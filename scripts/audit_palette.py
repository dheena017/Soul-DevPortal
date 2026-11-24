import os
import re

patterns = {
    '#111111': re.compile(r'#111111'),
    '#0a0a0a': re.compile(r'#0a0a0a'),
    '#222222': re.compile(r'#222222'),
    '#1a1a1a': re.compile(r'#1a1a1a'),
    '#111116 (FORBIDDEN)': re.compile(r'#111116', re.I),
    '#282838 (FORBIDDEN)': re.compile(r'#282838', re.I),
    '#22222e (FORBIDDEN)': re.compile(r'#22222e', re.I),
}

counts = {k: 0 for k in patterns}
violations = []

for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.css')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fp:
                content = fp.read()
                for name, pat in patterns.items():
                    c = len(pat.findall(content))
                    counts[name] += c
                    if 'FORBIDDEN' in name and c > 0:
                        violations.append(f"{p}: {c} occurrences of {name}")

print("=== PALETTE AUDIT REPORT ===")
for name, count in counts.items():
    print(f"  {name}: {count}")

if violations:
    print("\nVIOLATIONS FOUND:")
    for v in violations:
        print("  -", v)
else:
    print("\nSUCCESS: 0 forbidden bluish-dark colors found! Palette is 100% clean true neutral.")
