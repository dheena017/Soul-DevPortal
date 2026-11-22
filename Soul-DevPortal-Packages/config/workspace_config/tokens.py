"""
Soul Workspace - Design Tokens & Visual Hierarchy (Python Export).
Corresponds to @workspace/config/tailwind/tokens.js
"""

from __future__ import annotations

BRAND_COLORS = {
    "50": "#eff6ff",
    "100": "#dbeafe",
    "200": "#bfdbfe",
    "300": "#93c5fd",
    "400": "#60a5fa",
    "500": "#3b82f6",
    "600": "#2563eb",
    "700": "#1d4ed8",
    "800": "#1e40af",
    "900": "#1e3a8a",
    "950": "#172554",
    "DEFAULT": "#3b82f6",
}

SURFACE_COLORS = {
    "50": "#f8fafc",
    "100": "#f1f5f9",
    "800": "#1e1e1e",
    "850": "#181818",
    "900": "#121212",
    "950": "#0a0a0a",
    "DEFAULT": "#121212",
}

ACCENT_COLORS = {
    "50": "#fdf4ff",
    "500": "#d946ef",
    "600": "#c026d3",
    "700": "#a21caf",
    "DEFAULT": "#d946ef",
}

DESIGN_TOKENS = {
    "brand": BRAND_COLORS,
    "surface": SURFACE_COLORS,
    "accent": ACCENT_COLORS,
    "radius": {
        "sm": "4px",
        "md": "8px",
        "lg": "12px",
        "xl": "16px",
    },
    "font": {
        "sans": "Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
        "mono": "JetBrains Mono, Fira Code, Consolas, monospace",
    },
}
