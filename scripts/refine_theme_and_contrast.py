import os
import re

# 1. Update theme.css
theme_path = 'src/styles/theme.css'
with open(theme_path, 'r', encoding='utf-8') as f:
    theme = f.read()

theme = re.sub(r'--text-primary:\s*#[a-fA-F0-9]+;', '--text-primary: #ededed;', theme)
theme = re.sub(r'--text-secondary:\s*#[a-fA-F0-9]+;', '--text-secondary: #a3a3a3;', theme)
theme = re.sub(r'--text-muted:\s*#[a-fA-F0-9]+;', '--text-muted: #737373;', theme)
theme = re.sub(r'--border-active:\s*#[a-fA-F0-9]+;', '--border-active: #737373;', theme)

with open(theme_path, 'w', encoding='utf-8') as f:
    f.write(theme)
print('Updated theme.css with crisp primary text #ededed')

# 2. Update SoulLogo.tsx - make purely monochrome silver/white
logo_path = 'src/components/SoulLogo.tsx'
with open(logo_path, 'r', encoding='utf-8') as f:
    logo = f.read()

# Replace colorful stops in SoulLogo
logo = re.sub(r'<stop offset="0%" stopColor="#38bdf8" />\s*<stop offset="45%" stopColor="#6366f1" />\s*<stop offset="100%" stopColor="#a855f7" />',
              '<stop offset="0%" stopColor="#ffffff" />\n          <stop offset="50%" stopColor="#d4d4d4" />\n          <stop offset="100%" stopColor="#737373" />', logo)

logo = re.sub(r'<stop offset="0%" stopColor="#2dd4bf" />\s*<stop offset="50%" stopColor="#38bdf8" />\s*<stop offset="100%" stopColor="#818cf8" />',
              '<stop offset="0%" stopColor="#ffffff" />\n          <stop offset="50%" stopColor="#a3a3a3" />\n          <stop offset="100%" stopColor="#525252" />', logo)

logo = re.sub(r'<stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />\s*<stop offset="70%" stopColor="#38bdf8" stopOpacity="0.15" />',
              '<stop offset="0%" stopColor="#ffffff" stopOpacity="0.15" />\n          <stop offset="70%" stopColor="#ffffff" stopOpacity="0.05" />', logo)

logo = re.sub(r'fill="#38bdf8"', 'fill="#ffffff"', logo)
logo = re.sub(r'fill="#c084fc"', 'fill="#a3a3a3"', logo)

with open(logo_path, 'w', encoding='utf-8') as f:
    f.write(logo)
print('Updated SoulLogo.tsx to pure monochrome')

# 3. Update Header.tsx
header_path = 'src/components/Header.tsx'
with open(header_path, 'r', encoding='utf-8') as f:
    hdr = f.read()

# Replace unicode external link emoji with clean SVG
hdr = re.sub(r'<span className="text-\[10px\] text-neutral-500">↗</span>',
             r'''<svg className="w-3 h-3 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="7" y1="17" x2="17" y2="7" /><polyline points="7 7 17 7 17 17" /></svg>''', hdr)

# Upgrade Header Navigation Tabs active styling
hdr = re.sub(r"active === 'overview'\s*\?\s*'bg-\[#111111\] text-neutral-200 font-bold shadow-sm border border-\[#222222\]'\s*:\s*'text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] border border-transparent'",
             "active === 'overview' ? 'bg-[#1a1a1a] text-white font-bold shadow-sm border border-neutral-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent'", hdr)

hdr = re.sub(r"isProjectsActive\s*\?\s*'bg-\[#111111\] text-neutral-200 font-bold shadow-sm border border-\[#222222\]'\s*:\s*'text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] border border-transparent'",
             "isProjectsActive ? 'bg-[#1a1a1a] text-white font-bold shadow-sm border border-neutral-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent'", hdr)

hdr = re.sub(r"isPackagesActive\s*\?\s*'bg-\[#111111\] text-neutral-200 font-bold shadow-sm border border-\[#222222\]'\s*:\s*'text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] border border-transparent'",
             "isPackagesActive ? 'bg-[#1a1a1a] text-white font-bold shadow-sm border border-neutral-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent'", hdr)

hdr = re.sub(r"isDocsActive\s*\?\s*'bg-\[#111111\] text-neutral-200 font-bold shadow-sm border border-\[#222222\]'\s*:\s*'text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] border border-transparent'",
             "isDocsActive ? 'bg-[#1a1a1a] text-white font-bold shadow-sm border border-neutral-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 hover:border-neutral-700 border border-transparent'", hdr)

with open(header_path, 'w', encoding='utf-8') as f:
    f.write(hdr)
print('Updated Header.tsx navigation tabs & GitHub icon')

# 4. Update Sidebar.tsx active & hover styling
sidebar_path = 'src/components/Sidebar.tsx'
with open(sidebar_path, 'r', encoding='utf-8') as f:
    sb = f.read()

# Update project items active & hover
sb = re.sub(r"isProjActive\s*\?\s*'bg-\[#111111\] text-neutral-200 font-semibold border border-\[#222222\]'\s*:\s*'text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] border border-transparent'",
            "isProjActive ? 'bg-[#1a1a1a] text-white font-semibold border border-neutral-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent'", sb)

# Update package items active & hover
sb = re.sub(r"isPkgActive\s*\?\s*'bg-\[#111111\] text-neutral-200 font-semibold border border-\[#222222\]'\s*:\s*'text-neutral-400 hover:text-neutral-200 hover:bg-\[#111111\] border border-transparent'",
            "isPkgActive ? 'bg-[#1a1a1a] text-white font-semibold border border-neutral-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent'", sb)

# Update doc items active & hover
sb = re.sub(r"\(isActive\('docs'\) \|\| isActive\('docs-dashboard'\)\)\s*\?\s*'bg-\[#111111\] text-neutral-200 font-semibold border border-\[#222222\]'\s*:\s*'text-neutral-300 hover:text-neutral-200 hover:bg-\[#111111\] hover:border-\[#222222\] border border-transparent'",
            "(isActive('docs') || isActive('docs-dashboard')) ? 'bg-[#1a1a1a] text-white font-semibold border border-neutral-600' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50 border border-transparent'", sb)

with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(sb)
print('Updated Sidebar.tsx active & hover states')
