with open("src/screens/AdminScreen.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_fetch = '''  const fetchData = async () => {
    setIsLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersData);
      const totalBalance = usersData.reduce((sum: number, u: any) => sum + (u.balance || 0), 0);
      const activatedUsers = usersData.filter((u: any) => u.isActivated).length;
      setStats(prev => ({ ...prev, totalUsers: usersData.length, activatedUsers, totalBalance }));
      try {
        const depSnap = await getDocs(collection(db, "depositRequests"));
        setDeposits(depSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch(e) { console.error(e); }
      try {
        const gcSnap = await getDocs(collection(db, "gcashSettings"));
        setGcashAccounts(gcSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.order - b.order));
      } catch(e) { console.error(e); }
      const tSnap = await getDocs(collection(db, "transactions"));
      const tData = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(tData.sort((a: any, b: any) => {
        const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return bTime.getTime() - aTime.getTime();
      }));
      const pSnap = await getDocs(collection(db, "products"));
      setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      const oSnap = await getDocs(collection(db, "orders"));
      const oData = oSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setOrders(oData.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
        const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
        return bTime.getTime() - aTime.getTime();
      }));
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };'''

new_fetch = '''  // Load only what is needed per tab to save Firestore reads
  const fetchData = async (tab?: string) => {
    const currentTab = tab || activeTab;
    setIsLoading(true);
    try {
      // Always load users for stats (but limit fields by caching)
      if (currentTab === "users" || currentTab === "withdrawals") {
        const usersSnap = await getDocs(collection(db, "users"));
        const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setUsers(usersData);
        const totalBalance = usersData.reduce((sum: number, u: any) => sum + (u.balance || 0), 0);
        const activatedUsers = usersData.filter((u: any) => u.isActivated).length;
        setStats(prev => ({ ...prev, totalUsers: usersData.length, activatedUsers, totalBalance }));
        if (currentTab === "withdrawals") {
          const wSnap = await getDocs(query(collection(db, "withdrawalRequests"), orderBy("createdAt", "desc")));
          setWithdrawals(wSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } else if (currentTab === "transactions") {
        const tSnap = await getDocs(collection(db, "transactions"));
        const tData = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTransactions(tData.sort((a: any, b: any) => {
          const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
          const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
          return bTime.getTime() - aTime.getTime();
        }));
      } else if (currentTab === "products") {
        const pSnap = await getDocs(collection(db, "products"));
        setProducts(pSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else if (currentTab === "orders") {
        const oSnap = await getDocs(collection(db, "orders"));
        const oData = oSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setOrders(oData.sort((a: any, b: any) => {
          const aTime = a.createdAt?.toDate?.() || new Date(a.createdAt);
          const bTime = b.createdAt?.toDate?.() || new Date(b.createdAt);
          return bTime.getTime() - aTime.getTime();
        }));
      } else if (currentTab === "deposits") {
        const depSnap = await getDocs(collection(db, "depositRequests"));
        setDeposits(depSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } else if (currentTab === "gcash") {
        const gcSnap = await getDocs(collection(db, "gcashSettings"));
        setGcashAccounts(gcSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.order - b.order));
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };'''

content = content.replace(old_fetch, new_fetch)

# Also update tab change handler to fetch data per tab
content = content.replace(
    'onClick={() => setActiveTab(tab.id as AdminTab)}',
    'onClick={() => { setActiveTab(tab.id as AdminTab); fetchData(tab.id); }}'
)

with open("src/screens/AdminScreen.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Done!")
