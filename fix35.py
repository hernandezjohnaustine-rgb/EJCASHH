lines = open('src/App.tsx', 'r', encoding='utf-8').readlines()
# Find and remove duplicate userProfile and onRequestActivation props
result = []
prev_was_userProfile = False
prev_was_onRequest = False
for line in lines:
    if 'userProfile={userProfile}' in line and prev_was_userProfile:
        continue
    if 'onRequestActivation={() => setActiveView("activation")}' in line and prev_was_onRequest:
        continue
    prev_was_userProfile = 'userProfile={userProfile}' in line
    prev_was_onRequest = 'onRequestActivation={() => setActiveView("activation")}' in line
    result.append(line)
open('src/App.tsx', 'w', encoding='utf-8').write(''.join(result))
print('App.tsx fixed!')
