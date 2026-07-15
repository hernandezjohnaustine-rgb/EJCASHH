lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if 'let originalReferrerId = freshData.originalReferrerId || freshData.sponsorId;' in line:
        lines[i] = '        let originalReferrerId = freshData.sponsorId; // default\n'
        break
for i, line in enumerate(lines):
    if 'if (freshData.referredBy && !freshData.originalReferrerId) {' in line:
        lines[i] = '        if (freshData.referredBy) {\n'
        break
open('src/App.tsx', 'w', encoding='utf-8').write(''.join(lines))
print('Done!')
