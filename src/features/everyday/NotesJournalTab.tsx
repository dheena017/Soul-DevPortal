import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HeroArtworkBackdrop } from '../../components/PortalVisuals';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import { useScrollEdgeFade } from '../../utils/useScrollEdgeFade';
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

type TemplateIconKind = 'meeting' | 'shopping' | 'trip' | 'book' | 'weekly';

const SvgIcon: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = 'w-3.5 h-3.5 shrink-0',
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const StarIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <SvgIcon className={className}>
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </SvgIcon>
);

const PinIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <SvgIcon className={className}>
    <path d="M12 17v5" />
    <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" />
  </SvgIcon>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <SvgIcon className={className}>
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </SvgIcon>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 shrink-0' }) => (
  <SvgIcon className={className}>
    <path d="m6 9 6 6 6-6" />
  </SvgIcon>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 stroke-[2.5] shrink-0' }) => (
  <SvgIcon className={className}>
    <path d="M5 12h14" />
    <path d="M12 5v14" />
  </SvgIcon>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className = 'w-3 h-3 shrink-0' }) => (
  <SvgIcon className={className}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </SvgIcon>
);

const TEMPLATE_ICON_COLORS: Record<TemplateIconKind, string> = {
  meeting: 'text-sky-400',
  shopping: 'text-emerald-400',
  trip: 'text-amber-400',
  book: 'text-violet-400',
  weekly: 'text-rose-400',
};

function renderTemplateIcon(kind: TemplateIconKind) {
  const cls = `w-3.5 h-3.5 shrink-0 ${TEMPLATE_ICON_COLORS[kind]}`;
  switch (kind) {
    case 'meeting':
      return (
        <SvgIcon className={cls}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </SvgIcon>
      );
    case 'shopping':
      return (
        <SvgIcon className={cls}>
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </SvgIcon>
      );
    case 'trip':
      return (
        <SvgIcon className={cls}>
          <rect width="20" height="14" x="2" y="7" rx="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </SvgIcon>
      );
    case 'book':
      return (
        <SvgIcon className={cls}>
          <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
          <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
        </SvgIcon>
      );
    case 'weekly':
      return (
        <SvgIcon className={cls}>
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </SvgIcon>
      );
  }
}

