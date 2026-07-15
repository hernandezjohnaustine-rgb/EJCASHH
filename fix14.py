content = open('src/services/earningsService.ts', 'r', encoding='utf-8').read()
import re
content = re.sub(r"      console\.log\([^)]+\);\n", "", content)
open('src/services/earningsService.ts', 'w', encoding='utf-8').write(content)
print('Done!')
