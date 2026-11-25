"""Business logic layer for the Computer & Performance Monitor feature."""

from __future__ import annotations

from typing import Any, Dict

from features.system.sampler import system_sampler


class SystemService:
    """Provides static host hardware inventory and non-blocking live telemetry."""

    def get_specs(self, force_refresh: bool = False) -> Dict[str, Any]:
        return system_sampler.get_specs(force_refresh=force_refresh)

    def get_live(self) -> Dict[str, Any]:
        return system_sampler.get_live()

    def get_overview(self, force_refresh: bool = False) -> Dict[str, Any]:
        specs = self.get_specs(force_refresh=force_refresh)
        live = self.get_live()
        return {
            "specs": specs,
            "live": live,
        }
