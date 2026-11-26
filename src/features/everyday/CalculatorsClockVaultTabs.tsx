import React, { useEffect, useMemo, useState } from 'react';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
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

  const [billTotal, setBillTotal] = useState<string>('120');
  const [tipPct, setTipPct] = useState<number>(15);
  const [peopleCount, setPeopleCount] = useState<number>(3);
  const billNum = Math.max(0, parseFloat(billTotal) || 0);
  const tipAmount = (billNum * tipPct) / 100;
  const grandTotal = billNum + tipAmount;
  const perPerson = peopleCount > 0 ? grandTotal / peopleCount : grandTotal;

  const [origPrice, setOrigPrice] = useState<string>('2400');
  const [discountPct, setDiscountPct] = useState<string>('25');
  const origNum = Math.max(0, parseFloat(origPrice) || 0);
  const discNum = Math.max(0, Math.min(100, parseFloat(discountPct) || 0));
  const savedAmt = (origNum * discNum) / 100;
  const finalPrice = origNum - savedAmt;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Unit Converter */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Everyday Unit Converter</h2>
          <p className="text-xs text-zinc-400">Length, weight, cooking, temperature, digital storage &amp; time.</p>
        </div>

        <div className="flex flex-wrap gap-1.5">
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
              className={`px-2.5 py-1 rounded-xl text-xs font-semibold border cursor-pointer ${
                unitCat === c.id
                  ? 'bg-sky-500/20 border-sky-400/45 text-white font-bold'
                  : 'bg-[#16171e] border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-mono text-zinc-400">From</label>
            <div className="flex gap-2">
              <input
                type="number"
                value={unitValue}
                onChange={(e) => setUnitValue(e.target.value)}
                aria-label="Unit input value"
                className="w-28 h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white"
              />
              <select
                value={fromUnit}
                onChange={(e) => setFromUnit(e.target.value)}
                aria-label="From unit"
                className="flex-1 h-9 px-2.5 rounded-xl bg-[#16171e] border border-white/[0.08] text-xs text-zinc-200"
              >
                {unitOptions.map((u) => (
                  <option key={u.key} value={u.key}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const prevFrom = fromUnit;
              setFromUnit(toUnit);
              setToUnit(prevFrom);
            }}
            className="self-start px-3 py-1 rounded-lg bg-[#181922] border border-white/[0.1] text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
          >
            ⇅ Swap Units
          </button>

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
                className="flex-1 h-9 px-2.5 rounded-xl bg-[#16171e] border border-white/[0.08] text-xs text-zinc-200"
              >
                {unitOptions.map((u) => (
                  <option key={u.key} value={u.key}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Split Bill & Tip */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Split Bill &amp; Tip Calculator</h2>
          <p className="text-xs text-zinc-400">Split group bills fairly with instant per-person share.</p>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-zinc-400">Bill Total</span>
            <input
              type="number"
              min={0}
              value={billTotal}
              onChange={(e) => setBillTotal(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Tip ({tipPct}%)</span>
              <input
                type="range"
                min={0}
                max={30}
                value={tipPct}
                onChange={(e) => setTipPct(Number(e.target.value))}
                className="h-9 accent-emerald-400 cursor-pointer"
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
                className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white"
              />
            </label>
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
      </section>

      {/* Discount Calculator */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Discount &amp; Final Price</h2>
          <p className="text-xs text-zinc-400">Check sale savings and net price after percentage off.</p>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-zinc-400">Original Price</span>
            <input
              type="number"
              min={0}
              value={origPrice}
              onChange={(e) => setOrigPrice(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-mono text-zinc-400">Discount (%)</span>
            <input
              type="number"
              min={0}
              max={100}
              value={discountPct}
              onChange={(e) => setDiscountPct(e.target.value)}
              className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-mono text-white"
            />
          </label>
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
      </section>
    </div>
  );
};

// ── 2. World Clock & Time-Shift Meeting Planner Tab ──

function getZoneMeta(instant: Date, zone: string, localTz: string): { isDay: boolean; diffLabel: string } {
  try {
    const cityWall = new Date(instant.toLocaleString('en-US', { timeZone: zone }));
    const localWall = new Date(instant.toLocaleString('en-US', { timeZone: localTz }));
    const diffMin = Math.round((cityWall.getTime() - localWall.getTime()) / 60000);
    const hr = cityWall.getHours();
    const isDay = hr >= 6 && hr < 18;
    if (diffMin === 0) return { isDay, diffLabel: 'Local time' };
    const sign = diffMin > 0 ? '+' : '-';
    const abs = Math.abs(diffMin);
    const hrs = Math.floor(abs / 60);
    const mins = abs % 60;
    return {
      isDay,
      diffLabel: mins > 0 ? `${sign}${hrs}h ${mins}m` : `${sign}${hrs}h`,
    };
  } catch {
    return { isDay: true, diffLabel: zone };
  }
}

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
            Live local clock and 12 major global hubs with day/night state and relative hour offset.
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

      {/* Featured Local Time Banner */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-sky-500/[0.12] via-[#121622] to-[#111218] border border-sky-400/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono uppercase tracking-wider font-bold text-sky-300">
              Your Local Time
            </span>
            <span className="px-2 py-0.5 rounded bg-white/[0.06] border border-white/[0.08] text-[10px] font-mono text-zinc-300">
              {localTimeZone}
            </span>
          </div>
          <span className="text-xs text-zinc-400">{localDateStr}</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white tabular-nums tracking-tight">
          {localTimeStr}
        </div>
      </div>

      {/* Symmetrical 4x3 Global Hubs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cityRows.map((city) => {
          const isSameAsLocal = city.diffLabel === 'Local time';
          return (
            <div
              key={city.label}
              className={`p-3.5 rounded-xl border flex flex-col justify-between gap-2.5 transition-colors ${
                isSameAsLocal
                  ? 'bg-[#121822] border-sky-400/30'
                  : 'bg-[#0d0e13] border-white/[0.07] hover:border-white/[0.14]'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate">{city.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono border shrink-0 ${
                    city.isDay
                      ? 'bg-amber-500/10 border-amber-400/25 text-amber-300'
                      : 'bg-indigo-500/10 border-indigo-400/25 text-indigo-300'
                  }`}
                >
                  {city.isDay ? 'Day' : 'Night'}
                </span>
              </div>

              <div className="text-xl font-extrabold font-mono text-white tabular-nums">
                {city.timeStr}
              </div>

              <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-white/[0.06] text-[10.5px] font-mono">
                <span className="text-zinc-400 truncate">{city.dayStr}</span>
                <span className={isSameAsLocal ? 'text-sky-300 font-semibold shrink-0' : 'text-zinc-500 shrink-0'}>
                  {city.diffLabel}
                </span>
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

  const [pwLength, setPwLength] = useState<number>(16);
  const [pwSymbols, setPwSymbols] = useState<boolean>(true);
  const [generatedPw, setGeneratedPw] = useState<string>('');
  const [pwCopied, setPwCopied] = useState<boolean>(false);

  const [decisionInput, setDecisionInput] = useState<string>(
    'Walk outside\nRead a chapter\nCook fresh food\nStretch'
  );
  const [pickedOption, setPickedOption] = useState<string | null>(null);

  const generatePassword = (mode: 'random' | 'passphrase') => {
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
    if (!q) return bookmarks;
    return bookmarks.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.url.toLowerCase().includes(q)
    );
  }, [bookmarks, bmSearch]);

  const rollDecision = () => {
    const options = decisionInput.split('\n').map((s) => s.trim()).filter(Boolean);
    if (options.length === 0) return;
    const arr = new Uint32Array(1);
    window.crypto.getRandomValues(arr);
    setPickedOption(options[arr[0] % options.length]);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
      {/* Bookmarks Vault */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-white">Personal Quick Links</h2>
            <p className="text-xs text-zinc-400">Pin favorite sites, docs &amp; destinations.</p>
          </div>
          <input
            type="text"
            value={bmSearch}
            onChange={(e) => setBmSearch(e.target.value)}
            placeholder="Filter..."
            aria-label="Filter bookmarks"
            className="h-8 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white w-28"
          />
        </div>

        <form onSubmit={addBookmark} className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={bmTitle}
            onChange={(e) => setBmTitle(e.target.value)}
            placeholder="Site name"
            aria-label="Bookmark name"
            className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
          />
          <input
            type="text"
            value={bmUrl}
            onChange={(e) => setBmUrl(e.target.value)}
            placeholder="https://..."
            aria-label="Bookmark URL"
            className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
          />
          <select
            value={bmCategory}
            onChange={(e) => setBmCategory(e.target.value)}
            aria-label="Bookmark category"
            className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200"
          >
            {['Daily', 'Work', 'Learning', 'Finance', 'Health', 'Fun'].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="h-9 px-3 rounded-xl bg-white text-zinc-950 text-xs font-bold cursor-pointer">
            + Pin Bookmark
          </button>
        </form>

        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto overflow-x-hidden pt-1 pr-1.5 custom-scrollbar">
          {visibleBookmarks.map((b) => (
            <div
              key={b.id}
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#16171e] border border-white/[0.07]"
            >
              <a
                href={b.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 min-w-0 flex-1 text-xs font-semibold text-sky-300 hover:underline truncate"
              >
                <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[10px] font-mono text-zinc-300 shrink-0">
                  {b.category}
                </span>
                <span className="truncate">{b.title}</span>
              </a>
              <button
                type="button"
                onClick={() => setBookmarks((prev) => prev.filter((item) => item.id !== b.id))}
                className="text-zinc-500 hover:text-rose-300 text-xs cursor-pointer"
                aria-label={`Remove ${b.title}`}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Password Generator */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-white">Password &amp; Passphrase Studio</h2>
          <p className="text-xs text-zinc-400">
            Generated offline via Web Crypto (<code className="font-mono text-zinc-300">crypto.getRandomValues</code>).
          </p>
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-[#08090c] border border-white/[0.1]">
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
            className="px-3 py-1 rounded-lg bg-[#16171e] border border-white/[0.1] text-xs font-mono text-zinc-200 cursor-pointer shrink-0"
          >
            {pwCopied ? '✓ Copied' : 'Copy'}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300">
          <label className="flex items-center gap-2">
            <span className="font-mono text-zinc-400">Length: {pwLength}</span>
            <input
              type="range"
              min={8}
              max={32}
              value={pwLength}
              onChange={(e) => setPwLength(Number(e.target.value))}
              className="accent-emerald-400 cursor-pointer"
            />
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={pwSymbols}
              onChange={(e) => setPwSymbols(e.target.checked)}
              className="accent-emerald-400"
            />
            Symbols
          </label>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => generatePassword('random')}
            className="py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold cursor-pointer"
          >
            🔑 Random Password
          </button>
          <button
            type="button"
            onClick={() => generatePassword('passphrase')}
            className="py-2 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs font-bold text-sky-200 cursor-pointer"
          >
            📖 Passphrase
          </button>
        </div>
      </section>

      {/* Decision Picker, Tally & Scratchpad */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col justify-between gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Picker, Tally &amp; Scratchpad</h2>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScratchpad((s) => ({ ...s, counter: Math.max(0, s.counter - 1) }))}
              className="w-7 h-7 rounded-lg bg-[#16171e] border border-white/[0.1] text-white font-bold cursor-pointer"
            >
              -
            </button>
            <span className="px-2 font-mono text-sm font-extrabold text-amber-300 tabular-nums">
              {scratchpad.counter}
            </span>
            <button
              type="button"
              onClick={() => setScratchpad((s) => ({ ...s, counter: s.counter + 1 }))}
              className="w-7 h-7 rounded-lg bg-[#16171e] border border-white/[0.1] text-white font-bold cursor-pointer"
            >
              +
            </button>
          </div>
        </div>

        <textarea
          rows={3}
          value={decisionInput}
          onChange={(e) => setDecisionInput(e.target.value)}
          aria-label="Decision options"
          className="w-full p-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200"
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={rollDecision}
            className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-xs font-bold text-amber-200 cursor-pointer shrink-0"
          >
            🎲 Pick One
          </button>
          {pickedOption && (
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-400/35 text-xs font-bold text-emerald-200 truncate">
              Winner: {pickedOption}
            </div>
          )}
        </div>

        <textarea
          rows={3}
          value={scratchpad.text}
          onChange={(e) => setScratchpad((s) => ({ ...s, text: e.target.value }))}
          placeholder="Quick synced scratchpad for temp notes or tracking codes..."
          aria-label="Quick scratchpad"
          className="w-full p-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-zinc-200"
        />
      </section>
    </div>
  );
};
