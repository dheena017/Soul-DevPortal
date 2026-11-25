import React, { useEffect, useMemo, useState } from 'react';

function utf8ToBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = '';
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return window.btoa(bin);
}

function base64ToUtf8(b64: string): string {
  const bin = window.atob(b64.trim());
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) {
    bytes[i] = bin.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

function sortObjectKeysDeep(val: unknown): unknown {
  if (Array.isArray(val)) return val.map(sortObjectKeysDeep);
  if (val && typeof val === 'object') {
    const out: Record<string, unknown> = {};
    Object.keys(val as Record<string, unknown>)
      .sort((a, b) => a.localeCompare(b))
      .forEach((k) => {
        out[k] = sortObjectKeysDeep((val as Record<string, unknown>)[k]);
      });
    return out;
  }
  return val;
}

function toTitleCase(input: string): string {
  return input.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

function toCamelCase(input: string): string {
  return input
    .trim()
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((word, idx) =>
      idx === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join('');
}

function toDelimitedCase(input: string, sep: '_' | '-'): string {
  return input
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((w) => w.toLowerCase())
    .join(sep);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '').trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  const num = parseInt(clean, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

function rgbToHsl(r: number, g: number, b: number): string {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      default:
        h = (rn - gn) / d + 4;
        break;
    }
    h /= 6;
  }
  return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
}

export const TextAndDevLabTab: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const notifyCopy = (id: string) => {
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 1600);
  };

  // 1. Text Analyzer & Case Lab
  const [textInput, setTextInput] = useState<string>(
    'Soul DevPortal Everyday Utilities\nKeep calm, write clean code, and ship steadily.'
  );
  const textStats = useMemo(() => {
    const chars = textInput.length;
    const charsNoSpace = textInput.replace(/\s/g, '').length;
    const words = textInput.trim() ? textInput.trim().split(/\s+/).length : 0;
    const lines = textInput ? textInput.split('\n').length : 0;
    const sentences = textInput.trim()
      ? textInput.split(/[.!?]+/).filter((s) => s.trim().length > 0).length
      : 0;
    const readSec = Math.max(words > 0 ? 1 : 0, Math.round((words / 220) * 60));
    const readLabel = readSec >= 60 ? `${Math.ceil(readSec / 60)}m read` : `${readSec}s read`;
    return { chars, charsNoSpace, words, lines, sentences, readLabel };
  }, [textInput]);

  // 2. JSON Formatter & Validator
  const [jsonText, setJsonText] = useState<string>(
    '{\n  "portal": "Soul DevPortal",\n  "workspace": "Everyday Utilities",\n  "features": ["Tasks", "Notes", "Focus", "Budget", "Dev Lab"],\n  "localFirst": true\n}'
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const transformJson = (mode: 'pretty2' | 'pretty4' | 'minify' | 'sort') => {
    try {
      const parsed = JSON.parse(jsonText);
      const next =
        mode === 'minify'
          ? JSON.stringify(parsed)
          : mode === 'sort'
          ? JSON.stringify(sortObjectKeysDeep(parsed), null, 2)
          : JSON.stringify(parsed, null, mode === 'pretty4' ? 4 : 2);
      setJsonText(next);
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  // 3. Base64 & URL Encoder/Decoder
  const [codecKind, setCodecKind] = useState<'base64' | 'url'>('base64');
  const [codecRaw, setCodecRaw] = useState<string>('hello world & soul portal');
  const [codecEncoded, setCodecEncoded] = useState<string>(() => utf8ToBase64('hello world & soul portal'));
  const [codecError, setCodecError] = useState<string | null>(null);

  const encodeValue = (raw: string, kind: 'base64' | 'url') => {
    setCodecRaw(raw);
    try {
      setCodecEncoded(kind === 'base64' ? utf8ToBase64(raw) : encodeURIComponent(raw));
      setCodecError(null);
    } catch (err) {
      setCodecError(err instanceof Error ? err.message : 'Encoding failed');
    }
  };

  const decodeValue = (enc: string, kind: 'base64' | 'url') => {
    setCodecEncoded(enc);
    try {
      setCodecRaw(kind === 'base64' ? base64ToUtf8(enc) : decodeURIComponent(enc));
      setCodecError(null);
    } catch (err) {
      setCodecError(err instanceof Error ? err.message : 'Invalid encoded input');
    }
  };

  // 4. Unix Timestamp Converter
  const [nowEpochSec, setNowEpochSec] = useState<number>(() => Math.floor(Date.now() / 1000));
  const [epochInput, setEpochInput] = useState<string>(() => String(Math.floor(Date.now() / 1000)));
  const [dateTimeInput, setDateTimeInput] = useState<string>(() => new Date().toISOString().slice(0, 19));

  useEffect(() => {
    const id = window.setInterval(() => setNowEpochSec(Math.floor(Date.now() / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);

  const parsedEpochDate = useMemo(() => {
    const rawNum = Number(epochInput.trim());
    if (!epochInput.trim() || Number.isNaN(rawNum)) return null;
    const ms = Math.abs(rawNum) > 99_999_999_999 ? rawNum : rawNum * 1000;
    const d = new Date(ms);
    if (Number.isNaN(d.getTime())) return null;
    return {
      iso: d.toISOString(),
      local: d.toLocaleString(),
      utc: d.toUTCString(),
    };
  }, [epochInput]);

  // 5. UUID / Token & Hex Color Studio
  const [uuids, setUuids] = useState<string[]>(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return [crypto.randomUUID(), crypto.randomUUID(), crypto.randomUUID()];
    }
    return ['3a7b9f12-4c11-4f8a-9b22-1d8e0c9b12a0'];
  });
  const [colorHex, setColorHex] = useState<string>('#38bdf8');
  const rgb = hexToRgb(colorHex);
  const hsl = rgb ? rgbToHsl(rgb.r, rgb.g, rgb.b) : null;
  const luminance = rgb ? (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255 : 0.5;

  const generateUuids = () => {
    const makeId = () =>
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now().toString(16)}-${Math.random().toString(16).slice(2, 10)}`;
    setUuids([makeId(), makeId(), makeId(), makeId()]);
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Row 1: Text & Case Lab + JSON Formatter */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-white">Text Analyzer &amp; Case Transformer</h2>
              <p className="text-xs text-zinc-400">Live counts, read time &amp; instant case/line transformations.</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard?.writeText(textInput);
                  notifyCopy('text');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#181922] border border-white/[0.1] text-[11px] font-mono text-zinc-200 cursor-pointer"
              >
                {copiedId === 'text' ? '✓ Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={() => setTextInput('')}
                className="px-2.5 py-1 rounded-lg bg-[#181922] border border-white/[0.1] text-[11px] font-mono text-zinc-400 hover:text-rose-300 cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          <textarea
            rows={6}
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Paste text to analyze word counts or transform cases..."
            aria-label="Text analyzer input"
            className="w-full p-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-zinc-200 focus:outline-none focus:border-purple-400/50 resize-y"
          />

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
            {[
              { label: 'Words', val: textStats.words },
              { label: 'Chars', val: textStats.chars },
              { label: 'No Space', val: textStats.charsNoSpace },
              { label: 'Lines', val: textStats.lines },
              { label: 'Sentences', val: textStats.sentences },
              { label: 'Read Time', val: textStats.readLabel },
            ].map((s) => (
              <div key={s.label} className="p-2 rounded-xl bg-[#16171e] border border-white/[0.06]">
                <div className="text-xs font-extrabold font-mono text-white tabular-nums">{s.val}</div>
                <div className="text-[10px] text-zinc-500">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: 'UPPER', fn: () => setTextInput((t) => t.toUpperCase()) },
              { label: 'lower', fn: () => setTextInput((t) => t.toLowerCase()) },
              { label: 'Title Case', fn: () => setTextInput((t) => toTitleCase(t)) },
              { label: 'camelCase', fn: () => setTextInput((t) => toCamelCase(t)) },
              { label: 'snake_case', fn: () => setTextInput((t) => toDelimitedCase(t, '_')) },
              { label: 'kebab-case', fn: () => setTextInput((t) => toDelimitedCase(t, '-')) },
              {
                label: 'Sort Lines',
                fn: () => setTextInput((t) => t.split('\n').sort((a, b) => a.localeCompare(b)).join('\n')),
              },
              {
                label: 'Dedup Lines',
                fn: () => setTextInput((t) => Array.from(new Set(t.split('\n'))).join('\n')),
              },
              {
                label: 'Trim Blank',
                fn: () => setTextInput((t) => t.split('\n').map((l) => l.trim()).filter(Boolean).join('\n')),
              },
            ].map((act) => (
              <button
                key={act.label}
                type="button"
                onClick={act.fn}
                className="px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-purple-400/45 text-[11px] font-mono text-zinc-200 cursor-pointer"
              >
                {act.label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-white">JSON Formatter &amp; Validator</h2>
              <p className="text-xs text-zinc-400">Pretty-print, minify, sort keys alphabetically &amp; catch syntax errors.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(jsonText);
                notifyCopy('json');
              }}
              className="px-2.5 py-1 rounded-lg bg-[#181922] border border-white/[0.1] text-[11px] font-mono text-zinc-200 cursor-pointer"
            >
              {copiedId === 'json' ? '✓ Copied' : 'Copy JSON'}
            </button>
          </div>

          <textarea
            rows={7}
            value={jsonText}
            onChange={(e) => {
              setJsonText(e.target.value);
              setJsonError(null);
            }}
            spellCheck={false}
            aria-label="JSON input"
            className="w-full p-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-sky-200 focus:outline-none focus:border-sky-400/50 resize-y"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => transformJson('pretty2')}
                className="px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/35 text-xs font-bold text-sky-200 cursor-pointer"
              >
                Format (2sp)
              </button>
              <button
                type="button"
                onClick={() => transformJson('pretty4')}
                className="px-3 py-1.5 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                4sp
              </button>
              <button
                type="button"
                onClick={() => transformJson('minify')}
                className="px-3 py-1.5 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                Minify
              </button>
              <button
                type="button"
                onClick={() => transformJson('sort')}
                className="px-3 py-1.5 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-200 cursor-pointer"
              >
                Sort Keys
              </button>
            </div>
            <span className={`text-[11px] font-mono ${jsonError ? 'text-rose-300' : 'text-emerald-300'}`}>
              {jsonError ? `✕ ${jsonError}` : '✓ Ready'}
            </span>
          </div>
        </section>
      </div>

      {/* Row 2: Base64 / URL Codec + Unix Timestamp Converter */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-white">Base64 &amp; URL Encoder / Decoder</h2>
              <p className="text-xs text-zinc-400">Live two-way UTF-8 safe conversion.</p>
            </div>
            <div className="flex items-center p-0.5 rounded-xl bg-[#08090c] border border-white/[0.08]">
              <button
                type="button"
                onClick={() => {
                  setCodecKind('base64');
                  encodeValue(codecRaw, 'base64');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                  codecKind === 'base64' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                }`}
              >
                Base64
              </button>
              <button
                type="button"
                onClick={() => {
                  setCodecKind('url');
                  encodeValue(codecRaw, 'url');
                }}
                className={`px-3 py-1 rounded-lg text-xs font-mono cursor-pointer ${
                  codecKind === 'url' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400'
                }`}
              >
                URL Encode
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Plain Text</span>
              <textarea
                rows={2}
                value={codecRaw}
                onChange={(e) => encodeValue(e.target.value, codecKind)}
                className="w-full p-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-zinc-400">
                  {codecKind === 'base64' ? 'Base64 Output' : 'Encoded URL Output'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(codecEncoded);
                    notifyCopy('codec');
                  }}
                  className="text-[11px] font-mono text-sky-300 cursor-pointer"
                >
                  {copiedId === 'codec' ? '✓ Copied' : 'Copy output'}
                </button>
              </div>
              <textarea
                rows={2}
                value={codecEncoded}
                onChange={(e) => decodeValue(e.target.value, codecKind)}
                className="w-full p-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-emerald-300"
              />
            </label>
          </div>
          {codecError && <span className="text-[11px] font-mono text-rose-300">{codecError}</span>}
        </section>

        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-white">Unix Timestamp Converter</h2>
              <p className="text-xs text-zinc-400">Current Epoch: <span className="font-mono text-sky-300">{nowEpochSec}</span></p>
            </div>
            <button
              type="button"
              onClick={() => {
                const now = String(Math.floor(Date.now() / 1000));
                setEpochInput(now);
                setDateTimeInput(new Date().toISOString().slice(0, 19));
              }}
              className="px-3 py-1 rounded-xl bg-[#181922] border border-white/[0.1] text-xs font-mono text-zinc-200 cursor-pointer"
            >
              Use Now
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Epoch (sec or ms)</span>
              <input
                type="text"
                value={epochInput}
                onChange={(e) => setEpochInput(e.target.value)}
                className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-mono text-zinc-400">ISO Date → Epoch</span>
              <input
                type="datetime-local"
                value={dateTimeInput}
                onChange={(e) => {
                  setDateTimeInput(e.target.value);
                  const d = new Date(e.target.value);
                  if (!Number.isNaN(d.getTime())) {
                    setEpochInput(String(Math.floor(d.getTime() / 1000)));
                  }
                }}
                className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
              />
            </label>
          </div>

          {parsedEpochDate ? (
            <div className="p-3 rounded-xl bg-[#16171e] border border-white/[0.07] flex flex-col gap-1 text-xs font-mono">
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">ISO 8601:</span>
                <span className="text-white">{parsedEpochDate.iso}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">Local:</span>
                <span className="text-emerald-300">{parsedEpochDate.local}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-400">UTC:</span>
                <span className="text-sky-300">{parsedEpochDate.utc}</span>
              </div>
            </div>
          ) : (
            <div className="text-xs text-rose-300 font-mono">Enter a valid numeric timestamp.</div>
          )}
        </section>
      </div>

      {/* Row 3: UUID Generator + Hex / RGB Color Studio */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">UUID v4 Batch Generator</h2>
              <p className="text-xs text-zinc-400">Generate unique identifiers for records, tests &amp; APIs.</p>
            </div>
            <button
              type="button"
              onClick={generateUuids}
              className="px-3.5 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-extrabold cursor-pointer"
            >
              Generate 4 UUIDs
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {uuids.map((id) => (
              <div
                key={id}
                className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#08090c] border border-white/[0.07]"
              >
                <span className="text-xs font-mono text-zinc-200 truncate">{id}</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(id);
                    notifyCopy(id);
                  }}
                  className="text-[11px] font-mono text-sky-300 cursor-pointer shrink-0"
                >
                  {copiedId === id ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">Color Picker &amp; Hex / RGB / HSL Converter</h2>
              <p className="text-xs text-zinc-400">Convert Hex colors to RGB &amp; HSL and check foreground readability.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={rgb ? colorHex : '#38bdf8'}
              onChange={(e) => setColorHex(e.target.value)}
              aria-label="Pick color"
              className="w-12 h-10 rounded-xl bg-[#08090c] border border-white/[0.1] p-1 cursor-pointer"
            />
            <input
              type="text"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              aria-label="Hex value"
              className="h-10 w-32 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
            />
            <div
              className="flex-1 min-w-[140px] h-10 rounded-xl border border-white/[0.15] flex items-center justify-center text-xs font-bold"
              style={{
                backgroundColor: rgb ? colorHex : '#38bdf8',
                color: luminance > 0.55 ? '#09090c' : '#ffffff',
              }}
            >
              Sample Foreground Text
            </div>
          </div>

          {rgb && hsl && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
              {[
                { label: 'HEX', val: colorHex.toUpperCase() },
                { label: 'RGB', val: `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` },
                { label: 'HSL', val: hsl },
              ].map((entry) => (
                <button
                  key={entry.label}
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(entry.val);
                    notifyCopy(entry.label);
                  }}
                  className="p-2.5 rounded-xl bg-[#16171e] border border-white/[0.08] hover:border-sky-400/40 text-left cursor-pointer"
                >
                  <div className="text-[10px] text-zinc-500 flex justify-between">
                    <span>{entry.label}</span>
                    <span className="text-sky-300">{copiedId === entry.label ? '✓' : 'copy'}</span>
                  </div>
                  <div className="text-zinc-200 truncate mt-0.5">{entry.val}</div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
      {/* Row 4: Live Regex Tester + Quick Line Diff Comparator */}
      <RegexAndDiffToolkit />
    </div>
  );
};

const RegexAndDiffToolkit: React.FC = () => {
  const [regexPattern, setRegexPattern] = useState<string>('\\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}\\b');
  const [regexFlags, setRegexFlags] = useState<string>('g');
  const [regexInput, setRegexInput] = useState<string>(
    'Contact support@soulportal.dev or admin@example.org before Friday.'
  );

  const regexMatches = useMemo(() => {
    try {
      const rx = new RegExp(regexPattern, regexFlags);
      const found: string[] = [];
      if (regexFlags.includes('g')) {
        for (const m of regexInput.matchAll(rx)) {
          if (m[0]) found.push(m[0]);
          if (found.length >= 25) break;
        }
      } else {
        const m = regexInput.match(rx);
        if (m?.[0]) found.push(m[0]);
      }
      return { valid: true, matches: found, error: '' };
    } catch (err) {
      return { valid: false, matches: [] as string[], error: (err as Error).message };
    }
  }, [regexPattern, regexFlags, regexInput]);

  const [leftText, setLeftText] = useState<string>('port: 5181\nversion: 0.0.1\ntheme: obsidian\nscroll: smooth');
  const [rightText, setRightText] = useState<string>('port: 5281\nversion: 0.0.1\ntheme: obsidian-dark\ncache: sqlite-wal');

  const diffRows = useMemo(() => {
    const aLines = leftText.split('\n');
    const bLines = rightText.split('\n');
    const maxLen = Math.max(aLines.length, bLines.length);
    const out: Array<{ idx: number; left: string; right: string; changed: boolean }> = [];
    for (let i = 0; i < maxLen; i += 1) {
      const l = aLines[i] ?? '';
      const r = bLines[i] ?? '';
      out.push({ idx: i + 1, left: l, right: r, changed: l !== r });
    }
    return out;
  }, [leftText, rightText]);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Live Regular Expression Tester</h2>
            <p className="text-xs text-zinc-400">Validate regex patterns and inspect extracted matches.</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono text-emerald-300">
            {regexMatches.valid ? `${regexMatches.matches.length} matches` : 'Invalid Pattern'}
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={regexPattern}
            onChange={(e) => setRegexPattern(e.target.value)}
            aria-label="Regex pattern"
            className="flex-1 h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-sky-300"
          />
          <input
            type="text"
            value={regexFlags}
            onChange={(e) => setRegexFlags(e.target.value)}
            placeholder="gi"
            aria-label="Regex flags"
            className="w-16 h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-amber-300 text-center"
          />
        </div>

        <textarea
          rows={3}
          value={regexInput}
          onChange={(e) => setRegexInput(e.target.value)}
          aria-label="Regex sample input"
          className="w-full p-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-zinc-200"
        />

        {regexMatches.error ? (
          <div className="text-xs font-mono text-rose-300">{regexMatches.error}</div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {regexMatches.matches.length === 0 ? (
              <span className="text-xs text-zinc-500 font-mono">No matches found in sample text.</span>
            ) : (
              regexMatches.matches.map((m, idx) => (
                <span key={`${m}-${idx}`} className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-xs font-mono text-sky-200">
                  {m}
                </span>
              ))
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Quick Text &amp; Config Line Diff</h2>
            <p className="text-xs text-zinc-400">Spot line-by-line edits between two text snippets.</p>
          </div>
          <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/15 border border-amber-400/30 text-[11px] font-mono text-amber-300">
            {diffRows.filter((r) => r.changed).length} changed lines
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <textarea
            rows={4}
            value={leftText}
            onChange={(e) => setLeftText(e.target.value)}
            aria-label="Original text"
            className="w-full p-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-zinc-300"
          />
          <textarea
            rows={4}
            value={rightText}
            onChange={(e) => setRightText(e.target.value)}
            aria-label="Updated text"
            className="w-full p-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-zinc-300"
          />
        </div>

        <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1 custom-scrollbar font-mono text-[11px]">
          {diffRows.map((row) => (
            <div
              key={row.idx}
              className={`grid grid-cols-[24px_1fr_1fr] gap-2 px-2 py-1 rounded ${
                row.changed ? 'bg-amber-500/10 border border-amber-400/25' : 'bg-[#08090c]'
              }`}
            >
              <span className="text-zinc-500">{row.idx}</span>
              <span className={row.changed ? 'text-rose-300 truncate' : 'text-zinc-400 truncate'}>{row.left || '∅'}</span>
              <span className={row.changed ? 'text-emerald-300 truncate' : 'text-zinc-400 truncate'}>{row.right || '∅'}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};


