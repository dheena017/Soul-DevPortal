import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PROJECT_BRAND_MAP } from '../projects/projectsConstants';
import {
  HumanTask,
  TaskEnergy,
  TaskPriority,
  TaskRepeat,
  TaskStatus,
  offsetDateIso,
  todayIso,
} from './taskTypes';

export interface TaskEditorModalProps {
  task: HumanTask | null;
  allTasks: HumanTask[];
  categories: string[];
  onSave: (updated: HumanTask) => void;
  onDuplicate: (task: HumanTask) => void;
  onSaveTemplate: (task: HumanTask) => void;
  onSendToNotes: (task: HumanTask) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export const TaskEditorModal: React.FC<TaskEditorModalProps> = ({
  task,
  allTasks,
  categories,
  onSave,
  onDuplicate,
  onSaveTemplate,
  onSendToNotes,
  onDelete,
  onClose,
}) => {
  const [draft, setDraft] = useState<HumanTask | null>(task);
  const [newTag, setNewTag] = useState<string>('');
  const [newSubtask, setNewSubtask] = useState<string>('');

  useEffect(() => {
    setDraft(task ? { ...task, tags: [...(task.tags || [])], subtasks: task.subtasks.map((s) => ({ ...s })) } : null);
    setNewTag('');
    setNewSubtask('');
  }, [task]);

  useEffect(() => {
    if (!task) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [task, onClose]);

  if (!draft) return null;

  const blockerCandidates = allTasks.filter((t) => t.id !== draft.id && !t.done && !t.archived);
  const projectEntries = Object.entries(PROJECT_BRAND_MAP);

  const addTag = () => {
    const clean = newTag.trim().replace(/^#/, '');
    if (!clean) return;
    if (!(draft.tags || []).includes(clean)) {
      setDraft({ ...draft, tags: [...(draft.tags || []), clean] });
    }
    setNewTag('');
  };

  const addSubtask = () => {
    const clean = newSubtask.trim();
    if (!clean) return;
    setDraft({
      ...draft,
      subtasks: [
        ...draft.subtasks,
        { id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, text: clean, done: false },
      ],
    });
    setNewSubtask('');
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.title.trim()) return;
    onSave({
      ...draft,
      title: draft.title.trim(),
      done: draft.status === 'done' ? true : draft.done && draft.status !== 'todo' && draft.status !== 'doing',
    });
    onClose();
  };

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-2.5 sm:p-5 bg-black/80 backdrop-blur-md portal-backdrop-enter"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="task-edit-modal-title"
    >
      <form
        onSubmit={handleSaveSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[calc(100dvh-1.25rem)] sm:max-h-[min(90dvh,780px)] rounded-2xl bg-[#0e1017] border border-white/[0.12] shadow-[0_28px_90px_rgba(0,0,0,0.92)] flex flex-col overflow-hidden portal-header-sheen"
      >
        {/* Header */}
        <div className="shrink-0 px-5 py-3.5 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-[#12141c]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              Task Inspector
            </span>
            <h2 id="task-edit-modal-title" className="text-base font-extrabold text-white truncate">
              Edit &amp; Configure Task
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDraft({ ...draft, starred: !draft.starred })}
              className={`px-2.5 py-1 rounded-lg border text-xs cursor-pointer ${
                draft.starred
                  ? 'bg-amber-500/15 border-amber-400/40 text-amber-300'
                  : 'bg-[#16171e] border-white/[0.1] text-zinc-400 hover:text-white'
              }`}
            >
              {draft.starred ? '★ Starred' : '☆ Star'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.1] text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
            >
              Esc ✕
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 flex flex-col gap-4 sidebar-scroll text-xs">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Task Title
            </label>
            <input
              type="text"
              required
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="w-full h-10 px-3.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm font-semibold text-white focus:outline-none focus:border-sky-400/50"
            />
          </div>

          {/* Core Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Status</span>
              <select
                value={draft.done ? 'done' : draft.status || 'todo'}
                onChange={(e) => {
                  const st = e.target.value as TaskStatus;
                  setDraft({ ...draft, status: st, done: st === 'done' });
                }}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              >
                <option value="todo">📋 To Do</option>
                <option value="doing">⚡ In Progress</option>
                <option value="done">✅ Completed</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Priority</span>
              <select
                value={draft.priority}
                onChange={(e) => setDraft({ ...draft, priority: e.target.value as TaskPriority })}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              >
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">⚪ Low</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Category</span>
              <select
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              >
                {Array.from(new Set([...categories, draft.category])).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Energy Level</span>
              <select
                value={draft.energy || 'normal'}
                onChange={(e) => setDraft({ ...draft, energy: e.target.value as TaskEnergy })}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              >
                <option value="deep">🔥 Deep Focus</option>
                <option value="normal">⚡ Normal</option>
                <option value="low">🔋 Low Energy</option>
              </select>
            </label>
          </div>

          {/* Schedule & Effort */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Due Date</span>
              <input
                type="date"
                value={draft.dueDate || ''}
                onChange={(e) => setDraft({ ...draft, dueDate: e.target.value })}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Time (Optional)</span>
              <input
                type="time"
                value={draft.dueTime || ''}
                onChange={(e) => setDraft({ ...draft, dueTime: e.target.value })}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Repeat</span>
              <select
                value={draft.repeat || 'none'}
                onChange={(e) => setDraft({ ...draft, repeat: e.target.value as TaskRepeat })}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              >
                <option value="none">Once</option>
                <option value="daily">🔁 Daily</option>
                <option value="weekly">🔁 Weekly</option>
                <option value="monthly">🔁 Monthly</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Estimate (Min)</span>
              <input
                type="number"
                min={0}
                max={600}
                step={5}
                value={draft.estimateMin ?? 25}
                onChange={(e) => setDraft({ ...draft, estimateMin: Math.max(0, Number(e.target.value) || 0) })}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
            <span className="text-zinc-500 mr-1">Quick Schedule:</span>
            {[
              { label: 'Today', date: todayIso() },
              { label: 'Tomorrow', date: offsetDateIso(1) },
              { label: '+3 Days', date: offsetDateIso(3) },
              { label: 'Next Week', date: offsetDateIso(7) },
              { label: 'Clear Date', date: '' },
            ].map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => setDraft({ ...draft, dueDate: q.date })}
                className={`px-2 py-1 rounded-lg border cursor-pointer ${
                  draft.dueDate === q.date
                    ? 'bg-sky-500/15 border-sky-400/35 text-sky-200'
                    : 'bg-[#16171e] border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Workspace Link & Dependency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Linked Workspace Project</span>
              <select
                value={draft.projectId || ''}
                onChange={(e) => setDraft({ ...draft, projectId: e.target.value || undefined })}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              >
                <option value="">None (Personal / General)</option>
                {projectEntries.map(([id, brand]) => (
                  <option key={id} value={id}>
                    {brand.icon} {brand.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-mono uppercase text-zinc-400">Blocked By (Dependency)</span>
              <select
                value={draft.blockedById || ''}
                onChange={(e) => setDraft({ ...draft, blockedById: e.target.value || undefined })}
                className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 font-mono"
              >
                <option value="">Not Blocked (Ready)</option>
                {blockerCandidates.map((cand) => (
                  <option key={cand.id} value={cand.id}>
                    ⏳ {cand.title.slice(0, 48)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {/* Time Spent Tracker */}
          <div className="p-3 rounded-xl bg-[#090a0e] border border-white/[0.08] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-mono">
              <span className="text-zinc-400">Time Logged:</span>
              <strong className="text-sky-300">{draft.spentMin || 0}m</strong>
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              {[5, 15, 25].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setDraft({ ...draft, spentMin: (draft.spentMin || 0) + mins })}
                  className="px-2 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-sky-400/40 text-zinc-200 cursor-pointer"
                >
                  +{mins}m
                </button>
              ))}
              {(draft.spentMin || 0) > 0 && (
                <button
                  type="button"
                  onClick={() => setDraft({ ...draft, spentMin: 0 })}
                  className="px-2 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] text-zinc-400 hover:text-rose-300 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Tags</span>
            <div className="flex flex-wrap items-center gap-1.5">
              {(draft.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-[11px] font-mono text-sky-200"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() =>
                      setDraft({ ...draft, tags: (draft.tags || []).filter((t) => t !== tag) })
                    }
                    className="opacity-70 hover:opacity-100 cursor-pointer"
                    aria-label={`Remove ${tag}`}
                  >
                    ✕
                  </button>
                </span>
              ))}
              <input
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag..."
                className="w-28 h-7 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-[11px] font-mono text-white"
              />
              <button
                type="button"
                onClick={addTag}
                className="h-7 px-2.5 rounded-lg bg-[#16171e] border border-white/[0.1] text-[11px] font-mono text-zinc-200 cursor-pointer"
              >
                + Tag
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              Notes &amp; Context
            </label>
            <textarea
              rows={3}
              value={draft.notes || ''}
              onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
              placeholder="Links, instructions, acceptance criteria, or reminder notes..."
              className="w-full p-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-400/50 resize-y"
            />
          </div>

          {/* Subtasks */}
          <div className="p-3.5 rounded-xl bg-[#090a0e] border border-white/[0.08] flex flex-col gap-2.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Sub-Steps Checklist ({draft.subtasks.filter((s) => s.done).length}/{draft.subtasks.length})
              </span>
              {draft.subtasks.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      subtasks: draft.subtasks.map((s) => ({ ...s, done: !draft.subtasks.every((x) => x.done) })),
                    })
                  }
                  className="text-[10px] font-mono text-sky-300 hover:text-sky-200 cursor-pointer"
                >
                  {draft.subtasks.every((x) => x.done) ? 'Uncheck All' : 'Check All'}
                </button>
              )}
            </div>

            {draft.subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      subtasks: draft.subtasks.map((s) => (s.id === sub.id ? { ...s, done: !s.done } : s)),
                    })
                  }
                  className="flex items-center gap-2 text-left text-zinc-200 cursor-pointer min-w-0 flex-1"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px] ${
                      sub.done ? 'bg-emerald-400 border-emerald-400 text-zinc-950 font-bold' : 'border-white/25'
                    }`}
                  >
                    {sub.done ? '✓' : ''}
                  </span>
                  <span className={sub.done ? 'line-through text-zinc-500' : ''}>{sub.text}</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      subtasks: draft.subtasks.filter((s) => s.id !== sub.id),
                    })
                  }
                  className="text-zinc-500 hover:text-rose-300 px-1 cursor-pointer"
                  aria-label="Remove sub-step"
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add step..."
                className="flex-1 h-8 px-3 rounded-lg bg-[#08090c] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-sky-400/50"
              />
              <button
                type="button"
                onClick={addSubtask}
                className="h-8 px-3 rounded-lg bg-sky-500/15 border border-sky-400/30 text-xs font-semibold text-sky-200 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Secondary Actions Strip */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                onDuplicate(draft);
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-white/[0.2] text-zinc-200 cursor-pointer"
            >
              ⧉ Duplicate
            </button>
            <button
              type="button"
              onClick={() => onSaveTemplate(draft)}
              className="px-3 py-1.5 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-purple-400/35 text-purple-200 cursor-pointer"
            >
              ⚡ Save as Template
            </button>
            <button
              type="button"
              onClick={() => onSendToNotes(draft)}
              className="px-3 py-1.5 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-sky-400/35 text-sky-200 cursor-pointer"
            >
              📝 Copy to Notes
            </button>
            <button
              type="button"
              onClick={() => {
                onSave({ ...draft, archived: !draft.archived });
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-amber-400/35 text-amber-200 cursor-pointer"
            >
              {draft.archived ? '📤 Unarchive' : '📦 Archive'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-3.5 border-t border-white/[0.08] bg-[#0b0c11] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onDelete(draft.id);
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-500/12 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 cursor-pointer"
          >
            Delete Task
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-extrabold cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalMarkup, document.body);
  }
  return modalMarkup;
};

export default TaskEditorModal;
