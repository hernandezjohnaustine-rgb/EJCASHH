content = open('src/screens/ActivationScreen.tsx', 'r', encoding='utf-8').read()
old = '''  const availablePackages = PACKAGES.filter(p => {
    if (currentPackage === "combined") return false; // Has everything
    if (currentPackage === "package_1" && p.id === "package_1") return false;
    if (currentPackage === "package_2" && p.id === "package_2") return false;
    return true;
  });'''
new = '''  const availablePackages = PACKAGES.filter(p => {
    if (currentPackage === "combined") return false;
    if ((currentPackage === "package_1" || currentPackage === "combined") && p.id === "package_1") return false;
    if ((currentPackage === "package_2" || currentPackage === "combined") && p.id === "package_2") return false;
    if (isActivated && !currentPackage && p.id === "package_1") return false; // Old accounts
    return true;
  });'''
content = content.replace(old, new)
open('src/screens/ActivationScreen.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
