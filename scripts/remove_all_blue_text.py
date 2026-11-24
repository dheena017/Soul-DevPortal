import os
import re

replacements = [
    # Status badges / pills
    ('bg-blue-500/10 border border-blue-500/40 text-xs font-semibold text-blue-400 select-none shadow-sm',
     'bg-[#111111] border border-[#222222] text-xs font-semibold text-white select-none shadow-sm'),
    ('bg-blue-500/10 border border-blue-500/30 text-xs font-semibold text-blue-400',
     'bg-[#111111] border border-[#222222] text-xs font-semibold text-white'),
    ('w-2 h-2 rounded-full bg-blue-400', 'w-2 h-2 rounded-full bg-emerald-400'),
    ('w-1.5 h-1.5 rounded-full bg-blue-400', 'w-1.5 h-1.5 rounded-full bg-emerald-400'),
    
    # Section uppercase trackers
    ('uppercase tracking-wider text-blue-400', 'uppercase tracking-wider text-neutral-400'),
    
    # Metric counts and bold numbers
    ('text-blue-400 font-mono', 'text-white font-mono'),
    ('font-mono text-blue-400', 'font-mono text-white'),
    ('font-bold text-blue-400', 'font-bold text-white'),
    ('text-blue-400 font-bold', 'text-white font-bold'),
    ('text-blue-300 font-mono', 'text-neutral-200 font-mono'),
    ('font-mono text-blue-300', 'font-mono text-neutral-200'),
    
    # Icon colors
    ('text-blue-400 shrink-0', 'text-neutral-400 shrink-0'),
    ('w-3.5 h-3.5 text-blue-400', 'w-3.5 h-3.5 text-neutral-400'),
    ('w-4 h-4 text-blue-400', 'w-4 h-4 text-neutral-400'),
    ('w-5 h-5 text-blue-400', 'w-5 h-5 text-neutral-300'),
    ('w-6 h-6 text-blue-400', 'w-6 h-6 text-neutral-300'),
    
    # Hero icon wrappers
    ('bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400',
     'bg-[#111111] border border-[#222222] flex items-center justify-center text-white'),
    ('bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400',
     'bg-[#111111] border border-[#222222] flex items-center justify-center text-white'),
    ('bg-blue-500/10 border border-[#222222] flex items-center justify-center text-blue-400',
     'bg-[#111111] border border-[#222222] flex items-center justify-center text-white'),
    
    # Pillar & header tags
    ('bg-blue-500/15 border border-blue-500/30 text-blue-400',
     'bg-[#111111] border border-[#222222] text-neutral-300'),
    ('bg-blue-500/10 border border-blue-500/30 text-blue-400',
     'bg-[#111111] border border-[#222222] text-neutral-300'),
    ('bg-blue-500/15 border border-blue-500/20 text-blue-400',
     'bg-[#111111] border border-[#222222] text-neutral-300'),
    ('bg-blue-500/10 border border-blue-500/25 text-blue-400',
     'bg-[#111111] border border-[#222222] text-neutral-300'),

    # Interactive buttons and primary CTAs
    ('bg-blue-600 text-white hover:bg-blue-500',
     'bg-white text-black font-bold hover:bg-neutral-200'),
    ('bg-blue-600 text-white hover:bg-blue-600/90',
     'bg-white text-black font-bold hover:bg-neutral-200'),
    
    # Hover states
    ('group-hover:text-blue-400', 'group-hover:text-white'),
    ('hover:text-blue-400', 'hover:text-white'),
    ('hover:text-blue-300', 'hover:text-white'),
    ('hover:border-blue-500/40', 'hover:border-neutral-500'),
    ('hover:border-blue-500/50', 'hover:border-neutral-500'),
    ('hover:border-blue-500/30', 'hover:border-neutral-500'),
    
    # Text colors
    ('text-blue-400', 'text-white'),
    ('text-blue-300', 'text-neutral-200'),
    ('text-blue-200', 'text-neutral-200'),
    ('text-sky-400', 'text-white'),
    ('text-sky-300', 'text-neutral-200'),
    ('text-sky-200', 'text-neutral-200'),
]

modified_files = []
for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts')):
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

print(f"Updated blue text in {len(modified_files)} files to white / neutral user-friendly text.")
for mf in modified_files:
    print(" -", mf)
