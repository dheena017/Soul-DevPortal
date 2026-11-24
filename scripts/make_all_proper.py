import os
import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content
    for old, new in replacements:
        if old not in content:
            print(f"Warning: pattern not found in {filepath}:\n{old[:60]}...")
        content = content.replace(old, new)
    if content != orig:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")
    else:
        print(f"No changes in {filepath}")

# 1. Header.tsx: fix breadcrumbs and nav tabs to use clean #111116 and #282838
header_replacements = [
    (
        '''                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#111116] border border-blue-500/40 text-blue-400 font-semibold shadow-sm truncate max-w-[200px]"
                  title={crumb.label}
                >
                  {crumb.label}
                </span>''',
        '''                <span
                  className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#111116] border border-[#282838] text-white font-semibold shadow-sm truncate max-w-[200px]"
                  title={crumb.label}
                >
                  {crumb.label}
                </span>'''
    ),
    (
        '''          <button
            type="button"
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              active === 'overview'
                ? 'bg-[#111116] text-blue-400 font-bold shadow-sm border border-blue-500/40'
                : 'text-neutral-400 hover:text-white hover:bg-[#111116] border border-transparent'
            }`}
            onClick={() => onNavigate('overview')}
            title="Overview Dashboard"
          >
            Overview
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isProjectsActive
                ? 'bg-[#111116] text-blue-400 font-bold shadow-sm border border-blue-500/40'
                : 'text-neutral-400 hover:text-white hover:bg-[#111116] border border-transparent'
            }`}
            onClick={() => onNavigate('projects')}
            title={`Pillar 1: Applications (${projectsCount})`}
          >
            <span>Projects</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isProjectsActive ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold' : 'bg-[#111116] text-neutral-400 border border-[#22222e]'}`}>
              {projectsCount}
            </span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isPackagesActive
                ? 'bg-[#111116] text-blue-400 font-bold shadow-sm border border-blue-500/40'
                : 'text-neutral-400 hover:text-white hover:bg-[#111116] border border-transparent'
            }`}
            onClick={() => onNavigate('packages')}
            title={`Pillar 2: Shared Libraries (${packagesCount})`}
          >
            <span>Packages</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isPackagesActive ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold' : 'bg-[#111116] text-neutral-400 border border-[#22222e]'}`}>
              {packagesCount}
            </span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isDocsActive
                ? 'bg-[#111116] text-blue-400 font-bold shadow-sm border border-blue-500/40'
                : 'text-neutral-400 hover:text-white hover:bg-[#111116] border border-transparent'
            }`}
            onClick={() => onNavigate('docs')}
            title={`Pillar 3: Documentation Hub (${docsCount} Guides)`}
          >
            <span>Docs</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isDocsActive ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 font-bold' : 'bg-[#111116] text-neutral-400 border border-[#22222e]'}`}>
              {docsCount}
            </span>
          </button>''',
        '''          <button
            type="button"
            className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              active === 'overview'
                ? 'bg-[#111116] text-white font-bold shadow-sm border border-[#282838]'
                : 'text-neutral-400 hover:text-white hover:bg-[#111116] border border-transparent'
            }`}
            onClick={() => onNavigate('overview')}
            title="Overview Dashboard"
          >
            Overview
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isProjectsActive
                ? 'bg-[#111116] text-white font-bold shadow-sm border border-[#282838]'
                : 'text-neutral-400 hover:text-white hover:bg-[#111116] border border-transparent'
            }`}
            onClick={() => onNavigate('projects')}
            title={`Pillar 1: Applications (${projectsCount})`}
          >
            <span>Projects</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isProjectsActive ? 'bg-[#111116] text-white border border-[#282838] font-bold' : 'bg-[#111116] text-neutral-400 border border-[#22222e]'}`}>
              {projectsCount}
            </span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isPackagesActive
                ? 'bg-[#111116] text-white font-bold shadow-sm border border-[#282838]'
                : 'text-neutral-400 hover:text-white hover:bg-[#111116] border border-transparent'
            }`}
            onClick={() => onNavigate('packages')}
            title={`Pillar 2: Shared Libraries (${packagesCount})`}
          >
            <span>Packages</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isPackagesActive ? 'bg-[#111116] text-white border border-[#282838] font-bold' : 'bg-[#111116] text-neutral-400 border border-[#22222e]'}`}>
              {packagesCount}
            </span>
          </button>

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
              isDocsActive
                ? 'bg-[#111116] text-white font-bold shadow-sm border border-[#282838]'
                : 'text-neutral-400 hover:text-white hover:bg-[#111116] border border-transparent'
            }`}
            onClick={() => onNavigate('docs')}
            title={`Pillar 3: Documentation Hub (${docsCount} Guides)`}
          >
            <span>Docs</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${isDocsActive ? 'bg-[#111116] text-white border border-[#282838] font-bold' : 'bg-[#111116] text-neutral-400 border border-[#22222e]'}`}>
              {docsCount}
            </span>
          </button>'''
    )
]
replace_in_file('src/components/Header.tsx', header_replacements)

