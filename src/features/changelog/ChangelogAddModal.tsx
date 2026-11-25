import React, { useEffect, useState } from 'react';
import {
  CHANGELOG_SURFACE_TABS,
  ChangelogDetailItem,
  ChangelogRelease,
  ChangelogSurface,
} from './changelogConstants';

export interface ChangelogAddModalProps {
  open: boolean;
  editingRelease?: ChangelogRelease | null;
  onSave: (release: ChangelogRelease) => void;
  onClose: () => void;
}

function parseBulletLines(raw: string): ChangelogDetailItem[] {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 1 && colonIdx < 56) {
        return {
          title: line.slice(0, colonIdx).trim(),
          description: line.slice(colonIdx + 1).trim(),
        };
      }
      return {
        title: line,
        description: '',
      };
    });
}

function formatBulletLines(items?: ChangelogDetailItem[]): string {
  if (!items || items.length === 0) return '';
  return items
    .map((i) => (i.description ? `${i.title}: ${i.description}` : i.title))
    .join('\n');
}

export const ChangelogAddModal: React.FC<ChangelogAddModalProps> = ({
  open,
  editingRelease,
  onSave,
  onClose,
}) => {
  const [version, setVersion] = useState('v0.0.2');
  const [dateLabel, setDateLabel] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [surfaces, setSurfaces] = useState<Array<Exclude<ChangelogSurface, 'all'>>>(['desktop']);
  const [featuresRaw, setFeaturesRaw] = useState('');
  const [improvementsRaw, setImprovementsRaw] = useState('');
  const [fixesRaw, setFixesRaw] = useState('');
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErrorMsg(null);
    if (editingRelease) {
      setVersion(editingRelease.version);
      setDateLabel(editingRelease.dateLabel);
      setHeadline(editingRelease.headline);
      setSummary(editingRelease.summary);
      setSurfaces(editingRelease.surfaces.length > 0 ? editingRelease.surfaces : ['desktop']);
      setFeaturesRaw(formatBulletLines(editingRelease.features));
      setImprovementsRaw(formatBulletLines(editingRelease.improvements));
      setFixesRaw(formatBulletLines(editingRelease.fixes));
      setIsAnnouncement(Boolean(editingRelease.isAnnouncement));
    } else {
      setVersion('v0.0.2');
      setDateLabel(
        new Date().toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      );
      setHeadline('');
      setSummary('');
      setSurfaces(['desktop']);
      setFeaturesRaw('');
      setImprovementsRaw('');
      setFixesRaw('');
      setIsAnnouncement(false);
    }
  }, [open, editingRelease]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const toggleSurface = (surf: Exclude<ChangelogSurface, 'all'>) => {
    setSurfaces((prev) =>
      prev.includes(surf) ? (prev.length > 1 ? prev.filter((s) => s !== surf) : prev) : [...prev, surf]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanVersion = version.trim();
    const cleanHeadline = headline.trim();
    const cleanSummary = summary.trim();
    if (!cleanVersion || !cleanHeadline) {
      setErrorMsg('Please enter both a version tag and a headline.');
      return;
    }

    onSave({
      id: editingRelease?.id || `rel-custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      version: cleanVersion,
      dateLabel:
        dateLabel.trim() ||
        new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      headline: cleanHeadline,
      summary: cleanSummary || `${cleanHeadline} (${cleanVersion}) logged in workspace changelog.`,
      surfaces,
      isAnnouncement,
      announcementBadge: isAnnouncement ? 'Release Announcement' : undefined,
      features: parseBulletLines(featuresRaw),
      improvements: parseBulletLines(improvementsRaw),
      fixes: parseBulletLines(fixesRaw),
      isCustom: true,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Log Changelog Release Entry"
    >
      <div
        className="w-full max-w-2xl max-h-[90vh] rounded-2xl bg-[#111115] border border-white/[0.12] shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-white/[0.08] flex items-center justify-between gap-3 bg-[#14141a]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Changelog Entry Editor
            </span>
            <h2 className="text-base sm:text-lg font-semibold text-white">
              {editingRelease ? `Edit ${editingRelease.version}` : 'Add Changelog Release Entry'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.1] text-xs font-mono text-zinc-300 hover:text-white cursor-pointer"
          >
            Esc ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono text-zinc-400">Version *</label>
              <input
                type="text"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                placeholder="v0.0.2"
                className="h-9 px-3 rounded-lg bg-[#09090c] border border-white/[0.08] text-xs font-mono text-white focus:outline-none focus:border-sky-400/50"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col gap-1">
              <label className="text-[11px] font-mono text-zinc-400">Release Date</label>
              <input
                type="text"
                value={dateLabel}
                onChange={(e) => setDateLabel(e.target.value)}
                placeholder="November 25, 2026"
                className="h-9 px-3 rounded-lg bg-[#09090c] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-sky-400/50"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono text-zinc-400">Headline *</label>
            <input
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Enhanced Agent Workflows & New Desktop Inspector Tools"
              className="h-9 px-3 rounded-lg bg-[#09090c] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-sky-400/50"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-mono text-zinc-400">Summary</label>
            <textarea
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief overview of what this release ships..."
              className="p-3 rounded-lg bg-[#09090c] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-sky-400/50 resize-y"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-mono text-zinc-400 mr-1">Surfaces:</span>
              {CHANGELOG_SURFACE_TABS.filter((t) => t.id !== 'all').map((tab) => {
                const surfId = tab.id as Exclude<ChangelogSurface, 'all'>;
                const active = surfaces.includes(surfId);
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => toggleSurface(surfId)}
                    className={`px-2.5 py-1 rounded-md text-[11px] border cursor-pointer transition-colors ${
                      active
                        ? 'bg-sky-500/20 border-sky-400/45 text-sky-200 font-medium'
                        : 'bg-[#09090c] border-white/[0.08] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncement}
                onChange={(e) => setIsAnnouncement(e.target.checked)}
                className="accent-sky-400"
              />
              <span>Highlight card style</span>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono text-zinc-400">
                Features (optional, one per line as Title: Description)
              </label>
              <textarea
                rows={2}
                value={featuresRaw}
                onChange={(e) => setFeaturesRaw(e.target.value)}
                placeholder="Smart Search: Instant filtering across workspace modules"
                className="p-2.5 rounded-lg bg-[#09090c] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-sky-400/50 resize-y"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono text-zinc-400">
                Improvements (optional, one per line as Title: Description)
              </label>
              <textarea
                rows={2}
                value={improvementsRaw}
                onChange={(e) => setImprovementsRaw(e.target.value)}
                placeholder="Faster Startup: Cut initial bundle paint latency"
                className="p-2.5 rounded-lg bg-[#09090c] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-sky-400/50 resize-y"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-mono text-zinc-400">
                Fixes (optional, one per line as Title: Description)
              </label>
              <textarea
                rows={2}
                value={fixesRaw}
                onChange={(e) => setFixesRaw(e.target.value)}
                placeholder="Status Popover Clipping: Adjusted portal positioning above taskbar"
                className="p-2.5 rounded-lg bg-[#09090c] border border-white/[0.08] text-xs text-white focus:outline-none focus:border-sky-400/50 resize-y"
              />
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs font-mono text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-lg px-3 py-2">
              {errorMsg}
            </p>
          )}

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-lg bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold cursor-pointer"
            >
              {editingRelease ? 'Save Changes' : 'Publish Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChangelogAddModal;
