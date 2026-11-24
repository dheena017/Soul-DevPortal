import os
import re

# 1. Update theme.css
theme_path = 'src/styles/theme.css'
if os.path.exists(theme_path):
    with open(theme_path, 'r', encoding='utf-8') as f:
        theme = f.read()
    theme = re.sub(r'--text-primary:\s*#[a-fA-F0-9]+;', '--text-primary: #a3a3a3;', theme)
    theme = re.sub(r'--text-secondary:\s*#[a-fA-F0-9]+;', '--text-secondary: #8c8c8c;', theme)
    theme = re.sub(r'--text-muted:\s*#[a-fA-F0-9]+;', '--text-muted: #666666;', theme)
    theme = re.sub(r'--border-active:\s*#[a-fA-F0-9]+;', '--border-active: #555555;', theme)
    with open(theme_path, 'w', encoding='utf-8') as f:
        f.write(theme)
    print('Updated src/styles/theme.css')

# 2. Update components.css
comp_path = 'src/styles/components.css'
if os.path.exists(comp_path):
    with open(comp_path, 'r', encoding='utf-8') as f:
        comp = f.read()
    comp = re.sub(r'border-color:\s*rgba\(59,\s*130,\s*246,\s*0\.4\);', 'border-color: #555555;', comp)
    with open(comp_path, 'w', encoding='utf-8') as f:
        f.write(comp)
    print('Updated src/styles/components.css')

# 3. Update overview.css
ov_path = 'src/styles/overview.css'
if os.path.exists(ov_path):
    with open(ov_path, 'r', encoding='utf-8') as f:
        ov = f.read()
    ov = re.sub(r'text-shadow:\s*0\s*0\s*20px\s*rgba\(56,\s*189,\s*248,\s*0\.25\);', 'text-shadow: none;', ov)
    with open(ov_path, 'w', encoding='utf-8') as f:
        f.write(ov)
    print('Updated src/styles/overview.css')

# 4. Process all .tsx and .ts files
tsx_replacements = [
    # Remaining blue in ProjectFileExplorer
    (r'border-blue-500/50', 'border-neutral-500'),

    # Buttons: replace stark bg-white text-black with sleek neutral dark button
    (r'bg-white text-black font-bold hover:bg-neutral-200 transition-all shadow-md shadow-sm',
     'bg-[#111111] border border-[#222222] text-neutral-300 font-bold hover:text-neutral-100 hover:border-neutral-500 transition-all shadow-sm'),
    (r'bg-white text-black font-bold hover:bg-neutral-200 transition-all shadow-lg shadow-sm',
     'bg-[#111111] border border-[#222222] text-neutral-300 font-bold hover:text-neutral-100 hover:border-neutral-500 transition-all shadow-sm'),
    (r'bg-white text-black font-bold hover:bg-neutral-200',
     'bg-[#111111] border border-[#222222] text-neutral-300 font-bold hover:text-neutral-100 hover:border-neutral-500'),
    (r'bg-white hover:bg-neutral-200 text-black font-bold',
     'bg-[#111111] border border-[#222222] text-neutral-300 font-bold hover:text-neutral-100 hover:border-neutral-500'),
    (r'bg-white text-black font-bold group-hover:bg-neutral-200',
     'bg-[#111111] border border-[#222222] text-neutral-300 font-bold group-hover:text-neutral-100 group-hover:border-neutral-500'),
    (r'bg-white text-black font-bold shadow-sm border border-white',
     'bg-[#111111] text-neutral-200 font-bold shadow-sm border border-[#222222]'),
    (r'bg-white text-black font-bold',
     'bg-[#111111] border border-[#222222] text-neutral-300 font-bold hover:text-neutral-100'),
    (r'bg-white text-black',
     'bg-[#111111] border border-[#222222] text-neutral-300 hover:text-neutral-100'),

    # Hover text: soften to neutral-200 instead of glaring pure white
    (r'hover:text-white', 'hover:text-neutral-200'),
    (r'group-hover:text-white', 'group-hover:text-neutral-200'),

    # Headings & titles: change text-white to text-neutral-200
    (r'(<(?:h1|h2|h3|h4)[^>]*\b)text-white\b', r'\1text-neutral-200'),
    (r'(<(?:strong|b)[^>]*\b)text-white\b', r'\1text-neutral-200'),

    # Active states / badges / general spans: change text-white to text-neutral-300 or text-neutral-200
    (r'activeTab === \'[^\']+\'\s*\?\s*\'[^\']*?\btext-white\b', lambda m: m.group(0).replace('text-white', 'text-neutral-200')),
    (r'isProjActive\s*\?\s*\'[^\']*?\btext-white\b', lambda m: m.group(0).replace('text-white', 'text-neutral-200')),
    (r'isActive\([^\)]+\)\s*\?\s*\'[^\']*?\btext-white\b', lambda m: m.group(0).replace('text-white', 'text-neutral-200')),

    # Replace remaining text-white with text-neutral-300 for crisp, dark/subdued readability
    (r'\btext-white\b', 'text-neutral-300'),
]

updated_count = 0
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            original = content
            for pattern, repl in tsx_replacements:
                if callable(repl):
                    content = re.sub(pattern, repl, content)
                else:
                    content = re.sub(pattern, repl, content)
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                updated_count += 1
                print(f'Updated: {path}')

print(f'Total ts/tsx files updated: {updated_count}')
