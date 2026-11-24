import os
import re

def update_file(path, replacements):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    orig = content
    for pat, rep in replacements:
        content = re.sub(pat, rep, content)
    if content != orig:
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {path}')
    else:
        print(f'No changes for {path}')

# 1. ProjectDetailHeader.tsx
pdh_replacements = [
    # Project title
    (r'<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-200">',
     '<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">'),

    # Project logo grayscale
    (r'className="w-full h-full object-cover"',
     'className="w-full h-full object-cover grayscale brightness-110"'),

    # Description
    (r'<p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-4xl">',
     '<p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-4xl">'),

    # Badges
    (r'code className="px-2 py-0.5 rounded-md bg-\[#111111\] border border-\[#222222\] text-xs font-mono text-neutral-300 font-semibold"',
     'code className="px-2 py-0.5 rounded-md bg-[#161616] border border-neutral-700 text-xs font-mono text-neutral-200 font-semibold"'),
    (r'span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-\[#111111\] border border-\[#222222\] text-neutral-300"',
     'span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-[#161616] border border-neutral-700 text-neutral-200"'),

    # Buttons: Probe, Launch Client, Launch Server, Share
    (r"bg-\[#111111\] border border-\[#222222\] text-neutral-200 hover:text-neutral-200 hover:border-neutral-500 transition-all shadow-sm",
     "bg-[#161616] border border-neutral-700 text-neutral-200 hover:text-white hover:border-neutral-400 hover:bg-neutral-800 transition-all shadow-sm"),
    (r"bg-\[#111111\] border-\[#222222\] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500",
     "bg-[#161616] border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-400 hover:bg-neutral-800"),

    # Tabs active and hover
    (r"bg-\[#111111\] text-neutral-200 font-bold border border-\[#222222\] shadow-sm",
     "bg-[#1a1a1a] text-white font-bold border border-neutral-600 shadow-sm"),
    (r"text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] hover:border-\[#222222\] border border-transparent font-medium",
     "text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent font-medium"),
    (r"text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] hover:border-neutral-500",
     "text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-600"),

    # Active tab icons
    (r"\${activeTab === '([a-z0-9_-]+)' \? 'text-neutral-200' : 'text-neutral-400'}",
     r"${activeTab === '\1' ? 'text-white' : 'text-neutral-400'}"),

    # Active tab badges
    (r"\${activeTab === '([a-z0-9_-]+)' \? 'bg-\[#111111\] text-neutral-200 border border-\[#222222\] font-bold' : 'bg-\[#111111\] text-neutral-400 border border-\[#1a1a1a\]'}",
     r"${activeTab === '\1' ? 'bg-neutral-800 text-white border border-neutral-600 font-bold' : 'bg-[#111111] text-neutral-400 border border-[#222222]'}"),
]
update_file('src/features/projects/detail/ProjectDetailHeader.tsx', pdh_replacements)

# 2. ProjectOverviewTab.tsx
pot_replacements = [
    # Card title
    (r'<h2 className="text-xl font-extrabold text-neutral-200">',
     '<h2 className="text-xl font-extrabold text-white">'),

    # Description
    (r'<p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-4xl">',
     '<p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-4xl">'),

    # Database icon & badge
    (r'🗄️\s*\{project\.dbInfo \|\| \'SQLite\'\}',
     r'''<svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg><span>{project.dbInfo || 'SQLite'}</span>'''),

    # Terminal quickstart bolt
    (r'<span>⚡</span>\s*<span>Quickstart CLI Commands</span>',
     r'''<svg className="w-3.5 h-3.5 text-neutral-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg><span>Quickstart CLI Commands</span>'''),

    # Quickstart command codes
    (r'code className="text-neutral-200 text-\[11px\] truncate select-all"',
     'code className="text-neutral-100 text-[11px] truncate select-all font-mono font-medium"'),

    # Badges
    (r'bg-\[#111111\] border border-\[#222222\] text-neutral-200',
     'bg-[#161616] border border-neutral-700 text-neutral-200'),
]
update_file('src/features/projects/detail/ProjectOverviewTab.tsx', pot_replacements)

# 3. Overview.tsx
ov_replacements = [
    (r"bg-\[#111111\] text-neutral-200 font-bold border border-\[#222222\] shadow-sm",
     "bg-[#1a1a1a] text-white font-bold border border-neutral-600 shadow-sm"),
    (r"text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] hover:border-\[#222222\] border border-transparent font-medium",
     "text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent font-medium"),
    (r"\${activeTab === '([a-z0-9_-]+)' \? 'text-neutral-200 ' : ''}",
     r"${activeTab === '\1' ? 'text-white ' : ''}"),
    (r"\${activeTab === '([a-z0-9_-]+)' \? 'bg-\[#111111\] text-neutral-200 border border-\[#222222\] font-bold' : 'bg-\[#111111\] text-neutral-400 border border-\[#222222\]'}",
     r"${activeTab === '\1' ? 'bg-neutral-800 text-white border border-neutral-600 font-bold' : 'bg-[#111111] text-neutral-400 border border-[#222222]'}"),
    (r'<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-200">',
     '<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">'),
    (r'<h2 className="text-lg font-bold text-neutral-200">',
     '<h2 className="text-lg font-bold text-white">'),
    (r'<h3 className="text-lg font-bold text-neutral-200">',
     '<h3 className="text-lg font-bold text-white">'),
]
update_file('src/components/Overview.tsx', ov_replacements)

# 4. PackageDetailHeader.tsx
pkg_replacements = [
    (r'<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-200">',
     '<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">'),
    (r'<p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-4xl">',
     '<p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-4xl">'),
    (r"bg-\[#111111\] text-neutral-200 font-bold border border-\[#222222\] shadow-sm",
     "bg-[#1a1a1a] text-white font-bold border border-neutral-600 shadow-sm"),
    (r"text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] hover:border-\[#222222\] border border-transparent font-medium",
     "text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent font-medium"),
    (r"\${activeTab === '([a-z0-9_-]+)' \? 'text-neutral-200' : 'text-neutral-400'}",
     r"${activeTab === '\1' ? 'text-white' : 'text-neutral-400'}"),
]
update_file('src/features/packages/detail/PackageDetailHeader.tsx', pkg_replacements)

# 5. DocDetailHeader.tsx
doc_replacements = [
    (r'<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-200">',
     '<h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">'),
    (r'<p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-4xl">',
     '<p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-4xl">'),
    (r"bg-\[#111111\] text-neutral-200 font-bold border border-\[#222222\] shadow-sm",
     "bg-[#1a1a1a] text-white font-bold border border-neutral-600 shadow-sm"),
    (r"text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] hover:border-\[#222222\] border border-transparent font-medium",
     "text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent font-medium"),
    (r"\${activeTab === '([a-z0-9_-]+)' \? 'text-neutral-200' : ''}",
     r"${activeTab === '\1' ? 'text-white' : ''}"),
    (r"\${activeTab === '([a-z0-9_-]+)' \? 'bg-\[#111111\] text-neutral-200 border border-\[#222222\] font-bold' : 'bg-\[#111111\] text-neutral-400 border border-\[#222222\]'}",
     r"${activeTab === '\1' ? 'bg-neutral-800 text-white border border-neutral-600 font-bold' : 'bg-[#111111] text-neutral-400 border border-[#222222]'}"),
]
update_file('src/features/docs/detail/DocDetailHeader.tsx', doc_replacements)
