import os
import re

# 1. Update theme.css
theme_path = 'src/styles/theme.css'
with open(theme_path, 'r', encoding='utf-8') as f:
    theme = f.read()

# Exact Antigravity Screenshot Tokens
theme = re.sub(r'--page-bg:\s*#[a-fA-F0-9]+;', '--page-bg: #070708;', theme)
theme = re.sub(r'--surface:\s*#[a-fA-F0-9]+;', '--surface: #151519;', theme)
theme = re.sub(r'--surface-raised:\s*#[a-fA-F0-9]+;', '--surface-raised: #1c1c21;', theme)
theme = re.sub(r'--surface-hover:\s*#[a-fA-F0-9]+;', '--surface-hover: #212126;', theme)
theme = re.sub(r'--surface-active:\s*#[a-fA-F0-9]+;', '--surface-active: #262629;', theme)
theme = re.sub(r'--border:\s*#[a-fA-F0-9]+;', '--border: #212126;', theme)
theme = re.sub(r'--border-subtle:\s*#[a-fA-F0-9]+;', '--border-subtle: #19191d;', theme)
theme = re.sub(r'--border-muted:\s*#[a-fA-F0-9]+;', '--border-muted: #19191d;', theme)
theme = re.sub(r'--border-active:\s*#[a-fA-F0-9]+;', '--border-active: #ffffff;', theme)
theme = re.sub(r'--text-primary:\s*#[a-fA-F0-9]+;', '--text-primary: #ffffff;', theme)
theme = re.sub(r'--text-secondary:\s*#[a-fA-F0-9]+;', '--text-secondary: #babbc3;', theme)
theme = re.sub(r'--text-muted:\s*#[a-fA-F0-9]+;', '--text-muted: #98989a;', theme)

# Scrollbars
theme = re.sub(r'::-webkit-scrollbar-track\s*\{\s*background:\s*#[a-fA-F0-9]+;\s*\}',
               '::-webkit-scrollbar-track {\n  background: #070708;\n}', theme)
theme = re.sub(r'::-webkit-scrollbar-thumb\s*\{\s*background:\s*#[a-fA-F0-9]+;\s*border-radius:\s*9999px;\s*\}',
               '::-webkit-scrollbar-thumb {\n  background: #212126;\n  border-radius: 9999px;\n}', theme)
theme = re.sub(r'::-webkit-scrollbar-thumb:hover\s*\{\s*background:\s*#[a-fA-F0-9]+;\s*\}',
               '::-webkit-scrollbar-thumb:hover {\n  background: #383842;\n}', theme)

with open(theme_path, 'w', encoding='utf-8') as f:
    f.write(theme)
print('Updated theme.css with exact Antigravity screenshot tokens')

# 2. Update components.css & projects.css
comp_css = 'src/styles/components.css'
if os.path.exists(comp_css):
    with open(comp_css, 'r', encoding='utf-8') as f:
        ccss = f.read()
    ccss = re.sub(r'rgba\(23,\s*23,\s*28,\s*0\.85\)', 'rgba(21, 21, 25, 0.85)', ccss)
    ccss = re.sub(r'border-color:\s*#[a-fA-F0-9]+;', 'border-color: #33333d;', ccss)
    with open(comp_css, 'w', encoding='utf-8') as f:
        f.write(ccss)
    print('Updated components.css')

proj_css = 'src/styles/projects.css'
if os.path.exists(proj_css):
    with open(proj_css, 'r', encoding='utf-8') as f:
        pcss = f.read()
    pcss = pcss.replace('#282832', '#212126')
    with open(proj_css, 'w', encoding='utf-8') as f:
        f.write(pcss)
    print('Updated projects.css')

# 3. Sidebar.tsx and Header.tsx specific backgrounds
sb_path = 'src/components/Sidebar.tsx'
if os.path.exists(sb_path):
    with open(sb_path, 'r', encoding='utf-8') as f:
        sb = f.read()
    sb = sb.replace('bg-[#17171c]', 'bg-[#111114]')
    sb = sb.replace('border-[#282832]', 'border-[#1f1f24]')
    with open(sb_path, 'w', encoding='utf-8') as f:
        f.write(sb)
    print('Set Sidebar.tsx background to #111114')

hdr_path = 'src/components/Header.tsx'
if os.path.exists(hdr_path):
    with open(hdr_path, 'r', encoding='utf-8') as f:
        hdr = f.read()
    hdr = hdr.replace('bg-[#17171c]/95', 'bg-[#111114]/95')
    hdr = hdr.replace('bg-[#17171c]', 'bg-[#111114]')
    hdr = hdr.replace('border-[#282832]', 'border-[#1f1f24]')
    with open(hdr_path, 'w', encoding='utf-8') as f:
        f.write(hdr)
    print('Set Header.tsx background to #111114')

# 4. Universal replacement across all source files
replacements = [
    # Surface & background mappings
    (r'#0e0e11', '#070708'),
    (r'#17171c', '#151519'),
    (r'#282832', '#212126'),
    (r'#1e1e24', '#19191d'),
    (r'#1f1f26', '#19191d'),
    (r'#262630', '#262629'),

    # Active Tabs & Selected Pills in Antigravity Style
    (r'bg-\[#262629\] text-white font-semibold shadow-sm border border-white/20',
     'bg-[#262629] text-white font-semibold shadow-sm border border-[#333338]'),
    (r'bg-\[#262629\] text-white font-semibold border border-white/20 shadow-sm',
     'bg-[#262629] text-white font-semibold border border-[#333338] shadow-sm'),

    # Hover
    (r'hover:bg-\[#22222a\] hover:border-\[#333340\]',
     'hover:bg-[#1a1a1e] hover:border-[#2a2a32]'),
    (r'hover:bg-\[#262630\] hover:border-neutral-400',
     'hover:bg-[#262629] hover:border-[#383842]'),

    # Action Buttons
    (r'bg-\[#1f1f26\] border border-\[#2c2c36\] text-neutral-200',
     'bg-[#1a1a20] border border-[#26262e] text-[#babbc3]'),
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

print(f'Total files updated with exact Antigravity screenshot palette: {updated}')
