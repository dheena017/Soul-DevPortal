import React, { useEffect, useMemo, useState } from 'react';
import { HeroArtworkBackdrop, MiniRadialRing } from '../../components/PortalVisuals';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import { useScrollEdgeFade } from '../../utils/useScrollEdgeFade';
import { copyTextSafe } from '../../utils/clipboard';
import { BookmarkItem, DEFAULT_BOOKMARKS } from './everydayTabsRegistry';

type UnitCategory = 'length' | 'weight' | 'volume' | 'temp' | 'data' | 'time';

const UNIT_FACTORS: Record<
  Exclude<UnitCategory, 'temp'>,
  Record<string, { label: string; factor: number }>
> = {
  length: {
    m: { label: 'Meters (m)', factor: 1 },
    km: { label: 'Kilometers (km)', factor: 1000 },
    cm: { label: 'Centimeters (cm)', factor: 0.01 },
    mi: { label: 'Miles (mi)', factor: 1609.344 },
    ft: { label: 'Feet (ft)', factor: 0.3048 },
    in: { label: 'Inches (in)', factor: 0.0254 },
  },
  weight: {
    kg: { label: 'Kilograms (kg)', factor: 1 },
    g: { label: 'Grams (g)', factor: 0.001 },
    lb: { label: 'Pounds (lb)', factor: 0.45359237 },
    oz: { label: 'Ounces (oz)', factor: 0.0283495 },
  },
  volume: {
    ml: { label: 'Milliliters (ml)', factor: 0.001 },
    L: { label: 'Liters (L)', factor: 1 },
    cup: { label: 'US Cups', factor: 0.236588 },
    tbsp: { label: 'Tablespoons', factor: 0.0147868 },
    floz: { label: 'Fluid Oz', factor: 0.0295735 },
  },
  data: {
    MB: { label: 'Megabytes (MB)', factor: 1 },
    KB: { label: 'Kilobytes (KB)', factor: 1 / 1024 },
    GB: { label: 'Gigabytes (GB)', factor: 1024 },
    TB: { label: 'Terabytes (TB)', factor: 1024 * 1024 },
  },
  time: {
    min: { label: 'Minutes', factor: 60 },
    sec: { label: 'Seconds', factor: 1 },
    hr: { label: 'Hours', factor: 3600 },
    day: { label: 'Days', factor: 86400 },
  },
};

const PASSPHRASE_WORDS = [
  'amber', 'atlas', 'breeze', 'cedar', 'cloud', 'coral', 'crest', 'dawn',
  'drift', 'ember', 'falcon', 'forest', 'glade', 'harbor', 'horizon', 'jade',
  'lagoon', 'lantern', 'maple', 'meadow', 'mist', 'nebula', 'north', 'oak',
  'ocean', 'orbit', 'pebble', 'pine', 'prism', 'pulse', 'quartz', 'river',
  'sage', 'shore', 'silver', 'solar', 'spark', 'spring', 'stone', 'summit',
  'terra', 'tidal', 'timber', 'trail', 'vale', 'velvet', 'verge', 'wave',
];

const WORLD_CITIES = [
  { label: 'UTC', region: 'Universal', zone: 'UTC' },
  { label: 'London', region: 'Europe', zone: 'Europe/London' },
  { label: 'Berlin', region: 'Europe', zone: 'Europe/Berlin' },
  { label: 'Paris', region: 'Europe', zone: 'Europe/Paris' },
  { label: 'Dubai', region: 'Middle East', zone: 'Asia/Dubai' },
  { label: 'India (IST)', region: 'Asia', zone: 'Asia/Kolkata' },
  { label: 'Singapore', region: 'Asia', zone: 'Asia/Singapore' },
  { label: 'Tokyo', region: 'Asia', zone: 'Asia/Tokyo' },
  { label: 'Sydney', region: 'Oceania', zone: 'Australia/Sydney' },
  { label: 'Toronto', region: 'Americas', zone: 'America/Toronto' },
  { label: 'New York', region: 'Americas', zone: 'America/New_York' },
  { label: 'San Francisco', region: 'Americas', zone: 'America/Los_Angeles' },
];

// ── 1. Calculators & Unit Converter Tab (Full-Width 3-Column Desktop Grid) ──

