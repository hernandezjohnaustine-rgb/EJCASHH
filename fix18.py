content = open('src/App.tsx', 'r', encoding='utf-8').read()
content = content.replace(
    '        const updatedSponsorId = freshDoc2.data()?.sponsorId || freshDoc2.data()?.referredBy;\n        // ✅ Package details',
    '        const updatedSponsorId = freshDoc2.data()?.sponsorId || freshDoc2.data()?.referredBy;\n        const actualReferrerId = originalReferrerId; // Always use original referrer for L1\n        // ✅ Package details'
)
content = content.replace(
    'await processActivation(currentUser.uid, updatedSponsorId, packageId, originalReferrerId);',
    'await processActivation(currentUser.uid, updatedSponsorId, packageId, actualReferrerId);'
)
open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
