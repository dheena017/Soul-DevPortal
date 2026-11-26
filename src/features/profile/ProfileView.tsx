import React, { useEffect, useMemo, useState } from 'react';
import { consoleLogger } from '@workspace/logger';
import { PackageData, ProjectData, StatsData } from '../../types';
import { useSharedTelemetry } from '../../services/telemetryStore';
import { HeroArtworkBackdrop, MiniRadialRing } from '../../components/PortalVisuals';
import CopyButton from '../../components/CopyButton';
import { DOCUMENTATION_GUIDES_REGISTRY } from '../docs/docsConstants';
import { PROJECT_BRAND_MAP } from '../projects/projectsConstants';
import {
  ACCENT_COLOR_PRESETS,
  AVAILABILITY_OPTIONS,
  AVATAR_EMOJI_PRESETS,
  AvailabilityStatus,
  DEFAULT_DEVELOPER_PROFILE,
  DeveloperProfileData,
  getInitials,
  loadDeveloperProfile,
  saveDeveloperProfile,
} from './profileStore';

export interface ProfileViewProps {
  projects?: ProjectData[];
  packages?: PackageData[];
  stats?: StatsData;
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
}

const LANDING_VIEW_OPTIONS = [
  { id: 'overview', label: 'Workspace Overview' },
  { id: 'projects', label: 'Projects & Applications' },
  { id: 'packages', label: 'Shared Packages' },
  { id: 'docs', label: 'Documentation Hub' },
  { id: 'computer', label: 'Computer & Performance' },
  { id: 'everyday', label: 'Everyday Utilities' },
  { id: 'profile', label: 'Developer Profile' },
];

