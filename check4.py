lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
# Remove line 866 (index 865) and 867 (index 866) which are duplicates
# Lines are 0-indexed so line 866 = index 865
print('Line 863:', lines[862].strip())
print('Line 864:', lines[863].strip())
print('Line 865:', lines[864].strip())
print('Line 866:', lines[865].strip())
print('Line 867:', lines[866].strip())
print('Line 868:', lines[867].strip())
