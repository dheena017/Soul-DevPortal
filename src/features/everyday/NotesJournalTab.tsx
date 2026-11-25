import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HeroArtworkBackdrop } from '../../components/PortalVisuals';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import { NoteMarkdownPreview } from './NoteMarkdownPreview';
import type { HumanTask } from './TasksPlannerTab';

export type NoteAccent = 'sky' | 'emerald' | 'amber' | 'violet' | 'rose';
export type NoteEditorMode = 'split' | 'edit' | 'preview';
export type NoteLayoutView = 'workspace' | 'cards';
export type NoteSortBy = 'updated' | 'newest' | 'title' | 'words';

export interface NoteSnapshot {
  id: string;
  savedAt: string;
  content: string;
}

export interface HumanNote {
  id: string;
  title: string;
  content: string;
  notebook?: string;
  tags: string[];
  pinned: boolean;
  starred?: boolean;
  trashed?: boolean;
  reminderDate?: string;
  accent: NoteAccent;
  snapshots?: NoteSnapshot[];
  updatedAt: string;
  createdAt?: string;
}

const NOTEBOOKS = ['Personal', 'Work', 'Journal', 'Ideas', 'Study', 'Quick Captures'];

const ACCENT_MAP: Record<NoteAccent, { dot: string; border: string; pill: string; cardBg: string }> = {
  sky: {
    dot: 'bg-sky-400',
    border: 'border-sky-400/35',
    pill: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
    cardBg: 'border-sky-400/25 bg-[#111520]',
  },
  emerald: {
    dot: 'bg-emerald-400',
    border: 'border-emerald-400/35',
    pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30',
    cardBg: 'border-emerald-500/25 bg-[#101816]',
  },
  amber: {
    dot: 'bg-amber-400',
    border: 'border-amber-400/35',
    pill: 'bg-amber-500/15 text-amber-300 border-amber-400/30',
    cardBg: 'border-amber-400/25 bg-[#191610]',
  },
  violet: {
    dot: 'bg-violet-400',
    border: 'border-violet-400/35',
    pill: 'bg-violet-500/15 text-violet-300 border-violet-400/30',
    cardBg: 'border-violet-400/25 bg-[#161320]',
  },
  rose: {
    dot: 'bg-rose-400',
    border: 'border-rose-400/35',
    pill: 'bg-rose-500/15 text-rose-300 border-rose-400/30',
    cardBg: 'border-rose-400/25 bg-[#1c1216]',
  },
};

function todayTitleLabel(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function buildStarterNotes(): HumanNote[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'note-welcome',
      title: 'Daily Scratchpad & Ideas',
      notebook: 'Personal',
      content: `# Welcome to Personal Notes

Use this space for **meeting notes**, **shopping lists**, *book highlights*, or quick ideas.

## Quick Checklist (click checkboxes in Preview!)
- [x] Create a fast distraction-free personal notebook
- [ ] Write down 3 things to focus on today
- [ ] Keep reading highlights & quick links in one place

## Feature Table
| Shortcut / Tool | Purpose |
| --- | --- |
| Quick Templates | Start Meetings, Groceries, or Weekly Reviews in 1 click |
| Find & Replace | Search and replace words across long notes |
| Send to Tasks | Turn unchecked checklist lines into actionable tasks |

> Tip: Switch to Sticky Grid view anytime to browse all your notes like Keep cards.`,
      tags: ['Personal', 'Checklist'],
      pinned: true,
      starred: true,
      accent: 'sky',
      updatedAt: now,
      createdAt: now,
    },
    {
      id: 'note-reading',
      title: 'Books & Watchlist Queue',
      notebook: 'Study',
      content: `# Reading & Watchlist

1. Designing Data-Intensive Applications
2. Clean Architecture notes & takeaways
3. Weekend movie & documentary picks`,
      tags: ['Reading', 'Ideas'],
      pinned: false,
      starred: false,
      accent: 'violet',
      updatedAt: now,
      createdAt: now,
    },
  ];
}

const NOTE_TEMPLATES: Array<{
  id: string;
  label: string;
  title: string;
  notebook: string;
  tags: string[];
  accent: NoteAccent;
  content: string;
}> = [
  {
    id: 'meeting',
    label: '🤝 Meeting',
    title: 'Meeting Notes',
    notebook: 'Work',
    tags: ['Meetings', 'Work'],
    accent: 'sky',
    content: `# Meeting Notes · ${todayTitleLabel()}\n\n## Attendees\n- \n\n## Key Points\n- \n\n## Action Items\n- [ ] Follow up with team\n`,
  },
  {
    id: 'shopping',
    label: '🛒 Shopping',
    title: 'Groceries & Errands',
    notebook: 'Personal',
    tags: ['Shopping', 'Home'],
    accent: 'emerald',
    content: `# Groceries & Home List\n\n- [ ] Fresh vegetables & fruits\n- [ ] Milk, eggs, coffee\n- [ ] Pantry essentials\n`,
  },
  {
    id: 'trip',
    label: '✈️ Packing',
    title: 'Trip Packing Checklist',
    notebook: 'Personal',
    tags: ['Travel', 'Checklist'],
    accent: 'amber',
    content: `# Trip Packing List\n\n## Documents & Tech\n- [ ] ID / Wallet / Charger / Powerbank\n\n## Clothing & Essentials\n- [ ] Daily outfits\n- [ ] Toiletries & water bottle\n`,
  },
  {
    id: 'book',
    label: '📚 Book Notes',
    title: 'Book / Learning Takeaways',
    notebook: 'Study',
    tags: ['Reading', 'Learning'],
    accent: 'violet',
    content: `# Book / Video Takeaways\n\n## Core Ideas\n- \n\n## Quotes\n> \n\n## How to Apply\n- [ ] \n`,
  },
  {
    id: 'weekly',
    label: '🗓 Weekly Review',
    title: `Weekly Review · ${todayTitleLabel()}`,
    notebook: 'Journal',
    tags: ['Review', 'Weekly'],
    accent: 'rose',
    content: `# Weekly Review · ${todayTitleLabel()}\n\n## Biggest Wins\n- \n\n## Lessons Learned\n- \n\n## Priorities Next Week\n- [ ] \n`,
  },
];

