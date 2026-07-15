content = open('src/App.tsx', 'r', encoding='utf-8').read()
# Just add actualReferrerId after updatedSponsorId line
content = content.replace(
    '        const updatedSponsorId = freshDoc2.data()?.sponsorId || freshDoc2.data()?.referredBy;\n        // ✅ Package details',
    '        const updatedSponsorId = freshDoc2.data()?.sponsorId || freshDoc2.data()?.referredBy;\n        // ✅ Use originalReferrerId for L1 commission (before auto-placement changed sponsorId)\n        const actualReferrerId = originalReferrerId;\n        // ✅ Package details'
)
# Update commission call
content = content.replace(
    'await processActivation(currentUser.uid, updatedSponsorId, packageId, originalReferrerId);',
    'await processActivation(currentUser.uid, updatedSponsorId, packageId, actualReferrerId);'
)
open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
