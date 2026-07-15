content = open('src/services/earningsService.ts', 'r', encoding='utf-8').read()
content = content.replace('from "firebase/firestore";', 'from "firebase/firestore";\nimport { setDoc, addDoc } from "firebase/firestore";', 1)
open('src/services/earningsService.ts', 'w', encoding='utf-8').write(content)
print('Done!')
