lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
# Find the updatedSponsorId line and add actualReferrerId after it
for i, line in enumerate(lines):
    if 'const updatedSponsorId = freshDoc2.data()' in line:
        lines.insert(i + 1, '        const actualReferrerId = originalReferrerId; // Always use original referrer for L1\n')
        break
# Fix processActivation call
content = ''.join(lines)
content = content.replace(
    'await processActivation(currentUser.uid, updatedSponsorId, packageId, originalReferrerId);',
    'await processActivation(currentUser.uid, updatedSponsorId, packageId, actualReferrerId);'
)
open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
