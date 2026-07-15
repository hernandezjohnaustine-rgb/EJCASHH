# Fix App.tsx - remove duplicate props
lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
print('Total lines:', len(lines))
for i, line in enumerate(lines):
    if 'userProfile={userProfile}' in line:
        print(f'Line {i+1}: {line.strip()}')
