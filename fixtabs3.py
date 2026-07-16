with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Make tabs scrollable
content = content.replace(
    'className="flex gap-1.5"',
    'className="flex gap-1.5 overflow-x-auto pb-1" style={{scrollbarWidth: "none"}}'
)

# Remove flex-1 from tab buttons to prevent stretching
content = content.replace(
    "flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1",
    "shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1"
)

with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
