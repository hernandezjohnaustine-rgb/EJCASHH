content = open('src/services/earningsService.ts', 'r', encoding='utf-8').read()
old1 = '      // Update team size for all uplines\n      await setDoc(doc(db, "users", currentUid), {\n        stats: {\n          ...sponsorData.stats,\n          teamSize: (sponsorData.stats?.teamSize || 0) + 1,\n          totalReferrals: (sponsorData.stats?.totalReferrals || 0) + 1,\n        }\n      }, { merge: true });'
new1 = ''
content = content.replace(old1, new1)
old2 = '          ...(level === 1 ? {\n            directReferrals: (sponsorData.stats?.directReferrals || 0) + 1,\n          } : {}),\n        }'
new2 = '          ...(level === 1 ? {\n            directReferrals: (sponsorData.stats?.directReferrals || 0) + 1,\n          } : {}),\n          teamSize: (sponsorData.stats?.teamSize || 0) + 1,\n          totalReferrals: (sponsorData.stats?.totalReferrals || 0) + 1,\n        }'
content = content.replace(old2, new2)
open('src/services/earningsService.ts', 'w', encoding='utf-8').write(content)
print('Done!')
