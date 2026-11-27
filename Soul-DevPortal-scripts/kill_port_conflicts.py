"""Inspect TCP port usage across Soul-DevPortal reserved ports (5173-5181, 8000-8008)."""

from __future__ import annotations

import argparse
import socket

RESERVED_PORTS = list(range(5173, 5182)) + list(range(8000, 8009))


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.25)
        return sock.connect_ex((host, port)) == 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Check reserved Soul-DevPortal ports.")
    parser.parse_args()

    for port in RESERVED_PORTS:
        status = "IN_USE" if is_port_in_use(port) else "FREE"
        print(f"Port {port}: {status}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
