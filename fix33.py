content = open('src/screens/HomeScreen.tsx', 'r', encoding='utf-8').read()
# Hide trading from services list
content = content.replace(
    '  { id: "trading", name: "Bot", icon: TrendingUp, color: "#FACC15" },',
    '  // { id: "trading", name: "Bot", icon: TrendingUp, color: "#FACC15" }, // Hidden - Admin only'
)
# Hide Trading ROI Dashboard section
content = content.replace(
    '      {/* Trading ROI Dashboard */}\n      {stats.isActivated && (',
    '      {/* Trading ROI Dashboard - Hidden until admin enables */}\n      {false && stats.isActivated && ('
)
open('src/screens/HomeScreen.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
