with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '} else if (currentTab === "transactions") {',
    '''} else if (currentTab === "transactions") {
        // Load users for name lookup if not already loaded
        if (users.length === 0) {
          const usersSnap = await getDocs(query(collection(db, "users"), limit(200)));
          setUsers(usersSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }'''
)

with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
