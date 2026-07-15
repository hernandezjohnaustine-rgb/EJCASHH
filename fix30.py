lines = open('src/screens/ActivationScreen.tsx', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if '  const selected = PACKAGES.find(p => p.id === selectedPackage)!' in line:
        lines.insert(i, '  // Filter out already purchased packages\n')
        lines.insert(i+1, '  const availablePackages = PACKAGES.filter(p => {\n')
        lines.insert(i+2, '    if (currentPackage === "combined") return false; // Has everything\n')
        lines.insert(i+3, '    if (currentPackage === "package_1" && p.id === "package_1") return false;\n')
        lines.insert(i+4, '    if (currentPackage === "package_2" && p.id === "package_2") return false;\n')
        lines.insert(i+5, '    return true;\n')
        lines.insert(i+6, '  });\n')
        break
open('src/screens/ActivationScreen.tsx', 'w', encoding='utf-8').write(''.join(lines))
print('Done!')
