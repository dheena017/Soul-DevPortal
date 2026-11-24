import os
import re

replacements = [
    # Shadows & glow effects
    (r'shadow-\[0_2px_8px_rgba\(59,130,246,0\.18\)\]', 'shadow-sm'),
    (r'shadow-\[0_2px_10px_rgba\(59,130,246,0\.15\)\]', 'shadow-sm'),
    (r'shadow-\[0_0_6px_rgba\(96,165,250,0\.8\)\]', 'shadow-[0_0_6px_rgba(52,211,153,0.6)]'),
    (r'drop-shadow-\[0_0_6px_rgba\(59,130,246,0\.4\)\]', ''),
    (r'shadow-blue-600/25', 'shadow-sm'),
    (r'shadow-blue-600/20', 'shadow-sm'),
    (r'shadow-blue-500/5', 'shadow-sm'),
    (r'shadow-blue-500', 'shadow-sm'),

    # Gradients & brand
    (r'from-blue-400 to-blue-600', 'from-white to-neutral-400'),
    (r'hover:border-\[#3b82f6\]', 'hover:border-neutral-500'),
    (r'--accent-blue:\s*#[a-fA-F0-9]+;', '--accent-neutral: #ffffff;'),

    # Input focus borders
    (r'focus:border-blue-500/50', 'focus:border-neutral-500'),
    (r'focus:border-blue-500/60', 'focus:border-neutral-500'),
    (r'focus:border-blue-500', 'focus:border-neutral-500'),
    (r'focus:ring-1 focus:ring-blue-500/30', 'focus:ring-1 focus:ring-neutral-500/30'),

    # Active tabs & highlights
    (r'bg-blue-500/25 text-neutral-200 border border-blue-500/40 font-bold', 'bg-[#111111] text-white border border-[#222222] font-bold'),
    (r'bg-blue-500/20 text-neutral-200 border border-blue-500/40 font-bold', 'bg-[#111111] text-white border border-[#222222] font-bold'),
    (r'bg-blue-500/15 text-white font-bold border border-blue-500/40', 'bg-[#111111] text-white font-bold border border-[#222222]'),
    (r'bg-blue-500/15 border-blue-500/40 text-white', 'bg-[#111111] border-[#222222] text-white font-bold'),
    (r'bg-blue-600 text-white shadow-sm border border-blue-500', 'bg-white text-black font-bold shadow-sm border border-white'),
    (r'bg-blue-600 hover:bg-blue-500 text-white', 'bg-white hover:bg-neutral-200 text-black font-bold'),
    (r'bg-blue-600 text-white group-hover:bg-blue-500', 'bg-white text-black font-bold group-hover:bg-neutral-200'),
    (r'bg-blue-600', 'bg-white text-black font-bold'),

    # Badges & containers
    (r'bg-blue-500/10 text-white border border-blue-500/25', 'bg-[#111111] text-neutral-300 border border-[#222222]'),
    (r'bg-blue-500/10 text-white border border-blue-500/30', 'bg-[#111111] text-neutral-300 border border-[#222222]'),
    (r'bg-blue-500/10 text-white border border-blue-500/40', 'bg-[#111111] text-neutral-300 border border-[#222222]'),
    (r'bg-blue-500/10 text-white border border-blue-500/50', 'bg-[#111111] text-neutral-300 border border-[#222222]'),
    (r'bg-blue-500/10 text-white', 'bg-[#111111] text-neutral-300'),
    (r'bg-blue-500/15 text-white', 'bg-[#111111] text-neutral-300'),
    (r'bg-blue-500/15 border border-[#222222] text-white', 'bg-[#111111] border border-[#222222] text-neutral-300'),
    (r'bg-blue-500/15 border border-[#222222]', 'bg-[#111111] border border-[#222222]'),
    (r'bg-blue-500/10 border border-[#222222]', 'bg-[#111111] border border-[#222222]'),
    (r'bg-blue-500/10 border border-blue-500/30', 'bg-[#111111] border border-[#222222]'),
    (r'bg-blue-500/10 border border-blue-500/25', 'bg-[#111111] border border-[#222222]'),
    (r'bg-blue-500/10 border border-blue-500/40', 'bg-[#111111] border border-[#222222]'),
    (r'border border-blue-500/25 bg-blue-500/10', 'border border-[#222222] bg-[#111111]'),
    (r'border border-blue-500/30', 'border border-[#222222]'),
    (r'border border-blue-500/40', 'border border-[#222222]'),
    (r'border border-blue-500/50', 'border border-[#222222]'),
    (r'border border-blue-500/25', 'border border-[#222222]'),
    (r'border border-blue-500', 'border border-[#222222]'),
    (r'bg-blue-500/30 text-white', 'bg-neutral-800 text-white'),
    (r'bg-blue-500/20', 'bg-[#111111]'),
    (r'bg-blue-500/10', 'bg-[#111111]'),
    (r'bg-blue-500/15', 'bg-[#111111]'),
    (r'bg-blue-400', 'bg-emerald-400'),
    (r'bg-blue-500', 'bg-emerald-400'),

    # Copied states
    (r'text-white border-blue-500/50 bg-blue-500/10', 'text-white border-neutral-500 bg-[#111111]'),

    # Constants & themes
    (r"'violet' \| 'emerald' \| 'blue'", "'violet' | 'emerald' | 'neutral'"),
    (r"theme: 'blue' as const", "theme: 'neutral' as const"),
    (r"theme: 'blue'", "theme: 'neutral'"),
    (r'py-grad-blue', 'py-grad-neutral'),
    (r'#387eb8', '#a1a1a1'),
    (r'#366994', '#737373'),
]

updated_files = []
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.tsx', '.ts', '.css')):
            path = os.path.join(root, file)
            with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
            original = content
            for pattern, repl in replacements:
                content = re.sub(pattern, repl, content)
            if content != original:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(content)
                updated_files.append(path)

print(f'Successfully updated {len(updated_files)} files:')
for f in updated_files:
    print('  ', f)
