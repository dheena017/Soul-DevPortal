with open('src/components/Sidebar.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Overview button in Sidebar
content = content.replace(
    """                isActive('overview')
                  ? 'bg-[#111116] text-white font-semibold border border-[#282838] shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-[#111116]'""",
    """                isActive('overview')
                  ? 'bg-blue-500/10 text-white font-semibold border border-blue-500/40 shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-white/[0.04] hover:border-[#282838] border border-transparent'"""
)

# 2. Scripts button in Sidebar
content = content.replace(
    """                (isActive('scripts') || isActive('commands') || isActive('runners'))
                  ? 'bg-[#111116] text-white font-semibold border border-[#282838] shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-[#111116]'""",
    """                (isActive('scripts') || isActive('commands') || isActive('runners'))
                  ? 'bg-blue-500/10 text-white font-semibold border border-blue-500/40 shadow-sm'
                  : 'text-neutral-300 hover:text-white hover:bg-white/[0.04] hover:border-[#282838] border border-transparent'"""
)

# 3. Projects section header in Sidebar
content = content.replace(
    """                className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                  isActive('projects')
                    ? 'bg-[#111116] text-white font-semibold border border-[#282838]'
                    : 'text-neutral-300 hover:text-white hover:bg-[#111116]'
                }`}""",
    """                className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                  isActive('projects')
                    ? 'bg-blue-500/10 text-white font-semibold border border-blue-500/40'
                    : 'text-neutral-300 hover:text-white hover:bg-white/[0.04] hover:border-[#282838] border border-transparent'
                }`}"""
)

# 4. Project child items in Sidebar
content = content.replace(
    """                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors text-left ${
                        isProjActive
                          ? 'bg-[#111116] text-white font-semibold border border-[#282838]'
                          : 'text-neutral-400 hover:text-white hover:bg-[#111116]'
                      }`}""",
    """                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors text-left ${
                        isProjActive
                          ? 'bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/30'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}"""
)

# 5. Packages section header in Sidebar
content = content.replace(
    """                className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                  (isActive('packages') || isActive('packages-dashboard'))
                    ? 'bg-[#111116] text-white font-semibold border border-[#282838]'
                    : 'text-neutral-300 hover:text-white hover:bg-[#111116]'
                }`}""",
    """                className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                  (isActive('packages') || isActive('packages-dashboard'))
                    ? 'bg-blue-500/10 text-white font-semibold border border-blue-500/40'
                    : 'text-neutral-300 hover:text-white hover:bg-white/[0.04] hover:border-[#282838] border border-transparent'
                }`}"""
)

# 6. Package child items in Sidebar
content = content.replace(
    """                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors text-left ${
                        isPkgActive
                          ? 'bg-[#111116] text-white font-semibold border border-[#282838]'
                          : 'text-neutral-400 hover:text-white hover:bg-[#111116]'
                      }`}""",
    """                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors text-left ${
                        isPkgActive
                          ? 'bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/30'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}"""
)

# 7. Docs section header in Sidebar
content = content.replace(
    """                className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                  (isActive('docs') || isActive('docs-dashboard'))
                    ? 'bg-[#111116] text-white font-semibold border border-[#282838]'
                    : 'text-neutral-300 hover:text-white hover:bg-[#111116]'
                }`}""",
    """                className={`flex-1 flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-colors ${
                  (isActive('docs') || isActive('docs-dashboard'))
                    ? 'bg-blue-500/10 text-white font-semibold border border-blue-500/40'
                    : 'text-neutral-300 hover:text-white hover:bg-white/[0.04] hover:border-[#282838] border border-transparent'
                }`}"""
)

# 8. Doc guide child items in Sidebar
content = content.replace(
    """                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors text-left ${
                        isGuideActive
                          ? 'bg-[#111116] text-white font-semibold border border-[#282838]'
                          : 'text-neutral-400 hover:text-white hover:bg-[#111116]'
                      }`}""",
    """                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors text-left ${
                        isGuideActive
                          ? 'bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/30'
                          : 'text-neutral-400 hover:text-white hover:bg-white/[0.04] border border-transparent'
                      }`}"""
)

with open('src/components/Sidebar.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated Sidebar.tsx")
