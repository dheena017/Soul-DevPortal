import re

with open('src/features/projects/detail/ProjectDetailHeader.tsx', 'r', encoding='utf-8') as f:
    proj_content = f.read()

# Replace active SVG drop-shadow blue with clean text-white
proj_content = re.sub(
    r"activeTab === '(\w+)' \? 'text-blue-400 drop-shadow-\[0_0_6px_rgba\(59,130,246,0\.4\)\]' : ''",
    r"activeTab === '\1' ? 'text-white' : 'text-neutral-400'",
    proj_content
)

# Replace active tab badge blue with clean white badge
proj_content = re.sub(
    r"activeTab === '(\w+)' \? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold' : 'bg-\[#111116\] text-neutral-400 border border-\[#282838\]'",
    r"activeTab === '\1' ? 'bg-[#111116] text-white border border-[#282838] font-bold' : 'bg-[#111116] text-neutral-400 border border-[#22222e]'",
    proj_content
)

with open('src/features/projects/detail/ProjectDetailHeader.tsx', 'w', encoding='utf-8') as f:
    f.write(proj_content)
print("Updated ProjectDetailHeader.tsx tabs")

with open('src/features/packages/detail/PackageDetailHeader.tsx', 'r', encoding='utf-8') as f:
    pkg_content = f.read()

pkg_content = pkg_content.replace(
    "bg-blue-500/15 text-blue-400 font-bold border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.18)]",
    "bg-[#111116] text-white font-bold border border-[#282838] shadow-sm"
)
pkg_content = re.sub(
    r"activeTab === '(\w+)' \? 'text-blue-400' : ''",
    r"activeTab === '\1' ? 'text-white' : 'text-neutral-400'",
    pkg_content
)
pkg_content = pkg_content.replace(
    "activeTab === 'api' ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold' : 'bg-[#111116] text-neutral-400 border border-[#282838]'",
    "activeTab === 'api' ? 'bg-[#111116] text-white border border-[#282838] font-bold' : 'bg-[#111116] text-neutral-400 border border-[#22222e]'"
)

with open('src/features/packages/detail/PackageDetailHeader.tsx', 'w', encoding='utf-8') as f:
    f.write(pkg_content)
print("Updated PackageDetailHeader.tsx tabs")
