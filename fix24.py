lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if 'const actualReferrerId = originalReferrerId;' in line:
        # Add a line to save originalReferrerId to Firestore before auto-placement
        lines.insert(i, '        // Save correct originalReferrerId before auto-placement overwrites it\n')
        lines.insert(i+1, '        await setDoc(userDocRef, { originalReferrerId: originalReferrerId }, { merge: true });\n')
        break
open('src/App.tsx', 'w', encoding='utf-8').write(''.join(lines))
print('Done!')
