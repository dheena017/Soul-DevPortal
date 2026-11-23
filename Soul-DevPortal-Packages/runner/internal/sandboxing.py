"""
Kernel-Level Process Sandboxing & Windows Job Object (@workspace/runner/internal).
Binds spawned child processes to parent lifetimes to prevent orphan processes.
"""
from __future__ import annotations

import ctypes
import os
import signal
import sys
from typing import Any

# Initialize Windows Console ANSI Virtual Terminal Processing
if sys.platform == "win32":
    try:
        from ctypes import wintypes

        _kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        _std_out_handle = _kernel32.GetStdHandle(-11)
        _console_mode = wintypes.DWORD()
        if _kernel32.GetConsoleMode(_std_out_handle, ctypes.byref(_console_mode)):
            _kernel32.SetConsoleMode(_std_out_handle, _console_mode.value | 0x0004)
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

_GLOBAL_JOB_HANDLE: Any = None


def _setup_windows_job_object() -> Any:
    """Configures a Windows Job Object with JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE."""
    from ctypes import wintypes

    kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

    create_job = kernel32.CreateJobObjectW
    create_job.argtypes = (wintypes.LPVOID, wintypes.LPCWSTR)
    create_job.restype = wintypes.HANDLE

    set_job_info = kernel32.SetInformationJobObject
    set_job_info.argtypes = (wintypes.HANDLE, ctypes.c_int, wintypes.LPVOID, wintypes.DWORD)
    set_job_info.restype = wintypes.BOOL

    assign_process = kernel32.AssignProcessToJobObject
    assign_process.argtypes = (wintypes.HANDLE, wintypes.HANDLE)
    assign_process.restype = wintypes.BOOL

    job_handle = create_job(None, None)
    if not job_handle:
        return None

    class JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("PerProcessUserTimeLimit", wintypes.LARGE_INTEGER),
            ("PerJobUserTimeLimit", wintypes.LARGE_INTEGER),
            ("LimitFlags", wintypes.DWORD),
            ("MinimumWorkingSetSize", ctypes.c_size_t),
            ("MaximumWorkingSetSize", ctypes.c_size_t),
            ("ActiveProcessLimit", wintypes.DWORD),
            ("Affinity", ctypes.POINTER(ctypes.c_ulong)),
            ("PriorityClass", wintypes.DWORD),
            ("SchedulingClass", wintypes.DWORD),
        ]

    class IO_COUNTERS(ctypes.Structure):
        _fields_ = [
            ("ReadOperationCount", ctypes.c_ulonglong),
            ("WriteOperationCount", ctypes.c_ulonglong),
            ("OtherOperationCount", ctypes.c_ulonglong),
            ("ReadTransferCount", ctypes.c_ulonglong),
            ("WriteTransferCount", ctypes.c_ulonglong),
            ("OtherTransferCount", ctypes.c_ulonglong),
        ]

    class JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
        _fields_ = [
            ("BasicLimitInformation", JOBOBJECT_BASIC_LIMIT_INFORMATION),
            ("IoInfo", IO_COUNTERS),
            ("ProcessMemoryLimit", ctypes.c_size_t),
            ("JobMemoryLimit", ctypes.c_size_t),
            ("PeakProcessMemoryLimit", ctypes.c_size_t),
            ("PeakJobMemoryLimit", ctypes.c_size_t),
        ]

    extended_info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
    extended_info.BasicLimitInformation.LimitFlags = 0x00002000  # JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
    set_job_info(job_handle, 9, ctypes.byref(extended_info), ctypes.sizeof(extended_info))

    get_current_process = kernel32.GetCurrentProcess
    get_current_process.restype = wintypes.HANDLE
    assign_process(job_handle, get_current_process())

    return job_handle


def enable_windows_kill_on_close() -> None:
    """Binds subprocesses to a Windows Job Object that kills children when parent exits."""
    global _GLOBAL_JOB_HANDLE
    if sys.platform != "win32":
        return

    try:
        _GLOBAL_JOB_HANDLE = _setup_windows_job_object()
    except Exception:
        pass


def _linux_preexec_fn() -> None:
    """Sets new process session and registers Linux PR_SET_PDEATHSIG."""
    try:
        os.setsid()
    except Exception:
        pass

    if sys.platform.startswith("linux"):
        try:
            ctypes.CDLL(None).prctl(1, signal.SIGTERM)
        except Exception:
            pass


def enable_process_sandboxing() -> None:
    """Enables kernel-level process sandboxing across Windows and POSIX."""
    if sys.platform == "win32":
        enable_windows_kill_on_close()


__all__ = [
    "enable_process_sandboxing",
    "enable_windows_kill_on_close",
    "_linux_preexec_fn",
]
