import os
import re

# The two colors extracted from the user images:
# Image 1: #0f0f0f (Primary canvas / base background / sunken wells)
# Image 2: #181818 (Primary surface / cards / sidebars / headers)

REPLACEMENTS = [
    # Replace deep canvas & well colors
    ('#0a0a0a', '#0f0f0f'),
    ('#0A0A0A', '#0f0f0f'),
    # Replace card & surface colors
    ('#111116', '#181818'),
    ('#111118', '#181818'),
    # Replace hover/active variants with the canonical surface color
    ('#181820', '#181818'),
    ('#16161d', '#181818'),
    ('#1c1c24', '#181818'),
]

TARGET_DIRS = ['src']
EXTRA_FILES = ['index.html', 'server/exporters/data/workspace.json']

modified_files = []

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as fp:
        original = fp.read()
    
    modified = original
    for old_val, new_val in REPLACEMENTS:
        modified = modified.replace(old_val, new_val)
    
    if modified != original:
        with open(file_path, 'w', encoding='utf-8') as fp:
            fp.write(modified)
        modified_files.append(file_path)

# Process standalone files
for extra in EXTRA_FILES:
    if os.path.exists(extra):
        process_file(extra)

# Process directories
for target_dir in TARGET_DIRS:
    for root, _, files in os.walk(target_dir):
        for f in files:
            if f.endswith(('.tsx', '.ts', '.css', '.html')):
                process_file(os.path.join(root, f))

print(f"Successfully processed {len(modified_files)} files to enforce 2-color palette (#0f0f0f & #181818):")
for mf in modified_files:
    print(f"  - {mf}")
