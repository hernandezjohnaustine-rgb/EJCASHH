with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the tabs container with a sidebar layout
old_tabs = '''        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{scrollbarWidth: "none"}}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as AdminTab); fetchData(tab.id); }}
              className={`shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${
                activeTab === tab.id ? "bg-brand-primary text-brand-black" : "bg-brand-card/5 border border-brand-border text-brand-text/60"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>'''

new_tabs = '''        {/* Mobile: horizontal scrollable tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:hidden" style={{scrollbarWidth: "none", msOverflowStyle: "none"}}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as AdminTab); fetchData(tab.id); }}
              className={"shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 " + (activeTab === tab.id ? "bg-brand-primary text-brand-black" : "bg-brand-card/5 border border-brand-border text-brand-text/60")}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>'''

content = content.replace(old_tabs, new_tabs)

# Replace main content area with sidebar layout
old_content = '      <div className="px-4 py-4 flex flex-col gap-4">'
new_content = '''      <div className="flex gap-0 min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-52 shrink-0 border-r border-brand-border bg-brand-black/50 sticky top-[120px] h-[calc(100vh-120px)] overflow-y-auto py-4 px-3 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as AdminTab); fetchData(tab.id); }}
              className={"w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all " + (activeTab === tab.id ? "bg-brand-primary text-brand-black" : "text-brand-text/60 hover:bg-brand-card/10 hover:text-brand-text")}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Main Content */}
        <div className="flex-1 px-4 py-4 flex flex-col gap-4 overflow-x-hidden">'''

content = content.replace(old_content, new_content)

# Close the extra div before the final closing div
content = content.replace(
    '    </div>\n  );\n}',
    '        </div>\n      </div>\n    </div>\n  );\n}'
)

with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
