import os
import re

replacements = [
    # GuideDetail tabs
    ('bg-blue-500/15 text-white font-bold border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]',
     'bg-[#111111] text-white font-bold border border-[#222222] shadow-sm'),
    
    # Overview pillar icon containers
    ('w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-2xl',
     'w-12 h-12 rounded-xl bg-[#111111] border border-[#222222] flex items-center justify-center text-2xl'),
    ('w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-2xl',
     'w-12 h-12 rounded-xl bg-[#111111] border border-[#222222] flex items-center justify-center text-2xl'),
    
    # Callout.tsx
    ("badgeClass: 'text-white bg-blue-500/10 border-blue-500/30',",
     "badgeClass: 'text-neutral-300 bg-[#111111] border border-[#222222]',"),
    ("badgeClass: 'text-white bg-blue-500/10 border-[#222222]',",
     "badgeClass: 'text-neutral-300 bg-[#111111] border border-[#222222]',"),
    ("containerClass: 'bg-sky-500/5 border-blue-500/30 text-neutral-200',",
     "containerClass: 'bg-[#111111] border border-[#222222] text-neutral-200',"),
    ("containerClass: 'bg-blue-500/5 border-blue-500/30 text-neutral-200',",
     "containerClass: 'bg-[#111111] border border-[#222222] text-neutral-200',"),
    ("containerClass: 'bg-blue-500/5 border-[#222222] text-neutral-200',",
     "containerClass: 'bg-[#111111] border border-[#222222] text-neutral-200',"),
    
    # CopyButton.tsx copied feedback
    ("'bg-blue-500/15 border-blue-500/30 text-white'",
     "'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'"),
    ("'bg-blue-500/10 text-white border-transparent'",
     "'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'"),
    
    # Markdown blockquotes and badges
    ('border-l-2 border-blue-500/40 bg-[#111111]/50',
     'border-l-2 border-neutral-600 bg-[#111111]'),
    ("bg-blue-500/20 text-white border border-blue-500/30",
     "bg-[#111111] text-white border border-[#222222]"),
     
    # CodeSnippetGenerator.tsx
    ("bg-blue-600 text-white shadow-md border border-blue-500",
     "bg-[#111111] text-white font-bold border border-[#222222] shadow-sm"),
    ("bg-blue-500/15 border border-blue-500/30 text-white",
     "bg-[#111111] border border-[#222222] text-neutral-300"),
]

modified = []
for root, _, files in os.walk('src'):
    for f in files:
        if f.endswith(('.tsx', '.ts')):
            p = os.path.join(root, f)
            with open(p, 'r', encoding='utf-8') as fp:
                c = fp.read()
            orig = c
            for old, new in replacements:
                c = c.replace(old, new)
            if c != orig:
                with open(p, 'w', encoding='utf-8') as fp:
                    fp.write(c)
                modified.append(p)

print(f"Updated {len(modified)} files.")
for m in modified:
    print(" -", m)
