content = open('src/screens/ActivationScreen.tsx', 'r', encoding='utf-8').read()
content = content.replace(
    '        {PACKAGES.map(pkg => {',
    '        {availablePackages.map(pkg => {'
)
open('src/screens/ActivationScreen.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
