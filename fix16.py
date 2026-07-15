content = open('src/App.tsx', 'r', encoding='utf-8').read()
content = content.replace(
    'await processActivation(currentUser.uid, updatedSponsorId, packageId, originalReferrerId);',
    'await processActivation(currentUser.uid, updatedSponsorId, packageId, actualReferrerId);'
)
open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
