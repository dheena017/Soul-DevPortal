import React, { useEffect, useRef, useState } from 'react';
import { ProportionalSpectrumBar } from '../../components/PortalVisuals';
import {
  HumanTask,
  STARTER_TASK_TEMPLATES,
  TaskTemplate,
  formatMinutes,
  parseSmartTaskInput,
  todayIso,
} from './taskTypes';

export interface TaskInsightsPanelProps {
  tasks: HumanTask[];
  dailyCapacityMin: number;
  onChangeDailyCapacity: (mins: number) => void;
  onRescheduleOverdueToToday: () => void;
  onArchiveCompleted: () => void;
}

export const TaskInsightsPanel: React.FC<TaskInsightsPanelProps> = ({
  tasks,
  dailyCapacityMin,
  onChangeDailyCapacity,
  onRescheduleOverdueToToday,
  onArchiveCompleted,
}) => {
  const today = todayIso();
  const active = tasks.filter((t) => !t.done && !t.archived);
  const dueTodayMins = active
    .filter((t) => t.dueDate === today)
    .reduce((acc, t) => acc + (t.estimateMin || 20), 0);
  const overdueTasks = active.filter((t) => Boolean(t.dueDate) && t.dueDate < today);
  const completedToday = tasks.filter(
    (t) => t.done && ((t.completedAt && t.completedAt.slice(0, 10) === today) || t.dueDate === today)
  ).length;
  const totalSpent = tasks.reduce((acc, t) => acc + (t.spentMin || 0), 0);
  const recurringCount = active.filter((t) => t.repeat && t.repeat !== 'none').length;
  const capacityPct = dailyCapacityMin > 0 ? Math.min(100, Math.round((dueTodayMins / dailyCapacityMin) * 100)) : 0;
  const overloaded = dueTodayMins > dailyCapacityMin;

  return (
    <section
      className="neu-card w-full rounded-2xl bg-[#111218] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-4 portal-drawer-enter"
      aria-label="Productivity insights and capacity"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300">
            PRODUCTIVITY &amp; WORKLOAD ANALYTICS
          </span>
          <h2 className="text-base font-bold text-white">Daily Focus Capacity &amp; Task Distribution</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <label className="flex items-center gap-2 font-mono text-zinc-400">
            <span>Daily Cap:</span>
            <select
              value={dailyCapacityMin}
              onChange={(e) => onChangeDailyCapacity(Number(e.target.value))}
              className="h-8 px-2 rounded-lg bg-[#08090c] border border-white/[0.1] text-zinc-200"
            >
              <option value={120}>2h (Light)</option>
              <option value={240}>4h (Balanced)</option>
              <option value={360}>6h (Heavy)</option>
              <option value={480}>8h (Full Day)</option>
            </select>
          </label>
          {overdueTasks.length > 0 && (
            <button
              type="button"
              onClick={onRescheduleOverdueToToday}
              className="neu-btn px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/35 hover:bg-rose-500/25 text-xs font-bold text-rose-200 cursor-pointer"
            >
              Reschedule {overdueTasks.length} Overdue → Today
            </button>
          )}
          {tasks.some((t) => t.done && !t.archived) && (
            <button
              type="button"
              onClick={onArchiveCompleted}
              className="neu-btn px-3 py-1.5 rounded-lg bg-[#16171e] border border-white/[0.1] hover:border-amber-400/40 text-xs font-semibold text-amber-200 cursor-pointer"
            >
              Archive Done Tasks
            </button>
          )}
        </div>
      </div>

      {/* Capacity Bar + Summary Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="neu-inset lg:col-span-5 p-3.5 rounded-xl bg-[#090a0e] border border-white/[0.08] flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">Today&apos;s Planned Workload</span>
            <strong className={overloaded ? 'text-rose-300' : 'text-emerald-300'}>
              {formatMinutes(dueTodayMins)} / {formatMinutes(dailyCapacityMin)} ({capacityPct}%)
            </strong>
          </div>
          <div className="w-full h-2 rounded-full bg-[#16171e] overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                overloaded ? 'bg-rose-400' : capacityPct > 80 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
          <span className="text-[11px] text-zinc-400">
            {overloaded
              ? 'Heads up: Today exceeds your focus cap. Consider pushing low-priority items to Tomorrow.'
              : 'Balanced daily load — room for unexpected tasks or deep focus.'}
          </span>
        </div>

        <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
          <div className="neu-inset p-3 rounded-xl bg-[#090a0e] border border-white/[0.08]">
            <div className="text-[10px] text-zinc-500 uppercase">Done Today</div>
            <strong className="text-lg font-extrabold text-emerald-300">{completedToday}</strong>
          </div>
          <div className="neu-inset p-3 rounded-xl bg-[#090a0e] border border-white/[0.08]">
            <div className="text-[10px] text-zinc-500 uppercase">Overdue</div>
            <strong className={`text-lg font-extrabold ${overdueTasks.length > 0 ? 'text-rose-300' : 'text-zinc-200'}`}>
              {overdueTasks.length}
            </strong>
          </div>
          <div className="neu-inset p-3 rounded-xl bg-[#090a0e] border border-white/[0.08]">
            <div className="text-[10px] text-zinc-500 uppercase">Focus Logged</div>
            <strong className="text-lg font-extrabold text-sky-300">{formatMinutes(totalSpent)}</strong>
          </div>
          <div className="neu-inset p-3 rounded-xl bg-[#090a0e] border border-white/[0.08]">
            <div className="text-[10px] text-zinc-500 uppercase">Routines</div>
            <strong className="text-lg font-extrabold text-purple-300">{recurringCount}</strong>
          </div>
        </div>
      </div>

      {/* Distribution Spectrum Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ProportionalSpectrumBar
          title="ACTIVE TASKS BY PRIORITY"
          segments={[
            {
              label: 'High',
              value: active.filter((t) => t.priority === 'high').length,
              colorClass: 'bg-rose-400',
              hex: '#fb7185',
            },
            {
              label: 'Medium',
              value: active.filter((t) => t.priority === 'medium').length,
              colorClass: 'bg-amber-400',
              hex: '#fbbf24',
            },
            {
              label: 'Low',
              value: active.filter((t) => t.priority === 'low').length,
              colorClass: 'bg-sky-400',
              hex: '#38bdf8',
            },
          ]}
        />
        <ProportionalSpectrumBar
          title="ACTIVE WORKLOAD BY ENERGY"
          segments={[
            {
              label: 'Deep Focus',
              value: active.filter((t) => t.energy === 'deep').length,
              colorClass: 'bg-purple-400',
              hex: '#c084fc',
            },
            {
              label: 'Normal',
              value: active.filter((t) => !t.energy || t.energy === 'normal').length,
              colorClass: 'bg-sky-400',
              hex: '#38bdf8',
            },
            {
              label: 'Low Energy',
              value: active.filter((t) => t.energy === 'low').length,
              colorClass: 'bg-emerald-400',
              hex: '#34d399',
            },
          ]}
        />
      </div>
    </section>
  );
};

export interface TaskToolboxModalProps {
  open: boolean;
  tasks: HumanTask[];
  customTemplates: TaskTemplate[];
  customCategories: string[];
  categories: string[];
  onClose: () => void;
  onApplyTemplate: (tpl: TaskTemplate) => void;
  onDeleteCustomTemplate: (id: string) => void;
  onBulkBrainDump: (newTasks: HumanTask[]) => void;
  onAddCategory: (cat: string) => void;
  onRemoveCustomCategory?: (cat: string) => void;
  onImportJson: (imported: HumanTask[], mode: 'merge' | 'replace') => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onCopyFormat?: (format: 'md' | 'csv' | 'json') => void;
}

function parseCsvRow(line: string): string[] {
  const cols: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cols.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  cols.push(cur);
  return cols;
}

export const TaskToolboxModal: React.FC<TaskToolboxModalProps> = ({
  open,
  tasks,
  customTemplates,
  customCategories,
  categories,
  onClose,
  onApplyTemplate,
  onDeleteCustomTemplate,
  onBulkBrainDump,
  onAddCategory,
  onRemoveCustomCategory,
  onImportJson,
  onExportCsv,
  onExportJson,
  onExportMarkdown,
  onCopyFormat,
}) => {
  const [tab, setTab] = useState<'templates' | 'braindump' | 'categories' | 'portability'>('templates');
  const [dumpText, setDumpText] = useState<string>(
    '- Review weekly schedule !high @today ~20m\n- Reply to pending messages @today ~15m #Work\n- Grocery & essentials restock @tomorrow ^low #Errands'
  );
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [pasteImportText, setPasteImportText] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const allTemplates = [...customTemplates, ...STARTER_TASK_TEMPLATES];
  const parsedDumpLines = dumpText
    .split('\n')
    .map((l) => l.replace(/^\s*[-*•[\]xX\d.)]+\s*/, '').trim())
    .filter(Boolean)
    .map((line) => parseSmartTaskInput(line, categories));

  const handleCommitBrainDump = () => {
    if (parsedDumpLines.length === 0) return;
    const now = new Date().toISOString();
    const today = todayIso();
    const items: HumanTask[] = parsedDumpLines.map((p, idx) => ({
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      title: p.cleanTitle || 'Untitled Task',
      done: false,
      status: 'todo',
      priority: p.priority || 'medium',
      category: p.category || 'Personal',
      dueDate: p.dueDate ?? today,
      dueTime: p.dueTime,
      repeat: p.repeat || 'none',
      starred: p.priority === 'high',
      estimateMin: p.estimateMin ?? 20,
      energy: p.energy || 'normal',
      tags: p.tags,
      notes: '',
      subtasks: [],
      createdAt: now,
    }));
    onBulkBrainDump(items);
    setDumpText('');
    onClose();
  };

  const parseTextToTasks = (txt: string, filename = ''): { items: HumanTask[]; format: string } => {
    const trimmed = txt.trim();
    const ext = filename.toLowerCase();
    const now = new Date().toISOString();

    if (ext.endsWith('.json') || trimmed.startsWith('[')) {
      const parsed = JSON.parse(trimmed);
      if (!Array.isArray(parsed)) {
        throw new Error('JSON must be an array of task objects.');
      }
      const normalized: HumanTask[] = parsed
        .filter((x) => x && typeof x.title === 'string')
        .map((x, i) => ({
          id: String(x.id || `imp-${Date.now()}-${i}`),
          title: x.title.trim(),
          done: Boolean(x.done),
          status: x.status || (x.done ? 'done' : 'todo'),
          priority: ['high', 'medium', 'low'].includes(x.priority) ? x.priority : 'medium',
          category: String(x.category || 'Personal'),
          dueDate: String(x.dueDate || ''),
          dueTime: x.dueTime ? String(x.dueTime) : undefined,
          repeat: x.repeat || 'none',
          starred: Boolean(x.starred),
          estimateMin: typeof x.estimateMin === 'number' ? x.estimateMin : 20,
          spentMin: typeof x.spentMin === 'number' ? x.spentMin : 0,
          energy: x.energy || 'normal',
          tags: Array.isArray(x.tags) ? x.tags : [],
          projectId: x.projectId ? String(x.projectId) : undefined,
          notes: String(x.notes || ''),
          subtasks: Array.isArray(x.subtasks) ? x.subtasks : [],
          createdAt: String(x.createdAt || now),
        }));
      return { items: normalized, format: 'JSON' };
    }

    if (ext.endsWith('.csv') || (/^title\s*,/i.test(trimmed))) {
      const lines = trimmed.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error('CSV needs a header row and at least one task row.');
      const header = parseCsvRow(lines[0]).map((h) => h.trim().toLowerCase());
      const idxOf = (name: string) => header.indexOf(name);
      const tIdx = Math.max(0, idxOf('title'));
      const items: HumanTask[] = lines.slice(1).map((line, i) => {
        const cols = parseCsvRow(line);
        const stRaw = (cols[idxOf('status')] || 'todo').toLowerCase();
        const isDone = stRaw === 'done' || stRaw === 'completed';
        const prioRaw = (cols[idxOf('priority')] || 'medium').toLowerCase();
        const estRaw = Number(cols[idxOf('estimatemin')]);
        const spentRaw = Number(cols[idxOf('spentmin')]);
        const tagsRaw = (cols[idxOf('tags')] || '').split(';').map((s) => s.trim()).filter(Boolean);
        return {
          id: `csv-${Date.now()}-${i}`,
          title: (cols[tIdx] || 'Imported Task').trim(),
          done: isDone,
          status: isDone ? 'done' : stRaw === 'doing' ? 'doing' : 'todo',
          priority: (['high', 'medium', 'low'].includes(prioRaw) ? prioRaw : 'medium') as HumanTask['priority'],
          category: (cols[idxOf('category')] || 'Personal').trim() || 'Personal',
          dueDate: (cols[idxOf('duedate')] || '').trim(),
          dueTime: (cols[idxOf('duetime')] || '').trim() || undefined,
          repeat: (['daily', 'weekly', 'monthly'].includes((cols[idxOf('repeat')] || '').toLowerCase())
            ? cols[idxOf('repeat')].toLowerCase()
            : 'none') as HumanTask['repeat'],
          starred: prioRaw === 'high',
          estimateMin: !Number.isNaN(estRaw) && estRaw > 0 ? estRaw : 20,
          spentMin: !Number.isNaN(spentRaw) && spentRaw > 0 ? spentRaw : 0,
          energy: 'normal',
          tags: tagsRaw,
          notes: '',
          subtasks: [],
          createdAt: now,
        };
      });
      return { items: items.filter((t) => t.title.length > 0), format: 'CSV' };
    }

    // Fallback: Markdown checklist / plain lines
    const lines = trimmed.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
    const items: HumanTask[] = lines.map((line, idx) => {
      const doneMatch = /^[-*•]?\s*\[[xX]\]\s*/.test(line);
      const cleaned = line.replace(/^[-*•]?\s*\[[ xX]\]\s*/, '').replace(/^[-*•\d.)]+\s*/, '').trim();
      const parsed = parseSmartTaskInput(cleaned, categories);
      return {
        id: `md-${Date.now()}-${idx}`,
        title: parsed.cleanTitle || cleaned || 'Imported Task',
        done: doneMatch,
        status: doneMatch ? 'done' : 'todo',
        priority: parsed.priority || 'medium',
        category: parsed.category || 'Personal',
        dueDate: parsed.dueDate ?? '',
        dueTime: parsed.dueTime,
        repeat: parsed.repeat || 'none',
        starred: parsed.priority === 'high',
        estimateMin: parsed.estimateMin ?? 20,
        energy: parsed.energy || 'normal',
        tags: parsed.tags,
        notes: '',
        subtasks: [],
        createdAt: now,
      };
    });
    return { items: items.filter((t) => t.title.length > 0), format: 'Markdown / Text' };
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const { items, format } = parseTextToTasks(txt, file.name);
      if (items.length === 0) {
        setImportNotice(`No valid tasks found inside ${file.name}.`);
        return;
      }
      onImportJson(items, importMode);
      setImportNotice(`✓ Imported ${items.length} tasks from ${format} (${importMode}).`);
    } catch (err) {
      setImportNotice(err instanceof Error ? err.message : 'Failed to parse selected file.');
    } finally {
      e.target.value = '';
    }
  };

  const handlePasteImport = () => {
    if (!pasteImportText.trim()) return;
    try {
      const { items, format } = parseTextToTasks(pasteImportText);
      if (items.length === 0) {
        setImportNotice('No valid tasks detected in pasted content.');
        return;
      }
      onImportJson(items, importMode);
      setPasteImportText('');
      setImportNotice(`✓ Imported ${items.length} tasks from pasted ${format} (${importMode}).`);
    } catch (err) {
      setImportNotice(err instanceof Error ? err.message : 'Could not parse pasted text.');
    }
  };

  const triggerCopy = (format: 'md' | 'csv' | 'json') => {
    onCopyFormat?.(format);
    setCopiedKey(format);
    window.setTimeout(() => setCopiedKey(null), 1600);
  };

  return (
    <section
      className="neu-card w-full rounded-2xl bg-[#111218] border border-purple-500/25 p-4 sm:p-5 flex flex-col gap-4 portal-drawer-enter"
      aria-labelledby="task-toolbox-title"
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-purple-500/15 border border-purple-500/35 text-purple-200">
            Power Toolbox
          </span>
          <h2 id="task-toolbox-title" className="text-base font-extrabold text-white">
            Templates, Multi-Line Brain Dump &amp; Data Tools
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="neu-btn px-3 py-1 rounded-lg bg-[#16171e] border border-white/[0.12] hover:border-white/[0.25] text-xs font-mono text-zinc-200 hover:text-white cursor-pointer"
        >
          Close ✕
        </button>
      </div>

      {/* Sub-Tabs Strip */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl neu-tray bg-[#090a0e] border border-white/[0.08] self-start" role="tablist" aria-label="Power toolbox tools">
        {(
          [
            { id: 'templates', label: `⚡ Templates (${allTemplates.length})` },
            { id: 'braindump', label: '🧠 Multi-Line Brain Dump' },
            { id: 'categories', label: `🏷️ Categories (${categories.length})` },
            { id: 'portability', label: '💾 Export & Import' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
              tab === t.id
                ? 'text-white border-white/20 font-bold'
                : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Panel Body */}
      <div className="text-xs flex flex-col gap-4">
        {tab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {allTemplates.map((tpl) => (
              <div
                key={tpl.id}
                className="neu-tile p-4 rounded-xl bg-[#0b0c10] border border-white/[0.09] hover:border-white/[0.18] flex flex-col justify-between gap-3 transition-colors"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-sm text-white flex items-center gap-2">
                      <span>{tpl.icon}</span>
                      <span>{tpl.name}</span>
                    </strong>
                    {tpl.isCustom && (
                      <button
                        type="button"
                        onClick={() => onDeleteCustomTemplate(tpl.id)}
                        className="text-zinc-400 hover:text-rose-300 cursor-pointer"
                        title="Delete custom template"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <p className="text-zinc-300 font-medium">{tpl.title}</p>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-zinc-300">
                    <span className="px-1.5 py-0.5 rounded bg-[#16171e] border border-white/[0.08]">{tpl.category}</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#16171e] border border-white/[0.08]">~{tpl.estimateMin}m</span>
                    <span className="px-1.5 py-0.5 rounded bg-[#16171e] border border-white/[0.08]">{tpl.subtasks.length} steps</span>
                    {tpl.repeat !== 'none' && (
                      <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-200">
                        🔁 {tpl.repeat}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onApplyTemplate(tpl);
                    onClose();
                  }}
                  className="neu-btn w-full py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold cursor-pointer"
                >
                  + Launch into Tasks
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'braindump' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-7 flex flex-col gap-3">
              <p className="text-zinc-300 leading-relaxed">
                Paste multiple lines to create tasks at once. Smart tokens supported:{' '}
                <code className="px-1 py-0.5 rounded bg-[#16171e] text-sky-300">!high</code>{' '}
                <code className="px-1 py-0.5 rounded bg-[#16171e] text-emerald-300">@tomorrow</code>{' '}
                <code className="px-1 py-0.5 rounded bg-[#16171e] text-amber-300">~25m</code>{' '}
                <code className="px-1 py-0.5 rounded bg-[#16171e] text-purple-300">*daily</code>{' '}
                <code className="px-1 py-0.5 rounded bg-[#16171e] text-rose-300">^deep</code>{' '}
                <code className="px-1 py-0.5 rounded bg-[#16171e] text-zinc-200">#Work</code>
              </p>
              <textarea
                rows={6}
                value={dumpText}
                onChange={(e) => setDumpText(e.target.value)}
                placeholder="One task per line..."
                className="neu-inset w-full p-3.5 rounded-xl bg-[#08090c] border border-white/[0.12] font-mono text-xs text-white focus:outline-none focus:border-sky-400/50"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-zinc-300">
                  Detected <strong className="text-emerald-300">{parsedDumpLines.length}</strong> tasks ready to import
                </span>
                <button
                  type="button"
                  onClick={handleCommitBrainDump}
                  disabled={parsedDumpLines.length === 0}
                  className="neu-btn px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-extrabold disabled:opacity-40 cursor-pointer"
                >
                  + Import {parsedDumpLines.length} Tasks
                </button>
              </div>
            </div>

            <div className="neu-inset lg:col-span-5 rounded-xl bg-[#0b0c10] border border-white/[0.08] p-3.5 flex flex-col gap-2 max-h-64 overflow-y-auto custom-scrollbar">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Live Parsed Preview
              </span>
              {parsedDumpLines.length === 0 ? (
                <span className="text-zinc-500">Type lines on the left to preview parsed priorities &amp; dates.</span>
              ) : (
                parsedDumpLines.map((p, i) => (
                  <div key={i} className="neu-tile p-2 rounded-lg bg-[#16171e] border border-white/[0.06] flex flex-col gap-1">
                    <span className="font-semibold text-white truncate">{p.cleanTitle || 'Untitled'}</span>
                    <div className="flex flex-wrap gap-1 text-[10px] font-mono text-zinc-300">
                      <span className="px-1.5 rounded bg-white/[0.06]">{p.priority}</span>
                      <span className="px-1.5 rounded bg-white/[0.06]">{p.category}</span>
                      {p.dueDate && <span className="px-1.5 rounded bg-sky-500/15 text-sky-200">{p.dueDate}</span>}
                      {p.estimateMin && <span className="px-1.5 rounded bg-amber-500/15 text-amber-200">~{p.estimateMin}m</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'categories' && (
          <div className="flex flex-col gap-3">
            <p className="text-zinc-300">
              Add custom categories for your personal projects, study modules, or household workflows.
            </p>
            <div className="flex flex-wrap gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newCategoryName.trim()) {
                    e.preventDefault();
                    onAddCategory(newCategoryName.trim());
                    setNewCategoryName('');
                  }
                }}
                placeholder="New category name (e.g. SideProject, Finance)..."
                className="neu-inset flex-1 min-w-[220px] h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.12] text-white"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newCategoryName.trim()) return;
                  onAddCategory(newCategoryName.trim());
                  setNewCategoryName('');
                }}
                className="neu-btn h-9 px-4 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold cursor-pointer"
              >
                + Add Category
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {categories.map((cat) => {
                const isCustom = customCategories.includes(cat);
                const count = tasks.filter((t) => t.category === cat && !t.archived).length;
                return (
                  <span
                    key={cat}
                    className="neu-tile px-3 py-1.5 rounded-xl bg-[#0b0c10] border border-white/[0.1] font-mono text-zinc-200 flex items-center gap-2"
                  >
                    <span>{cat}</span>
                    <span className="text-zinc-400">({count})</span>
                    {isCustom && <span className="text-[10px] text-sky-300">custom</span>}
                    {isCustom && onRemoveCustomCategory && (
                      <button
                        type="button"
                        onClick={() => onRemoveCustomCategory(cat)}
                        className="text-zinc-400 hover:text-rose-300 cursor-pointer"
                        title={`Remove ${cat}`}
                      >
                        ✕
                      </button>
                    )}
                  </span>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'portability' && (
          <div className="flex flex-col gap-4">
            {/* Export Formats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: 'md' as const,
                  icon: '📝',
                  title: 'Markdown Checklist',
                  ext: '.md',
                  desc: `Export ${tasks.length} tasks as clickable Markdown check-items.`,
                  badgeCls: 'bg-sky-500/15 border-sky-400/30 text-sky-200',
                  borderCls: 'border-sky-400/25 hover:border-sky-400/50',
                  onDownload: onExportMarkdown,
                },
                {
                  id: 'csv' as const,
                  icon: '📊',
                  title: 'Spreadsheet Table',
                  ext: '.csv',
                  desc: `Export ${tasks.length} rows with status, dates, tags & estimates.`,
                  badgeCls: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200',
                  borderCls: 'border-emerald-500/25 hover:border-emerald-400/50',
                  onDownload: onExportCsv,
                },
                {
                  id: 'json' as const,
                  icon: '💾',
                  title: 'Full Lossless Backup',
                  ext: '.json',
                  desc: `Export all ${tasks.length} tasks with subtasks, notes & metadata.`,
                  badgeCls: 'bg-purple-500/15 border-purple-500/30 text-purple-200',
                  borderCls: 'border-purple-500/25 hover:border-purple-400/50',
                  onDownload: onExportJson,
                },
              ].map((card) => (
                <div
                  key={card.id}
                  className={`neu-tile p-4 rounded-xl bg-[#0b0c10] border ${card.borderCls} flex flex-col justify-between gap-3 transition-colors`}
                >
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-sm text-white flex items-center gap-1.5">
                        <span>{card.icon}</span>
                        <span>{card.title}</span>
                      </strong>
                      <code className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${card.badgeCls}`}>
                        {card.ext}
                      </code>
                    </div>
                    <p className="text-zinc-300 leading-relaxed">{card.desc}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={card.onDownload}
                      className="neu-btn flex-1 py-1.5 px-3 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 font-bold cursor-pointer"
                    >
                      ⬇ Download {card.ext}
                    </button>
                    {onCopyFormat && (
                      <button
                        type="button"
                        onClick={() => triggerCopy(card.id)}
                        className="neu-btn py-1.5 px-3 rounded-lg bg-[#16171e] border border-white/[0.12] hover:border-white/[0.25] font-mono text-zinc-200 hover:text-white cursor-pointer"
                      >
                        {copiedKey === card.id ? '✓ Copied' : 'Copy'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Multi-Format Import & Restore Panel */}
            <div className="neu-inset p-4 rounded-xl bg-[#0b0c10] border border-white/[0.1] flex flex-col gap-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="text-sm text-white">Restore or Import Tasks</strong>
                  <p className="text-zinc-300 mt-0.5">
                    Supports JSON backups, CSV spreadsheets, or Markdown checklist files &amp; pasted text.
                  </p>
                </div>

                <div className="neu-tray flex items-center p-0.5 rounded-lg bg-[#16171e] border border-white/[0.1]" role="tablist" aria-label="Import merge mode">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={importMode === 'merge'}
                    onClick={() => setImportMode('merge')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                      importMode === 'merge' ? 'bg-sky-500/20 text-sky-200 font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Merge with Existing
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={importMode === 'replace'}
                    onClick={() => setImportMode('replace')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono cursor-pointer ${
                      importMode === 'replace' ? 'bg-rose-500/20 text-rose-200 font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Replace All (Undoable)
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.csv,.md,.txt,application/json,text/csv,text/markdown,text/plain"
                onChange={(e) => void handleImportFile(e)}
                className="hidden"
              />

              <div className="grid grid-cols-1 lg:grid-cols-[auto_1fr] gap-3 items-stretch">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="neu-btn px-4 py-3 rounded-xl bg-sky-500/15 border border-sky-400/40 hover:bg-sky-500/25 text-sky-100 font-bold cursor-pointer flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <span>📂 Choose .json / .csv / .md File</span>
                </button>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pasteImportText}
                    onChange={(e) => setPasteImportText(e.target.value)}
                    placeholder="Or paste JSON array, CSV rows, or Markdown lines here..."
                    aria-label="Paste JSON, CSV, or Markdown tasks"
                    className="flex-1 px-3 rounded-xl bg-[#08090c] border border-white/[0.12] font-mono text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
                  />
                  <button
                    type="button"
                    onClick={handlePasteImport}
                    disabled={!pasteImportText.trim()}
                    className="neu-btn px-4 rounded-xl bg-[#16171e] border border-white/[0.12] hover:border-emerald-400/45 text-emerald-200 font-bold disabled:opacity-40 cursor-pointer shrink-0"
                  >
                    Import Pasted
                  </button>
                </div>
              </div>

              {importNotice && (
                <div className="px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 font-mono text-emerald-200">
                  {importNotice}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
