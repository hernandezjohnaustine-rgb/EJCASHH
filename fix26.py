lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if 'const originalReferrerId = freshData.sponsorId || freshData.referredBy;' in line:
        lines[i] = '        // Get original referrer UID from referredBy code (not sponsorId which may be auto-placed)\n'
        lines.insert(i+1, '        let originalReferrerId = freshData.originalReferrerId || freshData.sponsorId;\n')
        lines.insert(i+2, '        if (freshData.referredBy && !freshData.originalReferrerId) {\n')
        lines.insert(i+3, '          const refQuery = query(collection(db, "users"), where("referralCode", "==", freshData.referredBy), limit(1));\n')
        lines.insert(i+4, '          const refSnap = await getDocs(refQuery);\n')
        lines.insert(i+5, '          if (!refSnap.empty) originalReferrerId = refSnap.docs[0].id;\n')
        lines.insert(i+6, '        }\n')
        break
open('src/App.tsx', 'w', encoding='utf-8').write(''.join(lines))
print('Done!')
