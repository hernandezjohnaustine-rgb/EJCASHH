content = open('src/App.tsx', 'r', encoding='utf-8').read()
# Add originalReferrerId declaration right before auto-placement
content = content.replace(
    '        // ✅ Auto-placement\n        const sponsorId = freshData.sponsorId || freshData.referredBy;',
    '        // ✅ Save original referrer BEFORE auto-placement\n        const originalReferrerId = freshData.sponsorId || freshData.referredBy;\n        // ✅ Auto-placement\n        const sponsorId = originalReferrerId;'
)
open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