export default function ProfileView({
  projects = [],
  packages = [],
  stats,
  onNavigate,
  onBack,
}: ProfileViewProps) {
  const [profile, setProfile] = useState<DeveloperProfileData>(() => loadDeveloperProfile());
  const [draft, setDraft] = useState<DeveloperProfileData>(() => loadDeveloperProfile());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [newSkill, setNewSkill] = useState<string>('');
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'paths' | 'workspace' | 'preferences'>('overview');
  const [pathFilter, setPathFilter] = useState<string>('');

  const { isBackendLive, backendPort, liveTelemetry } = useSharedTelemetry(true);

  useEffect(() => {
    const sync = () => {
      const latest = loadDeveloperProfile();
      setProfile(latest);
      if (!isEditing) {
        setDraft(latest);
      }
    };
    window.addEventListener('soul-profile-updated', sync);
    return () => window.removeEventListener('soul-profile-updated', sync);
  }, [isEditing]);

  const showToast = (msg: string) => {
    setSaveNotice(msg);
    window.setTimeout(() => {
      setSaveNotice((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleaned: DeveloperProfileData = {
      ...draft,
      displayName: draft.displayName.trim() || DEFAULT_DEVELOPER_PROFILE.displayName,
      handle: draft.handle.trim() || DEFAULT_DEVELOPER_PROFILE.handle,
      role: draft.role.trim() || DEFAULT_DEVELOPER_PROFILE.role,
      skills: draft.skills.map((s) => s.trim()).filter(Boolean),
    };
    setProfile(cleaned);
    setDraft(cleaned);
    saveDeveloperProfile(cleaned);
    setIsEditing(false);
    consoleLogger.success('PROFILE', 'Saved developer profile preferences', {
      displayName: cleaned.displayName,
      status: cleaned.status,
    });
    showToast('Profile saved to local workspace storage');
  };

  const handleCancelEdit = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  const handleQuickStatusChange = (status: AvailabilityStatus) => {
    const next = { ...profile, status };
    setProfile(next);
    setDraft(next);
    saveDeveloperProfile(next);
    consoleLogger.action('PROFILE', `Updated availability status to ${status}`);
    showToast(`Status updated to ${AVAILABILITY_OPTIONS.find((o) => o.id === status)?.label || status}`);
  };

  const handlePreferenceChange = <K extends keyof DeveloperProfileData>(
    key: K,
    value: DeveloperProfileData[K]
  ) => {
    const next = { ...profile, [key]: value };
    setProfile(next);
    setDraft(next);
    saveDeveloperProfile(next);
    showToast('Workspace preference updated');
  };

  const handleAddSkill = () => {
    const trimmed = newSkill.trim();
    if (!trimmed) return;
    if (draft.skills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setNewSkill('');
      return;
    }
    setDraft((prev) => ({ ...prev, skills: [...prev.skills, trimmed] }));
    setNewSkill('');
  };

  const handleRemoveSkill = (skill: string) => {
    setDraft((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill),
    }));
  };

  const handleResetDefaults = () => {
    setProfile(DEFAULT_DEVELOPER_PROFILE);
    setDraft(DEFAULT_DEVELOPER_PROFILE);
    saveDeveloperProfile(DEFAULT_DEVELOPER_PROFILE);
    setIsEditing(false);
    showToast('Profile reset to defaults');
  };

  const handleExportJson = () => {
    try {
      const blob = new Blob([JSON.stringify(profile, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soul-devportal-profile-${profile.handle.replace(/^@/, '') || 'dev'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported profile JSON');
    } catch {
      showToast('Unable to export JSON');
    }
  };

  const activeStatusMeta = useMemo(
    () => AVAILABILITY_OPTIONS.find((o) => o.id === profile.status) || AVAILABILITY_OPTIONS[0],
    [profile.status]
  );

  const liveStats = useMemo(() => {
    let liveFe = 0;
    let liveBe = 0;
    for (const p of projects) {
      if (p.frontend?.isLive ?? p.frontendActive) liveFe += 1;
      if (p.backend?.isLive ?? p.backendActive) liveBe += 1;
    }
    return {
      totalProjects: projects.length,
      totalPackages: packages.length,
      liveFe,
      liveBe,
      totalLive: liveFe + liveBe,
      totalFiles: stats?.totalFiles ?? 0,
      totalLines: stats?.totalLines ?? 0,
      totalSymbols: stats?.totalSymbols ?? 0,
    };
  }, [projects, packages, stats]);

  const cpuPct = liveTelemetry ? Math.round(liveTelemetry.cpu.totalPercent) : 0;
  const ramPct = liveTelemetry ? Math.round(liveTelemetry.memory.percent) : 0;
  const hostName = 'Local Workstation';
  const osName = typeof navigator !== 'undefined' ? navigator.platform : 'Windows';

  const workspaceRoot = (profile.workspaceRootPath || DEFAULT_DEVELOPER_PROFILE.workspaceRootPath).replace(/[\\/]+$/, '');
  const joinPath = (...parts: string[]) => `${workspaceRoot}\\${parts.map((p) => p.replace(/^[\\/]+|[\\/]+$/g, '').replace(/\//g, '\\')).filter(Boolean).join('\\')}`;
  const pathNeedle = pathFilter.trim().toLowerCase();

  const mainDirectoryPaths = useMemo(
    () => [
      { label: 'Workspace Root', path: workspaceRoot },
      { label: 'Projects Root', path: joinPath('Soul-DevPortal-Projects') },
      { label: 'Packages Root', path: joinPath('Soul-DevPortal-Packages') },
      { label: 'Docs Root', path: joinPath('Soul-DevPortal-Docs') },
    ],
    [workspaceRoot]
  );

  const filteredProjectsPaths = useMemo(
    () =>
      projects.filter((p) =>
        !pathNeedle ||
        p.id.toLowerCase().includes(pathNeedle) ||
        p.title.toLowerCase().includes(pathNeedle)
      ),
    [projects, pathNeedle]
  );

  const filteredPackagesPaths = useMemo(
    () =>
      packages.filter((pkg) =>
        !pathNeedle ||
        pkg.id.toLowerCase().includes(pathNeedle) ||
        pkg.name.toLowerCase().includes(pathNeedle)
      ),
    [packages, pathNeedle]
  );

  const filteredDocsPaths = useMemo(
    () =>
      DOCUMENTATION_GUIDES_REGISTRY.filter((g) =>
        !pathNeedle ||
        g.id.toLowerCase().includes(pathNeedle) ||
        g.title.toLowerCase().includes(pathNeedle) ||
        g.folder.toLowerCase().includes(pathNeedle)
      ),
    [pathNeedle]
  );

  return (
    <div className="flex flex-col gap-5 pb-8">
      {/* ── Top Back / Toast Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="neu-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white hover:border-white/[0.2] transition-all cursor-pointer"
            >
              <span>←</span>
              <span>Overview</span>
            </button>
          )}
          <span className="text-[11px] font-mono text-zinc-500 uppercase tracking-wider">
            Developer Identity &amp; Workspace Preferences
          </span>
        </div>

        <div className="flex items-center gap-2">
          {saveNotice && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 text-xs font-medium">
              ✓ {saveNotice}
            </span>
          )}
          <button
            type="button"
            onClick={() => (isEditing ? handleCancelEdit() : setIsEditing(true))}
            className={`neu-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isEditing
                ? 'bg-zinc-800 border-white/20 text-zinc-200 hover:text-white'
                : 'bg-sky-500/15 border-sky-400/35 text-sky-200 hover:bg-sky-500/25 hover:text-white'
            }`}
          >
            <span>{isEditing ? 'Cancel Edit' : '✎ Edit Profile'}</span>
          </button>
        </div>
      </div>

      {/* ── Hero Profile Banner ── */}
      <section className="relative rounded-2xl neu-card bg-[#111115] border border-white/[0.08] overflow-hidden p-5 sm:p-6">
        <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="Developer profile backdrop" opacityClass="opacity-15" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 min-w-0">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-extrabold text-white border border-white/15 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${profile.accentColor}33, #16161c 75%)`,
                  boxShadow: `0 0 28px ${profile.accentColor}26`,
                }}
              >
                <span aria-hidden="true">{profile.avatarEmoji || getInitials(profile.displayName)}</span>
              </div>
              <span
                title={activeStatusMeta.label}
                className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#111115] ${activeStatusMeta.dotClass}`}
              />
            </div>

            {/* Identity */}
            <div className="flex flex-col gap-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight truncate">
                  {profile.displayName}
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.1] text-xs font-mono text-zinc-300">
                  {profile.handle}
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${activeStatusMeta.pillClass}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${activeStatusMeta.dotClass}`} />
                  {activeStatusMeta.label}
                </span>
              </div>

              <p className="text-sm font-medium text-sky-300/90">{profile.role}</p>
              <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
                {profile.bio}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] font-mono text-zinc-400">
                {profile.location && <span>📍 {profile.location}</span>}
                {profile.timezone && <span>🕒 {profile.timezone}</span>}
                {profile.email && <span>✉ {profile.email}</span>}
                {profile.githubUrl && (
                  <a
                    href={profile.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-300 hover:text-sky-200 underline underline-offset-2"
                  >
                    GitHub ↗
                  </a>
                )}
                {profile.websiteUrl && (
                  <a
                    href={profile.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
                  >
                    Website ↗
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Status Switcher */}
          <div className="flex flex-col gap-2 shrink-0">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
              Availability Status
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[#09090c] border border-white/[0.08]">
              {AVAILABILITY_OPTIONS.map((opt) => {
                const selected = profile.status === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleQuickStatusChange(opt.id)}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                      selected
                        ? `${opt.pillClass} font-bold`
                        : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${opt.dotClass}`} />
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Edit Profile Form (when active) ── */}
      {isEditing && (
        <form
          onSubmit={handleSave}
          className="rounded-2xl neu-card bg-[#111115] border border-sky-400/30 p-5 sm:p-6 flex flex-col gap-5"
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] pb-3">
            <div>
              <h2 className="text-base font-bold text-white">Edit Developer Profile</h2>
              <p className="text-xs text-zinc-400">
                All changes are persisted locally in your browser/desktop storage.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-xl bg-[#16161c] border border-white/[0.1] text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-bold cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-zinc-300">Display Name</span>
              <input
                type="text"
                value={draft.displayName}
                onChange={(e) => setDraft({ ...draft, displayName: e.target.value })}
                className="h-9 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-zinc-100 focus:outline-none focus:border-sky-400/50"
                placeholder="Your name"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-zinc-300">Handle</span>
              <input
                type="text"
                value={draft.handle}
                onChange={(e) => setDraft({ ...draft, handle: e.target.value })}
                className="h-9 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-zinc-100 font-mono focus:outline-none focus:border-sky-400/50"
                placeholder="@username"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-zinc-300">Role / Title</span>
              <input
                type="text"
                value={draft.role}
                onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                className="h-9 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-zinc-100 focus:outline-none focus:border-sky-400/50"
                placeholder="Full-Stack Developer"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-zinc-300">Location</span>
              <input
                type="text"
                value={draft.location}
                onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                className="h-9 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-zinc-100 focus:outline-none focus:border-sky-400/50"
                placeholder="City, Country"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-zinc-300">Email</span>
              <input
                type="email"
                value={draft.email}
                onChange={(e) => setDraft({ ...draft, email: e.target.value })}
                className="h-9 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-zinc-100 focus:outline-none focus:border-sky-400/50"
                placeholder="you@example.com"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs">
              <span className="font-semibold text-zinc-300">GitHub URL</span>
              <input
                type="url"
                value={draft.githubUrl}
                onChange={(e) => setDraft({ ...draft, githubUrl: e.target.value })}
                className="h-9 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-zinc-100 font-mono focus:outline-none focus:border-sky-400/50"
                placeholder="https://github.com/..."
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs md:col-span-2 lg:col-span-3">
              <span className="font-semibold text-zinc-300">Workspace Root Path</span>
              <input
                type="text"
                value={draft.workspaceRootPath}
                onChange={(e) => setDraft({ ...draft, workspaceRootPath: e.target.value })}
                className="h-9 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-zinc-100 font-mono focus:outline-none focus:border-sky-400/50"
                placeholder="C:\Users\dheen\Soul-DevPortal"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-xs md:col-span-2 lg:col-span-3">
              <span className="font-semibold text-zinc-300">Bio</span>
              <textarea
                rows={2}
                value={draft.bio}
                onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                className="p-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-zinc-100 focus:outline-none focus:border-sky-400/50 resize-y"
                placeholder="Short developer bio..."
              />
            </label>
          </div>

          {/* Avatar Emoji & Accent Color */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-300">Avatar Badge</span>
              <div className="flex flex-wrap gap-1.5">
                {AVATAR_EMOJI_PRESETS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setDraft({ ...draft, avatarEmoji: emoji })}
                    className={`w-9 h-9 rounded-xl border text-base flex items-center justify-center cursor-pointer transition-all ${
                      draft.avatarEmoji === emoji
                        ? 'bg-white/15 border-white/40 scale-105'
                        : 'bg-[#09090c] border-white/[0.08] hover:border-white/25'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-zinc-300">Accent Ring Color</span>
              <div className="flex flex-wrap gap-2">
                {ACCENT_COLOR_PRESETS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setDraft({ ...draft, accentColor: color })}
                    aria-label={`Select accent color ${color}`}
                    className={`w-8 h-8 rounded-xl border-2 cursor-pointer transition-transform ${
                      draft.accentColor === color ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Skills Editor */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-zinc-300">Core Stack &amp; Skills</span>
            <div className="flex flex-wrap gap-1.5">
              {draft.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.1] text-xs font-mono text-zinc-200"
                >
                  {skill}
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                    aria-label={`Remove ${skill}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2 max-w-sm mt-1">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="Add skill (e.g. Docker)"
                className="flex-1 h-8 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-xs text-zinc-100 font-mono focus:outline-none focus:border-sky-400/50"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.12] text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
              >
                + Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ── Section Switcher Tabs ── */}
      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-[#09090c] border border-white/[0.08] w-fit" role="tablist">
        {[
          { id: 'overview', label: 'Developer Overview' },
          { id: 'paths', label: `Main Paths (${projects.length + packages.length + DOCUMENTATION_GUIDES_REGISTRY.length})` },
          { id: 'workspace', label: 'Workspace & Host' },
          { id: 'preferences', label: 'Portal Preferences' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeSection === tab.id}
            onClick={() => setActiveSection(tab.id as typeof activeSection)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeSection === tab.id
                ? 'bg-[#1a1a22] text-white border border-white/15 font-bold'
                : 'text-zinc-400 hover:text-white border border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab 1: Developer Overview ── */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Skills & Pinned Notes */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Tech Stack &amp; Focus Areas</h2>
                <span className="text-[11px] font-mono text-zinc-400">{profile.skills.length} skills</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill) => (
                  <span
                    key={skill}
                    className="px-3 py-1.5 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs font-mono text-zinc-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">Pinned Developer Note</h2>
                <CopyButton text={profile.pinnedNotes} variant="compact" label="Copy Note" />
              </div>
              <textarea
                rows={3}
                value={profile.pinnedNotes}
                onChange={(e) => handlePreferenceChange('pinnedNotes', e.target.value)}
                className="w-full p-3 rounded-xl bg-[#09090c] border border-white/[0.08] text-xs text-zinc-200 font-mono focus:outline-none focus:border-sky-400/45 resize-y"
                placeholder="Write a quick reminder or workspace note..."
              />
            </div>
          </div>

          {/* Quick Workspace Summary & Shortcuts */}
          <div className="flex flex-col gap-5">
            <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 flex flex-col gap-3">
              <h2 className="text-sm font-bold text-white">Monorepo Footprint</h2>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => onNavigate('projects')}
                  className="p-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-emerald-500/35 text-left transition-all cursor-pointer"
                >
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Projects</div>
                  <div className="text-lg font-extrabold text-emerald-300">{liveStats.totalProjects}</div>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('packages')}
                  className="p-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-purple-500/35 text-left transition-all cursor-pointer"
                >
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Packages</div>
                  <div className="text-lg font-extrabold text-purple-300">{liveStats.totalPackages}</div>
                </button>
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.08]">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Live Sockets</div>
                  <div className="text-lg font-extrabold text-sky-300">{liveStats.totalLive}</div>
                </div>
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.08]">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">AST Symbols</div>
                  <div className="text-lg font-extrabold text-amber-300">
                    {liveStats.totalSymbols.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 flex flex-col gap-2.5">
              <h2 className="text-sm font-bold text-white">Quick Jump</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'projects', label: 'Projects' },
                  { id: 'packages', label: 'Packages' },
                  { id: 'docs', label: 'Docs Hub' },
                  { id: 'computer', label: 'System Monitor' },
                  { id: 'everyday', label: 'Everyday Tools' },
                  { id: 'portal', label: 'Portal Hub' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onNavigate(item.id)}
                    className="h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/25 text-xs font-semibold text-zinc-200 hover:text-white text-left transition-all cursor-pointer"
                  >
                    {item.label} →
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveSection('paths')}
                className="h-8 px-3 rounded-xl bg-sky-500/15 border border-sky-400/35 hover:bg-sky-500/25 text-xs font-semibold text-sky-200 hover:text-white text-left transition-all cursor-pointer"
              >
                Open Main Paths →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 2: Main Paths ── */}
      {activeSection === 'paths' && (
        <div className="flex flex-col gap-5">
          {/* Filter Bar */}
          <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-col gap-1 min-w-0">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">
                Main Workspace Paths
              </span>
              <p className="text-xs text-zinc-400">
                Root folders for the portal, projects, shared packages, and documentation.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full md:w-80">
              <input
                type="text"
                value={pathFilter}
                onChange={(e) => setPathFilter(e.target.value)}
                placeholder="Filter main paths..."
                className="w-full h-9 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-xs font-mono text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
              />
              {pathFilter && (
                <button
                  type="button"
                  onClick={() => setPathFilter('')}
                  className="h-9 px-2.5 rounded-xl bg-[#16161c] border border-white/[0.1] text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Main Root Directories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {mainDirectoryPaths.map((dir) => (
              <div
                key={dir.label}
                className="p-3.5 rounded-xl neu-card bg-[#111115] border border-white/[0.08] flex items-center justify-between gap-2 min-w-0"
              >
                <div className="min-w-0">
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">{dir.label}</div>
                  <div className="text-xs font-mono text-sky-300 truncate">{dir.path}</div>
                </div>
                <CopyButton text={dir.path} variant="compact" label="Copy" />
              </div>
            ))}
          </div>

          {/* 1. Projects Main Paths */}
          <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white">
              Projects ({filteredProjectsPaths.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredProjectsPaths.map((proj) => {
                const fullProjPath =
                  proj.id === 'devportal'
                    ? workspaceRoot
                    : joinPath('Soul-DevPortal-Projects', proj.id);
                const brand = PROJECT_BRAND_MAP[proj.id];
                return (
                  <div
                    key={proj.id}
                    className="p-3 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center justify-between gap-2 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onNavigate(`projects/${proj.id}`)}
                        className="text-xs font-bold text-white hover:text-sky-300 text-left truncate cursor-pointer block max-w-full"
                      >
                        {brand?.icon || '💻'} {proj.title}
                      </button>
                      <div className="text-[11px] font-mono text-zinc-400 truncate">{fullProjPath}</div>
                    </div>
                    <CopyButton text={fullProjPath} variant="compact" label="Copy" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Packages Main Paths */}
          <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white">
              Packages ({filteredPackagesPaths.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              {filteredPackagesPaths.map((pkg) => {
                const fullPkgPath = joinPath('Soul-DevPortal-Packages', pkg.id);
                return (
                  <div
                    key={pkg.id}
                    className="p-3 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center justify-between gap-2 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onNavigate(`packages/${pkg.id}`)}
                        className="text-xs font-bold text-white hover:text-purple-300 truncate cursor-pointer block max-w-full"
                      >
                        📦 {pkg.displayName || pkg.name}
                      </button>
                      <div className="text-[11px] font-mono text-zinc-400 truncate">{fullPkgPath}</div>
                    </div>
                    <CopyButton text={fullPkgPath} variant="compact" label="Copy" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Docs Main Paths */}
          <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white">
              Docs ({filteredDocsPaths.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {filteredDocsPaths.map((guide) => {
                const fullDocPath = joinPath('Soul-DevPortal-Docs', guide.folder);
                return (
                  <div
                    key={guide.id}
                    className="p-3 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center justify-between gap-2 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => onNavigate(`docs/${guide.slug}`)}
                        className="text-xs font-bold text-white hover:text-sky-300 truncate cursor-pointer block max-w-full"
                      >
                        {guide.icon} {guide.title}
                      </button>
                      <div className="text-[11px] font-mono text-zinc-400 truncate">{fullDocPath}</div>
                    </div>
                    <CopyButton text={fullDocPath} variant="compact" label="Copy" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 3: Workspace & Host ── */}
      {activeSection === 'workspace' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Workstation Telemetry</h2>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                  isBackendLive
                    ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                    : 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30'
                }`}
              >
                {isBackendLive ? `FastAPI :${backendPort} Live` : 'Offline'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center gap-3">
                <MiniRadialRing percent={cpuPct || 15} color="#38bdf8" size={32} />
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">CPU Load</div>
                  <div className="text-base font-bold text-white tabular-nums">{cpuPct}%</div>
                </div>
              </div>
              <div className="p-3.5 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center gap-3">
                <MiniRadialRing percent={ramPct || 25} color="#34d399" size={32} />
                <div>
                  <div className="text-[10px] font-mono text-zinc-400 uppercase">Memory</div>
                  <div className="text-base font-bold text-white tabular-nums">{ramPct}%</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-xs font-mono text-zinc-300 bg-[#09090c] border border-white/[0.08] rounded-xl p-3.5">
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">Host</span>
                <span className="truncate">{hostName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">OS</span>
                <span className="truncate">{osName}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-zinc-500">Runtime</span>
                <span>
                  {typeof window !== 'undefined' && window.soulDesktop?.isDesktop
                    ? 'Electron Desktop'
                    : 'Web Browser'}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 flex flex-col gap-3">
            <h2 className="text-sm font-bold text-white">Active Micro-Apps ({projects.length})</h2>
            <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-1">
              {projects.map((proj) => {
                const feLive = Boolean(proj.frontend?.isLive ?? proj.frontendActive);
                const beLive = Boolean(proj.backend?.isLive ?? proj.backendActive);
                return (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => onNavigate(`projects/${proj.id}`)}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/20 text-left transition-all cursor-pointer"
                  >
                    <span className="text-xs font-semibold text-zinc-100 truncate">{proj.title}</span>
                    <div className="flex items-center gap-1.5 shrink-0 font-mono text-[10px]">
                      {proj.frontendPort && (
                        <span
                          className={`px-1.5 py-0.5 rounded border ${
                            feLive
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                          }`}
                        >
                          :{proj.frontendPort}
                        </span>
                      )}
                      {proj.backendPort && (
                        <span
                          className={`px-1.5 py-0.5 rounded border ${
                            beLive
                              ? 'bg-sky-500/15 text-sky-300 border-sky-400/30'
                              : 'bg-white/[0.04] text-zinc-400 border-white/[0.08]'
                          }`}
                        >
                          :{proj.backendPort}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Tab 4: Portal Preferences ── */}
      {activeSection === 'preferences' && (
        <div className="rounded-2xl neu-card bg-[#111115] border border-white/[0.08] p-5 sm:p-6 flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <label className="flex flex-col gap-2 text-xs">
              <span className="font-bold text-white">Default Landing View</span>
              <span className="text-zinc-400">
                Choose which view opens when no hash route is present.
              </span>
              <select
                value={profile.defaultLandingView}
                onChange={(e) => handlePreferenceChange('defaultLandingView', e.target.value)}
                className="h-9 px-3 rounded-xl bg-[#09090c] border border-white/[0.1] text-zinc-100 focus:outline-none focus:border-sky-400/50"
              >
                {LANDING_VIEW_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[#16161c] border border-white/[0.08]">
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">Show Host Metrics in Header</span>
                <span className="text-[11px] text-zinc-400">
                  Display live CPU &amp; RAM pill in the top navigation bar.
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={profile.showHostMetricsInHeader}
                onClick={() =>
                  handlePreferenceChange('showHostMetricsInHeader', !profile.showHostMetricsInHeader)
                }
                className={`w-11 h-6 rounded-full transition-colors p-0.5 cursor-pointer shrink-0 ${
                  profile.showHostMetricsInHeader ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    profile.showHostMetricsInHeader ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
            <div className="text-xs text-zinc-400">
              Export your profile configuration as JSON or restore default settings.
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="neu-btn h-8 px-3 rounded-xl bg-[#16161c] border border-white/[0.1] text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
              >
                ↓ Export Profile JSON
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="neu-btn h-8 px-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 cursor-pointer"
              >
                Reset to Defaults
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
