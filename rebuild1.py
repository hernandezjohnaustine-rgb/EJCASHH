import re

with open('src/screens/AdminScreen.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add deposits and gcash to AdminTab type
content = content.replace(
    'type AdminTab = "users" | "withdrawals" | "transactions" | "products" | "orders" | "settings";',
    'type AdminTab = "users" | "withdrawals" | "transactions" | "products" | "orders" | "deposits" | "gcash" | "settings";'
)

# 2. Add deposits and gcashAccounts state after orders state
content = content.replace(
    '  const [orders, setOrders] = useState<any[]>([]);',
    '''  const [orders, setOrders] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);
  const [gcashAccounts, setGcashAccounts] = useState<any[]>([]);
  const [showGcashForm, setShowGcashForm] = useState(false);
  const [gcashForm, setGcashForm] = useState({ accountName: "", accountNumber: "", qrCode: "", order: 1 });
  const [savingGcash, setSavingGcash] = useState(false);'''
)

# 3. Add deposits fetch in fetchData
content = content.replace(
    "      setStats(prev => ({ ...prev, totalUsers: usersData.length, activatedUsers, totalBalance }));",
    """      setStats(prev => ({ ...prev, totalUsers: usersData.length, activatedUsers, totalBalance }));
      try {
        const depSnap = await getDocs(collection(db, "depositRequests"));
        setDeposits(depSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
      } catch(e) { console.error(e); }
      try {
        const gcSnap = await getDocs(collection(db, "gcashSettings"));
        setGcashAccounts(gcSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a: any, b: any) => a.order - b.order));
      } catch(e) { console.error(e); }"""
)

# 4. Add approve/reject/gcash functions before handleApprove
content = content.replace(
    '  const handleApprove = async',
    '''  const handleApproveDeposit = async (d: any) => {
    setProcessingDeposit(true);
    try {
      await updateDoc(doc(db, "depositRequests", d.id), { status: "approved", approvedAt: Timestamp.now(), adminNote: adminNote || "" });
      const uRef = doc(db, "users", d.userId);
      const uSnap = await getDoc(uRef);
      if (!uSnap.exists()) throw new Error("User not found");
      await updateDoc(uRef, { balance: (uSnap.data().balance || 0) + d.amount });
      await addDoc(collection(db, "transactions"), { userId: d.userId, type: "in", title: "GCash Deposit", amount: d.amount, category: "Cash In", status: "Completed", referenceNo: d.referenceNo || "", paymentMethod: "GCash", timestamp: Timestamp.now() });
      await addDoc(collection(db, "users", d.userId, "notifications"), { title: "Deposit Approved!", message: "Your GCash deposit of \u20B1" + (d.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " has been credited to your wallet.", type: "deposit", read: false, createdAt: Timestamp.now() });
      setSelectedDeposit(null);
      setAdminNote("");
      await fetchData();
      alert("Approved! \u20B1" + d.amount + " credited to " + d.userName);
    } catch(err: any) { alert("Failed: " + (err.message || String(err))); }
    finally { setProcessingDeposit(false); }
  };
  const handleRejectDeposit = async (d: any) => {
    setProcessingDeposit(true);
    try {
      await updateDoc(doc(db, "depositRequests", d.id), { status: "rejected", rejectedAt: Timestamp.now(), adminNote: adminNote || "" });
      await addDoc(collection(db, "users", d.userId, "notifications"), { title: "Deposit Rejected", message: "Your GCash deposit of \u20B1" + (d.amount || 0).toLocaleString() + " was rejected. " + (adminNote ? "Reason: " + adminNote : ""), type: "deposit", read: false, createdAt: Timestamp.now() });
      setSelectedDeposit(null);
      setAdminNote("");
      await fetchData();
    } catch(err: any) { alert("Failed: " + (err.message || String(err))); }
    finally { setProcessingDeposit(false); }
  };
  const handleSaveGcash = async () => {
    setSavingGcash(true);
    try {
      await addDoc(collection(db, "gcashSettings"), { ...gcashForm, createdAt: Timestamp.now() });
      setGcashForm({ accountName: "", accountNumber: "", qrCode: "", order: 1 });
      setShowGcashForm(false);
      await fetchData();
    } catch { alert("Failed to save GCash account."); }
    finally { setSavingGcash(false); }
  };
  const handleDeleteGcash = async (id: string) => {
    if (!window.confirm("Remove this GCash account?")) return;
    try {
      await deleteDoc(doc(db, "gcashSettings", id));
      await fetchData();
    } catch { alert("Failed to delete."); }
  };
  const handleApprove = async'''
)

# 5. Add Deposits and GCash to tabs array
content = content.replace(
    '{ id: "settings", label: "Settings", icon: Shield }',
    '{ id: "deposits", label: "Deposits", icon: Wallet }, { id: "gcash", label: "GCash", icon: Wallet }, { id: "settings", label: "Settings", icon: Shield }'
)

with open('src/screens/AdminScreen.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print("Step 1 done!")
