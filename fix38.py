lines = open('src/screens/AdminScreen.tsx', 'r', encoding='utf-8').readlines()
for i, line in enumerate(lines):
    if 'className={px-4 py-2 rounded-xl' in line:
        lines[i] = '                      className={px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 }\n'
        print("Fixed at line", i+1)
        break
open('src/screens/AdminScreen.tsx', 'w', encoding='utf-8').write(''.join(lines))
print('Done!')
