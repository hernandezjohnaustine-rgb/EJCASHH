lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
# Remove duplicate lines 866 and 867 (index 865 and 866)
del lines[865]  # removes "userProfile={userProfile}"
del lines[865]  # removes "onRequestActivation=..." (now at same index after deletion)
open('src/App.tsx', 'w', encoding='utf-8').write(''.join(lines))
print('Done!')
