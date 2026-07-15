lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if 'const actualReferrerId = originalReferrerId;' in line:
        print('Found at line', i+1)
        break
