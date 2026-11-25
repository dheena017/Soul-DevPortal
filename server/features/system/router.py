"""
Computer & Performance Monitor Router.
Serves:
  - GET  /api/system/specs
  - GET  /api/system/live
  - GET  /api/system/stream  (Server-Sent Events live stream)
  - GET  /api/system/overview
  - POST /api/system/refresh
"""

from __future__ import annotations

import asyncio
import json
from typing import Optional

from fastapi import APIRouter, Query, Request
from fastapi.responses import StreamingResponse

from features.system.service import SystemService

router = APIRouter(prefix="/system", tags=["Computer & Performance Monitor"])
service = SystemService()


@router.get("/specs")
def get_system_specs():
    """Returns full live-probed and human-decoded host hardware inventory."""
    return service.get_specs(force_refresh=False)


@router.get("/live")
def get_system_live(window_sec: int = Query(default=60, ge=30, le=900)):
    """Returns instant live performance telemetry + windowed history ring buffer."""
    return service.get_live(window_sec=window_sec)


@router.get("/stream")
async def stream_system_live(
    request: Request,
    interval_ms: int = Query(default=2000, ge=1000, le=10000),
    window_sec: int = Query(default=60, ge=30, le=900),
    max_events: Optional[int] = Query(default=None, ge=1, le=1000),
):
    """Pushes Server-Sent Events (SSE) live telemetry frames cleanly until disconnect."""
    step_sec = max(1.0, min(10.0, interval_ms / 1000.0))

    async def event_generator():
        sent = 0
        while True:
            if await request.is_disconnected():
                break
            snapshot = await asyncio.to_thread(service.get_live, window_sec)
            yield f"data: {json.dumps(snapshot, separators=(',', ':'))}\n\n"
            sent += 1
            if max_events is not None and sent >= max_events:
                break
            waited = 0.0
            while waited < step_sec:
                if await request.is_disconnected():
                    return
                await asyncio.sleep(min(0.25, step_sec - waited))
                waited += 0.25

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/overview")
def get_system_overview(window_sec: int = Query(default=60, ge=30, le=900)):
    """Combined initial payload containing static hardware specs + live performance snapshot."""
    return service.get_overview(force_refresh=False, window_sec=window_sec)


@router.post("/refresh")
def refresh_system_specs():
    """Forces fresh OS hardware/peripheral/runtime discovery and updates the spec cache."""
    specs = service.get_specs(force_refresh=True)
    return {
        "success": True,
        "message": "Host hardware specifications rescanned.",
        "specs": specs,
    }
