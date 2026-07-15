content = open('src/App.tsx', 'r', encoding='utf-8').read()
old = '        // ✅ Distribute commissions\n        await processActivation(currentUser.uid, updatedSponsorId, packageId);'
new = '        // ✅ Distribute commissions\n        // originalReferrerId = who shared the link, updatedSponsorId = where placed in matrix\n        const originalReferrerId = freshData.sponsorId || freshData.referredBy;\n        await processActivation(currentUser.uid, updatedSponsorId, packageId, originalReferrerId);'
content = content.replace(old, new)
open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
