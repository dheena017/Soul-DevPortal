import os

replacements = [
    ('#111116', '#111111'),
    ('#282838', '#222222'),
    ('#22222e', '#1a1a1a'),
]

modified_files = []
for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts', '.css', '.html', '.json')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fp:
                content = fp.read()
            orig = content
            for old, new in replacements:
                content = content.replace(old, new)
            if content != orig:
                with open(p, 'w', encoding='utf-8') as fp:
                    fp.write(content)
                modified_files.append(p)

for extra in ['index.html']:
    if os.path.exists(extra):
        with open(extra, 'r', encoding='utf-8') as fp:
            content = fp.read()
        orig = content
        for old, new in replacements:
            content = content.replace(old, new)
        if content != orig:
            with open(extra, 'w', encoding='utf-8') as fp:
                fp.write(content)
            modified_files.append(extra)

print(f"Replaced bluish-dark colors with true neutral colors (#111111, #222222, #1a1a1a) in {len(modified_files)} files.")
for mf in modified_files[:15]:
    print(" -", mf)
if len(modified_files) > 15:
    print(f" ... and {len(modified_files) - 15} more files.")
