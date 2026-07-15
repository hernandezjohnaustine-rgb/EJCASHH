content = open('src/services/earningsService.ts', 'r', encoding='utf-8').read()
old = 'import {\n  doc,\n  getDoc,\n  runTransaction,\n  collection,\n  query,\n  where,\n  getDocs,\n  limit,\n  Timestamp,\n  increment\n} from "firebase/firestore";'
new = 'import {\n  doc,\n  getDoc,\n  setDoc,\n  addDoc,\n  runTransaction,\n  collection,\n  query,\n  where,\n  getDocs,\n  limit,\n  Timestamp,\n  increment\n} from "firebase/firestore";'
content = content.replace(old, new)
open('src/services/earningsService.ts', 'w', encoding='utf-8').write(content)
print('Done!')
