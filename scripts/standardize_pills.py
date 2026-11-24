import re

def update_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content
    for old, new in replacements:
        if old not in content:
            print(f"WARNING: Target string not found in {filepath}:\n{old[:60]}...")
        content = content.replace(old, new)
    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"No changes in {filepath}")

# 1. Overview.tsx
update_file('src/components/Overview.tsx', [
    (
        '<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">\n              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />\n              <span>Live Ecosystem · 3 Pillars · {projects.length || 8} Apps · {packages.length || 3} Packages</span>\n            </div>',
        '<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs font-semibold text-blue-400 select-none shadow-sm">\n              <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />\n              <span>Live Ecosystem · 3 Pillars · {projects.length || 9} Apps · {packages.length || 3} Packages</span>\n            </div>'
    )
])

# 2. PackagesHeader.tsx
update_file('src/features/packages/dashboard/PackagesHeader.tsx', [
    (
        '<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">\n          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />\n          <span>{packagesCount} Shared Libraries Active</span>\n        </div>',
        '<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs font-semibold text-blue-400 select-none shadow-sm">\n          <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />\n          <span>{packagesCount} Shared Libraries Active</span>\n        </div>'
    ),
    (
        'Production-grade shared libraries and tools consumed across all 8 workspace applications.',
        'Production-grade shared libraries and tools consumed across all 9 workspace applications.'
    )
])

# 3. ProjectHeader.tsx
update_file('src/features/projects/ProjectHeader.tsx', [
    (
        '<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">\n          <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />\n          <span>{totalCount} Applications Indexed</span>\n        </div>',
        '<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs font-semibold text-blue-400 select-none shadow-sm">\n          <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />\n          <span>{totalCount} Applications Active</span>\n        </div>'
    )
])

# 4. DocsDashboard.tsx
update_file('src/features/docs/dashboard/DocsDashboard.tsx', [
    (
        '<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">\n            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />\n            <span>{DOCUMENTATION_GUIDES_REGISTRY.length} Architecture Guides Live</span>\n          </div>',
        '<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs font-semibold text-blue-400 select-none shadow-sm">\n            <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />\n            <span>{DOCUMENTATION_GUIDES_REGISTRY.length} Architecture Guides Live</span>\n          </div>'
    ),
    (
        'governing all 8 workspace applications',
        'governing all 9 workspace applications'
    )
])

# 5. DocDetailHeader.tsx
update_file('src/features/docs/detail/DocDetailHeader.tsx', [
    (
        '<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">\n            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />\n            <span>100% Monorepo Compliant (8/8 Apps)</span>\n          </div>',
        '<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs font-semibold text-blue-400 select-none shadow-sm">\n            <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />\n            <span>Official Specification · 100% Compliant (9/9 Apps)</span>\n          </div>'
    )
])

# 6. PackageDetailHeader.tsx
update_file('src/features/packages/detail/PackageDetailHeader.tsx', [
    (
        '<div className="flex items-center gap-2">\n          <CopyButton text={pkg.name || \'\'} label="Copy Name" copiedLabel="Copied!" variant="compact" />',
        '<div className="flex items-center gap-2">\n          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs font-semibold text-blue-400 select-none shadow-sm">\n            <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />\n            <span>Active Package · {totalExports} Symbols</span>\n          </div>\n          <CopyButton text={pkg.name || \'\'} label="Copy Name" copiedLabel="Copied!" variant="compact" />'
    )
])

# 7. ProjectDetailHeader.tsx
update_file('src/features/projects/detail/ProjectDetailHeader.tsx', [
    (
        'px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm',
        'px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/40 text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm'
    )
])

# 8. ScriptsView.tsx
update_file('src/features/scripts/ScriptsView.tsx', [
    (
        '<div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400">\n              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" aria-hidden="true" />\n              <span>19 Canonical Commands Active</span>\n            </div>',
        '<div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs font-semibold text-blue-400 select-none shadow-sm">\n              <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />\n              <span>19 Canonical Commands Active</span>\n            </div>'
    )
])

# 9. WorkspaceProjects.tsx
update_file('src/components/WorkspaceProjects.tsx', [
    (
        'Catalog of all 8 applications consuming the shared packages',
        'Catalog of all 9 applications consuming the shared packages'
    )
])

# 10. docsConstants.ts
update_file('src/features/docs/docsConstants.ts', [
    (
        'The authoritative golden rulebook governing all 8 workspace applications',
        'The authoritative golden rulebook governing all 9 workspace applications'
    ),
    (
        "complianceStatus: '100% Monorepo Compliant (8/8 Apps)'",
        "complianceStatus: '100% Monorepo Compliant (9/9 Apps)'"
    )
])

# 11. ProjectFileExplorer.tsx
update_file('src/features/projects/ProjectFileExplorer.tsx', [
    (
        '<span className="px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30 text-blue-400 font-semibold">\n              <strong className="font-bold">{fileTree.length}</strong> indexed items\n            </span>',
        '<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-400 font-semibold shadow-sm">\n              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />\n              <span><strong className="font-bold">{fileTree.length}</strong> items indexed</span>\n            </span>'
    )
])

print('Finished standardizing pills.')