export const CalculatorsUnitsTab: React.FC = () => {
  const [unitCat, setUnitCat] = useState<UnitCategory>('length');
  const [unitValue, setUnitValue] = useState<string>('10');
  const [fromUnit, setFromUnit] = useState<string>('km');
  const [toUnit, setToUnit] = useState<string>('mi');

  const unitOptions =
    unitCat === 'temp'
      ? [
          { key: 'C', label: 'Celsius (°C)' },
          { key: 'F', label: 'Fahrenheit (°F)' },
          { key: 'K', label: 'Kelvin (K)' },
        ]
      : Object.entries(
          UNIT_FACTORS[unitCat] as Record<string, { label: string; factor: number }>
        ).map(([key, val]) => ({ key, label: val.label }));

  const switchUnitCategory = (cat: UnitCategory) => {
    setUnitCat(cat);
    if (cat === 'temp') {
      setFromUnit('C');
      setToUnit('F');
    } else {
      const keys = Object.keys(UNIT_FACTORS[cat]);
      setFromUnit(keys[0]);
      setToUnit(keys[1] || keys[0]);
    }
  };

  const convertedValue = useMemo(() => {
    const num = parseFloat(unitValue);
    if (Number.isNaN(num)) return '—';
    if (unitCat === 'temp') {
      let c = num;
      if (fromUnit === 'F') c = ((num - 32) * 5) / 9;
      if (fromUnit === 'K') c = num - 273.15;
      let out = c;
      if (toUnit === 'F') out = (c * 9) / 5 + 32;
      if (toUnit === 'K') out = c + 273.15;
      return out.toFixed(2);
    }
    const table = UNIT_FACTORS[unitCat];
    const fromFactor = table[fromUnit]?.factor || 1;
    const toFactor = table[toUnit]?.factor || 1;
    const res = (num * fromFactor) / toFactor;
    return Number(res.toPrecision(6)).toString();
  }, [unitCat, unitValue, fromUnit, toUnit]);

  const [unitCopied, setUnitCopied] = useState<boolean>(false);
  const [splitCopied, setSplitCopied] = useState<boolean>(false);

  const [billTotal, setBillTotal] = useState<string>('120');
  const [tipPct, setTipPct] = useState<number>(15);
  const [peopleCount, setPeopleCount] = useState<number>(3);
  const billNum = Math.max(0, parseFloat(billTotal) || 0);
  const tipAmount = (billNum * tipPct) / 100;
  const grandTotal = billNum + tipAmount;
  const perPerson = peopleCount > 0 ? grandTotal / peopleCount : grandTotal;
  const tipSharePct = grandTotal > 0 ? Math.round((tipAmount / grandTotal) * 100) : 0;

  const [origPrice, setOrigPrice] = useState<string>('2400');
  const [discountPct, setDiscountPct] = useState<string>('25');
  const origNum = Math.max(0, parseFloat(origPrice) || 0);
  const discNum = Math.max(0, Math.min(100, parseFloat(discountPct) || 0));
  const savedAmt = (origNum * discNum) / 100;
  const finalPrice = origNum - savedAmt;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-stretch">
      {/* Unit Converter */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1017] shrink-0">
          <HeroArtworkBackdrop src="/visuals/pillar-computer-silicon.jpg" alt="Unit Converter Precision Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-white">Everyday Unit Converter</h2>
              <p className="text-xs text-zinc-300/90">Length, weight, volume, temp, storage &amp; time.</p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-md bg-[#080b12]/85 backdrop-blur-sm border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300">
              {fromUnit} → {toUnit}
            </span>
          </div>
          <div className="relative z-10 mt-3 flex flex-wrap gap-1.5">
            {(
              [
                { id: 'length', label: 'Length' },
                { id: 'weight', label: 'Weight' },
                { id: 'volume', label: 'Volume' },
                { id: 'temp', label: 'Temp' },
                { id: 'data', label: 'Data' },
                { id: 'time', label: 'Time' },
              ] as const
            ).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => switchUnitCategory(c.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer transition-colors ${
                  unitCat === c.id
                    ? 'bg-sky-500/20 border-sky-400/45 text-white font-bold'
                    : 'bg-[#11141d]/90 border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-3.5">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono text-zinc-400">From</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={unitValue}
                  onChange={(e) => setUnitValue(e.target.value)}
                  aria-label="Unit input value"
                  className="w-28 h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white focus:outline-none focus:border-sky-400/45"
                />
                <select
                  value={fromUnit}
                  onChange={(e) => setFromUnit(e.target.value)}
                  aria-label="From unit"
                  className="flex-1 h-9 px-2.5 rounded-xl bg-[#16171e] border border-white/[0.08] text-xs text-zinc-200 focus:outline-none"
                >
                  {unitOptions.map((u) => (
                    <option key={u.key} value={u.key}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  const prevFrom = fromUnit;
                  setFromUnit(toUnit);
                  setToUnit(prevFrom);
                }}
                className="px-3 py-1 rounded-lg bg-[#181922] border border-white/[0.1] hover:border-sky-400/35 text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
              >
                ⇅ Swap Units
              </button>
              <button
                type="button"
                onClick={() => {
                  void copyTextSafe(convertedValue).then((ok) => {
                    if (ok) {
                      setUnitCopied(true);
                      window.setTimeout(() => setUnitCopied(false), 1600);
                    }
                  });
                }}
                className="px-2.5 py-1 rounded-lg bg-[#181922] border border-white/[0.08] text-[10.5px] font-mono text-zinc-300 hover:text-white cursor-pointer"
              >
                {unitCopied ? '✓ Copied' : 'Copy Result'}
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-mono text-zinc-400">Result</label>
              <div className="flex gap-2">
                <div className="w-28 h-9 px-3 rounded-xl bg-[#08090c] border border-sky-400/30 flex items-center text-sm font-mono font-extrabold text-sky-300 tabular-nums overflow-hidden">
                  {convertedValue}
                </div>
                <select
                  value={toUnit}
                  onChange={(e) => setToUnit(e.target.value)}
                  aria-label="To unit"
                  className="flex-1 h-9 px-2.5 rounded-xl bg-[#16171e] border border-white/[0.08] text-xs text-zinc-200 focus:outline-none"
                >
                  {unitOptions.map((u) => (
                    <option key={u.key} value={u.key}>{u.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#0c0d12] border border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
            <span className="text-zinc-400 truncate">
              {unitValue || '0'} {fromUnit}
            </span>
            <span className="text-sky-300 font-bold shrink-0">= {convertedValue} {toUnit}</span>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>6 unit families</span>
          <span className="text-zinc-600">6-sig-fig offline math</span>
        </div>
      </section>

      {/* Split Bill & Tip */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1210] shrink-0">
          <HeroArtworkBackdrop src="/visuals/tab-database-wal.jpg" alt="Split Bill and Tip Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-white">Split Bill &amp; Tip Calculator</h2>
              <p className="text-xs text-zinc-300/90">Split group bills fairly with per-person breakdown.</p>
            </div>
            <div className="shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#080b0a]/90 border border-emerald-400/25">
              <MiniRadialRing percent={Math.min(100, Math.round((tipPct / 30) * 100))} color="#34d399" size={32} />
              <div className="flex flex-col">
                <span className="text-xs font-extrabold font-mono text-white tabular-nums">{tipPct}%</span>
                <span className="text-[9.5px] font-mono text-emerald-300">Tip rate</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-3.5">
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-[1fr_110px] gap-2.5">
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-zinc-400">Bill Total</span>
                <input
                  type="number"
                  min={0}
                  value={billTotal}
                  onChange={(e) => setBillTotal(e.target.value)}
                  className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white focus:outline-none focus:border-emerald-400/45"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-[11px] font-mono text-zinc-400">People</span>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={peopleCount}
                  onChange={(e) => setPeopleCount(Math.max(1, Number(e.target.value) || 1))}
                  className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white focus:outline-none focus:border-emerald-400/45"
                />
              </label>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Tip ({tipPct}%)</span>
                <div className="flex items-center gap-1">
                  {[0, 10, 15, 18, 20].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setTipPct(pct)}
                      className={`px-1.5 py-0.5 rounded text-[10px] border cursor-pointer ${
                        tipPct === pct
                          ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 font-bold'
                          : 'bg-[#16171e] border-white/[0.07] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={30}
                value={tipPct}
                onChange={(e) => setTipPct(Number(e.target.value))}
                className="h-6 accent-emerald-400 cursor-pointer"
              />
            </div>

            {/* Base vs Tip Spectrum Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
              <div className="h-full bg-sky-400/75" style={{ width: `${Math.max(0, 100 - tipSharePct)}%` }} />
              <div className="h-full bg-amber-400" style={{ width: `${tipSharePct}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2.5 rounded-xl bg-[#16171e] border border-white/[0.06]">
              <div className="text-[10px] text-zinc-400">Tip</div>
              <div className="text-sm font-bold font-mono text-amber-300 tabular-nums">{tipAmount.toFixed(2)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-[#16171e] border border-white/[0.06]">
              <div className="text-[10px] text-zinc-400">Total</div>
              <div className="text-sm font-bold font-mono text-white tabular-nums">{grandTotal.toFixed(2)}</div>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
              <div className="text-[10px] text-emerald-300">Each</div>
              <div className="text-sm font-extrabold font-mono text-emerald-300 tabular-nums">{perPerson.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>
            {peopleCount} {peopleCount === 1 ? 'person' : 'people'} split
          </span>
          <button
            type="button"
            onClick={() => {
              void copyTextSafe(
                `Bill ${billNum.toFixed(2)} + ${tipPct}% tip (${tipAmount.toFixed(2)}) = ${grandTotal.toFixed(2)} -> ${perPerson.toFixed(2)} each (${peopleCount})`
              ).then((ok) => {
                if (ok) {
                  setSplitCopied(true);
                  window.setTimeout(() => setSplitCopied(false), 1600);
                }
              });
            }}
            className="text-emerald-400 hover:text-emerald-300 cursor-pointer"
          >
            {splitCopied ? '✓ Copied split' : 'Copy share'}
          </button>
        </div>
      </section>

      {/* Discount Calculator */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#110f17] shrink-0">
          <HeroArtworkBackdrop src="/visuals/pillar-packages-core.jpg" alt="Discount Calculator Visual" opacityClass="opacity-72 sm:opacity-88" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-white">Discount &amp; Final Price</h2>
              <p className="text-xs text-zinc-300/90">Check sale savings and net payable price.</p>
            </div>
            <div className="shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#09080e]/90 border border-amber-400/25">
              <MiniRadialRing percent={discNum} color="#fbbf24" size={32} />
              <div className="flex flex-col">
                <span className="text-xs font-extrabold font-mono text-white tabular-nums">{Math.round(discNum)}%</span>
                <span className="text-[9.5px] font-mono text-amber-300">Saved</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-3.5">
          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Original Price</span>
              <input
                type="number"
                min={0}
                value={origPrice}
                onChange={(e) => setOrigPrice(e.target.value)}
                className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white focus:outline-none focus:border-sky-400/45"
              />
            </label>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Discount (%)</span>
                <div className="flex items-center gap-1">
                  {[10, 15, 25, 30, 50].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setDiscountPct(String(pct))}
                      className={`px-1.5 py-0.5 rounded text-[10px] border cursor-pointer ${
                        Math.round(discNum) === pct
                          ? 'bg-amber-500/20 border-amber-400/40 text-amber-200 font-bold'
                          : 'bg-[#16171e] border-white/[0.07] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <input
                type="number"
                min={0}
                max={100}
                value={discountPct}
                onChange={(e) => setDiscountPct(e.target.value)}
                className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white focus:outline-none focus:border-amber-400/45"
              />
            </div>

            {/* Savings vs Payable Bar */}
            <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex">
              <div className="h-full bg-sky-400" style={{ width: `${Math.max(0, 100 - discNum)}%` }} />
              <div className="h-full bg-amber-400" style={{ width: `${discNum}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-[#16171e] border border-white/[0.06]">
              <div className="text-[11px] text-zinc-400">You Save</div>
              <div className="text-base font-bold font-mono text-amber-300 tabular-nums">{savedAmt.toFixed(2)}</div>
            </div>
            <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-400/30">
              <div className="text-[11px] text-sky-300">Final Price</div>
              <div className="text-base font-extrabold font-mono text-white tabular-nums">{finalPrice.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>Pay {(100 - discNum).toFixed(0)}% of list</span>
          <span className="text-amber-300/80">-{savedAmt.toFixed(2)} off</span>
        </div>
      </section>
    </div>
  );
};

// ── 2. World Clock & Time-Shift Meeting Planner Tab ──

interface ZoneMeta {
  isDay: boolean;
  diffLabel: string;
  hour: number;
  minute: number;
  dayPct: number;
}

function getZoneMeta(instant: Date, zone: string, localTz: string): ZoneMeta {
  try {
    const cityWall = new Date(instant.toLocaleString('en-US', { timeZone: zone }));
    const localWall = new Date(instant.toLocaleString('en-US', { timeZone: localTz }));
    const diffMin = Math.round((cityWall.getTime() - localWall.getTime()) / 60000);
    const hour = cityWall.getHours();
    const minute = cityWall.getMinutes();
    const isDay = hour >= 6 && hour < 18;
    const dayPct = Math.min(100, Math.max(0, ((hour * 60 + minute) / 1440) * 100));
    if (diffMin === 0) return { isDay, diffLabel: 'Local time', hour, minute, dayPct };
    const sign = diffMin > 0 ? '+' : '-';
    const abs = Math.abs(diffMin);
    const hrs = Math.floor(abs / 60);
    const mins = abs % 60;
    return {
      isDay,
      diffLabel: mins > 0 ? `${sign}${hrs}h ${mins}m` : `${sign}${hrs}h`,
      hour,
      minute,
      dayPct,
    };
  } catch {
    return { isDay: true, diffLabel: zone, hour: 12, minute: 0, dayPct: 50 };
  }
}

const REGION_ACCENTS: Record<string, string> = {
  Universal: 'text-zinc-300 bg-zinc-500/10 border-zinc-400/20',
  Europe: 'text-sky-300 bg-sky-500/10 border-sky-400/25',
  'Middle East': 'text-amber-300 bg-amber-500/10 border-amber-400/25',
  Asia: 'text-emerald-300 bg-emerald-500/10 border-emerald-400/25',
  Oceania: 'text-cyan-300 bg-cyan-500/10 border-cyan-400/25',
  Americas: 'text-purple-300 bg-purple-500/10 border-purple-400/25',
};

const AnalogClockDial: React.FC<{
  hour: number;
  minute: number;
  second?: number;
  size?: number;
  isDay: boolean;
}> = ({ hour, minute, second, size = 36, isDay }) => {
  const hourAngle = ((hour % 12) + minute / 60) * 30;
  const minAngle = minute * 6 + (second ?? 0) * 0.1;
  const secAngle = (second ?? 0) * 6;
  const ringStroke = isDay ? 'rgba(251, 191, 36, 0.35)' : 'rgba(129, 140, 248, 0.35)';
  const handAccent = isDay ? '#fbbf24' : '#818cf8';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className="shrink-0"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="29" fill="#090a0f" stroke={ringStroke} strokeWidth="2" />
      {Array.from({ length: 12 }, (_, idx) => {
        const deg = idx * 30;
        const len = idx % 3 === 0 ? 5 : 2.5;
        return (
          <line
            key={deg}
            x1="32"
            y1="5.5"
            x2="32"
            y2={5.5 + len}
            stroke={idx % 3 === 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.18)'}
            strokeWidth={idx % 3 === 0 ? '1.6' : '1'}
            strokeLinecap="round"
            transform={`rotate(${deg} 32 32)`}
          />
        );
      })}
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="17"
        stroke={handAccent}
        strokeWidth="2.6"
        strokeLinecap="round"
        transform={`rotate(${hourAngle} 32 32)`}
      />
      <line
        x1="32"
        y1="32"
        x2="32"
        y2="11"
        stroke="#f4f4f5"
        strokeWidth="1.8"
        strokeLinecap="round"
        transform={`rotate(${minAngle} 32 32)`}
      />
      {typeof second === 'number' && (
        <line
          x1="32"
          y1="36"
          x2="32"
          y2="9"
          stroke="#38bdf8"
          strokeWidth="1.1"
          strokeLinecap="round"
          transform={`rotate(${secAngle} 32 32)`}
        />
      )}
      <circle cx="32" cy="32" r="2.6" fill="#ffffff" />
    </svg>
  );
};

export const WorldClockTab: React.FC = () => {
  const [nowTick, setNowTick] = useState<number>(() => Date.now());
  const [hour24, setHour24] = useState<boolean>(false);
  const [copiedSchedule, setCopiedSchedule] = useState<boolean>(false);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const targetInstant = useMemo(() => new Date(nowTick), [nowTick]);
  const localTimeZone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
    } catch {
      return 'Local';
    }
  }, []);

  const cityRows = useMemo(
    () =>
      WORLD_CITIES.map((city) => {
        const meta = getZoneMeta(targetInstant, city.zone, localTimeZone);
        return {
          ...city,
          ...meta,
          timeStr: targetInstant.toLocaleTimeString('en-US', {
            timeZone: city.zone,
            hour12: !hour24,
            hour: '2-digit',
            minute: '2-digit',
          }),
          dayStr: targetInstant.toLocaleDateString([], {
            timeZone: city.zone,
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          }),
        };
      }),
    [targetInstant, localTimeZone, hour24]
  );

  const localHour = targetInstant.getHours();
  const localMinute = targetInstant.getMinutes();
  const localSecond = targetInstant.getSeconds();
  const localIsDay = localHour >= 6 && localHour < 18;
  const localTimeStr = targetInstant.toLocaleTimeString('en-US', {
    hour12: !hour24,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const localDateStr = targetInstant.toLocaleDateString([], {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const copyMeetingSummary = () => {
    const lines = [
      `Local (${localTimeZone}): ${localTimeStr} (${localDateStr})`,
      ...cityRows.map((c) => `${c.label}: ${c.timeStr} (${c.dayStr}) · ${c.diffLabel}`),
    ].join('\n');
    void copyTextSafe(lines).then((ok) => {
      if (ok) {
        setCopiedSchedule(true);
        window.setTimeout(() => setCopiedSchedule(false), 1800);
      }
    });
  };

  return (
    <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.07]">
        <div>
          <h2 className="text-base font-bold text-white">World Clock &amp; Time Zones</h2>
          <p className="text-xs text-zinc-400">
            Live analog dials, solar day/night progression, and relative offsets across 12 global hubs.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center p-0.5 rounded-xl bg-[#0a0b0f] border border-white/[0.08] text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setHour24(false)}
              className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                !hour24 ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              12h
            </button>
            <button
              type="button"
              onClick={() => setHour24(true)}
              className={`px-2.5 py-1 rounded-lg cursor-pointer ${
                hour24 ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
              }`}
            >
              24h
            </button>
          </div>
          <button
            type="button"
            onClick={copyMeetingSummary}
            className="px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-400/35 hover:bg-indigo-500/25 text-xs font-semibold text-indigo-200 cursor-pointer"
          >
            {copiedSchedule ? '✓ Copied All' : '📋 Copy Summary'}
          </button>
        </div>
      </div>

      {/* Featured Local Time Hero Banner */}
      <div className="relative overflow-hidden p-4 sm:p-5 rounded-xl bg-[#0c0f16] border border-sky-400/30 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <HeroArtworkBackdrop src="/visuals/world-clock-globe.jpg" alt="Global Timezones Orbital Backdrop" opacityClass="opacity-85 sm:opacity-95" />
        <div className="relative z-10 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-sky-300">
              Your Local System Clock
            </span>
            <span className="px-2 py-0.5 rounded-md bg-white/[0.07] border border-white/[0.1] text-[10px] font-mono text-zinc-200">
              {localTimeZone}
            </span>
          </div>
          <span className="text-xs sm:text-sm text-zinc-300 font-medium">{localDateStr}</span>
        </div>

        <div className="relative z-10 flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums tracking-tight">
              {localTimeStr}
            </div>
            <div className="text-[10.5px] font-mono text-zinc-400">
              {localIsDay ? '☀️ Daytime Cycle' : '🌙 Evening / Night'}
            </div>
          </div>
          <AnalogClockDial
            hour={localHour}
            minute={localMinute}
            second={localSecond}
            size={56}
            isDay={localIsDay}
          />
        </div>
      </div>

      {/* Symmetrical 4x3 Global Hubs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cityRows.map((city) => {
          const isSameAsLocal = city.diffLabel === 'Local time';
          const regionBadge = REGION_ACCENTS[city.region] || REGION_ACCENTS.Universal;
          return (
            <div
              key={city.label}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-all portal-card-hover ${
                isSameAsLocal
                  ? 'bg-gradient-to-br from-[#121a28] to-[#0d1017] border-sky-400/35'
                  : 'bg-[#0d0e13] border-white/[0.07] hover:border-white/[0.16]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1 min-w-0">
                  <span className="text-xs font-bold text-white truncate">{city.label}</span>
                  <span className={`self-start px-1.5 py-px rounded text-[9.5px] font-mono border ${regionBadge}`}>
                    {city.region}
                  </span>
                </div>
                <AnalogClockDial hour={city.hour} minute={city.minute} size={36} isDay={city.isDay} />
              </div>

              <div className="flex items-baseline justify-between gap-2">
                <div className="text-xl font-extrabold font-mono text-white tabular-nums">
                  {city.timeStr}
                </div>
                <span className={`text-[10px] font-mono ${city.isDay ? 'text-amber-300' : 'text-indigo-300'}`}>
                  {city.isDay ? '☀️ Day' : '🌙 Night'}
                </span>
              </div>

              {/* 24h Solar Daylight Bar (06:00 - 18:00 sunlit zone) */}
              <div className="flex flex-col gap-1.5 pt-1 border-t border-white/[0.06]">
                <div className="relative w-full h-1.5 rounded-full bg-white/[0.06] overflow-visible">
                  <div
                    className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/40 to-amber-500/20"
                    style={{ left: '25%', width: '50%' }}
                  />
                  <span
                    className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-[#0d0e13] ${
                      city.isDay
                        ? 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.85)]'
                        : 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.85)]'
                    }`}
                    style={{ left: `${city.dayPct}%` }}
                  />
                </div>

                <div className="flex items-center justify-between gap-2 text-[10.5px] font-mono">
                  <span className="text-zinc-400 truncate">{city.dayStr}</span>
                  <span className={isSameAsLocal ? 'text-sky-300 font-semibold shrink-0' : 'text-zinc-500 shrink-0'}>
                    {city.diffLabel}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ── 3. Bookmarks Vault, Password Generator, Decision Picker & Scratchpad Tab ──

export const BookmarksSecurityTab: React.FC = () => {
  const [bookmarks, setBookmarks] = useSyncedWorkspaceState<BookmarkItem[]>('bookmarks', DEFAULT_BOOKMARKS);
  const [scratchpad, setScratchpad] = useSyncedWorkspaceState<{ text: string; counter: number }>(
    'scratchpad',
    { text: '', counter: 0 }
  );

  const [bmTitle, setBmTitle] = useState<string>('');
  const [bmUrl, setBmUrl] = useState<string>('');
  const [bmCategory, setBmCategory] = useState<string>('Daily');
  const [bmSearch, setBmSearch] = useState<string>('');
  const [bmCatFilter, setBmCatFilter] = useState<string>('All');

  const [pwLength, setPwLength] = useState<number>(16);
  const [pwSymbols, setPwSymbols] = useState<boolean>(true);
  const [pwMode, setPwMode] = useState<'random' | 'passphrase'>('random');
  const [generatedPw, setGeneratedPw] = useState<string>('');
  const [pwCopied, setPwCopied] = useState<boolean>(false);

  const [decisionInput, setDecisionInput] = useState<string>(
    'Walk outside\nRead a chapter\nCook fresh food\nStretch'
  );
  const [pickedOption, setPickedOption] = useState<string | null>(null);

  const counterVal = Number.isFinite(Number(scratchpad?.counter)) ? Math.max(0, Number(scratchpad?.counter)) : 0;
  const scratchpadText = typeof scratchpad?.text === 'string' ? scratchpad.text : '';

  const generatePassword = (mode: 'random' | 'passphrase') => {
    setPwMode(mode);
    const arr = new Uint32Array(Math.max(4, pwLength));
    window.crypto.getRandomValues(arr);
    if (mode === 'passphrase') {
      const words = [
        PASSPHRASE_WORDS[arr[0] % PASSPHRASE_WORDS.length],
        PASSPHRASE_WORDS[arr[1] % PASSPHRASE_WORDS.length],
        PASSPHRASE_WORDS[arr[2] % PASSPHRASE_WORDS.length],
        String(10 + (arr[3] % 89)),
      ];
      setGeneratedPw(words.join('-'));
    } else {
      const chars =
        'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789' + (pwSymbols ? '!@#$%^&*-_' : '');
      let out = '';
      for (let i = 0; i < pwLength; i += 1) {
        out += chars[arr[i] % chars.length];
      }
      setGeneratedPw(out);
    }
    setPwCopied(false);
  };

  useEffect(() => {
    if (!generatedPw) generatePassword('random');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entropyStats = useMemo(() => {
    if (pwMode === 'passphrase') {
      const bits = Math.round(3 * Math.log2(PASSPHRASE_WORDS.length) + Math.log2(90));
      return { bits, pct: Math.min(100, Math.round((bits / 128) * 100)), label: 'Memorable' };
    }
    const poolSize = 54 + (pwSymbols ? 10 : 0);
    const bits = Math.round(generatedPw.length * Math.log2(poolSize));
    const pct = Math.min(100, Math.round((bits / 128) * 100));
    const label = bits >= 96 ? 'Very Strong' : bits >= 72 ? 'Strong' : 'Moderate';
    return { bits, pct, label };
  }, [pwMode, pwSymbols, generatedPw.length]);

  const addBookmark = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bmTitle.trim() || !bmUrl.trim()) return;
    const cleanUrl = /^https?:\/\//i.test(bmUrl.trim()) ? bmUrl.trim() : `https://${bmUrl.trim()}`;
    setBookmarks((prev) => [
      { id: `bm-${Date.now()}`, title: bmTitle.trim(), url: cleanUrl, category: bmCategory },
      ...prev,
    ]);
    setBmTitle('');
    setBmUrl('');
  };

  const visibleBookmarks = useMemo(() => {
    const q = bmSearch.trim().toLowerCase();
    return bookmarks.filter((b) => {
      if (bmCatFilter !== 'All' && b.category !== bmCatFilter) return false;
      if (!q) return true;
      return (
        b.title.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q)
      );
    });
  }, [bookmarks, bmSearch, bmCatFilter]);

  const bookmarksScroll = useScrollEdgeFade([visibleBookmarks.length]);

  const decisionOptions = useMemo(
    () => decisionInput.split('\n').map((s) => s.trim()).filter(Boolean),
    [decisionInput]
  );

  const rollDecision = () => {
    if (decisionOptions.length === 0) return;
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    setPickedOption(decisionOptions[arr[0] % decisionOptions.length]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-stretch">
      {/* Bookmarks Vault */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1015] shrink-0">
          <HeroArtworkBackdrop src="/visuals/tab-api-rest.jpg" alt="Personal Quick Links Visual" opacityClass="opacity-75 sm:opacity-90" />
          <div className="relative z-10 flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-white">Personal Quick Links</h2>
              <p className="text-xs text-zinc-300/90">Pin favorite sites, docs &amp; destinations.</p>
            </div>
            <span className="shrink-0 px-2.5 py-1 rounded-md bg-[#080b12]/85 backdrop-blur-sm border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300">
              {bookmarks.length} pinned
            </span>
          </div>
          <div className="relative z-10 mt-3 flex items-center gap-2">
            <input
              type="text"
              value={bmSearch}
              onChange={(e) => setBmSearch(e.target.value)}
              placeholder="Filter links or tags..."
              aria-label="Filter bookmarks"
              className="flex-1 h-8 px-2.5 rounded-lg bg-[#08090c]/90 border border-white/[0.12] text-xs text-white focus:outline-none focus:border-sky-400/45"
            />
          </div>
        </div>

        <div className="px-4 sm:px-5 pt-3.5 pb-3 border-b border-white/[0.06] bg-[#111218] flex flex-col gap-2.5 shrink-0">
          <form onSubmit={addBookmark} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={bmTitle}
              onChange={(e) => setBmTitle(e.target.value)}
              placeholder="Site name"
              aria-label="Bookmark name"
              className="h-8 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-sky-400/45"
            />
            <input
              type="text"
              value={bmUrl}
              onChange={(e) => setBmUrl(e.target.value)}
              placeholder="https://..."
              aria-label="Bookmark URL"
              className="h-8 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-sky-400/45"
            />
            <select
              value={bmCategory}
              onChange={(e) => setBmCategory(e.target.value)}
              aria-label="Bookmark category"
              className="h-8 px-2 rounded-lg bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200 focus:outline-none"
            >
              {['Daily', 'Work', 'Learning', 'Finance', 'Health', 'Fun'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <button type="submit" className="h-8 px-3 rounded-lg bg-white hover:bg-sky-100 text-zinc-950 text-xs font-extrabold cursor-pointer">
              + Pin Bookmark
            </button>
          </form>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none text-[10.5px] font-mono">
            {['All', 'Daily', 'Work', 'Learning', 'Finance', 'Health', 'Fun'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setBmCatFilter(cat)}
                className={`shrink-0 px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                  bmCatFilter === cat
                    ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 font-bold'
                    : 'bg-[#16171e] border-white/[0.07] text-zinc-400 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 min-h-0 px-4 sm:px-5 py-3 bg-[#0b0c11]/60 flex flex-col">
          {visibleBookmarks.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-xs text-zinc-500 rounded-xl bg-[#08090c] border border-dashed border-white/[0.08]">
              <span>No links matching filter.</span>
            </div>
          ) : (
            <div
              ref={bookmarksScroll.ref}
              onScroll={bookmarksScroll.onScroll}
              className={`flex flex-col gap-1.5 max-h-56 overflow-y-auto overflow-x-hidden pr-1.5 custom-scrollbar ${bookmarksScroll.fadeClass}`}
            >
              {visibleBookmarks.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#12141c] border border-white/[0.07] hover:border-white/[0.15] transition-colors"
                >
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 min-w-0 flex-1 text-xs font-semibold text-sky-300 hover:text-sky-200 hover:underline truncate"
                  >
                    <span className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.06] text-[10px] font-mono text-zinc-300 shrink-0">
                      {b.category}
                    </span>
                    <span className="truncate">{b.title}</span>
                    <span className="text-[10px] opacity-60 shrink-0">↗</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setBookmarks((prev) => prev.filter((item) => item.id !== b.id))}
                    className="text-zinc-500 hover:text-rose-300 text-xs px-1 cursor-pointer shrink-0"
                    aria-label={`Remove ${b.title}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>
            {visibleBookmarks.length} of {bookmarks.length} links
          </span>
          <span className="text-zinc-600">Synced live</span>
        </div>
      </section>

      {/* Password Generator */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c1210] shrink-0">
          <HeroArtworkBackdrop src="/visuals/tab-env-security.jpg" alt="Password Security Studio Visual" opacityClass="opacity-75 sm:opacity-90" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-extrabold text-white">Password &amp; Passphrase Studio</h2>
              <p className="text-xs text-zinc-300/90">
                Offline CSPRNG (<code className="font-mono text-emerald-300">crypto.getRandomValues</code>).
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl bg-[#080b0a]/90 border border-emerald-400/25">
              <MiniRadialRing percent={entropyStats.pct} color="#34d399" size={34} />
              <div className="flex flex-col">
                <span className="text-xs font-extrabold font-mono text-white tabular-nums">
                  {entropyStats.bits} bits
                </span>
                <span className="text-[9.5px] font-mono text-emerald-300">{entropyStats.label}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col justify-between gap-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#08090c] border border-emerald-500/25">
              <input
                type="text"
                readOnly
                value={generatedPw}
                aria-label="Generated password"
                className="flex-1 bg-transparent text-sm font-mono font-bold text-emerald-300 focus:outline-none min-w-0"
              />
              <button
                type="button"
                onClick={() => {
                  void copyTextSafe(generatedPw).then((ok) => {
                    if (ok) {
                      setPwCopied(true);
                      window.setTimeout(() => setPwCopied(false), 1800);
                    }
                  });
                }}
                className="px-3 py-1 rounded-lg bg-[#16171e] border border-white/[0.1] hover:border-emerald-400/40 text-xs font-mono text-zinc-200 cursor-pointer shrink-0"
              >
                {pwCopied ? '✓ Copied' : 'Copy'}
              </button>
            </div>

            {/* Entropy & Character Class Breakdown */}
            <div className="flex flex-col gap-1.5">
              <div className="w-full h-1.5 rounded-full bg-[#08090c] overflow-hidden border border-white/[0.06]">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-300"
                  style={{ width: `${entropyStats.pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
                <span>Mode: {pwMode === 'passphrase' ? 'Passphrase (Words)' : 'Random Alphanumeric'}</span>
                <span>{generatedPw.length} chars</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#0c0d12] border border-white/[0.06] flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-300">
              <label className="flex items-center gap-2 flex-1 min-w-[160px]">
                <span className="font-mono text-zinc-400 shrink-0">Length: {pwLength}</span>
                <input
                  type="range"
                  min={8}
                  max={32}
                  value={pwLength}
                  onChange={(e) => setPwLength(Number(e.target.value))}
                  className="flex-1 accent-emerald-400 cursor-pointer"
                />
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer font-mono text-[11px] px-2 py-1 rounded-lg bg-[#16171e] border border-white/[0.08]">
                <input
                  type="checkbox"
                  checked={pwSymbols}
                  onChange={(e) => setPwSymbols(e.target.checked)}
                  className="accent-emerald-400"
                />
                Symbols
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => generatePassword('random')}
              className="py-2.5 rounded-xl bg-white hover:bg-emerald-100 text-zinc-950 text-xs font-extrabold cursor-pointer transition-colors"
            >
              🔑 Random Password
            </button>
            <button
              type="button"
              onClick={() => generatePassword('passphrase')}
              className="py-2.5 rounded-xl bg-sky-500/20 border border-sky-400/40 hover:bg-sky-500/30 text-xs font-bold text-sky-200 cursor-pointer transition-colors"
            >
              📖 Passphrase
            </button>
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>Zero network · Local CSPRNG</span>
          <span className="text-emerald-300/80">{entropyStats.bits}-bit entropy</span>
        </div>
      </section>

      {/* Decision Picker, Tally & Scratchpad */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#100e17] shrink-0">
          <HeroArtworkBackdrop src="/visuals/tab-code-playground.jpg" alt="Picker and Scratchpad Visual" opacityClass="opacity-75 sm:opacity-90" />
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-extrabold text-white">Picker, Tally &amp; Scratchpad</h2>
              <p className="text-xs text-zinc-300/90">Quick decision wheel, click tally &amp; synced note pad.</p>
            </div>
            <div className="shrink-0 flex items-center gap-1 p-1 rounded-xl bg-[#08090c]/90 border border-amber-400/30">
              <button
                type="button"
                onClick={() => setScratchpad((s) => ({ text: s?.text ?? '', counter: Math.max(0, counterVal - 1) }))}
                aria-label="Decrease tally"
                className="w-7 h-7 rounded-lg bg-[#16171e] border border-white/[0.1] hover:border-white/[0.25] text-white font-bold cursor-pointer"
              >
                -
              </button>
              <span className="px-2.5 font-mono text-sm font-extrabold text-amber-300 tabular-nums min-w-[28px] text-center">
                {counterVal}
              </span>
              <button
                type="button"
                onClick={() => setScratchpad((s) => ({ text: s?.text ?? '', counter: counterVal + 1 }))}
                aria-label="Increase tally"
                className="w-7 h-7 rounded-lg bg-[#16171e] border border-white/[0.1] hover:border-white/[0.25] text-white font-bold cursor-pointer"
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 px-4 sm:px-5 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-zinc-400">
              <span>Decision Options (1 per line)</span>
              <span>{decisionOptions.length} choices</span>
            </div>
            <textarea
              rows={3}
              value={decisionInput}
              onChange={(e) => setDecisionInput(e.target.value)}
              aria-label="Decision options"
              className="w-full p-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] focus:border-amber-400/45 focus:outline-none text-xs text-zinc-200 custom-scrollbar resize-none"
            />
          </div>

          <div className="flex items-center gap-2 min-h-[32px]">
            <button
              type="button"
              onClick={rollDecision}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 hover:bg-amber-500/30 text-xs font-bold text-amber-200 cursor-pointer shrink-0 transition-colors"
            >
              🎲 Pick One
            </button>
            {pickedOption && (
              <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-xs font-bold text-emerald-200 truncate">
                Winner: {pickedOption}
              </div>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1.5 min-h-[96px]">
            <div className="flex items-center justify-between text-[10.5px] font-mono text-zinc-400">
              <span>Quick Scratchpad</span>
              <span>{scratchpadText.length} chars</span>
            </div>
            <textarea
              rows={3}
              value={scratchpadText}
              onChange={(e) => setScratchpad({ text: e.target.value, counter: counterVal })}
              placeholder="Quick synced scratchpad for temp notes or tracking codes..."
              aria-label="Quick scratchpad"
              className="w-full flex-1 p-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] focus:border-purple-400/45 focus:outline-none text-xs font-mono text-zinc-200 custom-scrollbar resize-none"
            />
          </div>
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>Tally: {counterVal}</span>
          <span className="text-zinc-600">Synced live</span>
        </div>
      </section>
    </div>
  );
};
