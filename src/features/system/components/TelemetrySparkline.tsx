import React, { useId, useMemo, useState } from 'react';
import { TelemetryHistoryPoint } from '../../../types';

export interface SparklineSeriesConfig {
  key: keyof TelemetryHistoryPoint;
  label: string;
  color: string;
  unit?: string;
  decimals?: number;
}

export interface TelemetrySparklineProps {
  data: TelemetryHistoryPoint[];
  series: SparklineSeriesConfig[];
  fixedMax?: number;
  height?: number;
  compact?: boolean;
  showAvgLine?: boolean;
  showStatsFooter?: boolean;
  valueFormatter?: (val: number) => string;
  syncHoverIdx?: number | null;
  onHoverChange?: (idx: number | null) => void;
}

interface ChartCoord {
  x: number;
  y: number;
  v: number;
}

/**
 * Generates a monotone cubic Bezier SVG path (Fritsch-Carlson method) so
 * curves remain smooth without ever overshooting above max or below zero.
 */
function buildSmoothPath(coords: ChartCoord[]): string {
  if (coords.length === 0) return '';
  if (coords.length === 1) {
    return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`;
  }
  if (coords.length === 2) {
    return `M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)} L ${coords[1].x.toFixed(1)} ${coords[1].y.toFixed(1)}`;
  }

  const n = coords.length;
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const dx = coords[i + 1].x - coords[i].x || 1;
    slopes.push((coords[i + 1].y - coords[i].y) / dx);
  }

  const tangents: number[] = new Array(n).fill(0);
  tangents[0] = slopes[0];
  tangents[n - 1] = slopes[n - 2];

  for (let i = 1; i < n - 1; i++) {
    const sPrev = slopes[i - 1];
    const sNext = slopes[i];
    if (sPrev * sNext <= 0) {
      tangents[i] = 0;
    } else {
      const m = (sPrev + sNext) / 2;
      const limit = 2.5 * Math.min(Math.abs(sPrev), Math.abs(sNext));
      tangents[i] = Math.sign(m) * Math.min(Math.abs(m), limit);
    }
  }

  const segments: string[] = [`M ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`];
  for (let i = 0; i < n - 1; i++) {
    const p0 = coords[i];
    const p1 = coords[i + 1];
    const dx = p1.x - p0.x;
    const cx1 = p0.x + dx / 3;
    const cy1 = p0.y + tangents[i] * (dx / 3);
    const cx2 = p1.x - dx / 3;
    const cy2 = p1.y - tangents[i + 1] * (dx / 3);
    segments.push(
      `C ${cx1.toFixed(1)} ${cy1.toFixed(1)}, ${cx2.toFixed(1)} ${cy2.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`
    );
  }
  return segments.join(' ');
}

export default function TelemetrySparkline({
  data,
  series,
  fixedMax,
  height = 175,
  compact = false,
  showAvgLine = true,
  showStatsFooter = true,
  valueFormatter,
  syncHoverIdx,
  onHoverChange,
}: TelemetrySparklineProps) {
  const uid = useId().replace(/:/g, '');
  const [localHoverIdx, setLocalHoverIdx] = useState<number | null>(null);
  const hoverIdx = syncHoverIdx !== undefined ? syncHoverIdx : localHoverIdx;

  const width = 560;
  const padTop = compact ? 10 : 14;
  const padBottom = compact ? 10 : 16;
  const padLeft = compact ? 54 : 52;
  const padRight = 8;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const { maxVal, paths, activeIdx, primaryAvgY, primaryStats } = useMemo(() => {
    const safeData = data.length > 0 ? data : [];
    let computedMax = fixedMax ?? 10;
    if (fixedMax === undefined) {
      let rawMax = 0;
      for (const pt of safeData) {
        for (const s of series) {
          const v = Number(pt[s.key] ?? 0);
          if (Number.isFinite(v) && v > rawMax) rawMax = v;
        }
      }
      computedMax = Math.max(rawMax * 1.2, 1);
    }

    const built = series.map((s, sIdx) => {
      if (safeData.length === 0) {
        return {
          series: s,
          linePath: '',
          areaPath: '',
          coords: [] as ChartCoord[],
          gradId: `grad-${uid}-${String(s.key)}-${sIdx}`,
        };
      }
      const coords = safeData.map((pt, idx) => {
        const x =
          safeData.length === 1
            ? padLeft + innerW
            : padLeft + (idx / (safeData.length - 1)) * innerW;
        const raw = Number(pt[s.key] ?? 0);
        const clamped = Math.max(0, Math.min(computedMax, Number.isFinite(raw) ? raw : 0));
        const y = padTop + innerH - (clamped / computedMax) * innerH;
        return { x, y, v: Number.isFinite(raw) ? raw : 0 };
      });

      const linePath =
        coords.length === 1
          ? `M ${padLeft} ${coords[0].y.toFixed(1)} L ${coords[0].x.toFixed(1)} ${coords[0].y.toFixed(1)}`
          : buildSmoothPath(coords);

      const lastX = coords[coords.length - 1].x.toFixed(1);
      const firstX = (coords.length === 1 ? padLeft : coords[0].x).toFixed(1);
      const baseY = (padTop + innerH).toFixed(1);
      const areaPath = `${linePath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;

      return {
        series: s,
        linePath,
        areaPath,
        coords,
        gradId: `grad-${uid}-${String(s.key)}-${sIdx}`,
      };
    });

    const p0Coords = built[0]?.coords || [];
    const vals = p0Coords.map((c) => c.v);
    const curV = vals.length ? vals[vals.length - 1] : 0;
    const minV = vals.length ? Math.min(...vals) : 0;
    const maxV = vals.length ? Math.max(...vals) : 0;
    const avgV = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    const avgClamped = Math.max(0, Math.min(computedMax, avgV));
    const avgY = vals.length ? padTop + innerH - (avgClamped / computedMax) * innerH : null;

    const clampedHover =
      hoverIdx !== null && safeData.length > 0 ? Math.max(0, Math.min(safeData.length - 1, hoverIdx)) : null;

    return {
      maxVal: computedMax,
      paths: built,
      activeIdx: clampedHover,
      primaryAvgY: avgY,
      primaryStats: { curV, minV, avgV, maxV },
    };
  }, [data, series, fixedMax, innerH, innerW, padLeft, padTop, hoverIdx, uid]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (data.length === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const scaleX = width / Math.max(1, rect.width);
    const relX = (e.clientX - rect.left) * scaleX - padLeft;
    const ratio = Math.max(0, Math.min(1, relX / Math.max(1, innerW)));
    const idx = Math.round(ratio * Math.max(0, data.length - 1));
    setLocalHoverIdx(idx);
    onHoverChange?.(idx);
  };

  const handleMouseLeave = () => {
    setLocalHoverIdx(null);
    onHoverChange?.(null);
  };

  const activePoint = activeIdx !== null && data[activeIdx] ? data[activeIdx] : null;
  const activeCoordX =
    activeIdx !== null && paths[0]?.coords[activeIdx] ? paths[0].coords[activeIdx].x : null;
  const firstLabel = data[0]?.timeLabel || '';
  const midLabel = data.length > 2 ? data[Math.floor(data.length / 2)]?.timeLabel || '' : '';
  const lastLabel = data[data.length - 1]?.timeLabel || 'Now';

  const fmtVal = (val: number) => {
    const s0 = series[0];
    if (!s0) return String(val);
    return valueFormatter ? valueFormatter(val) : `${val.toFixed(s0.decimals ?? 1)}${s0.unit ?? ''}`;
  };

  const fmtAxis = (val: number) => {
    const s0 = series[0];
    if (!s0) return String(val);
    if (valueFormatter) return valueFormatter(val);
    return `${val.toFixed(val >= 10 || val === 0 ? 0 : 1)}${s0.unit ?? ''}`;
  };

  return (
    <div
      className={`neu-inset relative w-full select-none rounded-xl bg-[#0a0a0e] border border-white/[0.06] ${
        compact ? 'p-2.5' : 'p-3.5'
      }`}
    >
      {/* Interactive Hover Tooltip Card */}
      {activePoint && (
        <div className="neu-card absolute top-2 right-2 z-10 pointer-events-none flex flex-wrap items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0d0d13]/95 border border-white/[0.16] text-[10px] font-mono tabular-nums">
          <span className="text-zinc-400">{activePoint.timeLabel}</span>
          {series.map((s) => {
            const val = Number(activePoint[s.key] ?? 0);
            const formatted = valueFormatter
              ? valueFormatter(val)
              : `${val.toFixed(s.decimals ?? 1)}${s.unit ?? ''}`;
            return (
              <span key={String(s.key)} className="inline-flex items-center gap-1.5 font-bold text-white">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                <span>{s.label} {formatted}</span>
              </span>
            );
          })}
        </div>
      )}

      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible block cursor-crosshair"
        style={{ height: `${height}px` }}
        preserveAspectRatio="none"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="img"
        aria-label="Smooth live telemetry spline graph"
      >
        <defs>
          {paths.map((p) => (
            <linearGradient key={p.gradId} id={p.gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.series.color} stopOpacity="0.34" />
              <stop offset="70%" stopColor={p.series.color} stopOpacity="0.08" />
              <stop offset="100%" stopColor={p.series.color} stopOpacity="0.0" />
            </linearGradient>
          ))}
        </defs>

        {/* Horizontal Reference Gridlines */}
        {(compact ? [0, 0.5, 1] : [0, 0.25, 0.5, 0.75, 1]).map((frac) => {
          const y = padTop + innerH * frac;
          const valAtTick = maxVal * (1 - frac);
          const isBaseline = frac === 1;
          return (
            <g key={frac}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke={isBaseline ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.06)'}
                strokeDasharray={isBaseline ? undefined : '4 4'}
                strokeWidth="1"
              />
              {(frac === 0 || (!compact && frac === 0.5) || frac === 1) && (
                <text
                  x={padLeft - 6}
                  y={y + 3}
                  textAnchor="end"
                  fill="rgba(161,161,170,0.72)"
                  fontSize="9.5"
                  fontFamily="monospace"
                >
                  {fmtAxis(valAtTick)}
                </text>
              )}
            </g>
          );
        })}

        {/* Vertical Time Quarter Gridlines */}
        {[0.25, 0.5, 0.75].map((frac) => {
          const x = padLeft + innerW * frac;
          return (
            <line
              key={`v-${frac}`}
              x1={x}
              x2={x}
              y1={padTop}
              y2={padTop + innerH}
              stroke="rgba(255,255,255,0.035)"
              strokeDasharray="3 4"
              strokeWidth="1"
            />
          );
        })}

        {/* Rolling Average Dashed Line (primary series — numeric value displayed cleanly in footer strip) */}
        {!compact && showAvgLine && primaryAvgY !== null && series[0] && (
          <line
            x1={padLeft}
            x2={width - padRight}
            y1={primaryAvgY}
            y2={primaryAvgY}
            stroke={series[0].color}
            strokeOpacity="0.45"
            strokeDasharray="6 4"
            strokeWidth="1.1"
          />
        )}

        {/* Smooth Gradient Area Fills, Outer Glow Stroke & Crisp Primary Line */}
        {paths.map((p) => {
          const lastPt = p.coords[p.coords.length - 1];
          return (
            <g key={String(p.series.key)}>
              {p.areaPath && <path d={p.areaPath} fill={`url(#${p.gradId})`} />}
              {p.linePath && (
                <>
                  <path
                    d={p.linePath}
                    fill="none"
                    stroke={p.series.color}
                    strokeOpacity="0.24"
                    strokeWidth={compact ? '5' : '6'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d={p.linePath}
                    fill="none"
                    stroke={p.series.color}
                    strokeWidth={compact ? '2' : '2.3'}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              )}
              {lastPt && activeCoordX === null && (
                <g>
                  <circle cx={lastPt.x} cy={lastPt.y} r="6.5" fill={p.series.color} className="sys-spark-beacon" />
                  <circle cx={lastPt.x} cy={lastPt.y} r="3" fill="#0a0a0e" stroke={p.series.color} strokeWidth="2.1" />
                </g>
              )}
            </g>
          );
        })}

        {/* Interactive Hover Crosshair + Focus Halo */}
        {activeCoordX !== null && activeIdx !== null && (
          <g>
            <line
              x1={activeCoordX}
              x2={activeCoordX}
              y1={padTop}
              y2={padTop + innerH}
              stroke="rgba(255,255,255,0.3)"
              strokeDasharray="3 3"
              strokeWidth="1"
            />
            {paths.map((p) => {
              const pt = p.coords[activeIdx];
              if (!pt) return null;
              return (
                <g key={String(p.series.key)}>
                  <circle cx={pt.x} cy={pt.y} r="7.5" fill={p.series.color} opacity="0.22" />
                  <circle cx={pt.x} cy={pt.y} r="4" fill="#0b0b0e" stroke={p.series.color} strokeWidth="2.3" />
                </g>
              );
            })}
          </g>
        )}
      </svg>

      {/* Bottom Time Span & Summary Metrics Strip */}
      {!compact && (
        <div className="flex flex-col gap-2 mt-2 pt-2 border-t border-white/[0.05]">
          {data.length > 1 && (
            <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-zinc-500 pl-9">
              <span>{firstLabel}</span>
              {midLabel && <span>{midLabel}</span>}
              <span>{lastLabel}</span>
            </div>
          )}

          {showStatsFooter && series[0] && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono tabular-nums">
              <div className="flex flex-wrap items-center gap-3">
                {series.map((s) => (
                  <span key={String(s.key)} className="inline-flex items-center gap-1.5 text-zinc-300">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span>{s.label}</span>
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-zinc-400">
                <span>Min <strong className="text-zinc-200">{fmtVal(primaryStats.minV)}</strong></span>
                <span>Avg <strong className="text-sky-300">{fmtVal(primaryStats.avgV)}</strong></span>
                <span>Peak <strong className="text-amber-300">{fmtVal(primaryStats.maxV)}</strong></span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