# 2. ProjectDetailHeader.tsx: clean up buttons, version tag, consumes tags, and tab styling
detail_replacements = [
    (
        '''          {feUrl && (
            <a
              href={feUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/40 text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm"
              title="Open Client in Browser"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Launch Client :{project.frontendPort}</span>
            </a>
          )}
          {beUrl && (
            <a
              href={beUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-500/10 border border-blue-500/40 text-blue-400 hover:bg-blue-500/20 transition-all shadow-sm"
              title="Open Server API"
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              <span>Launch Server :{project.backendPort}</span>
            </a>
          )}''',
        '''          {feUrl && (
            <a
              href={feUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#111116] border border-[#282838] text-neutral-200 hover:text-white hover:border-blue-500/40 transition-all shadow-sm"
              title="Open Client in Browser"
            >
              <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Launch Client :{project.frontendPort}</span>
            </a>
          )}
          {beUrl && (
            <a
              href={beUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#111116] border border-[#282838] text-neutral-200 hover:text-white hover:border-blue-500/40 transition-all shadow-sm"
              title="Open Server API"
            >
              <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              <span>Launch Server :{project.backendPort}</span>
            </a>
          )}'''
    ),
    (
        '''            {project.version && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
                v{project.version}
              </span>
            )}''',
        '''            {project.version && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#111116] border border-[#282838] text-neutral-300">
                v{project.version}
              </span>
            )}'''
    ),
    (
        '''          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] font-mono font-bold tracking-wider text-neutral-500 uppercase">CONSUMES:</span>
            <a href="#packages/logger" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#111116] border border-[#282838] text-neutral-400 hover:text-blue-400 hover:border-blue-500/40 transition-all font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
              <span>@workspace/logger</span>
            </a>
            <a href="#packages/config" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#111116] border border-[#282838] text-neutral-400 hover:text-blue-400 hover:border-blue-500/40 transition-all font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
              <span>@workspace/config</span>
            </a>
            <a href="#packages/runner" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#111116] border border-[#282838] text-neutral-400 hover:text-blue-400 hover:border-blue-500/40 transition-all font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
              <span>@workspace/runner</span>
            </a>
          </div>''',
        '''          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] font-mono font-bold tracking-wider text-neutral-500 uppercase">CONSUMES:</span>
            <a href="#packages/logger" className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#111116] border border-[#282838] text-neutral-300 hover:text-white hover:border-[#282838] transition-all font-mono text-xs">
              @workspace/logger
            </a>
            <a href="#packages/config" className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#111116] border border-[#282838] text-neutral-300 hover:text-white hover:border-[#282838] transition-all font-mono text-xs">
              @workspace/config
            </a>
            <a href="#packages/runner" className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#111116] border border-[#282838] text-neutral-300 hover:text-white hover:border-[#282838] transition-all font-mono text-xs">
              @workspace/runner
            </a>
          </div>'''
    ),
    (
        '''bg-blue-500/15 text-blue-400 font-bold border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]''',
        '''bg-[#111116] text-white font-bold border border-[#282838] shadow-sm'''
    )
]
replace_in_file('src/features/projects/detail/ProjectDetailHeader.tsx', detail_replacements)

# 3. ProjectOverviewTab.tsx: change "APPLICATION OVERVIEW" subtitle color
overview_replacements = [
    (
        '''<span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">APPLICATION OVERVIEW</span>''',
        '''<span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">APPLICATION OVERVIEW</span>'''
    )
]
replace_in_file('src/features/projects/detail/ProjectOverviewTab.tsx', overview_replacements)

# 4. PackageDetailHeader.tsx: normalize tabs, version pill, active states
pkg_detail_replacements = [
    (
        '''              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
                <span>v{pkg.version || '1.0.0'}</span>
              </span>''',
        '''              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#111116] border border-[#282838] text-neutral-300">
                <span>v{pkg.version || '1.0.0'}</span>
              </span>'''
    ),
    (
        '''bg-blue-500/15 text-blue-400 font-bold border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]''',
        '''bg-[#111116] text-white font-bold border border-[#282838] shadow-sm'''
    )
]
replace_in_file('src/features/packages/detail/PackageDetailHeader.tsx', pkg_detail_replacements)

# 5. Sidebar.tsx: keep active item clean #111116 and #282838 with white text
sidebar_replacements = [
    (
        '''bg-blue-500/10 text-white font-semibold border border-blue-500/40 shadow-sm''',
        '''bg-[#111116] text-white font-semibold border border-[#282838] shadow-sm'''
    ),
    (
        '''bg-blue-500/10 text-white font-semibold border border-blue-500/40''',
        '''bg-[#111116] text-white font-semibold border border-[#282838]'''
    ),
    (
        '''bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/30''',
        '''bg-[#111116] text-white font-semibold border border-[#282838]'''
    ),
    (
        '''hover:bg-white/[0.04] hover:border-[#282838] border border-transparent''',
        '''hover:bg-[#111116] hover:border-[#282838] border border-transparent'''
    ),
    (
        '''hover:bg-white/[0.04] border border-transparent''',
        '''hover:bg-[#111116] border border-transparent'''
    )
]
replace_in_file('src/components/Sidebar.tsx', sidebar_replacements)

# 6. Filter tabs in PackagesHeader.tsx, ProjectHeader.tsx, ScriptsView.tsx: replace active blue background with clean #111116
filter_replacements = [
    (
        '''bg-blue-500/15 text-blue-400 font-bold border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]''',
        '''bg-[#111116] text-white font-bold border border-[#282838] shadow-sm'''
    ),
    (
        '''bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold''',
        '''bg-[#111116] text-white border border-[#282838] font-bold'''
    )
]
replace_in_file('src/features/packages/dashboard/PackagesHeader.tsx', filter_replacements)
replace_in_file('src/features/projects/ProjectHeader.tsx', filter_replacements)
replace_in_file('src/features/scripts/ScriptsView.tsx', filter_replacements)

print("Make all proper completed.")
