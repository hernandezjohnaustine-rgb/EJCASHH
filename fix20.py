lines = open('src/services/earningsService.ts', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if 'Step 2: Credit Levels 2-10' in line:
        lines.insert(i + 1, '  console.log("L2-10 start - placementSponsorId:", placementSponsorId, "referrerId:", referrerId, "same?", placementSponsorId === referrerId);\n')
        break
open('src/services/earningsService.ts', 'w', encoding='utf-8').write(''.join(lines))
print('Done!')
