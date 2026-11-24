import os
import re

fixes = [
    ('divide-[#1c1c1c]', 'divide-[#22222e]'),
    ('from-[#111118] to-[#141422]', 'bg-[#111116]'),
    ('bg-gradient-to-r from-[#111118] to-[#141422]', 'bg-[#111116]'),
    ('hover:bg-[#16161d]', 'hover:bg-[#111116]'),
    ('stopColor="#0f172a"', 'stopColor="#0a0a0a"'),
    ('stopColor="#1e2230"', 'stopColor="#111116"'),
    ('stopColor="#0b0d13"', 'stopColor="#0a0a0a"'),
    ('--surface-hover: #16161d;', '--surface-hover: #111116;'),
    ('--surface-active: #1c1c24;', '--surface-active: #111116;'),
    ('--border-muted: #1c1c24;', '--border-muted: #22222e;'),
]

modified_files = []
for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.css', '.html')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fp:
                orig = fp.read()
            mod = orig
            for old, new in fixes:
                mod = mod.replace(old, new)
            if mod != orig:
                with open(p, 'w', encoding='utf-8') as fp:
                    fp.write(mod)
                modified_files.append(p)

print('Enforced palette on files:', len(modified_files))
for mf in modified_files:
    print(' -', mf)
