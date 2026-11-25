"""
Thread-safe On-Demand System Telemetry Sampler.

Maintains:
  - In-memory static hardware cache (lazy + manual rescan)
  - Rolling 60-sample performance history deque + Peak/Average stats
  - 1s fast background ticker + 5s slow telemetry refresher
  - Automatic 30s idle hibernation so background overhead drops to zero
"""

from __future__ import annotations

from collections import deque
import datetime
import threading
import time
from typing import Any, Deque, Dict, Optional

from shared.extractors.system_inspector import (
    _evaluate_health_posture,
    collect_fast_telemetry,
    collect_slow_telemetry,
    get_static_hardware_specs,
    prime_process_cpu_times,
)


class SystemTelemetrySampler:
    """Manages cached static specs and non-blocking live performance ring buffers."""

    IDLE_HIBERNATE_SECONDS = 30.0
    SLOW_REFRESH_SECONDS = 15.0
    FAST_INTERVAL_SECONDS = 1.0

    def __init__(self) -> None:
        self._lock = threading.RLock()
        self._specs_lock = threading.Lock()
        self._fast_lock = threading.Lock()
        self._slow_lock = threading.Lock()
        self._static_specs: Optional[Dict[str, Any]] = None
        self._history: Deque[Dict[str, Any]] = deque(maxlen=900)
        self._latest_fast: Optional[Dict[str, Any]] = None
        self._latest_slow: Optional[Dict[str, Any]] = None
        self._prev_state: Optional[Dict[str, Any]] = None
        self._last_fast_ts: float = 0.0
        self._last_touch_ts: float = 0.0
        self._last_slow_ts: float = 0.0
        self._worker_thread: Optional[threading.Thread] = None
        self._warmup_started = False
        self._slow_in_flight = False
        self._proc_cache: Dict[Any, Any] = {}

    def _refresh_slow_once(self) -> None:
        """Refreshes slow telemetry in background without blocking the 1s fast sampler loop."""
        if not self._slow_lock.acquire(blocking=False):
            return
        try:
            with self._lock:
                self._slow_in_flight = True
            prev_ts = float(self._proc_cache.get("_prev_ts") or 0.0)
            elapsed = time.monotonic() - prev_ts
            if prev_ts <= 0.0:
                prime_process_cpu_times(self._proc_cache)
                time.sleep(0.35)
            elif elapsed < 0.35:
                time.sleep(0.35 - elapsed)
            slow = collect_slow_telemetry(include_gpu_perf=True, proc_cache=self._proc_cache)
            with self._lock:
                self._latest_slow = slow
                self._last_slow_ts = time.monotonic()
        except Exception:
            pass
        finally:
            with self._lock:
                self._slow_in_flight = False
            self._slow_lock.release()

    def warm_up_async(self) -> None:
        """Schedules one-time background hardware discovery & initial slow telemetry warm-up."""
        with self._lock:
            if self._warmup_started:
                return
            self._warmup_started = True

        def _warmup_specs() -> None:
            try:
                self.get_specs(force_refresh=False)
            except Exception:
                pass

        def _warmup_telemetry() -> None:
            try:
                prime_process_cpu_times(self._proc_cache)
                with self._fast_lock:
                    with self._lock:
                        need_seed = self._prev_state is None
                    if need_seed:
                        _, seed_state = collect_fast_telemetry(None)
                        seeded_ts = time.monotonic()
                        with self._lock:
                            if self._prev_state is None:
                                self._prev_state = seed_state
                                self._last_fast_ts = seeded_ts
            except Exception:
                pass
            self._refresh_slow_once()

        threading.Thread(target=_warmup_specs, daemon=True, name="sys-specs-warmup").start()
        threading.Thread(target=_warmup_telemetry, daemon=True, name="sys-slow-warmup").start()

    def get_specs(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Returns cached host hardware specs, probing live once or on manual rescan."""
        if not force_refresh:
            with self._lock:
                if self._static_specs is not None:
                    return self._static_specs

        with self._specs_lock:
            if not force_refresh:
                with self._lock:
                    if self._static_specs is not None:
                        return self._static_specs
            specs = get_static_hardware_specs()
            with self._lock:
                self._static_specs = specs
            return specs

    def _record_fast_tick(self, min_interval_sec: float = 0.12) -> Dict[str, Any]:
        with self._fast_lock:
            now_mono = time.monotonic()
            with self._lock:
                prev = self._prev_state
                latest = self._latest_fast
                last_fast_ts = self._last_fast_ts

            if latest is not None and (now_mono - last_fast_ts) < 0.35:
                return latest

            if prev is None:
                # One-time cold prime so the very first chart sample never records a fake 0.0% cliff
                _, prev = collect_fast_telemetry(None)
                last_fast_ts = time.monotonic()

            since_last = time.monotonic() - last_fast_ts
            if since_last < min_interval_sec:
                time.sleep(min_interval_sec - since_last)

            fast_payload, next_state = collect_fast_telemetry(prev)
            sampled_at = time.monotonic()

            now_local = datetime.datetime.now().strftime("%H:%M:%S")
            with self._lock:
                self._prev_state = next_state
                self._latest_fast = fast_payload
                self._last_fast_ts = sampled_at
                gpu_pct = None
                if self._latest_slow and self._latest_slow.get("gpuLive"):
                    gpu_pct = self._latest_slow["gpuLive"].get("utilizationPercent")

                point = {
                    "timestampIso": fast_payload["timestampIso"],
                    "timeLabel": now_local,
                    "cpuPercent": fast_payload["cpu"]["totalPercent"],
                    "ramPercent": fast_payload["memory"]["percent"],
                    "gpuPercent": gpu_pct,
                    "diskReadMBps": fast_payload["disk"]["readMBps"],
                    "diskWriteMBps": fast_payload["disk"]["writeMBps"],
                    "netRxKBps": fast_payload["network"]["rxKBps"],
                    "netTxKBps": fast_payload["network"]["txKBps"],
                }
                self._history.append(point)
            return fast_payload

    def _ensure_worker_running(self) -> None:
        with self._lock:
            self._last_touch_ts = time.monotonic()
            if self._worker_thread is not None and self._worker_thread.is_alive():
                return
            worker = threading.Thread(target=self._run_loop, daemon=True, name="sys-telemetry-sampler")
            self._worker_thread = worker
            worker.start()

    def _run_loop(self) -> None:
        while True:
            now_mono = time.monotonic()
            with self._lock:
                idle_for = now_mono - self._last_touch_ts
                last_slow = self._last_slow_ts

            if idle_for > self.IDLE_HIBERNATE_SECONDS:
                break

            try:
                self._record_fast_tick()
            except Exception:
                pass

            if (now_mono - last_slow) >= self.SLOW_REFRESH_SECONDS and not self._slow_in_flight:
                threading.Thread(target=self._refresh_slow_once, daemon=True, name="sys-slow-refresh").start()

            time.sleep(self.FAST_INTERVAL_SECONDS)

    def _slice_history(self, raw_history: list[Dict[str, Any]], window_sec: int) -> list[Dict[str, Any]]:
        """Slices history to requested window (60s / 300s / 900s) and downsamples <= 90 points."""
        if not raw_history:
            return []
        sec = max(30, min(900, int(window_sec)))
        cutoff = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=sec)).isoformat()
        sliced = [pt for pt in raw_history if str(pt.get("timestampIso") or "") >= cutoff]
        if not sliced:
            sliced = raw_history[-min(len(raw_history), sec):]
        max_pts = 90
        if len(sliced) <= max_pts:
            return sliced
        step = (len(sliced) - 1) / float(max_pts - 1)
        sampled = [sliced[int(round(i * step))] for i in range(max_pts - 1)]
        sampled.append(sliced[-1])
        return sampled

    def get_live(self, window_sec: int = 60) -> Dict[str, Any]:
        """Returns latest fast + slow snapshots and windowed history ring buffer in < 5ms."""
        with self._lock:
            need_bootstrap = self._latest_fast is None

        if need_bootstrap:
            self._record_fast_tick()

        # Worker loop starts immediately on first touch and populates slow telemetry in background
        self._ensure_worker_running()

        with self._lock:
            fast = self._latest_fast or {}
            slow = self._latest_slow or {}
            raw_history = list(self._history)

        history = self._slice_history(raw_history, window_sec)
        cpu_vals = [h["cpuPercent"] for h in history] or [fast.get("cpu", {}).get("totalPercent", 0.0)]
        ram_vals = [h["ramPercent"] for h in history] or [fast.get("memory", {}).get("percent", 0.0)]
        d_read_vals = [h["diskReadMBps"] for h in history] or [0.0]
        d_write_vals = [h["diskWriteMBps"] for h in history] or [0.0]
        n_rx_vals = [h["netRxKBps"] for h in history] or [0.0]
        n_tx_vals = [h["netTxKBps"] for h in history] or [0.0]

        wifi = slow.get("connectedWifi")
        bat = fast.get("battery")
        disk_total_mbps = fast.get("disk", {}).get("readMBps", 0.0) + fast.get("disk", {}).get("writeMBps", 0.0)
        health_posture = _evaluate_health_posture(
            cpu_pct=fast.get("cpu", {}).get("totalPercent", 0.0),
            ram_pct=fast.get("memory", {}).get("percent", 0.0),
            disk_mbps=disk_total_mbps,
            wifi_signal=wifi.get("signalPercent") if wifi else None,
            power_plugged=bat.get("powerPlugged") if bat else None,
            battery_pct=bat.get("percent") if bat else None,
        )

        return {
            **fast,
            "swap": slow.get("swap", {"totalBytes": 0, "usedBytes": 0, "freeBytes": 0, "percent": 0.0}),
            "gpu": slow.get("gpuLive", {}),
            "networkAdapters": slow.get("networkAdapters", []),
            "wifiInterfaces": slow.get("wifiInterfaces", []),
            "connectedWifi": wifi,
            "socketCounts": slow.get("socketCounts", {"established": 0, "listening": 0, "timeWait": 0, "closeWait": 0, "total": 0}),
            "activePorts": slow.get("activePorts", []),
            "activeConnections": slow.get("activeConnections", []),
            "processes": slow.get("processes", []),
            "topCpu": slow.get("topCpu", []),
            "topMemory": slow.get("topMemory", []),
            "topDiskIo": slow.get("topDiskIo", []),
            "totalProcessesCount": slow.get("totalProcessesCount", 0),
            "totalThreadsCount": slow.get("totalThreadsCount", 0),
            "healthPosture": health_posture,
            "history": history,
            "windowSec": max(30, min(900, int(window_sec))),
            "historyTotalSamples": len(raw_history),
            "peaks": {
                "cpuPeakPercent": round(max(cpu_vals), 1),
                "cpuAvgPercent": round(sum(cpu_vals) / len(cpu_vals), 1),
                "ramPeakPercent": round(max(ram_vals), 1),
                "diskReadPeakMBps": round(max(d_read_vals), 2),
                "diskWritePeakMBps": round(max(d_write_vals), 2),
                "netRxPeakKBps": round(max(n_rx_vals), 2),
                "netTxPeakKBps": round(max(n_tx_vals), 2),
            },
        }


system_sampler = SystemTelemetrySampler()
