import os
import re

# 1. Update theme.css with official Antigravity IDE Design System
theme_path = 'src/styles/theme.css'
with open(theme_path, 'r', encoding='utf-8') as f:
    theme = f.read()

# Antigravity Design Tokens
theme = re.sub(r'--page-bg:\s*#[a-fA-F0-9]+;', '--page-bg: #0e0e11;', theme)
theme = re.sub(r'--surface:\s*#[a-fA-F0-9]+;', '--surface: #17171c;', theme)
theme = re.sub(r'--surface-raised:\s*#[a-fA-F0-9]+;', '--surface-raised: #1f1f26;', theme)
theme = re.sub(r'--surface-hover:\s*#[a-fA-F0-9]+;', '--surface-hover: #262630;', theme)
theme = re.sub(r'--surface-active:\s*#[a-fA-F0-9]+;', '--surface-active: #2a2a36;', theme)
theme = re.sub(r'--border:\s*#[a-fA-F0-9]+;', '--border: #26262e;', theme)
theme = re.sub(r'--border-subtle:\s*#[a-fA-F0-9]+;', '--border-subtle: #1e1e24;', theme)
theme = re.sub(r'--border-muted:\s*#[a-fA-F0-9]+;', '--border-muted: #1e1e24;', theme)
theme = re.sub(r'--border-active:\s*#[a-fA-F0-9]+;', '--border-active: #ffffff;', theme)
theme = re.sub(r'--text-primary:\s*#[a-fA-F0-9]+;', '--text-primary: #f4f4f5;', theme)
theme = re.sub(r'--text-secondary:\s*#[a-fA-F0-9]+;', '--text-secondary: #a1a1aa;', theme)
theme = re.sub(r'--text-muted:\s*#[a-fA-F0-9]+;', '--text-muted: #71717a;', theme)

# Scrollbars matching Antigravity
theme = re.sub(r'::-webkit-scrollbar-track\s*\{\s*background:\s*#[a-fA-F0-9]+;\s*\}',
               '::-webkit-scrollbar-track {\n  background: #0e0e11;\n}', theme)
theme = re.sub(r'::-webkit-scrollbar-thumb\s*\{\s*background:\s*#[a-fA-F0-9]+;\s*border-radius:\s*9999px;\s*\}',
               '::-webkit-scrollbar-thumb {\n  background: #282832;\n  border-radius: 9999px;\n}', theme)
theme = re.sub(r'::-webkit-scrollbar-thumb:hover\s*\{\s*background:\s*#[a-fA-F0-9]+;\s*\}',
               '::-webkit-scrollbar-thumb:hover {\n  background: #444452;\n}', theme)

with open(theme_path, 'w', encoding='utf-8') as f:
    f.write(theme)
print('Updated theme.css with Antigravity tokens')

# 2. Update components.css & projects.css
comp_css = 'src/styles/components.css'
if os.path.exists(comp_css):
    with open(comp_css, 'r', encoding='utf-8') as f:
        ccss = f.read()
    ccss = re.sub(r'rgba\(22,\s*27,\s*34,\s*0\.85\)', 'rgba(23, 23, 28, 0.85)', ccss)
    ccss = re.sub(r'border-color:\s*#[a-fA-F0-9]+;', 'border-color: #3f3f4e;', ccss)
    with open(comp_css, 'w', encoding='utf-8') as f:
        f.write(ccss)
    print('Updated components.css')

proj_css = 'src/styles/projects.css'
if os.path.exists(proj_css):
    with open(proj_css, 'r', encoding='utf-8') as f:
        pcss = f.read()
    pcss = pcss.replace('#30363d', '#282832')
    with open(proj_css, 'w', encoding='utf-8') as f:
        f.write(pcss)
    print('Updated projects.css')

# 3. Universal replacement across all source files
replacements = [
    # Surface & background mappings to Antigravity Dark
    (r'#0d1117', '#0e0e11'),
    (r'#161b22', '#17171c'),
    (r'#30363d', '#282832'),
    (r'#21262d', '#1f1f26'),

    # Active Tabs & Selected Pills in Antigravity Studio Style
    (r'bg-\[#30363d\] text-white font-bold shadow-sm border border-neutral-400',
     'bg-[#262630] text-white font-semibold shadow-sm border border-white/20'),
    (r'bg-\[#30363d\] text-white font-bold border border-neutral-400 shadow-sm',
     'bg-[#262630] text-white font-semibold shadow-sm border border-white/20'),
    (r'bg-\[#21262d\] text-white font-semibold border border-neutral-400 shadow-sm',
     'bg-[#262630] text-white font-semibold border border-white/20 shadow-sm'),

    # Inactive Tabs Hover
    (r'text-neutral-400 hover:text-white hover:bg-\[#21262d\]/50 hover:border-\[#30363d\]',
     'text-neutral-400 hover:text-white hover:bg-[#22222a] hover:border-[#333340]'),
    (r'text-neutral-400 hover:text-white hover:bg-\[#21262d\] hover:border-\[#30363d\]',
     'text-neutral-400 hover:text-white hover:bg-[#22222a] hover:border-[#333340]'),

    # Action Buttons
    (r'bg-\[#21262d\] border border-\[#30363d\] text-white hover:border-neutral-400 hover:bg-\[#30363d\]',
     'bg-[#1f1f26] border border-[#2c2c36] text-neutral-200 hover:text-white hover:bg-[#262630] hover:border-neutral-400'),
    (r'bg-\[#21262d\] border border-\[#30363d\] text-neutral-200 hover:text-white hover:border-neutral-400 hover:bg-\[#30363d\]',
     'bg-[#1f1f26] border border-[#2c2c36] text-neutral-200 hover:text-white hover:bg-[#262630] hover:border-neutral-400'),
]

updated = 0
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            original = content
            for pat, rep in replacements:
                content = re.sub(pat, rep, content)
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                updated += 1
                print(f'Updated {path}')

print(f'Total files updated with Antigravity theme: {updated}')