function checklistStats(content: string): { done: number; total: number; uncheckedLines: string[] } {
  const lines = content.split('\n');
  let done = 0;
  let total = 0;
  const uncheckedLines: string[] = [];
  for (const line of lines) {
    if (/^\s*-\s*\[[xX]\]/.test(line)) {
      done += 1;
      total += 1;
    } else if (/^\s*-\s*\[ \]/.test(line)) {
      total += 1;
      const text = line.replace(/^\s*-\s*\[ \]\s*/, '').trim();
      if (text) uncheckedLines.push(text);
    }
  }
  return { done, total, uncheckedLines };
}

function extractOutline(content: string): Array<{ level: number; text: string; lineIdx: number }> {
  const items: Array<{ level: number; text: string; lineIdx: number }> = [];
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    const m = /^(#{1,3})\s+(.+)$/.exec(line.trim());
    if (m) {
      items.push({ level: m[1].length, text: m[2].trim(), lineIdx: idx });
    }
  });
  return items;
}

export interface NotesJournalTabProps {
  onNavigate: (viewId: string) => void;
  embedded?: boolean;
}

export default function NotesJournalTab({ onNavigate, embedded = false }: NotesJournalTabProps) {
  const [notes, setNotes, sync] = useSyncedWorkspaceState<HumanNote[]>('notes', buildStarterNotes);
  const [, setTasks] = useSyncedWorkspaceState<HumanTask[]>('tasks', []);

  const [selectedId, setSelectedId] = useState<string>(() => notes[0]?.id || '');
  const [layoutView, setLayoutView] = useState<NoteLayoutView>('workspace');
  const [scopeFilter, setScopeFilter] = useState<string>('All');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<NoteSortBy>('updated');
  const [search, setSearch] = useState<string>('');
  const [mode, setMode] = useState<NoteEditorMode>('split');
  const [zenMode, setZenMode] = useState<boolean>(false);
  const [editorFont, setEditorFont] = useState<'mono' | 'sans'>('mono');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  const [findOpen, setFindOpen] = useState<boolean>(false);
  const [findQuery, setFindQuery] = useState<string>('');
  const [replaceQuery, setReplaceQuery] = useState<string>('');
  const [snapshotsOpen, setSnapshotsOpen] = useState<boolean>(false);
  const [listeningVoice, setListeningVoice] = useState<boolean>(false);
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2000);
  };

  const activeNotes = useMemo(() => notes.filter((n) => !n.trashed), [notes]);
  const trashedNotes = useMemo(() => notes.filter((n) => Boolean(n.trashed)), [notes]);

  const allTags = useMemo(() => {
    const set = new Set<string>();
    activeNotes.forEach((n) => n.tags.forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [activeNotes]);

  const visibleNotes = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = notes.filter((n) => {
      if (scopeFilter === 'Trash') return Boolean(n.trashed);
      if (n.trashed) return false;
      if (scopeFilter === 'Pinned' && !n.pinned) return false;
      if (scopeFilter === 'Starred' && !n.starred) return false;
      if (
        scopeFilter !== 'All' &&
        scopeFilter !== 'Pinned' &&
        scopeFilter !== 'Starred' &&
        (n.notebook || 'Personal') !== scopeFilter
      ) {
        return false;
      }
      if (tagFilter !== 'All' && !n.tags.includes(tagFilter)) return false;
      if (needle) {
        const hay = `${n.title} ${n.content} ${n.tags.join(' ')} ${n.notebook || ''}`.toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    return list.sort((a, b) => {
      if (scopeFilter !== 'Trash' && a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (sortBy === 'title') return (a.title || '').localeCompare(b.title || '');
      if (sortBy === 'words') return b.content.length - a.content.length;
      if (sortBy === 'newest') return (b.createdAt || b.updatedAt).localeCompare(a.createdAt || a.updatedAt);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [notes, scopeFilter, tagFilter, search, sortBy]);

  const activeNote = useMemo(
    () => notes.find((n) => n.id === selectedId) || visibleNotes[0] || activeNotes[0] || null,
    [notes, selectedId, visibleNotes, activeNotes]
  );

  const updateActiveNote = (patch: Partial<HumanNote>) => {
    if (!activeNote) return;
    const now = new Date().toISOString();
    setNotes((prev) =>
      prev.map((n) => (n.id === activeNote.id ? { ...n, ...patch, updatedAt: now } : n))
    );
  };

  const createNewNote = (preset?: Partial<HumanNote>) => {
    const now = new Date().toISOString();
    const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const next: HumanNote = {
      id,
      title: preset?.title || 'Untitled Note',
      notebook: preset?.notebook || (scopeFilter !== 'All' && NOTEBOOKS.includes(scopeFilter) ? scopeFilter : 'Personal'),
      content: preset?.content || '# Untitled Note\n\nStart writing here...\n',
      tags: preset?.tags || ['Personal'],
      pinned: Boolean(preset?.pinned),
      starred: Boolean(preset?.starred),
      trashed: false,
      accent: preset?.accent || 'sky',
      snapshots: [],
      updatedAt: now,
      createdAt: now,
    };
    setNotes((prev) => [next, ...prev]);
    if (scopeFilter === 'Trash') setScopeFilter('All');
    setTagFilter('All');
    setSearch('');
    setSelectedId(id);
    setLayoutView('workspace');
  };

  const openDailyJournal = () => {
    const label = `Journal · ${todayTitleLabel()}`;
    const existing = activeNotes.find((n) => n.title === label);
    if (existing) {
      setScopeFilter('All');
      setTagFilter('All');
      setSearch('');
      setSelectedId(existing.id);
      setLayoutView('workspace');
      return;
    }
    createNewNote({
      title: label,
      notebook: 'Journal',
      tags: ['Journal', 'Daily'],
      pinned: true,
      accent: 'emerald',
      content: `# ${label}\n\n## Top Focus Today\n- [ ] \n\n## Wins & Gratitude\n- \n\n## Evening Reflection\n> `,
    });
  };

  const moveNoteToTrash = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, trashed: true, pinned: false } : n)));
    showToast('Moved to Trash (recoverable)');
  };

  const restoreNoteFromTrash = (id: string) => {
    setNotes((prev) => prev.map((n) => (n.id === id ? { ...n, trashed: false } : n)));
    setScopeFilter('All');
    setSelectedId(id);
    showToast('Note restored');
  };

  const deleteForever = (id: string) => {
    const remaining = notes.filter((n) => n.id !== id);
    setNotes(remaining);
    if (selectedId === id) {
      setSelectedId(remaining.find((n) => !n.trashed)?.id || '');
    }
  };

  const duplicateActiveNote = () => {
    if (!activeNote) return;
    createNewNote({
      title: `${activeNote.title} (Copy)`,
      notebook: activeNote.notebook,
      content: activeNote.content,
      tags: [...activeNote.tags],
      accent: activeNote.accent,
      pinned: false,
    });
    showToast('Note duplicated');
  };

  const saveSnapshot = () => {
    if (!activeNote) return;
    const snap: NoteSnapshot = {
      id: `snap-${Date.now()}`,
      savedAt: new Date().toISOString(),
      content: activeNote.content,
    };
    const nextSnaps = [snap, ...(activeNote.snapshots || [])].slice(0, 6);
    updateActiveNote({ snapshots: nextSnaps });
    showToast('Saved snapshot ✓');
  };

  const applyFormatOrSnippet = (before: string, after = '', placeholder = 'text') => {
    if (!activeNote) return;
    const el = editorRef.current;
    if (el && mode !== 'preview') {
      const start = el.selectionStart ?? activeNote.content.length;
      const end = el.selectionEnd ?? activeNote.content.length;
      const selected = activeNote.content.slice(start, end);
      const inner = selected || (after ? placeholder : '');
      const replacement = `${before}${inner}${after}`;
      const updated = `${activeNote.content.slice(0, start)}${replacement}${activeNote.content.slice(end)}`;
      updateActiveNote({ content: updated });
      window.requestAnimationFrame(() => {
        el.focus();
        const cursorStart = start + before.length;
        const cursorEnd = cursorStart + inner.length;
        el.setSelectionRange(cursorStart, cursorEnd);
      });
      return;
    }
    const sep = activeNote.content.endsWith('\n') || activeNote.content === '' ? '' : '\n';
    updateActiveNote({ content: `${activeNote.content}${sep}${before}${after ? placeholder : ''}${after}` });
  };

  const toggleMarkdownCheckbox = (lineIdx: number) => {
    if (!activeNote) return;
    const lines = activeNote.content.split('\n');
    const line = lines[lineIdx];
    if (line === undefined) return;
    if (/^\s*-\s*\[ \]/.test(line)) {
      lines[lineIdx] = line.replace('- [ ]', '- [x]');
    } else if (/^\s*-\s*\[[xX]\]/.test(line)) {
      lines[lineIdx] = line.replace(/-\s*\[[xX]\]/, '- [ ]');
    }
    updateActiveNote({ content: lines.join('\n') });
  };

  const clearCheckedItems = () => {
    if (!activeNote) return;
    const nextContent = activeNote.content
      .split('\n')
      .filter((line) => !/^\s*-\s*\[[xX]\]/.test(line))
      .join('\n');
    updateActiveNote({ content: nextContent });
    showToast('Cleared checked items');
  };

  const sendChecklistToTasks = () => {
    if (!activeNote) return;
    const { uncheckedLines } = checklistStats(activeNote.content);
    if (uncheckedLines.length === 0) {
      showToast('No unchecked items to send');
      return;
    }
    const todayStr = new Date().toISOString().slice(0, 10);
    const nowIso = new Date().toISOString();
    const additions: HumanTask[] = uncheckedLines.map((text, idx) => ({
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 5)}`,
      title: text,
      done: false,
      status: 'todo',
      priority: 'medium',
      category: activeNote.notebook || 'Personal',
      dueDate: todayStr,
      repeat: 'none',
      starred: false,
      estimateMin: 20,
      notes: `From note: ${activeNote.title}`,
      subtasks: [],
      createdAt: nowIso,
    }));
    setTasks((prev) => [...additions, ...prev]);
    showToast(`Added ${additions.length} items to Tasks ✓`);
  };

  const findMatchCount = useMemo(() => {
    if (!activeNote || !findQuery) return 0;
    try {
      const esc = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return (activeNote.content.match(new RegExp(esc, 'gi')) || []).length;
    } catch {
      return 0;
    }
  }, [activeNote, findQuery]);

  const handleReplaceAll = () => {
    if (!activeNote || !findQuery) return;
    const esc = findQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const next = activeNote.content.replace(new RegExp(esc, 'gi'), replaceQuery);
    updateActiveNote({ content: next });
    showToast(`Replaced ${findMatchCount} matches`);
  };

  const startVoiceDictation = () => {
    if (!activeNote) return;
    const w = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
        onerror: (() => void) | null;
        onend: (() => void) | null;
        start: () => void;
      };
    };
    const Rec = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Rec) {
      showToast('Voice dictation unavailable on this runtime');
      return;
    }
    try {
      const rec = new Rec();
      rec.lang = navigator.language || 'en-US';
      rec.interimResults = false;
      setListeningVoice(true);
      rec.onresult = (evt) => {
        const spoken = evt.results?.[0]?.[0]?.transcript;
        if (spoken) {
          applyFormatOrSnippet(`${spoken} `);
          showToast('Voice note inserted ✓');
        }
      };
      rec.onerror = () => setListeningVoice(false);
      rec.onend = () => setListeningVoice(false);
      rec.start();
    } catch {
      setListeningVoice(false);
      showToast('Microphone unavailable');
    }
  };

  const noteAnalytics = useMemo(() => {
    if (!activeNote) {
      return { words: 0, chars: 0, paragraphs: 0, readMin: 0, checks: { done: 0, total: 0, uncheckedLines: [] }, outline: [] };
    }
    const trimmed = activeNote.content.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    const paragraphs = trimmed ? trimmed.split(/\n\s*\n/).length : 0;
    return {
      words,
      chars: activeNote.content.length,
      paragraphs,
      readMin: Math.max(1, Math.ceil(words / 200)),
      checks: checklistStats(activeNote.content),
      outline: extractOutline(activeNote.content),
    };
  }, [activeNote]);

  const exportFile = (ext: 'md' | 'txt') => {
    if (!activeNote) return;
    const blob = new Blob([activeNote.content], {
      type: ext === 'md' ? 'text/markdown;charset=utf-8' : 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeNote.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'note'}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f' && layoutView === 'workspace' && activeNote) {
        e.preventDefault();
        setFindOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [layoutView, activeNote]);

  return (
    <article className="w-full flex flex-col gap-5">
      {/* Header Banner */}
      {!zenMode && (
        <header
          className={
            embedded
              ? 'w-full bg-[#111218] border border-white/[0.08] rounded-2xl p-4 sm:p-5'
              : 'w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-6 shadow-2xl portal-header-sheen'
          }
        >
          {!embedded && (
            <HeroArtworkBackdrop src="/visuals/pillar-docs-blueprint.jpg" alt="" opacityClass="opacity-28 sm:opacity-42" />
          )}
          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300">
                    Personal Knowledge &amp; Notebook
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-sky-500/15 border border-sky-400/30 text-sky-300">
                    {sync.saving ? 'Saving...' : `${activeNotes.length} Notes`}
                  </span>
                  {toastMsg && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold">
                      {toastMsg}
                    </span>
                  )}
                </div>
                {embedded ? (
                  <h2 className="text-lg font-extrabold tracking-tight text-white">Notes &amp; Journal</h2>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                      Notes &amp; Journal
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400">
                      Organize notebooks, write rich Markdown with tables &amp; clickable checklists, find &amp; replace, snapshot versions, and browse sticky note cards.
                    </p>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center p-0.5 rounded-xl bg-[#0b0c10] border border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setLayoutView('workspace')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${
                      layoutView === 'workspace' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    ◫ Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayoutView('cards')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono cursor-pointer ${
                      layoutView === 'cards' ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    ▦ Sticky Grid
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openDailyJournal}
                  className="px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 text-xs font-bold text-emerald-200 transition-colors cursor-pointer"
                >
                  📅 Today’s Journal
                </button>
                <button
                  type="button"
                  onClick={() => createNewNote()}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 text-xs font-extrabold transition-colors cursor-pointer"
                >
                  + New Note
                </button>
                {!embedded && (
                  <button
                    type="button"
                    onClick={() => onNavigate('tasks')}
                    className="px-3.5 py-2 rounded-xl bg-[#181922] border border-white/[0.1] hover:border-white/[0.25] text-xs font-semibold text-zinc-200 cursor-pointer"
                  >
                    ✅ Tasks
                  </button>
                )}
              </div>
            </div>

            {/* Templates Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.07]">
              <span className="text-[11px] font-mono text-zinc-400">Templates:</span>
              {NOTE_TEMPLATES.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() =>
                    createNewNote({
                      title: tpl.title,
                      notebook: tpl.notebook,
                      tags: tpl.tags,
                      accent: tpl.accent,
                      content: tpl.content,
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#181a24] border border-white/[0.08] hover:border-sky-400/40 text-xs text-zinc-200 hover:text-white cursor-pointer"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>
        </header>
      )}

      {/* Notebook Filter Chips */}
      {!zenMode && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {['All', 'Starred', 'Pinned', ...NOTEBOOKS].map((nb) => (
              <button
                key={nb}
                type="button"
                onClick={() => setScopeFilter(nb)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                  scopeFilter === nb
                    ? 'bg-sky-500/20 border-sky-400/45 text-white font-bold'
                    : 'bg-[#121319] border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {nb === 'Starred' ? '★ Favorites' : nb === 'Pinned' ? '📌 Pinned' : nb}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setScopeFilter('Trash')}
              className={`px-3 py-1 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
                scopeFilter === 'Trash'
                  ? 'bg-rose-500/20 border-rose-400/45 text-rose-200 font-bold'
                  : 'bg-[#121319] border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
            >
              🗑️ Trash ({trashedNotes.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as NoteSortBy)}
              aria-label="Sort notes"
              className="h-8 px-2.5 rounded-xl bg-[#121319] border border-white/[0.08] text-xs text-zinc-200 focus:outline-none"
            >
              <option value="updated">Sort: Last Edited</option>
              <option value="newest">Sort: Newest Created</option>
              <option value="title">Sort: A–Z</option>
              <option value="words">Sort: Longest</option>
            </select>
          </div>
        </div>
      )}

      {/* Keep-style Sticky Cards Grid View */}
      {layoutView === 'cards' ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search cards..."
              className="w-full max-w-sm h-9 px-3 rounded-xl bg-[#111218] border border-white/[0.1] text-xs text-white"
            />
          </div>
          {visibleNotes.length === 0 ? (
            <div className="rounded-2xl bg-[#111218] border border-white/[0.08] p-12 text-center text-xs text-zinc-400">
              No notes found in this notebook view.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {visibleNotes.map((note) => {
                const acc = ACCENT_MAP[note.accent] || ACCENT_MAP.sky;
                const chk = checklistStats(note.content);
                return (
                  <div
                    key={note.id}
                    className={`rounded-2xl border p-4 flex flex-col justify-between gap-3 cursor-pointer hover:brightness-110 transition-all ${acc.cardBg}`}
                    onClick={() => {
                      setSelectedId(note.id);
                      setLayoutView('workspace');
                    }}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${acc.dot}`} />
                          <h3 className="text-sm font-bold text-white truncate">{note.title || 'Untitled'}</h3>
                        </div>
                        <div className="flex items-center gap-1 shrink-0 text-xs">
                          {note.starred && <span className="text-amber-300">★</span>}
                          {note.pinned && <span>📌</span>}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-300 line-clamp-5 whitespace-pre-line leading-relaxed">
                        {note.content.replace(/^#+\s*/gm, '').trim()}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400 pt-2 border-t border-white/[0.07]">
                      <span>{note.notebook || 'Personal'}</span>
                      <span>{chk.total > 0 ? `✓ ${chk.done}/${chk.total}` : note.tags.slice(0, 2).join(', ')}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Dual-Pane Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Notes Sidebar */}
          {!zenMode && (
            <aside className="lg:col-span-4 xl:col-span-3 rounded-2xl bg-[#111218] border border-white/[0.08] p-4 flex flex-col gap-3">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes or tags..."
                aria-label="Search notes"
                className="w-full h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/45"
              />

              <div className="flex flex-wrap items-center gap-1.5">
                {['All', ...allTags].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTagFilter(tag)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono border cursor-pointer transition-colors ${
                      tagFilter === tag
                        ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 font-bold'
                        : 'bg-[#171820] border-white/[0.07] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tag === 'All' ? 'All Tags' : `#${tag}`}
                  </button>
                ))}
              </div>

              <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
                {visibleNotes.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">
                    {scopeFilter === 'Trash' ? 'Trash is empty.' : 'No notes match your filter.'}
                  </div>
                ) : (
                  visibleNotes.map((note) => {
                    const selected = activeNote?.id === note.id;
                    const acc = ACCENT_MAP[note.accent] || ACCENT_MAP.sky;
                    const snippet = note.content.replace(/^#+\s*/gm, '').trim().slice(0, 80);
                    const chk = checklistStats(note.content);
                    return (
                      <button
                        key={note.id}
                        type="button"
                        onClick={() => setSelectedId(note.id)}
                        className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col gap-1 ${
                          selected
                            ? `bg-[#181a24] ${acc.border}`
                            : 'bg-[#0d0e13] border-white/[0.06] hover:border-white/[0.15]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${acc.dot}`} />
                            <span className="text-xs font-bold text-white truncate">{note.title || 'Untitled'}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 text-[11px]">
                            {note.starred && <span className="text-amber-300">★</span>}
                            {note.pinned && <span>📌</span>}
                          </div>
                        </div>
                        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
                          {snippet || 'Empty note'}
                        </p>
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 pt-1">
                          <span>{note.notebook || 'Personal'}</span>
                          <span>
                            {chk.total > 0 ? `✓ ${chk.done}/${chk.total}` : new Date(note.updatedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </aside>
          )}

          {/* Right Editor & Preview */}
          <section className={`${zenMode ? 'lg:col-span-12' : 'lg:col-span-8 xl:col-span-9'} rounded-2xl bg-[#111218] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-3.5`}>
            {!activeNote ? (
              <div className="py-20 text-center flex flex-col items-center gap-3">
                <span className="text-3xl">📝</span>
                <h2 className="text-base font-bold text-white">No note selected</h2>
                <button
                  type="button"
                  onClick={() => createNewNote()}
                  className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold cursor-pointer"
                >
                  + Create New Note
                </button>
              </div>
            ) : (
              <>
                {activeNote.trashed && (
                  <div className="rounded-xl bg-rose-500/12 border border-rose-500/35 px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="text-rose-200 font-semibold">This note is in Trash. Restore it to move back into active notebooks.</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => restoreNoteFromTrash(activeNote.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold cursor-pointer"
                      >
                        Restore Note
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteForever(activeNote.id)}
                        className="px-3 py-1 rounded-lg bg-rose-500/25 border border-rose-400/45 text-rose-100 font-bold cursor-pointer"
                      >
                        Delete Forever
                      </button>
                    </div>
                  </div>
                )}

                {/* Title + Controls */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => updateActiveNote({ starred: !activeNote.starred })}
                      aria-label={activeNote.starred ? 'Unfavorite note' : 'Favorite note'}
                      className={`text-lg cursor-pointer shrink-0 ${
                        activeNote.starred ? 'text-amber-300' : 'text-zinc-600 hover:text-zinc-300'
                      }`}
                    >
                      {activeNote.starred ? '★' : '☆'}
                    </button>
                    <input
                      type="text"
                      value={activeNote.title}
                      onChange={(e) => updateActiveNote({ title: e.target.value })}
                      aria-label="Note title"
                      className="flex-1 bg-transparent text-lg sm:text-xl font-extrabold text-white focus:outline-none placeholder-zinc-600 min-w-0"
                      placeholder="Note Title..."
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <select
                      value={activeNote.notebook || 'Personal'}
                      onChange={(e) => updateActiveNote({ notebook: e.target.value })}
                      aria-label="Select notebook"
                      className="h-7 px-2 rounded-lg bg-[#0a0b0f] border border-white/[0.08] text-[11px] font-mono text-zinc-200"
                    >
                      {NOTEBOOKS.map((nb) => (
                        <option key={nb} value={nb}>
                          {nb}
                        </option>
                      ))}
                    </select>

                    <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#0a0b0f] border border-white/[0.08]">
                      {(Object.keys(ACCENT_MAP) as NoteAccent[]).map((accent) => (
                        <button
                          key={accent}
                          type="button"
                          onClick={() => updateActiveNote({ accent })}
                          aria-label={`Set ${accent} color`}
                          className={`w-3 h-3 rounded-full cursor-pointer transition-transform ${ACCENT_MAP[accent].dot} ${
                            activeNote.accent === accent ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center p-0.5 rounded-lg bg-[#0a0b0f] border border-white/[0.08]">
                      {(['edit', 'split', 'preview'] as NoteEditorMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setMode(m)}
                          className={`px-2 py-1 rounded-md text-[11px] font-mono capitalize cursor-pointer ${
                            mode === m ? 'bg-zinc-800 text-white font-bold' : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => setZenMode((z) => !z)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono border cursor-pointer ${
                        zenMode
                          ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                          : 'bg-[#171820] border-white/[0.08] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {zenMode ? 'Exit Zen' : '⛶ Zen'}
                    </button>

                    <button
                      type="button"
                      onClick={() => updateActiveNote({ pinned: !activeNote.pinned })}
                      className={`px-2 py-1 rounded-lg text-[11px] font-mono border cursor-pointer ${
                        activeNote.pinned
                          ? 'bg-amber-500/15 border-amber-400/35 text-amber-200'
                          : 'bg-[#171820] border-white/[0.08] text-zinc-400 hover:text-white'
                      }`}
                    >
                      {activeNote.pinned ? '📌 Pinned' : 'Pin'}
                    </button>

                    {!activeNote.trashed && (
                      <button
                        type="button"
                        onClick={() => moveNoteToTrash(activeNote.id)}
                        className="px-2 py-1 rounded-lg bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-[11px] font-mono text-rose-300 cursor-pointer"
                      >
                        Trash
                      </button>
                    )}
                  </div>
                </div>

                {/* Action Utilities Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFindOpen((f) => !f)}
                      className={`px-2 py-1 rounded-md border cursor-pointer ${
                        findOpen ? 'bg-sky-500/20 border-sky-400/40 text-sky-200' : 'bg-[#171820] border-white/[0.08] text-zinc-300'
                      }`}
                    >
                      🔍 Find/Replace
                    </button>
                    <button
                      type="button"
                      onClick={startVoiceDictation}
                      className={`px-2 py-1 rounded-md border cursor-pointer ${
                        listeningVoice
                          ? 'bg-rose-500/20 border-rose-400/45 text-rose-200 animate-pulse'
                          : 'bg-[#171820] border-white/[0.08] text-zinc-300 hover:text-white'
                      }`}
                    >
                      {listeningVoice ? '🎙️ Listening...' : '🎙️ Dictate'}
                    </button>
                    <button
                      type="button"
                      onClick={saveSnapshot}
                      className="px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] hover:border-white/[0.2] text-zinc-300 cursor-pointer"
                    >
                      📸 Snapshot
                    </button>
                    {(activeNote.snapshots?.length || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => setSnapshotsOpen((s) => !s)}
                        className="px-2 py-1 rounded-md bg-violet-500/15 border border-violet-400/35 text-violet-200 cursor-pointer"
                      >
                        ↺ History ({activeNote.snapshots?.length})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={duplicateActiveNote}
                      className="px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] text-zinc-300 hover:text-white cursor-pointer"
                    >
                      Duplicate
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        void navigator.clipboard.writeText(`${activeNote.title}\n\n${activeNote.content}`);
                        showToast('Copied note ✓');
                      }}
                      className="px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] text-zinc-200 cursor-pointer"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => exportFile('md')}
                      className="px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] text-zinc-200 cursor-pointer"
                    >
                      .md
                    </button>
                    <button
                      type="button"
                      onClick={() => exportFile('txt')}
                      className="px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] text-zinc-200 cursor-pointer"
                    >
                      .txt
                    </button>
                    <button
                      type="button"
                      onClick={() => window.print()}
                      className="px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] text-zinc-200 cursor-pointer"
                    >
                      🖨️ Print
                    </button>
                  </div>
                </div>

                {/* Find & Replace Drawer */}
                {findOpen && (
                  <div className="rounded-xl bg-[#0b0c11] border border-sky-400/30 p-3 flex flex-wrap items-center gap-2 text-xs">
                    <input
                      type="text"
                      value={findQuery}
                      onChange={(e) => setFindQuery(e.target.value)}
                      placeholder="Find text..."
                      className="h-8 px-2.5 rounded-lg bg-[#07080b] border border-white/[0.1] text-white"
                    />
                    <input
                      type="text"
                      value={replaceQuery}
                      onChange={(e) => setReplaceQuery(e.target.value)}
                      placeholder="Replace with..."
                      className="h-8 px-2.5 rounded-lg bg-[#07080b] border border-white/[0.1] text-white"
                    />
                    <span className="font-mono text-zinc-400">{findMatchCount} matches</span>
                    <button
                      type="button"
                      disabled={findMatchCount === 0}
                      onClick={handleReplaceAll}
                      className="h-8 px-3 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-200 font-bold disabled:opacity-40 cursor-pointer"
                    >
                      Replace All
                    </button>
                  </div>
                )}

                {/* Snapshots History Panel */}
                {snapshotsOpen && (activeNote.snapshots?.length || 0) > 0 && (
                  <div className="rounded-xl bg-[#0b0c11] border border-violet-400/30 p-3 flex flex-col gap-2 text-xs">
                    <div className="flex items-center justify-between text-violet-200 font-bold">
                      <span>Saved Version Snapshots</span>
                      <button
                        type="button"
                        onClick={() => setSnapshotsOpen(false)}
                        className="text-zinc-400 hover:text-white cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    {activeNote.snapshots?.map((snap) => (
                      <div key={snap.id} className="flex items-center justify-between gap-2 py-1 border-t border-white/[0.06]">
                        <span className="font-mono text-zinc-300">
                          {new Date(snap.savedAt).toLocaleString()} ({snap.content.length} chars)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            updateActiveNote({ content: snap.content });
                            setSnapshotsOpen(false);
                            showToast('Restored snapshot ✓');
                          }}
                          className="px-2.5 py-0.5 rounded bg-violet-500/20 border border-violet-400/35 text-violet-200 cursor-pointer"
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Checklist Action Banner */}
                {noteAnalytics.checks.total > 0 && (
                  <div className="rounded-xl bg-[#0c0e14] border border-emerald-500/25 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-300 font-bold">
                        Checklist: {noteAnalytics.checks.done}/{noteAnalytics.checks.total} completed
                      </span>
                      <div className="w-24 h-1.5 rounded-full bg-black/60 overflow-hidden">
                        <div
                          className="h-full bg-emerald-400"
                          style={{ width: `${Math.round((noteAnalytics.checks.done / noteAnalytics.checks.total) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 font-mono text-[11px]">
                      {noteAnalytics.checks.uncheckedLines.length > 0 && (
                        <button
                          type="button"
                          onClick={sendChecklistToTasks}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
                        >
                          ➜ Send {noteAnalytics.checks.uncheckedLines.length} to Tasks
                        </button>
                      )}
                      {noteAnalytics.checks.done > 0 && (
                        <button
                          type="button"
                          onClick={clearCheckedItems}
                          className="px-2.5 py-1 rounded-lg bg-[#171820] border border-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                        >
                          Clear Checked
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags & Formatting Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    {activeNote.tags.map((tag) => (
                      <span
                        key={tag}
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-mono border ${
                          (ACCENT_MAP[activeNote.accent] || ACCENT_MAP.sky).pill
                        }`}
                      >
                        <span>#{tag}</span>
                        <button
                          type="button"
                          onClick={() => updateActiveNote({ tags: activeNote.tags.filter((t) => t !== tag) })}
                          className="opacity-70 hover:opacity-100 cursor-pointer"
                          aria-label={`Remove tag ${tag}`}
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                    <div className="inline-flex items-center gap-1">
                      <input
                        type="text"
                        value={newTagInput}
                        onChange={(e) => setNewTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newTagInput.trim()) {
                            e.preventDefault();
                            const clean = newTagInput.trim();
                            if (!activeNote.tags.includes(clean)) {
                              updateActiveNote({ tags: [...activeNote.tags, clean] });
                            }
                            setNewTagInput('');
                          }
                        }}
                        placeholder="New tag..."
                        aria-label="Add tag"
                        className="w-24 h-6 px-2 rounded-md bg-[#090a0e] border border-white/[0.08] text-[11px] font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-sky-400/45"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const clean = newTagInput.trim();
                          if (!clean) return;
                          if (!activeNote.tags.includes(clean)) {
                            updateActiveNote({ tags: [...activeNote.tags, clean] });
                          }
                          setNewTagInput('');
                        }}
                        className="h-6 px-2 rounded-md bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.1] text-[10px] font-mono font-bold text-zinc-200 cursor-pointer"
                      >
                        + Tag
                      </button>
                    </div>
                  </div>

                  {mode !== 'preview' && (
                    <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono">
                      {[
                        { label: 'H1', b: '# ', a: '' },
                        { label: 'H2', b: '## ', a: '' },
                        { label: 'B', b: '**', a: '**' },
                        { label: 'I', b: '*', a: '*' },
                        { label: 'Code', b: '`', a: '`' },
                        { label: 'List', b: '- ', a: '' },
                        { label: '1.2', b: '1. ', a: '' },
                        { label: '[ ]', b: '- [ ] ', a: '' },
                        { label: 'Table', b: '\n| Item | Notes |\n| --- | --- |\n| ', a: ' | |\n' },
                        { label: 'Quote', b: '> ', a: '' },
                        { label: 'Link', b: '[', a: '](https://example.com)' },
                      ].map((tool) => (
                        <button
                          key={tool.label}
                          type="button"
                          onClick={() => applyFormatOrSnippet(tool.b, tool.a)}
                          className="px-2 py-0.5 rounded bg-[#181922] border border-white/[0.08] hover:border-white/[0.2] text-zinc-300 hover:text-white cursor-pointer"
                        >
                          {tool.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Outline Jump Pills */}
                {noteAnalytics.outline.length > 1 && mode !== 'edit' && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono text-zinc-400">
                    <span>Outline:</span>
                    {noteAnalytics.outline.map((h) => (
                      <button
                        key={h.lineIdx}
                        type="button"
                        onClick={() => {
                          const target = previewContainerRef.current?.querySelector(
                            `[data-note-heading="${h.lineIdx}"]`
                          );
                          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }}
                        className="px-2 py-0.5 rounded bg-white/[0.04] hover:bg-sky-500/15 border border-white/[0.07] text-zinc-300 hover:text-sky-200 cursor-pointer"
                      >
                        {h.text}
                      </button>
                    ))}
                  </div>
                )}

                {/* Editor & Enhanced Preview Grid */}
                <div className={`grid gap-4 ${mode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'}`}>
                  {mode !== 'preview' && (
                    <textarea
                      ref={editorRef}
                      value={activeNote.content}
                      onChange={(e) => updateActiveNote({ content: e.target.value })}
                      aria-label="Note markdown editor"
                      rows={zenMode ? 22 : 16}
                      className={`w-full ${zenMode ? 'min-h-[520px]' : 'min-h-[400px]'} p-4 rounded-xl bg-[#08090c] border border-white/[0.08] focus:border-sky-400/45 focus:outline-none text-zinc-100 leading-relaxed resize-y ${
                        editorFont === 'mono' ? 'font-mono' : 'font-sans'
                      } ${fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'}`}
                      placeholder="Write notes cleanly in Markdown..."
                    />
                  )}

                  {mode !== 'edit' && (
                    <div className={`w-full ${zenMode ? 'min-h-[520px]' : 'min-h-[400px]'} p-4 sm:p-5 rounded-xl bg-[#0c0d13] border border-white/[0.08] overflow-y-auto max-h-[600px]`}>
                      <NoteMarkdownPreview
                        content={activeNote.content}
                        fontSize={fontSize}
                        onToggleCheckbox={toggleMarkdownCheckbox}
                        containerRef={previewContainerRef}
                      />
                    </div>
                  )}
                </div>

                {/* Comfort & Analytics Footer */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500 pt-2 border-t border-white/[0.06]">
                  <div className="flex flex-wrap items-center gap-3">
                    <span>
                      {noteAnalytics.words} words · {noteAnalytics.chars} chars · {noteAnalytics.paragraphs} paragraphs · ~{noteAnalytics.readMin}m read
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditorFont((f) => (f === 'mono' ? 'sans' : 'mono'))}
                        className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.08] text-zinc-300 cursor-pointer"
                      >
                        {editorFont === 'mono' ? 'Mono' : 'Sans'}
                      </button>
                      {(['sm', 'md', 'lg'] as const).map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setFontSize(sz)}
                          className={`px-1.5 py-0.5 rounded border uppercase cursor-pointer ${
                            fontSize === sz ? 'bg-sky-500/20 border-sky-400/40 text-sky-200' : 'bg-white/[0.04] border-white/[0.08] text-zinc-400'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                  <span>Updated {new Date(activeNote.updatedAt).toLocaleString()}</span>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </article>
  );
}
