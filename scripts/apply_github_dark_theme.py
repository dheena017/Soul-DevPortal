import os
import re

# 1. Update theme.css
theme_path = 'src/styles/theme.css'
with open(theme_path, 'r', encoding='utf-8') as f:
    theme = f.read()

theme = re.sub(r'--page-bg:\s*#[a-fA-F0-9]+;', '--page-bg: #0d1117;', theme)
theme = re.sub(r'--surface:\s*#[a-fA-F0-9]+;', '--surface: #161b22;', theme)
theme = re.sub(r'--surface-raised:\s*#[a-fA-F0-9]+;', '--surface-raised: #21262d;', theme)
theme = re.sub(r'--surface-hover:\s*#[a-fA-F0-9]+;', '--surface-hover: #30363d;', theme)
theme = re.sub(r'--surface-active:\s*#[a-fA-F0-9]+;', '--surface-active: #21262d;', theme)
theme = re.sub(r'--border:\s*#[a-fA-F0-9]+;', '--border: #30363d;', theme)
theme = re.sub(r'--border-subtle:\s*#[a-fA-F0-9]+;', '--border-subtle: #21262d;', theme)
theme = re.sub(r'--border-muted:\s*#[a-fA-F0-9]+;', '--border-muted: #21262d;', theme)
theme = re.sub(r'--border-active:\s*#[a-fA-F0-9]+;', '--border-active: #f0f6fc;', theme)
theme = re.sub(r'--text-primary:\s*#[a-fA-F0-9]+;', '--text-primary: #f0f6fc;', theme)
theme = re.sub(r'--text-secondary:\s*#[a-fA-F0-9]+;', '--text-secondary: #c9d1d9;', theme)
theme = re.sub(r'--text-muted:\s*#[a-fA-F0-9]+;', '--text-muted: #8b949e;', theme)

# Scrollbars
theme = re.sub(r'::-webkit-scrollbar-track\s*\{\s*background:\s*#[a-fA-F0-9]+;\s*\}',
               '::-webkit-scrollbar-track {\n  background: #0d1117;\n}', theme)
theme = re.sub(r'::-webkit-scrollbar-thumb\s*\{\s*background:\s*#[a-fA-F0-9]+;\s*border-radius:\s*9999px;\s*\}',
               '::-webkit-scrollbar-thumb {\n  background: #30363d;\n  border-radius: 9999px;\n}', theme)
theme = re.sub(r'::-webkit-scrollbar-thumb:hover\s*\{\s*background:\s*#[a-fA-F0-9]+;\s*\}',
               '::-webkit-scrollbar-thumb:hover {\n  background: #8b949e;\n}', theme)

with open(theme_path, 'w', encoding='utf-8') as f:
    f.write(theme)
print('Updated theme.css with GitHub Dark design tokens')

# 2. Update styles/projects.css
proj_css = 'src/styles/projects.css'
if os.path.exists(proj_css):
    with open(proj_css, 'r', encoding='utf-8') as f:
        pcss = f.read()
    pcss = pcss.replace('#222222', '#30363d')
    with open(proj_css, 'w', encoding='utf-8') as f:
        f.write(pcss)
    print('Updated projects.css')

# 3. Update styles/components.css
comp_css = 'src/styles/components.css'
if os.path.exists(comp_css):
    with open(comp_css, 'r', encoding='utf-8') as f:
        ccss = f.read()
    ccss = ccss.replace('#555555', '#8b949e')
    ccss = re.sub(r'rgba\(17,\s*17,\s*17,\s*0\.85\)', 'rgba(22, 27, 34, 0.85)', ccss)
    with open(comp_css, 'w', encoding='utf-8') as f:
        f.write(ccss)
    print('Updated components.css')

# 4. Universal replacement across all .tsx, .ts, .css in src
color_replacements = [
    # Surface & background mappings
    (r'#0a0a0a', '#0d1117'),
    (r'#111111', '#161b22'),
    (r'#222222', '#30363d'),
    (r'#1a1a1a', '#21262d'),
    (r'#161616', '#21262d'),
    (r'#1f1f1f', '#21262d'),

    # High-contrast highlight for active tabs & selected buttons
    (r'bg-\[#1a1a1a\] text-white font-bold border border-neutral-600 shadow-sm',
     'bg-[#21262d] text-white font-bold border-2 border-neutral-400 shadow-md'),
    (r'bg-\[#1a1a1a\] text-white font-bold shadow-sm border border-neutral-600',
     'bg-[#21262d] text-white font-bold shadow-sm border-2 border-neutral-400'),
    (r'bg-\[#1a1a1a\] text-white font-semibold border border-neutral-600',
     'bg-[#21262d] text-white font-semibold border border-neutral-400 shadow-sm'),

    # Buttons
    (r'bg-\[#21262d\] border border-neutral-700 text-neutral-200 hover:text-white hover:border-neutral-400 hover:bg-neutral-800',
     'bg-[#21262d] border border-[#30363d] text-white hover:border-neutral-400 hover:bg-[#30363d]'),
    (r'bg-\[#21262d\] border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-400 hover:bg-neutral-800',
     'bg-[#21262d] border border-[#30363d] text-neutral-200 hover:text-white hover:border-neutral-400 hover:bg-[#30363d]'),

    # Badges inside active tabs
    (r'bg-neutral-800 text-white border border-neutral-600 font-bold',
     'bg-[#30363d] text-white border border-neutral-400 font-bold'),
]

updated = 0
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            original = content
            for pat, rep in color_replacements:
                content = re.sub(pat, rep, content)
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                updated += 1
                print(f'Updated {path}')

print(f'Total files updated with GitHub Dark High-Contrast palette: {updated}')
