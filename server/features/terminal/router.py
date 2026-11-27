"""
Terminal API Router.
Exposes workspace terminal metadata and live interactive ConPTY WebSocket streaming (/api/terminal/ws).
"""

from __future__ import annotations

import asyncio
import json
from typing import Optional

from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from features.terminal.service import PtySession, TerminalService

router = APIRouter(prefix="/terminal", tags=["Workspace Terminal"])


@router.get("/info")
def get_terminal_info():
    """Returns workspace root, available shell profiles, PTY support, and quick directories."""
    return TerminalService.get_info()


@router.websocket("/ws")
async def terminal_websocket(
    websocket: WebSocket,
    profile: str = Query(default="powershell"),
    cwd: Optional[str] = Query(default=None),
    cols: int = Query(default=100, ge=10, le=500),
    rows: int = Query(default=30, ge=2, le=500),
):
    """Live interactive PTY WebSocket session backed by pywinpty ConPTY."""
    await websocket.accept()

    session: Optional[PtySession] = None
    try:
        session = await asyncio.to_thread(
            TerminalService.spawn_pty,
            profile_id=profile,
            cwd=cwd,
            cols=cols,
            rows=rows,
        )
    except Exception as exc:
        await websocket.send_json({"type": "error", "message": str(exc)})
        await websocket.close(code=1011)
        return

    await websocket.send_json(
        {
            "type": "ready",
            "pid": session.pid,
            "profile": session.profile,
            "cwd": str(session.cwd),
            "relativeCwd": TerminalService._relative_cwd(session.cwd),
        }
    )

    async def pump_pty_to_ws() -> None:
        assert session is not None
        try:
            while session.isalive():
                chunk = await asyncio.to_thread(session.read, 4096)
                if chunk:
                    await websocket.send_json({"type": "output", "data": chunk})
                else:
                    await asyncio.sleep(0.015)

            # Drain any trailing buffered bytes after exit
            for _ in range(3):
                trailing = await asyncio.to_thread(session.read, 4096)
                if not trailing:
                    break
                await websocket.send_json({"type": "output", "data": trailing})

            await websocket.send_json(
                {
                    "type": "exit",
                    "code": session.exitstatus if session.exitstatus is not None else 0,
                }
            )
        except (WebSocketDisconnect, RuntimeError):
            pass
        except asyncio.CancelledError:
            pass

    reader_task = asyncio.create_task(pump_pty_to_ws())

    try:
        while True:
            raw_msg = await websocket.receive_text()
            try:
                payload = json.loads(raw_msg)
            except json.JSONDecodeError:
                session.write(raw_msg)
                continue

            msg_type = payload.get("type")
            if msg_type == "input":
                data = payload.get("data", "")
                if isinstance(data, str) and data:
                    await asyncio.to_thread(session.write, data)
            elif msg_type == "resize":
                next_cols = int(payload.get("cols", cols))
                next_rows = int(payload.get("rows", rows))
                await asyncio.to_thread(session.resize, next_rows, next_cols)
            elif msg_type == "signal":
                sig = str(payload.get("signal", "SIGINT")).upper()
                if sig == "SIGINT":
                    await asyncio.to_thread(session.interrupt)
            elif msg_type == "kill":
                await asyncio.to_thread(session.terminate)
                break
    except WebSocketDisconnect:
        pass
    finally:
        reader_task.cancel()
        try:
            await reader_task
        except asyncio.CancelledError:
            pass
        if session is not None:
            await asyncio.to_thread(session.terminate)
