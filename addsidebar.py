with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the content div opening with sidebar + content layout
content = content.replace(
    '      <div className="px-4 py-4">',
    '''      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-56 shrink-0 border-r border-brand-border bg-brand-black sticky top-[120px] self-start h-[calc(100vh-120px)] overflow-y-auto py-4 px-3 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as AdminTab); fetchData(tab.id); }}
              className={"w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all text-left " + (activeTab === tab.id ? "bg-brand-primary text-brand-black" : "text-brand-text/60 hover:bg-brand-card/10 hover:text-brand-text")}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Main Content */}
        <div className="flex-1 px-4 py-4 overflow-x-hidden">'''
)

# Close the extra divs before the final closing
content = content.replace(
    '    </div>\n  );\n}',
    '        </div>\n      </div>\n    </div>\n  );\n}'
)

with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
