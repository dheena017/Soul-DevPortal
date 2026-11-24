import os
import re
from collections import Counter

bg_counts = Counter()
border_counts = Counter()

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.css')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fp:
                content = fp.read()
                for m in re.findall(r'bg-\[#([0-9a-fA-F]{6})\]', content):
                    bg_counts[m.lower()] += 1
                for m in re.findall(r'border-\[#([0-9a-fA-F]{6})\]', content):
                    border_counts[m.lower()] += 1

print('=== PALETTE AUDIT REPORT ===')
print('Background surfaces:')
for h, c in bg_counts.most_common():
    label = 'Slightly Lighter Dark' if h == '111116' else ('Deep Black Canvas/Wells' if h == '0a0a0a' else 'Divider line')
    print(f'  #{h}: {c} occurrences [{label}]')

print('\nBorders & Dividers:')
for h, c in border_counts.most_common():
    label = 'Primary Outer Border' if h == '282838' else ('Subtle Divider Border' if h == '22222e' else 'Active Accent')
    print(f'  #{h}: {c} occurrences [{label}]')
