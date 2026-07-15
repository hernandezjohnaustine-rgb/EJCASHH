content = open('src/App.tsx', 'r', encoding='utf-8').read()

# Remove debug alert
content = content.replace('        console.log("Sponsor ID:", updatedSponsorId, "Package:", packageId);\n        alert("Debug - SponsorId: " + updatedSponsorId + " Package: " + packageId);\n        await processActivation(currentUser.uid, updatedSponsorId, packageId);', '        // L1 commission goes to originalReferrerId, L2-10 go to updatedSponsorId (placement)\n        await processActivation(currentUser.uid, updatedSponsorId, packageId, originalReferrerId);')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
