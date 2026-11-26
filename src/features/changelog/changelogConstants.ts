export type ChangelogSurface =
  | 'all'
  | 'desktop'
  | 'everyday'
  | 'project'
  | 'package'
  | 'documentation'
  | 'computer';

export type ChangelogSurfaceTag = Exclude<ChangelogSurface, 'all'>;

export function normalizeChangelogSurface(raw: string): ChangelogSurfaceTag {
  switch (raw) {
    case 'productivity':
    case 'everyday':
      return 'everyday';
    case 'apps':
    case 'project':
      return 'project';
    case 'sdk':
    case 'package':
      return 'package';
    case 'architecture':
    case 'documentation':
      return 'documentation';
    case 'computer':
      return 'computer';
    default:
      return 'desktop';
  }
}

export interface ChangelogDetailItem {
  title: string;
  description: string;
  route?: string;
}

export interface ChangelogRelease {
  id: string;
  version: string;
  dateLabel: string;
  headline: string;
  summary: string;
  surfaces: Array<Exclude<ChangelogSurface, 'all'>>;
  isLatest?: boolean;
  isAnnouncement?: boolean;
  announcementBadge?: string;
  ctaLabel?: string;
  ctaRoute?: string;
  commitRef?: string;
  features?: ChangelogDetailItem[];
  improvements?: ChangelogDetailItem[];
  fixes?: ChangelogDetailItem[];
  isCustom?: boolean;
}

export interface ChangelogPersistedState {
  customReleases?: ChangelogRelease[];
  starredIds?: string[];
  // Legacy catalog fields preserved harmlessly for backward SQLite compatibility
  itemNotes?: Record<string, string>;
  inquiries?: unknown[];
}

export const DEFAULT_CHANGELOG_PERSISTED_STATE: ChangelogPersistedState = {
  customReleases: [],
  starredIds: [],
};

export const CHANGELOG_SURFACE_TABS: Array<{
  id: ChangelogSurface;
  label: string;
}> = [
  { id: 'all', label: 'All Surfaces' },
  { id: 'desktop', label: 'Desktop & UI' },
  { id: 'everyday', label: 'Everyday Utilities' },
  { id: 'project', label: 'Project' },
  { id: 'package', label: 'Package' },
  { id: 'documentation', label: 'Documentation' },
  { id: 'computer', label: 'Computer & Performance' },
];

