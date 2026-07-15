lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if '        await setDoc(userDocRef, { originalReferrerId: freshData.sponsorId || freshData.referredBy }, { merge: true });' in line:
        lines[i] = '        await setDoc(userDocRef, { originalReferrerId: originalReferrerId }, { merge: true });\n'
        break
open('src/App.tsx', 'w', encoding='utf-8').write(''.join(lines))
print('Done!')
