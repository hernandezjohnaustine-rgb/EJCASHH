lines = open('src/screens/ActivationScreen.tsx', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if '  const [selectedPackage, setSelectedPackage] = useState<string>("package_1");' in line:
        lines[i] = '  const [selectedPackage, setSelectedPackage] = useState<string>(isActivated && !currentPackage?.includes("package_2") && currentPackage !== "combined" ? "package_2" : "package_1");\n'
        break
open('src/screens/ActivationScreen.tsx', 'w', encoding='utf-8').write(''.join(lines))
print('Done!')