export const BUILTIN_CHANGELOG_RELEASES: ChangelogRelease[] = [
  {
    id: 'rel-v0-0-1-changelog',
    version: 'v0.0.1',
    dateLabel: 'November 25, 2026',
    headline: 'Minimalist Changelog Hub, Notes Studio v2 & Custom Release Logging',
    summary:
      'Redesigned the ecosystem directory into an editorial Changelog timeline featuring surface filter tabs, collapsible Features/Improvements/Fixes drawers, a sticky On This Page version rail, and SQLite-backed custom release logging alongside Notes Studio v2.',
    surfaces: ['desktop', 'everyday', 'project'],
    isLatest: true,
    commitRef: 'v0.0.1',
    ctaLabel: 'Open Everyday Utilities',
    ctaRoute: 'everyday/notes',
    features: [
      {
        title: 'Antigravity-style Changelog timeline',
        description:
          'Single-column chronological release view with surface filter tabs, Expand All toggle, sticky version index rail, and Markdown CHANGELOG export.',
        route: 'changelog',
      },
      {
        title: 'Custom Release Composer',
        description:
          'Record custom workspace changelogs, internal milestones, features, improvements, and bug fixes synced directly to SQLite WAL.',
      },
      {
        title: 'Notes & Journal v2 upgrades',
        description:
          'Added Sticky Cards layout, safe inline/table/code Markdown preview, interactive checklists, Find & Replace, Snapshots, Trash recovery, Voice Dictation, and Zen Mode.',
        route: 'notes',
      },
      {
        title: 'Tasks & Daily Planner',
        description:
          'Full task workspace with List and Kanban Board views, Star focus, daily/weekly repeat schedules, time estimates, subtasks, and Markdown checklist export.',
        route: 'tasks',
      },
    ],
    improvements: [
      {
        title: 'Unified telemetry store',
        description:
          'Replaced repeated root polling with a shared external telemetry subscriber so Header and Status Bar stay synchronized with zero root re-renders.',
      },
      {
        title: 'Expanded SQLite WAL workspace API',
        description:
          'Extended /api/workspace-tools/state endpoints to persist notes, tasks, habits, goals, expenses, focus sessions, and changelog logs across restarts.',
      },
      {
        title: 'Navigation clarity across shell',
        description:
          'Updated top Header, Sidebar, Developer Hub, Shortcuts dialog, and Status Bar links to route cleanly to #changelog while preserving legacy #catalog aliases.',
      },
    ],
    fixes: [
      {
        title: 'Lazy changelog route rendering',
        description:
          'Wired lazy Chunk preloading and active route mounting in the main shell so navigating to Changelog renders cleanly every time.',
      },
      {
        title: 'Debounced write flush on route switch',
        description:
          'Added keepalive flush-on-unmount in the synced workspace store so rapid tab switches never lose unsaved edits.',
      },
    ],
  },
  {
    id: 'rel-v0-0-1-rc5',
    version: 'v0.0.1-rc5',
    dateLabel: 'November 25, 2026',
    headline: 'Everyday Utilities: Unified Workspace for Tasks, Notes, Focus & Budget',
    summary:
      'Consolidated daily workflow tools into the unified Everyday Utilities page integrated inside the portal and Electron desktop app, backed by localStorage cache and FastAPI SQLite WAL persistence.',
    surfaces: ['everyday'],
    ctaLabel: 'Open Everyday Utilities',
    ctaRoute: 'everyday',
    features: [
      {
        title: 'Focus Pomodoro & calm breathing',
        description:
          'Customizable focus/short-break/long-break timer paired with guided box breathing intervals and session history.',
        route: 'focus',
      },
      {
        title: 'Daily habits & personal goals',
        description:
          'Track recurring daily habits with streak counters, consistency progress bars, and milestone goal targets.',
        route: 'habits',
      },
      {
        title: 'Expenses, budget & world converters',
        description:
          'Track income vs categorized expenses alongside a live multi-timezone world clock, password generator, and unit converters.',
        route: 'budget',
      },
    ],
    improvements: [
      {
        title: 'One-click task handoff from Notes',
        description:
          'Send unchecked Markdown checklist items directly into Tasks & Daily Planner without manual copy-paste.',
      },
      {
        title: 'Responsive mobile & desktop tabs',
        description:
          'Unified hash routing across #tasks, #notes, #tools, #focus, #habits, #budget, and #utilities with keyboard shortcuts Ctrl+7/8/9.',
      },
    ],
    fixes: [
      {
        title: 'Task filter auto-reset on quick add',
        description:
          'Automatically clears conflicting priority or status filters when adding a new task so newly created items appear immediately.',
      },
    ],
  },
  {
    id: 'rel-v0-0-1-rc4',
    version: 'v0.0.1-rc4',
    dateLabel: 'November 25, 2026',
    headline: 'Always-Visible Status Bar Clock, Calendar Popover & Smooth Scroll',
    summary:
      'Added a persistent bottom utility status bar with real-time seconds clock, interactive calendar popover, UTC comparison, and battery/network vitals, alongside a full UI responsiveness and scroll performance pass.',
    surfaces: ['desktop', 'computer'],
    ctaLabel: 'Inspect Computer Vitals',
    ctaRoute: 'computer',
    features: [
      {
        title: 'Persistent bottom status bar',
        description:
          'Shows live connectivity dot, app version v0.0.1, quick workspace jumps, system posture badge, Wi-Fi throughput, battery status, and live digital clock.',
      },
      {
        title: 'Interactive calendar & timezone popover',
        description:
          'Click the clock anytime for a full monthly calendar grid, UTC live comparison, 12h/24h toggle, and instant ISO timestamp copy.',
      },
    ],
    improvements: [
      {
        title: 'GPU-composited monochrome tech doodle wallpaper',
        description:
          'Rendered a bespoke 600x600 engineering/space/cyber tile onto an isolated fixed GPU layer, replacing expensive fixed background attachment repaints.',
      },
      {
        title: 'Removed scroll-time blur & infinite CSS sweeps',
        description:
          'Eliminated heavy nested backdrop-blur filters on header/cards and continuous keyframes so wheel and trackpad scrolling stay crisp.',
      },
      {
        title: 'Compact centered route loading fallback',
        description:
          'Redesigned lazy route loading screens to stay vertically centered without empty hero spacer pushdown or developer port noise.',
      },
    ],
    fixes: [
      {
        title: 'Status bar popover viewport clipping',
        description:
          'Rendered the clock calendar popover outside the status footer stacking context so Windows taskbar never clips its bottom edge.',
      },
      {
        title: 'Lazy loading artwork framing',
        description:
          'Applied smooth radial alpha feathering on loading artwork backdrops to eliminate hard rectangular seams.',
      },
    ],
  },
  {
    id: 'rel-v0-0-1-announcement',
    version: 'v0.0.1-win',
    dateLabel: 'November 25, 2026',
    headline: 'Soul DevPortal v0.0.1 Standalone Windows App',
    summary:
      'Electron 45.5.0 Windows desktop packaging is live with isolated client ports (5281+), dedicated backend ports (18008+), automatic FastAPI startup with crash recovery logs, frameless splash launch, and automated GitHub Releases.',
    surfaces: ['desktop', 'documentation'],
    isAnnouncement: true,
    announcementBadge: 'Release Announcement',
    ctaLabel: 'Open Developer Hub & Port Map',
    ctaRoute: 'portal',
  },
  {
    id: 'rel-fac070b',
    version: 'v0.0.1-dev2',
    dateLabel: 'November 25, 2026',
    headline: 'Developer Hub, Visual Artwork Gallery & API Explorer Upgrades',
    summary:
      'Introduced bespoke dark visual artwork across Pillars, the #portal GitHub & live endpoints dashboard, interactive OpenAPI route filtering, and responsive top bar ergonomics.',
    surfaces: ['project', 'desktop'],
    commitRef: 'fac070b · 1662b21',
    ctaLabel: 'Open Developer Hub',
    ctaRoute: 'portal',
    improvements: [
      {
        title: 'Pillar & module hero visuals',
        description:
          'Generated dark schematic backdrops for Projects, Packages, Docs, Scripts, Computer Monitor, SQLite WAL, Environment Vault, and Code Playground.',
      },
      {
        title: 'Top header horizontal overflow guard',
        description:
          'Refined header flex wrapping and compact button widths so help and search controls always fit inside desktop and split window viewports.',
      },
    ],
    fixes: [
      {
        title: 'Shortcuts dialog vertical scrolling',
        description:
          'Added constrained inner scroll container on the shortcuts & desktop modal so small viewports can reach every action button.',
      },
      {
        title: 'Zero broken visual assets check',
        description:
          'Added automated image naturalWidth verification inside Electron smoke runs across Overview and feature modules.',
      },
    ],
  },
  {
    id: 'rel-bae1016',
    version: 'v0.0.1-dev1',
    dateLabel: 'November 25, 2026',
    headline: 'Computer & Performance Monitor with Live SSE Hardware Telemetry',
    summary:
      'Added real-time OS, CPU per-core load, memory allocation, GPU thermals, disk throughput, network Wi-Fi signal, startup services, and process inspection powered by Python psutil and Server-Sent Events.',
    surfaces: ['computer', 'desktop'],
    commitRef: 'bae1016 · b3ef477',
    ctaLabel: 'Open Computer Monitor',
    ctaRoute: 'computer',
    features: [
      {
        title: 'Live SSE telemetry stream',
        description:
          'Streams real-time CPU, RAM, GPU, Disk I/O, and network send/receive metrics to the client with minimal polling overhead.',
      },
      {
        title: 'Hardware specs & peripheral discovery',
        description:
          'Inspects logical processors, cache sizes, displays, audio endpoints, storage drives, and OS uptime details.',
      },
      {
        title: 'Process & startup services inspector',
        description:
          'Sortable live process table and Windows startup task viewer with environment variable vault inspection.',
      },
    ],
    improvements: [
      {
        title: 'Lazy chunk route code-splitting',
        description:
          'Split heavy hardware, project, package, and documentation views into independent Vite bundles for faster cold startup.',
      },
    ],
  },
  {
    id: 'rel-03b9ed0',
    version: 'v0.0.0-docs',
    dateLabel: 'November 24, 2026',
    headline: 'Master Technical Blueprint, Golden Rules & Port Architecture Specs',
    summary:
      'Published comprehensive workspace architecture documentation with interactive block rendering, floating table-of-contents navigation, duplicate rule cleanup, and operational runbooks.',
    surfaces: ['documentation'],
    commitRef: '03b9ed0 · 62135a1 · d2d9dc2',
    ctaLabel: 'Read Documentation Hub',
    ctaRoute: 'docs',
    improvements: [
      {
        title: 'Master technical architecture guide',
        description:
          'Documented three-pillar standards, SQLite WAL isolation guidelines, AST extraction flows, and monorepo directory conventions.',
      },
      {
        title: 'Port topology runbooks',
        description:
          'Codified strict :5173–:5182 frontend and :8000–:8009 backend assignments alongside desktop isolated range guarantees.',
      },
    ],
    fixes: [
      {
        title: 'Markdown horizontal divider deduplication',
        description:
          'Collapsed consecutive thematic hr breaks before headings across rendered technical guides.',
        route: 'docs',
      },
    ],
  },
  {
    id: 'rel-318b779',
    version: 'v0.0.0-apps',
    dateLabel: 'November 24, 2026',
    headline: 'Unified 9-App Micro-Workspace Fleet on Isolated SQLite WAL Datastores',
    summary:
      'Standardized nine full-stack React + FastAPI applications under Soul-DevPortal-Projects with live socket probing, OpenAPI endpoint discovery, and per-project SQLite WAL isolation.',
    surfaces: ['project', 'documentation'],
    commitRef: '318b779 · 292bd1e',
    ctaLabel: 'Browse Projects Hub',
    ctaRoute: 'projects',
    features: [
      {
        title: 'AI Creative & News Studios',
        description:
          'Integrated ApexMind AI Studio, Sonikoma Voice & Vision Dubbing, GlobalPulse AI News Synthesizer, and PostCraft AI.',
        route: 'projects',
      },
      {
        title: 'Systems, 3D WebGL & ERP Apps',
        description:
          'Connected Home Management OS, Spatial Dimensions 3D, Outpass System, Free API Hub, and College Management ERP.',
        route: 'projects',
      },
    ],
    improvements: [
      {
        title: 'Live socket port probing',
        description:
          'Monitors all 9 application frontends and FastAPI backends with zero port overlap and one-click Swagger links.',
      },
    ],
  },
  {
    id: 'rel-332d931',
    version: 'v0.0.0-theme',
    dateLabel: 'November 24, 2026',
    headline: 'Obsidian Dark Design System & Sidebar Hierarchy Refinement',
    summary:
      'Unified visual contrast across cards, active tab pills, typography rhythm, and sidebar navigation trees with clear visual hierarchy between primary pillars and nested inspectors.',
    surfaces: ['desktop'],
    commitRef: '332d931 · f506229 · 98cc165',
    improvements: [
      {
        title: 'Consistent dark surface hierarchy',
        description:
          'Adopted #070708 obsidian backdrop, #111115 elevated containers, and hairline white/[0.08] boundaries across every view.',
      },
      {
        title: 'Main Page vs Sub Page sidebar clarity',
        description:
          'Distinguished top-level navigation anchors from deep project/package/doc tree sub-items for faster keyboard and pointer scanning.',
      },
    ],
  },
  {
    id: 'rel-f450477',
    version: 'v0.0.0-sdk',
    dateLabel: 'November 24, 2026',
    headline: 'Shared Dual-Runtime SDKs: @workspace/config, logger & runner',
    summary:
      'Established shared TypeScript and Python packages powering unified color tokens, structured terminal/devtools logging, AST export indexing, and socket port collision guards.',
    surfaces: ['package'],
    commitRef: 'f450477 · 7c8aa18',
    ctaLabel: 'Inspect Shared Packages',
    ctaRoute: 'packages',
    features: [
      {
        title: '@workspace/config dual tokens',
        description:
          'Shared design palette, spacing scale, and semantic token exports consumed by React clients and Tailwind v4 configurations.',
        route: 'packages/config',
      },
      {
        title: '@workspace/logger structured telemetry',
        description:
          'Five-column aligned runtime console logger with Python & TypeScript parity plus global error hooks.',
        route: 'packages/logger',
      },
      {
        title: '@workspace/runner orchestration',
        description:
          'Automated monorepo script runner with socket-in-use port checks and parallel multi-app orchestration.',
        route: 'packages/runner',
      },
    ],
  },
];

export function buildChangelogMarkdown(releases: ChangelogRelease[]): string {
  const lines: string[] = [
    '# Soul DevPortal Changelog',
    '',
    'Track new features, improvements, and fixes across Soul Workspace surfaces.',
    '',
  ];

  for (const rel of releases) {
    lines.push(`## ${rel.version} — ${rel.headline} (${rel.dateLabel})`);
    lines.push('');
    lines.push(rel.summary);
    lines.push('');
    if (rel.features && rel.features.length > 0) {
      lines.push('### Features');
      for (const item of rel.features) {
        lines.push(`- **${item.title}**: ${item.description}`);
      }
      lines.push('');
    }
    if (rel.improvements && rel.improvements.length > 0) {
      lines.push('### Improvements');
      for (const item of rel.improvements) {
        lines.push(`- **${item.title}**: ${item.description}`);
      }
      lines.push('');
    }
    if (rel.fixes && rel.fixes.length > 0) {
      lines.push('### Fixes');
      for (const item of rel.fixes) {
        lines.push(`- **${item.title}**: ${item.description}`);
      }
      lines.push('');
    }
  }

  return lines.join('\n');
}
