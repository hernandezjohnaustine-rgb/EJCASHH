lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
# Remove the wrongly placed lines
new_lines = []
skip_next = 0
for i, line in enumerate(lines):
    if '// Save correct originalReferrerId before auto-placement overwrites it' in line:
        skip_next = 2
    if skip_next > 0:
        skip_next -= 1
        continue
    new_lines.append(line)

# Now add it before auto-placement
result = []
for i, line in enumerate(new_lines):
    if 'const originalReferrerId = freshData.sponsorId || freshData.referredBy;' in line:
        result.append(line)
        result.append('        // Save originalReferrerId to Firestore BEFORE auto-placement can overwrite it\n')
        result.append('        await setDoc(userDocRef, { originalReferrerId: freshData.sponsorId || freshData.referredBy }, { merge: true });\n')
    else:
        result.append(line)

open('src/App.tsx', 'w', encoding='utf-8').write(''.join(result))
print('Done!')
