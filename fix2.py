content = open('src/App.tsx', 'r', encoding='utf-8').read()
old = '      } catch (error) {\n        handleFirestoreError(error, OperationType.UPDATE, "users/" + currentUser.uid);\n      }\n    }\n    setShowSuccess("Account Activated Successfully!'
new = '      } catch (error: any) {\n        console.error("ACTIVATION ERROR:", error);\n        alert("Activation failed: " + (error?.message || String(error)));\n        handleFirestoreError(error, OperationType.UPDATE, "users/" + currentUser.uid);\n      }\n    }\n    setShowSuccess("Account Activated Successfully!'
content = content.replace(old, new)
open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