const NOTE_TEMPLATES: Array<{
  id: TemplateIconKind;
  label: string;
  title: string;
  notebook: string;
  tags: string[];
  accent: NoteAccent;
  content: string;
}> = [
  {
    id: 'meeting',
    label: 'Meeting',
    title: 'Meeting Notes',
    notebook: 'Work',
    tags: ['Meetings', 'Work'],
    accent: 'sky',
    content: `# Meeting Notes · ${todayTitleLabel()}\n\n## Attendees\n- \n\n## Key Points\n- \n\n## Action Items\n- [ ] Follow up with team\n`,
  },
  {
    id: 'shopping',
    label: 'Shopping',
    title: 'Groceries & Errands',
    notebook: 'Personal',
    tags: ['Shopping', 'Home'],
    accent: 'emerald',
    content: `# Groceries & Home List\n\n- [ ] Fresh vegetables & fruits\n- [ ] Milk, eggs, coffee\n- [ ] Pantry essentials\n`,
  },
  {
    id: 'trip',
    label: 'Packing',
    title: 'Trip Packing Checklist',
    notebook: 'Personal',
    tags: ['Travel', 'Checklist'],
    accent: 'amber',
    content: `# Trip Packing List\n\n## Documents & Tech\n- [ ] ID / Wallet / Charger / Powerbank\n\n## Clothing & Essentials\n- [ ] Daily outfits\n- [ ] Toiletries & water bottle\n`,
  },
  {
    id: 'book',
    label: 'Book Notes',
    title: 'Book / Learning Takeaways',
    notebook: 'Study',
    tags: ['Reading', 'Learning'],
    accent: 'violet',
    content: `# Book / Video Takeaways\n\n## Core Ideas\n- \n\n## Quotes\n> \n\n## How to Apply\n- [ ] \n`,
  },
  {
    id: 'weekly',
    label: 'Weekly Review',
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
  const [tagsExpanded, setTagsExpanded] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const previewContainerRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2000);
  };

  const activeNotes = useMemo(() => notes.filter((n) => !n.trashed), [notes]);
  const trashedNotes = useMemo(() => notes.filter((n) => Boolean(n.trashed)), [notes]);

  const scopeCounts = useMemo(() => {
    const byNotebook: Record<string, number> = {};
    NOTEBOOKS.forEach((nb) => {
      byNotebook[nb] = 0;
    });
    let starred = 0;
    let pinned = 0;
    for (const n of activeNotes) {
      if (n.starred) starred += 1;
      if (n.pinned) pinned += 1;
      const nb = n.notebook || 'Personal';
      byNotebook[nb] = (byNotebook[nb] || 0) + 1;
    }
    return {
      all: activeNotes.length,
      starred,
      pinned,
      trash: trashedNotes.length,
      byNotebook,
    };
  }, [activeNotes, trashedNotes]);

  const availableNotebooks = useMemo(() => {
    const extras = new Set<string>();
    activeNotes.forEach((n) => {
      if (n.notebook && !NOTEBOOKS.includes(n.notebook)) extras.add(n.notebook);
    });
    return [...NOTEBOOKS, ...Array.from(extras)];
  }, [activeNotes]);

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
    () => visibleNotes.find((n) => n.id === selectedId) || visibleNotes[0] || null,
    [visibleNotes, selectedId]
  );

  const notesListScroll = useScrollEdgeFade([
    visibleNotes.length,
    tagsExpanded,
    scopeFilter,
    tagFilter,
    search,
    zenMode,
    layoutView,
  ]);

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
    const targetNotebook =
      preset?.notebook ||
      (scopeFilter !== 'All' && availableNotebooks.includes(scopeFilter) ? scopeFilter : 'Personal');
    const next: HumanNote = {
      id,
      title: preset?.title || 'Untitled Note',
      notebook: targetNotebook,
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
    if (
      scopeFilter === 'Trash' ||
      (scopeFilter === 'Pinned' && !next.pinned) ||
      (scopeFilter === 'Starred' && !next.starred) ||
      (availableNotebooks.includes(scopeFilter) && scopeFilter !== next.notebook)
    ) {
      setScopeFilter('All');
    }
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
              ? 'relative overflow-hidden w-full bg-[#111218] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-lg'
              : 'relative overflow-hidden w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl portal-header-sheen'
          }
        >
          {!embedded && (
            <HeroArtworkBackdrop src="/visuals/pillar-docs-blueprint.jpg" alt="" opacityClass="opacity-28 sm:opacity-42" />
          )}
          <div className="relative z-10 flex flex-col gap-3.5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#161722] border border-white/[0.09] flex items-center justify-center text-sky-300 shrink-0 shadow-sm">
                  <SvgIcon className="w-5 h-5">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    <path d="M8 7h6" />
                    <path d="M8 11h8" />
                  </SvgIcon>
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300">
                      Personal Knowledge &amp; Notebook
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-sky-500/15 border border-sky-400/30 text-sky-300 tabular-nums">
                      {sync.saving ? 'Saving...' : `${activeNotes.length} Notes`}
                    </span>
                    {toastMsg && (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/20 border border-emerald-400/40 text-emerald-200">
                        {toastMsg}
                      </span>
                    )}
                  </div>
                  {embedded ? (
                    <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">Notes &amp; Journal</h2>
                  ) : (
                    <>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                        Notes &amp; Journal
                      </h1>
                      <p className="text-xs sm:text-sm text-zinc-400 mt-0.5">
                        Organize notebooks, write rich Markdown with tables &amp; clickable checklists, find &amp; replace, snapshot versions, and browse sticky note cards.
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div
                  className="inline-flex items-center h-9 p-1 rounded-xl bg-[#09090c] border border-white/[0.08] gap-0.5"
                  role="group"
                  aria-label="Notes layout view"
                >
                  <button
                    type="button"
                    aria-pressed={layoutView === 'workspace'}
                    onClick={() => setLayoutView('workspace')}
                    className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                      layoutView === 'workspace'
                        ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent font-medium'
                    }`}
                  >
                    <SvgIcon className={layoutView === 'workspace' ? 'w-3.5 h-3.5 text-sky-300' : 'w-3.5 h-3.5 text-zinc-500'}>
                      <rect width="18" height="18" x="3" y="3" rx="2" />
                      <path d="M9 3v18" />
                    </SvgIcon>
                    <span>Editor</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={layoutView === 'cards'}
                    onClick={() => setLayoutView('cards')}
                    className={`inline-flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                      layoutView === 'cards'
                        ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent font-medium'
                    }`}
                  >
                    <SvgIcon className={layoutView === 'cards' ? 'w-3.5 h-3.5 text-sky-300' : 'w-3.5 h-3.5 text-zinc-500'}>
                      <rect width="7" height="7" x="3" y="3" rx="1.5" />
                      <rect width="7" height="7" x="14" y="3" rx="1.5" />
                      <rect width="7" height="7" x="14" y="14" rx="1.5" />
                      <rect width="7" height="7" x="3" y="14" rx="1.5" />
                    </SvgIcon>
                    <span>Sticky Grid</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={openDailyJournal}
                  className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 hover:border-emerald-400/50 text-xs font-bold text-emerald-200 transition-all cursor-pointer whitespace-nowrap"
                >
                  <SvgIcon className="w-3.5 h-3.5 text-emerald-300">
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M16 2v4" />
                    <path d="M8 2v4" />
                    <path d="M3 10h18" />
                  </SvgIcon>
                  <span>Today’s Journal</span>
                </button>
                <button
                  type="button"
                  onClick={() => createNewNote()}
                  className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 text-xs font-extrabold transition-all shadow-sm cursor-pointer whitespace-nowrap"
                >
                  <PlusIcon />
                  <span>New Note</span>
                </button>
                {!embedded && (
                  <button
                    type="button"
                    onClick={() => onNavigate('tasks')}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#181922] border border-white/[0.1] hover:border-white/[0.25] text-xs font-semibold text-zinc-200 transition-all cursor-pointer whitespace-nowrap"
                  >
                    <SvgIcon className="w-3.5 h-3.5 text-emerald-400">
                      <path d="m9 11 3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </SvgIcon>
                    <span>Tasks</span>
                  </button>
                )}
              </div>
            </div>

            {/* Templates Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3.5 border-t border-white/[0.07]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mr-1">
                  Templates:
                </span>
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
                    className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#161821] border border-white/[0.08] hover:border-white/[0.22] hover:bg-[#1c1f2b] text-xs font-medium text-zinc-200 hover:text-white transition-all cursor-pointer whitespace-nowrap"
                  >
                    {renderTemplateIcon(tpl.id)}
                    <span>{tpl.label}</span>
                  </button>
                ))}
              </div>

              <div className="hidden lg:flex items-center gap-2 text-[11px] font-mono text-zinc-500">
                <span>{scopeCounts.starred} favorites</span>
                <span className="text-zinc-700">·</span>
                <span>{scopeCounts.pinned} pinned</span>
                <span className="text-zinc-700">·</span>
                <span>Ctrl+F find</span>
              </div>
            </div>

            {/* Row 3: Notebook Filter & Sort Toolbar (unified inside single header card) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pt-3.5 border-t border-white/[0.07]">
              <div className="flex flex-wrap items-center gap-1.5">
                {/* Smart Views Group */}
                <div className="inline-flex items-center h-8 p-0.5 rounded-xl bg-[#09090c] border border-white/[0.08] gap-0.5">
                  <button
                    type="button"
                    onClick={() => setScopeFilter('All')}
                    className={`inline-flex items-center gap-1.5 h-full px-2.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                      scopeFilter === 'All'
                        ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent font-medium'
                    }`}
                  >
                    <SvgIcon className={scopeFilter === 'All' ? 'w-3.5 h-3.5 text-sky-300' : 'w-3.5 h-3.5 text-zinc-500'}>
                      <path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z" />
                      <path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65" />
                      <path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65" />
                    </SvgIcon>
                    <span>All</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono leading-none tabular-nums ${
                        scopeFilter === 'All' ? 'bg-sky-500/20 text-sky-200' : 'bg-white/[0.05] text-zinc-400'
                      }`}
                    >
                      {scopeCounts.all}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeFilter('Starred')}
                    className={`inline-flex items-center gap-1.5 h-full px-2.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                      scopeFilter === 'Starred'
                        ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent font-medium'
                    }`}
                  >
                    <StarIcon className={scopeFilter === 'Starred' ? 'w-3.5 h-3.5 text-amber-300 fill-amber-300' : 'w-3.5 h-3.5 text-amber-400/80'} />
                    <span>Favorites</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono leading-none tabular-nums ${
                        scopeFilter === 'Starred' ? 'bg-amber-500/20 text-amber-200' : 'bg-white/[0.05] text-zinc-400'
                      }`}
                    >
                      {scopeCounts.starred}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScopeFilter('Pinned')}
                    className={`inline-flex items-center gap-1.5 h-full px-2.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                      scopeFilter === 'Pinned'
                        ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent font-medium'
                    }`}
                  >
                    <PinIcon className={scopeFilter === 'Pinned' ? 'w-3.5 h-3.5 text-sky-300' : 'w-3.5 h-3.5 text-sky-400/80'} />
                    <span>Pinned</span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono leading-none tabular-nums ${
                        scopeFilter === 'Pinned' ? 'bg-sky-500/20 text-sky-200' : 'bg-white/[0.05] text-zinc-400'
                      }`}
                    >
                      {scopeCounts.pinned}
                    </span>
                  </button>
                </div>

                <span className="hidden sm:block w-px h-5 bg-white/[0.08] mx-0.5" aria-hidden="true" />

                {/* Notebook Folders */}
                {availableNotebooks.map((nb) => {
                  const count = scopeCounts.byNotebook[nb] || 0;
                  const isActive = scopeFilter === nb;
                  return (
                    <button
                      key={nb}
                      type="button"
                      onClick={() => setScopeFilter(nb)}
                      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs border transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-sky-500/15 border-sky-400/45 text-white font-bold shadow-sm'
                          : 'bg-[#161821] border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2] font-medium'
                      }`}
                    >
                      <span>{nb}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono leading-none tabular-nums ${
                          isActive
                            ? 'bg-sky-400/20 text-sky-200'
                            : count > 0
                            ? 'bg-white/[0.06] text-zinc-300'
                            : 'bg-white/[0.03] text-zinc-500'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}

                <span className="hidden sm:block w-px h-5 bg-white/[0.08] mx-0.5" aria-hidden="true" />

                {/* Trash Filter */}
                <button
                  type="button"
                  onClick={() => setScopeFilter('Trash')}
                  className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs border transition-all cursor-pointer whitespace-nowrap ${
                    scopeFilter === 'Trash'
                      ? 'bg-rose-500/20 border-rose-400/45 text-rose-200 font-bold shadow-sm'
                      : 'bg-[#161821] border-white/[0.08] text-zinc-400 hover:text-rose-200 hover:border-rose-400/30 font-medium'
                  }`}
                >
                  <TrashIcon className={scopeFilter === 'Trash' ? 'w-3.5 h-3.5 text-rose-300' : 'w-3.5 h-3.5 text-zinc-500'} />
                  <span>Trash</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono leading-none tabular-nums ${
                      scopeFilter === 'Trash'
                        ? 'bg-rose-400/20 text-rose-200'
                        : scopeCounts.trash > 0
                        ? 'bg-rose-500/15 text-rose-300'
                        : 'bg-white/[0.04] text-zinc-500'
                    }`}
                  >
                    {scopeCounts.trash}
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end xl:self-auto">
                <div className="relative inline-flex items-center h-8 rounded-xl bg-[#09090c] border border-white/[0.09] hover:border-white/[0.2] transition-colors">
                  <SvgIcon className="w-3.5 h-3.5 text-zinc-400 ml-2.5 pointer-events-none shrink-0">
                    <path d="m3 16 4 4 4-4" />
                    <path d="M7 20V4" />
                    <path d="m21 8-4-4-4 4" />
                    <path d="M17 4v16" />
                  </SvgIcon>
                  <span className="text-[11px] font-mono text-zinc-400 pl-1.5 pointer-events-none select-none">
                    Sort:
                  </span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as NoteSortBy)}
                    aria-label="Sort notes"
                    className="appearance-none bg-transparent h-full pl-1 pr-6 text-xs font-semibold text-zinc-100 focus:outline-none cursor-pointer"
                  >
                    <option value="updated" className="bg-[#111218] text-zinc-100">Last Edited</option>
                    <option value="newest" className="bg-[#111218] text-zinc-100">Newest</option>
                    <option value="title" className="bg-[#111218] text-zinc-100">Title (A–Z)</option>
                    <option value="words" className="bg-[#111218] text-zinc-100">Longest</option>
                  </select>
                  <ChevronDownIcon className="w-3.5 h-3.5 text-zinc-400 absolute right-2 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>
        </header>
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
              {scopeFilter === 'Trash' ? 'Trash is empty.' : 'No notes found in this notebook view.'}
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
                        <div className="flex items-center gap-1.5 shrink-0">
                          {note.starred && <StarIcon className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />}
                          {note.pinned && <PinIcon className="w-3.5 h-3.5 text-sky-300" />}
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
            <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-3 rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col lg:h-[calc(100vh-8rem)] lg:min-h-[460px] lg:max-h-[820px]">
              <div className="p-3.5 pb-3 border-b border-white/[0.07] bg-[#111218] shrink-0 flex flex-col gap-2.5">
                <div className="relative flex items-center">
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search notes or tags..."
                    aria-label="Search notes"
                    className="w-full h-9 pl-3 pr-8 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/45"
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch('')}
                      aria-label="Clear note search"
                      className="absolute right-2 w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono text-zinc-400 hover:text-white hover:bg-white/[0.08] cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <div className="flex items-start gap-1.5">
                  <div
                    onWheel={(e) => {
                      if (!tagsExpanded && e.deltaY !== 0) {
                        e.currentTarget.scrollLeft += e.deltaY;
                      }
                    }}
                    style={
                      !tagsExpanded && allTags.length > 4
                        ? {
                            WebkitMaskImage:
                              'linear-gradient(to right, #000 0%, #000 calc(100% - 18px), transparent 100%)',
                            maskImage:
                              'linear-gradient(to right, #000 0%, #000 calc(100% - 18px), transparent 100%)',
                          }
                        : undefined
                    }
                    className={`flex-1 min-w-0 flex items-center gap-1.5 ${
                      tagsExpanded ? 'flex-wrap' : 'overflow-x-auto scrollbar-none py-0.5 pr-3'
                    }`}
                  >
                    {['All', ...allTags].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setTagFilter(tag)}
                        className={`shrink-0 px-2 py-0.5 rounded-md text-[11px] font-mono border cursor-pointer transition-colors ${
                          tagFilter === tag
                            ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 font-bold'
                            : 'bg-[#171820] border-white/[0.07] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {tag === 'All' ? 'All Tags' : `#${tag}`}
                      </button>
                    ))}
                  </div>
                  {allTags.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setTagsExpanded((prev) => !prev)}
                      title={tagsExpanded ? 'Collapse tags to single scrollable row' : `Show all ${allTags.length} tags`}
                      aria-label={tagsExpanded ? 'Collapse tags' : 'Expand all tags'}
                      className="shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-mono border border-white/[0.08] bg-[#161821] text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {tagsExpanded ? '▴' : `+${allTags.length}`}
                    </button>
                  )}
                </div>
              </div>

              <div
                ref={notesListScroll.ref}
                onScroll={notesListScroll.onScroll}
                className={`flex-1 min-h-[240px] max-h-[540px] lg:max-h-none overflow-y-auto overflow-x-hidden custom-scrollbar px-3.5 py-3 flex flex-col gap-2 ${notesListScroll.fadeClass}`}
              >
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
                        className={`w-full text-left p-3 rounded-xl border transition-colors cursor-pointer flex flex-col gap-1 shrink-0 ${
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
                          <div className="flex items-center gap-1 shrink-0">
                            {note.starred && <StarIcon className="w-3 h-3 text-amber-300 fill-amber-300" />}
                            {note.pinned && <PinIcon className="w-3 h-3 text-sky-300" />}
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

              <div className="px-3.5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
                <span>
                  {visibleNotes.length} {visibleNotes.length === 1 ? 'note' : 'notes'}
                  {scopeFilter !== 'All' ? ` · ${scopeFilter}` : ''}
                </span>
                {search || tagFilter !== 'All' || scopeFilter !== 'All' ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setTagFilter('All');
                      setScopeFilter('All');
                    }}
                    className="text-sky-400 hover:text-sky-300 cursor-pointer"
                  >
                    Reset filters
                  </button>
                ) : (
                  <span className="text-zinc-600">Scroll list ↕</span>
                )}
              </div>
            </aside>
          )}

          {/* Right Editor & Preview */}
          <section
            className={`${
              zenMode
                ? 'lg:col-span-12 min-h-[calc(100vh-8rem)]'
                : 'lg:col-span-8 xl:col-span-9 lg:sticky lg:top-3 lg:h-[calc(100vh-8rem)] lg:min-h-[460px] lg:max-h-[820px]'
            } rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col`}
          >
            {!activeNote ? (
              <div className="flex-1 py-20 px-6 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#161722] border border-white/[0.09] flex items-center justify-center text-sky-300">
                  <SvgIcon className="w-6 h-6">
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </SvgIcon>
                </div>
                <h2 className="text-base font-bold text-white">
                  {scopeFilter === 'Trash' ? 'Trash is empty' : 'No notes in this view'}
                </h2>
                <div className="flex items-center gap-2">
                  {scopeFilter !== 'All' && (
                    <button
                      type="button"
                      onClick={() => {
                        setScopeFilter('All');
                        setTagFilter('All');
                        setSearch('');
                      }}
                      className="h-9 px-3.5 rounded-xl bg-[#161821] border border-white/[0.1] hover:border-white/[0.22] text-xs font-semibold text-zinc-200 cursor-pointer"
                    >
                      Show All Notes
                    </button>
                  )}
                  {scopeFilter !== 'Trash' && (
                    <button
                      type="button"
                      onClick={() => createNewNote()}
                      className="inline-flex items-center gap-1.5 h-9 px-4 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 text-xs font-extrabold cursor-pointer"
                    >
                      <PlusIcon />
                      <span>Create New Note</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Zone A: Pinned Note Header & Compact Controls */}
                <div className="px-4 pt-3.5 pb-2.5 border-b border-white/[0.07] bg-[#111218] shrink-0 flex flex-col gap-2">
                  {activeNote.trashed && (
                    <div className="rounded-xl bg-rose-500/12 border border-rose-500/35 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-rose-200 font-semibold">This note is in Trash. Restore it to move back into active notebooks.</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => restoreNoteFromTrash(activeNote.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold cursor-pointer"
                        >
                          Restore Note
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteForever(activeNote.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-500/25 border border-rose-400/45 text-rose-100 font-bold cursor-pointer"
                        >
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Title + Mode / Actions */}
                  <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2 pb-2 border-b border-white/[0.07]">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => updateActiveNote({ starred: !activeNote.starred })}
                        aria-label={activeNote.starred ? 'Unfavorite note' : 'Favorite note'}
                        className={`p-1 rounded-lg cursor-pointer shrink-0 transition-colors ${
                          activeNote.starred ? 'text-amber-300' : 'text-zinc-600 hover:text-zinc-300'
                        }`}
                      >
                        <StarIcon className={activeNote.starred ? 'w-4 h-4 fill-amber-300' : 'w-4 h-4'} />
                      </button>
                      <input
                        type="text"
                        value={activeNote.title}
                        onChange={(e) => updateActiveNote({ title: e.target.value })}
                        aria-label="Note title"
                        className="flex-1 bg-transparent text-base sm:text-lg font-extrabold text-white focus:outline-none placeholder-zinc-600 min-w-0"
                        placeholder="Note Title..."
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <div className="relative inline-flex items-center h-7 rounded-lg bg-[#0a0b0f] border border-white/[0.08] hover:border-white/[0.18]">
                        <select
                          value={activeNote.notebook || 'Personal'}
                          onChange={(e) => updateActiveNote({ notebook: e.target.value })}
                          aria-label="Select notebook"
                          className="appearance-none bg-transparent h-full pl-2.5 pr-6 text-[11px] font-mono text-zinc-200 focus:outline-none cursor-pointer"
                        >
                          {availableNotebooks.map((nb) => (
                            <option key={nb} value={nb} className="bg-[#111218] text-zinc-100">
                              {nb}
                            </option>
                          ))}
                        </select>
                        <ChevronDownIcon className="w-3 h-3 text-zinc-400 absolute right-1.5 pointer-events-none" />
                      </div>

                      <div className="flex items-center gap-1 h-7 px-2 rounded-lg bg-[#0a0b0f] border border-white/[0.08]">
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

                      <div className="flex items-center h-7 p-0.5 rounded-lg bg-[#0a0b0f] border border-white/[0.08]">
                        {(['edit', 'split', 'preview'] as NoteEditorMode[]).map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setMode(m)}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-mono capitalize cursor-pointer ${
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
                        className={`inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-mono border cursor-pointer ${
                          zenMode
                            ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                            : 'bg-[#171820] border-white/[0.08] text-zinc-300 hover:text-white'
                        }`}
                      >
                        <SvgIcon className="w-3 h-3">
                          <path d="M8 3H5a2 2 0 0 0-2 2v3" />
                          <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                          <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                          <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                        </SvgIcon>
                        <span>{zenMode ? 'Exit Zen' : 'Zen'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => updateActiveNote({ pinned: !activeNote.pinned })}
                        className={`inline-flex items-center gap-1 h-7 px-2 rounded-lg text-[11px] font-mono border cursor-pointer ${
                          activeNote.pinned
                            ? 'bg-amber-500/15 border-amber-400/35 text-amber-200'
                            : 'bg-[#171820] border-white/[0.08] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <PinIcon className="w-3 h-3" />
                        <span>{activeNote.pinned ? 'Pinned' : 'Pin'}</span>
                      </button>

                      {!activeNote.trashed && (
                        <button
                          type="button"
                          onClick={() => moveNoteToTrash(activeNote.id)}
                          className="inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-[11px] font-mono text-rose-300 cursor-pointer"
                        >
                          <TrashIcon className="w-3 h-3" />
                          <span>Trash</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Action Utilities Row */}
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFindOpen((f) => !f)}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border cursor-pointer ${
                          findOpen ? 'bg-sky-500/20 border-sky-400/40 text-sky-200' : 'bg-[#171820] border-white/[0.08] text-zinc-300 hover:text-white'
                        }`}
                      >
                        <SvgIcon className="w-3 h-3">
                          <circle cx="11" cy="11" r="8" />
                          <path d="m21 21-4.3-4.3" />
                        </SvgIcon>
                        <span>Find/Replace</span>
                      </button>
                      <button
                        type="button"
                        onClick={startVoiceDictation}
                        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border cursor-pointer ${
                          listeningVoice
                            ? 'bg-rose-500/20 border-rose-400/45 text-rose-200 animate-pulse'
                            : 'bg-[#171820] border-white/[0.08] text-zinc-300 hover:text-white'
                        }`}
                      >
                        <SvgIcon className="w-3 h-3">
                          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" x2="12" y1="19" y2="22" />
                        </SvgIcon>
                        <span>{listeningVoice ? 'Listening...' : 'Dictate'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={saveSnapshot}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] hover:border-white/[0.2] text-zinc-300 hover:text-white cursor-pointer"
                      >
                        <SvgIcon className="w-3 h-3">
                          <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                          <polyline points="17 21 17 13 7 13 7 21" />
                          <polyline points="7 3 7 8 15 8" />
                        </SvgIcon>
                        <span>Snapshot</span>
                      </button>
                      {(activeNote.snapshots?.length || 0) > 0 && (
                        <button
                          type="button"
                          onClick={() => setSnapshotsOpen((s) => !s)}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-violet-500/15 border border-violet-400/35 text-violet-200 cursor-pointer"
                        >
                          <span>History ({activeNote.snapshots?.length})</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={duplicateActiveNote}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] text-zinc-300 hover:text-white cursor-pointer"
                      >
                        <span>Duplicate</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          void navigator.clipboard.writeText(`${activeNote.title}\n\n${activeNote.content}`);
                          showToast('Copied note ✓');
                        }}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] hover:border-white/[0.2] text-zinc-200 cursor-pointer"
                      >
                        <SvgIcon className="w-3 h-3">
                          <rect width="14" height="14" x="8" y="8" rx="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </SvgIcon>
                        <span>Copy</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => exportFile('md')}
                        title="Download note as Markdown (.md)"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] hover:border-sky-400/35 text-zinc-200 cursor-pointer"
                      >
                        <DownloadIcon className="w-3 h-3 text-sky-300" />
                        <span>.md</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => exportFile('txt')}
                        title="Download note as Plain Text (.txt)"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] hover:border-emerald-400/35 text-zinc-200 cursor-pointer"
                      >
                        <DownloadIcon className="w-3 h-3 text-emerald-300" />
                        <span>.txt</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => window.print()}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#171820] border border-white/[0.08] hover:border-white/[0.2] text-zinc-200 cursor-pointer"
                      >
                        <SvgIcon className="w-3 h-3">
                          <polyline points="6 9 6 2 18 2 18 9" />
                          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                          <rect width="12" height="8" x="6" y="14" />
                        </SvgIcon>
                        <span>Print</span>
                      </button>
                    </div>
                  </div>

                  {/* Find & Replace Drawer */}
                  {findOpen && (
                    <div className="rounded-xl bg-[#0b0c11] border border-sky-400/30 p-2.5 flex flex-wrap items-center gap-2 text-xs">
                      <input
                        type="text"
                        value={findQuery}
                        onChange={(e) => setFindQuery(e.target.value)}
                        placeholder="Find text..."
                        className="h-7 px-2.5 rounded-lg bg-[#07080b] border border-white/[0.1] text-white"
                      />
                      <input
                        type="text"
                        value={replaceQuery}
                        onChange={(e) => setReplaceQuery(e.target.value)}
                        placeholder="Replace with..."
                        className="h-7 px-2.5 rounded-lg bg-[#07080b] border border-white/[0.1] text-white"
                      />
                      <span className="font-mono text-zinc-400">{findMatchCount} matches</span>
                      <button
                        type="button"
                        disabled={findMatchCount === 0}
                        onClick={handleReplaceAll}
                        className="h-7 px-2.5 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-200 font-bold disabled:opacity-40 cursor-pointer"
                      >
                        Replace All
                      </button>
                    </div>
                  )}

                  {/* Snapshots History Panel */}
                  {snapshotsOpen && (activeNote.snapshots?.length || 0) > 0 && (
                    <div className="rounded-xl bg-[#0b0c11] border border-violet-400/30 p-2.5 flex flex-col gap-1.5 text-xs max-h-36 overflow-y-auto custom-scrollbar overscroll-contain">
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

                  {/* Tags & Inline Checklist Row */}
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

                    {noteAnalytics.checks.total > 0 && (
                      <div className="flex flex-wrap items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0c0e14] border border-emerald-500/25 text-[11px] font-mono">
                        <span className="text-emerald-300 font-bold">
                          Checklist {noteAnalytics.checks.done}/{noteAnalytics.checks.total}
                        </span>
                        <div className="w-16 h-1.5 rounded-full bg-black/60 overflow-hidden">
                          <div
                            className="h-full bg-emerald-400"
                            style={{ width: `${Math.round((noteAnalytics.checks.done / noteAnalytics.checks.total) * 100)}%` }}
                          />
                        </div>
                        {noteAnalytics.checks.uncheckedLines.length > 0 && (
                          <button
                            type="button"
                            onClick={sendChecklistToTasks}
                            className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-400/35 text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
                          >
                            ➜ Send {noteAnalytics.checks.uncheckedLines.length} to Tasks
                          </button>
                        )}
                        {noteAnalytics.checks.done > 0 && (
                          <button
                            type="button"
                            onClick={clearCheckedItems}
                            className="px-2 py-0.5 rounded bg-[#171820] border border-white/[0.1] text-zinc-300 hover:text-white cursor-pointer"
                          >
                            Clear Checked
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Zone B: Slim Formatting + Outline Strip & Full-Height Flex Editor / Preview */}
                {(mode !== 'preview' || (noteAnalytics.outline.length > 1 && mode !== 'edit')) && (
                  <div className="px-4 py-1.5 border-b border-white/[0.06] bg-[#0e0f15] shrink-0 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                    {mode !== 'preview' ? (
                      <div className="flex flex-wrap items-center gap-1">
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
                            className="px-1.5 py-0.5 rounded bg-[#181922] border border-white/[0.08] hover:border-white/[0.22] text-zinc-300 hover:text-white cursor-pointer"
                          >
                            {tool.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span className="text-zinc-500">Markdown Preview</span>
                    )}

                    {noteAnalytics.outline.length > 1 && mode !== 'edit' && (
                      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-full text-zinc-400">
                        <span className="shrink-0">Outline:</span>
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
                            className="shrink-0 px-2 py-0.5 rounded bg-white/[0.04] hover:bg-sky-500/15 border border-white/[0.07] text-zinc-300 hover:text-sky-200 cursor-pointer"
                          >
                            {h.text}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Editor & Enhanced Preview Grid */}
                <div
                  className={`flex-1 min-h-0 p-3.5 grid gap-3 ${
                    mode === 'split' ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
                  }`}
                >
                  {mode !== 'preview' && (
                    <textarea
                      ref={editorRef}
                      value={activeNote.content}
                      onChange={(e) => updateActiveNote({ content: e.target.value })}
                      aria-label="Note markdown editor"
                      rows={zenMode ? 22 : 12}
                      className={`w-full h-full ${
                        zenMode ? 'min-h-[420px]' : 'min-h-[240px] lg:min-h-0'
                      } p-3.5 rounded-xl bg-[#08090c] border border-white/[0.08] focus:border-sky-400/45 focus:outline-none text-zinc-100 leading-relaxed resize-none custom-scrollbar ${
                        editorFont === 'mono' ? 'font-mono' : 'font-sans'
                      } ${fontSize === 'sm' ? 'text-xs' : fontSize === 'lg' ? 'text-base' : 'text-sm'}`}
                      placeholder="Write notes cleanly in Markdown..."
                    />
                  )}

                  {mode !== 'edit' && (
                    <div
                      className={`w-full h-full ${
                        zenMode ? 'min-h-[420px]' : 'min-h-[240px] lg:min-h-0'
                      } p-3.5 sm:p-4 rounded-xl bg-[#0c0d13] border border-white/[0.08] overflow-y-auto overflow-x-hidden custom-scrollbar`}
                    >
                      <NoteMarkdownPreview
                        content={activeNote.content}
                        fontSize={fontSize}
                        onToggleCheckbox={toggleMarkdownCheckbox}
                        containerRef={previewContainerRef}
                      />
                    </div>
                  )}
                </div>

                {/* Zone C: Pinned Bottom Analytics & Typography Footer */}
                <div className="px-4 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono text-zinc-500 shrink-0">
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
