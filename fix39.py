lines = open('src/screens/AdminScreen.tsx', 'r', encoding='utf-8').readlines()
# Line 551 is index 550
print('Current line 551:', repr(lines[550]))
lines[550] = '                      className={px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 }\n'
open('src/screens/AdminScreen.tsx', 'w', encoding='utf-8').write(''.join(lines))
print('Fixed!')
