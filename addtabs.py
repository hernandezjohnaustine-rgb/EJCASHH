with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()
for i, line in enumerate(lines):
    if "orders" in line and "Orders" in line and "Package" in line and "label" in line:
        lines.insert(i+1, '    { id: "deposits", label: "Deposits", icon: Wallet },\n')
        lines.insert(i+2, '    { id: "gcash", label: "GCash", icon: Wallet },\n')
        lines.insert(i+3, '    { id: "settings", label: "Settings", icon: Shield },\n')
        print("Added tabs at line", i+2)
        break
with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.writelines(lines)
print("Done!")
