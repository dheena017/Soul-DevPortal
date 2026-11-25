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
      className="w-full rounded-2xl bg-[#111218] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-4 shadow-xl portal-drawer-enter"
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
              className="px-3 py-1.5 rounded-lg bg-rose-500/15 border border-rose-500/35 hover:bg-rose-500/25 text-xs font-bold text-rose-200 cursor-pointer"
            >
              Reschedule {overdueTasks.length} Overdue → Today
            </button>
          )}
          {tasks.some((t) => t.done && !t.archived) && (
            <button
              type="button"
              onClick={onArchiveCompleted}
              className="px-3 py-1.5 rounded-lg bg-[#16171e] border border-white/[0.1] hover:border-amber-400/40 text-xs font-semibold text-amber-200 cursor-pointer"
            >
              Archive Done Tasks
            </button>
          )}
        </div>
      </div>

      {/* Capacity Bar + Summary Tiles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-5 p-3.5 rounded-xl bg-[#090a0e] border border-white/[0.08] flex flex-col gap-2">
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
          <div className="p-3 rounded-xl bg-[#090a0e] border border-white/[0.08]">
            <div className="text-[10px] text-zinc-500 uppercase">Done Today</div>
            <strong className="text-lg font-extrabold text-emerald-300">{completedToday}</strong>
          </div>
          <div className="p-3 rounded-xl bg-[#090a0e] border border-white/[0.08]">
            <div className="text-[10px] text-zinc-500 uppercase">Overdue</div>
            <strong className={`text-lg font-extrabold ${overdueTasks.length > 0 ? 'text-rose-300' : 'text-zinc-200'}`}>
              {overdueTasks.length}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[#090a0e] border border-white/[0.08]">
            <div className="text-[10px] text-zinc-500 uppercase">Focus Logged</div>
            <strong className="text-lg font-extrabold text-sky-300">{formatMinutes(totalSpent)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-[#090a0e] border border-white/[0.08]">
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
  onImportJson: (imported: HumanTask[], mode: 'merge' | 'replace') => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onExportMarkdown: () => void;
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
  onImportJson,
  onExportCsv,
  onExportJson,
  onExportMarkdown,
}) => {
  const [tab, setTab] = useState<'templates' | 'braindump' | 'categories' | 'portability'>('templates');
  const [dumpText, setDumpText] = useState<string>(
    '- Review weekly schedule !high @today ~20m\n- Reply to pending messages @today ~15m #Work\n- Grocery & essentials restock @tomorrow ^low #Errands'
  );
  const [newCategoryName, setNewCategoryName] = useState<string>('');
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

  const handleJsonFile = async (e: React.ChangeEvent<HTMLInputElement>, mode: 'merge' | 'replace') => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const txt = await file.text();
      const parsed = JSON.parse(txt);
      if (!Array.isArray(parsed)) {
        setImportNotice('Invalid JSON: expected an array of task objects.');
        return;
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
          createdAt: String(x.createdAt || new Date().toISOString()),
        }));
      onImportJson(normalized, mode);
      setImportNotice(`Imported ${normalized.length} tasks (${mode}).`);
    } catch {
      setImportNotice('Failed to parse JSON file.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-toolbox-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl max-h-[88vh] rounded-2xl bg-[#111115] border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.88)] flex flex-col overflow-hidden portal-header-sheen portal-page-enter"
      >
        <div className="shrink-0 px-5 py-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-purple-500/15 border border-purple-500/30 text-purple-300">
              Power Toolbox
            </span>
            <h2 id="task-toolbox-title" className="text-base font-extrabold text-white">
              Templates, Multi-Line Brain Dump &amp; Data Tools
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.1] text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
          >
            Esc ✕
          </button>
        </div>

        <div className="shrink-0 px-5 pt-3 pb-2 border-b border-white/[0.06] flex flex-wrap gap-1.5 bg-[#090a0e]">
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
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer ${
                tab === t.id
                  ? 'bg-zinc-800 text-white border-white/20 font-bold'
                  : 'bg-[#16171e] border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar text-xs">
          {tab === 'templates' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {allTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-4 rounded-xl bg-[#090a0e] border border-white/[0.08] flex flex-col justify-between gap-3"
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
                          className="text-zinc-500 hover:text-rose-300 cursor-pointer"
                          title="Delete custom template"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <p className="text-zinc-300 font-medium">{tpl.title}</p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-zinc-400">
                      <span className="px-1.5 py-0.5 rounded bg-[#16171e] border border-white/[0.06]">{tpl.category}</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#16171e] border border-white/[0.06]">~{tpl.estimateMin}m</span>
                      <span className="px-1.5 py-0.5 rounded bg-[#16171e] border border-white/[0.06]">{tpl.subtasks.length} steps</span>
                      {tpl.repeat !== 'none' && (
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300">
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
                    className="w-full py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-bold cursor-pointer"
                  >
                    + Launch into Tasks
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'braindump' && (
            <div className="flex flex-col gap-3">
              <p className="text-zinc-300">
                Paste multiple lines to create tasks at once. Supports inline smart tokens:
                <code className="text-sky-300 ml-1">!high</code>, <code className="text-emerald-300">@tomorrow</code>,{' '}
                <code className="text-amber-300">~25m</code>, <code className="text-purple-300">*daily</code>,{' '}
                <code className="text-rose-300">^deep</code>, <code className="text-zinc-200">#Work</code>.
              </p>
              <textarea
                rows={7}
                value={dumpText}
                onChange={(e) => setDumpText(e.target.value)}
                placeholder="One task per line..."
                className="w-full p-3.5 rounded-xl bg-[#08090c] border border-white/[0.1] font-mono text-xs text-white focus:outline-none focus:border-sky-400/50"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-zinc-400">
                  Detected {parsedDumpLines.length} tasks ready to import
                </span>
                <button
                  type="button"
                  onClick={handleCommitBrainDump}
                  disabled={parsedDumpLines.length === 0}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 font-extrabold disabled:opacity-40 cursor-pointer"
                >
                  + Import {parsedDumpLines.length} Tasks
                </button>
              </div>
            </div>
          )}

          {tab === 'categories' && (
            <div className="flex flex-col gap-3">
              <p className="text-zinc-300">
                Add custom categories for your personal projects, study modules, or household areas.
              </p>
              <div className="flex gap-2">
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
                  className="flex-1 h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newCategoryName.trim()) return;
                    onAddCategory(newCategoryName.trim());
                    setNewCategoryName('');
                  }}
                  className="h-9 px-4 rounded-xl bg-white text-zinc-950 font-bold cursor-pointer"
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
                      className="px-3 py-1.5 rounded-xl bg-[#090a0e] border border-white/[0.08] font-mono text-zinc-200 flex items-center gap-2"
                    >
                      <span>{cat}</span>
                      <span className="text-zinc-500">({count})</span>
                      {isCustom && <span className="text-[10px] text-sky-300">custom</span>}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {tab === 'portability' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={onExportMarkdown}
                  className="p-4 rounded-xl bg-[#090a0e] border border-white/[0.08] hover:border-sky-400/40 text-left flex flex-col gap-1 cursor-pointer"
                >
                  <strong className="text-white">📝 Export Markdown</strong>
                  <span className="text-zinc-400">Download checklist as `.md`</span>
                </button>
                <button
                  type="button"
                  onClick={onExportCsv}
                  className="p-4 rounded-xl bg-[#090a0e] border border-white/[0.08] hover:border-emerald-400/40 text-left flex flex-col gap-1 cursor-pointer"
                >
                  <strong className="text-white">📊 Export Spreadsheet</strong>
                  <span className="text-zinc-400">Download full table as `.csv`</span>
                </button>
                <button
                  type="button"
                  onClick={onExportJson}
                  className="p-4 rounded-xl bg-[#090a0e] border border-white/[0.08] hover:border-purple-400/40 text-left flex flex-col gap-1 cursor-pointer"
                >
                  <strong className="text-white">💾 Full JSON Backup</strong>
                  <span className="text-zinc-400">Download lossless `.json`</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-[#090a0e] border border-white/[0.08] flex flex-col gap-3">
                <strong className="text-white">Restore / Import Tasks JSON</strong>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => void handleJsonFile(e, 'merge')}
                  className="hidden"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-sky-500/15 border border-sky-400/35 text-sky-200 font-bold cursor-pointer"
                  >
                    Choose JSON File (Merge into Current)
                  </button>
                  {importNotice && <span className="font-mono text-emerald-300">{importNotice}</span>}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
