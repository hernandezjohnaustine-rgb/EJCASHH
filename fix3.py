content = open('src/App.tsx', 'r', encoding='utf-8').read()
old = '        // ✅ Distribute commissions\n        await processActivation(currentUser.uid, updatedSponsorId, packageId);'
new = '        // ✅ Distribute commissions\n        console.log("Sponsor ID:", updatedSponsorId, "Package:", packageId);\n        alert("Debug - SponsorId: " + updatedSponsorId + " Package: " + packageId);\n        await processActivation(currentUser.uid, updatedSponsorId, packageId);'
content = content.replace(old, new)
open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
