import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, setDoc, getDoc, onSnapshot, query, orderBy, Timestamp, addDoc, deleteDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Users, Wallet, CheckCircle2, XCircle, TrendingUp, ArrowLeft, RefreshCw, Shield, Ban, User, Hash, ChevronDown, ChevronUp, ShoppingBag, Package, Plus, Trash2, Edit3, X, Lock, Unlock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

type AdminTab = "users" | "withdrawals" | "transactions" | "products" | "orders";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
  approved:  "bg-green-500/20 text-green-400 border-green-500/20",
  rejected:  "bg-red-500/20 text-red-400 border-red-500/20",
  Pending:   "bg-yellow-500/20 text-yellow-400 border-yellow-500/20",
  Processing:"bg-blue-500/20 text-blue-400 border-blue-500/20",
  Shipped:   "bg-purple-500/20 text-purple-400 border-purple-500/20",
  Delivered: "bg-green-500/20 text-green-400 border-green-500/20",
  Cancelled: "bg-red-500/20 text-red-400 border-red-500/20",
};

const ORDER_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
const CATEGORIES = ["Beauty", "Merch", "Electronics", "Home", "Other"];

const EMPTY_PRODUCT = { title: "", price: "", category: "Beauty", description: "", image: "", stock: "" };

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);
  const [selectedTx, setSelectedTx] = useState<any | null>(null);
  const [txSearch, setTxSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [txStatusFilter, setTxStatusFilter] = useState("all");
  const [adminNote, setAdminNote] = useState("");
  const [processingDeposit, setProcessingDeposit] = useState(false);
  const [zoomImage, setZoomImage] = useState(false);
  const [gcashAccounts, setGcashAccounts] = useState<any[]>([]);
  const [showGcashForm, setShowGcashForm] = useState(false);
  const [gcashForm, setGcashForm] = useState({ accountName: "", accountNumber: "", qrCode: "", order: 1 });
  const [savingGcash, setSavingGcash] = useState(false);
  const [userCache, setUserCache] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [withdrawalFilter, setWithdrawalFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [note, setNote] = useState("");
  const [stats, setStats] = useState({ totalUsers: 0, activatedUsers: 0, totalBalance: 0, pendingWithdrawals: 0 });

  // Settings state
  const [tradingEnabled, setTradingEnabled] = useState(true);
  const [merchantLink, setMerchantLink] = useState("");
  const [savingMerchantLink, setSavingMerchantLink] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  // Product form state
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState(EMPTY_PRODUCT);
  const [savingProduct, setSavingProduct] = useState(false);

  const fetchData = async () => {
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
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    getDoc(doc(db, "settings", "trading"))
      .then(snap => { if (snap.exists()) setTradingEnabled(snap.data().enabled !== false); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    getDoc(doc(db, "settings", "merchant"))
      .then(snap => { if (snap.exists()) setMerchantLink(snap.data().url || ""); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const q = query(collection(db, "withdrawalRequests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWithdrawals(data);
      setStats(prev => ({ ...prev, pendingWithdrawals: data.filter((w: any) => w.status === "pending").length }));
    });
    return () => unsub();
  }, []);

  const handleActivateUser = async (userId: string) => {
    if (!confirm("Manually activate this account?")) return;
    try {
      await updateDoc(doc(db, "users", userId), { isActivated: true, activatedAt: new Date().toISOString(), manuallyActivated: true });
      alert("✅ Account activated!"); fetchData();
    } catch { alert("❌ Failed to activate"); }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm("Deactivate this account?")) return;
    try {
      await updateDoc(doc(db, "users", userId), { isActivated: false });
      alert("✅ Account deactivated"); fetchData();
    } catch { alert("❌ Failed to deactivate"); }
  };

  const handleAdjustBalance = async (userId: string, currentBalance: number) => {
    const input = prompt(`Current balance: ₱${currentBalance}\nEnter new balance:`);
    if (!input) return;
    const newBalance = parseFloat(input);
    if (isNaN(newBalance) || newBalance < 0) { alert("Invalid amount"); return; }
    try {
      await updateDoc(doc(db, "users", userId), { balance: newBalance });
      alert("✅ Balance updated!"); fetchData();
    } catch { alert("❌ Failed to update balance"); }
  };

  // ── Referral link lock/unlock ──────────────────────────────────────────────
  const handleToggleReferralLink = async (userId: string, currentValue: boolean) => {
    if (!confirm(`${currentValue ? "Lock" : "Unlock"} this user's referral link sharing?`)) return;
    try {
      await updateDoc(doc(db, "users", userId), { referralLinkEnabled: !currentValue });
      alert(`✅ Referral link ${currentValue ? "locked" : "unlocked"}`);
      fetchData();
    } catch {
      alert("❌ Failed to update referral link status");
    }
  };

  // ── Trading bot settings ───────────────────────────────────────────────────
  const handleToggleTrading = async () => {
    setSavingSettings(true);
    try {
      await setDoc(doc(db, "settings", "trading"), { enabled: !tradingEnabled }, { merge: true });
      setTradingEnabled(!tradingEnabled);
      alert((!tradingEnabled ? "Trading Bot ENABLED" : "Trading Bot DISABLED") + " successfully!");
    } catch {
      alert("Failed to update trading status");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveMerchantLink = async () => {
    setSavingMerchantLink(true);
    try {
      await setDoc(doc(db, "settings", "merchant"), { url: merchantLink.trim() }, { merge: true });
      alert("Merchant link saved!");
    } catch {
      alert("Failed to save merchant link");
    } finally {
      setSavingMerchantLink(false);
    }
  };

  const handleUnlockAllReferralLinks = async () => {
    if (!confirm("Unlock ALL users referral links? This will allow all users to share their referral links.")) return;
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const batch = usersSnap.docs.map(d => updateDoc(doc(db, "users", d.id), { referralLinkEnabled: true }));
      await Promise.all(batch);
      alert("✅ All referral links unlocked!");
      fetchData();
    } catch {
      alert("❌ Failed to unlock all referral links");
    }
  };

  const handleApproveDeposit = async (d: any) => {
    setProcessingDeposit(true);
    try {
      await updateDoc(doc(db, "depositRequests", d.id), { status: "approved", approvedAt: Timestamp.now(), adminNote: adminNote || "" });
      const uRef = doc(db, "users", d.userId);
      const uSnap = await getDoc(uRef);
      if (!uSnap.exists()) throw new Error("User not found");
      await updateDoc(uRef, { balance: (uSnap.data().balance || 0) + d.amount });
      await addDoc(collection(db, "transactions"), { userId: d.userId, type: "in", title: "GCash Deposit", amount: d.amount, category: "Cash In", status: "Completed", referenceNo: d.referenceNo || "", paymentMethod: "GCash", timestamp: Timestamp.now() });
      await addDoc(collection(db, "users", d.userId, "notifications"), { title: "Deposit Approved!", message: "Your GCash deposit of ₱" + (d.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " has been credited to your wallet.", type: "deposit", read: false, createdAt: Timestamp.now() });
      setSelectedDeposit(null);
      setAdminNote("");
      await fetchData();
      alert("Approved! ₱" + d.amount + " credited to " + d.userName);
    } catch(err: any) { alert("Failed: " + (err.message || String(err))); }
    finally { setProcessingDeposit(false); }
  };
  const handleRejectDeposit = async (d: any) => {
    setProcessingDeposit(true);
    try {
      await updateDoc(doc(db, "depositRequests", d.id), { status: "rejected", rejectedAt: Timestamp.now(), adminNote: adminNote || "" });
      await addDoc(collection(db, "users", d.userId, "notifications"), { title: "Deposit Rejected", message: "Your GCash deposit of ₱" + (d.amount || 0).toLocaleString() + " was rejected. " + (adminNote ? "Reason: " + adminNote : ""), type: "deposit", read: false, createdAt: Timestamp.now() });
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
  const handleApprove = async (w: any) => {
    setProcessingId(w.id);
    try {
      await updateDoc(doc(db, "withdrawalRequests", w.id), { status: "approved", processedAt: Timestamp.now(), note: note || "" });
      await addDoc(collection(db, "transactions"), {
        userId: w.userId, type: "out", title: `Withdrawal via ${w.methodLabel || w.method}`,
        amount: w.amount, category: "Withdrawal", status: "Completed",
        referenceNo: "EJ-W-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: w.methodLabel || w.method, timestamp: Timestamp.now(),
      });
      setNote(""); setExpandedId(null);
    } catch { alert("❌ Failed to approve"); }
    finally { setProcessingId(null); }
  };

  const handleReject = async (w: any) => {
    setProcessingId(w.id);
    try {
      const userRef = doc(db, "users", w.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        await setDoc(userRef, { earningsWallet: (data.earningsWallet || 0) + w.amount }, { merge: true });
      }
      await updateDoc(doc(db, "withdrawalRequests", w.id), { status: "rejected", processedAt: Timestamp.now(), note: note || "Rejected by admin" });
      setNote(""); setExpandedId(null);
    } catch { alert("❌ Failed to reject"); }
    finally { setProcessingId(null); }
  };

  // ── Product actions ────────────────────────────────────────────────────────
  const openAddProduct = () => {
    setEditingProduct(null);
    setProductForm(EMPTY_PRODUCT);
    setShowProductForm(true);
  };

  const openEditProduct = (p: any) => {
    setEditingProduct(p);
    setProductForm({ title: p.title, price: String(p.price), category: p.category, description: p.description || "", image: p.image || "", stock: String(p.stock || 0) });
    setShowProductForm(true);
  };

  const handleSaveProduct = async () => {
    if (!productForm.title || !productForm.price) { alert("Title and price are required."); return; }
    setSavingProduct(true);
    try {
      const data = {
        title: productForm.title,
        price: parseFloat(productForm.price),
        category: productForm.category,
        description: productForm.description,
        image: productForm.image,
        stock: parseInt(productForm.stock) || 0,
        rating: editingProduct?.rating || 5.0,
        reviews: editingProduct?.reviews || 0,
        isActive: true,
        updatedAt: Timestamp.now(),
      };
      if (editingProduct) {
        await updateDoc(doc(db, "products", editingProduct.id), data);
      } else {
        await addDoc(collection(db, "products"), { ...data, createdAt: Timestamp.now() });
      }
      setShowProductForm(false);
      fetchData();
    } catch { alert("❌ Failed to save product"); }
    finally { setSavingProduct(false); }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteDoc(doc(db, "products", id));
      fetchData();
    } catch { alert("❌ Failed to delete"); }
  };

  // ── Order actions ──────────────────────────────────────────────────────────
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status });
      fetchData();
    } catch { alert("❌ Failed to update order"); }
  };

  const formatDate = (ts: any) => {
    if (!ts) return "";
    const date = ts?.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  const filteredWithdrawals = withdrawalFilter === "all" ? withdrawals : withdrawals.filter(w => w.status === withdrawalFilter);
  const withdrawalCounts = {
    all: withdrawals.length,
    pending: withdrawals.filter(w => w.status === "pending").length,
    approved: withdrawals.filter(w => w.status === "approved").length,
    rejected: withdrawals.filter(w => w.status === "rejected").length,
  };

  const TABS = [
    { id: "users", label: "Users", icon: Users },
    { id: "withdrawals", label: "Withdraw", icon: Wallet },
    { id: "transactions", label: "Txns", icon: TrendingUp },
    { id: "products", label: "Products", icon: ShoppingBag },
    { id: "orders", label: "Orders", icon: Package },
    { id: "deposits", label: "Deposits", icon: Wallet },
    { id: "gcash", label: "GCash", icon: Wallet },
    { id: "settings", label: "Settings", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-brand-black text-brand-text pb-32">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-brand-black/95 backdrop-blur-xl border-b border-brand-border px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={onBack} className="w-10 h-10 rounded-full bg-brand-card/5 flex items-center justify-center border border-brand-border">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-brand-primary" />
            <h1 className="text-lg font-display font-black tracking-tight">Admin Panel</h1>
          </div>
          <button onClick={fetchData} className="w-10 h-10 rounded-full bg-brand-card/5 flex items-center justify-center border border-brand-border">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: "Users", value: stats.totalUsers, color: "text-blue-400" },
            { label: "Activated", value: stats.activatedUsers, color: "text-brand-primary" },
            { label: "Balance", value: `₱${stats.totalBalance.toLocaleString()}`, color: "text-green-400" },
            { label: "Pending", value: stats.pendingWithdrawals, color: "text-red-400" },
          ].map((s) => (
            <div key={s.label} className="bg-brand-card/5 border border-brand-border rounded-xl p-3 text-center">
              <p className={`text-sm font-black ${s.color}`}>{s.value}</p>
              <p className="text-[9px] text-brand-text/40 uppercase tracking-widest">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Mobile: horizontal scrollable tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 md:hidden" style={{scrollbarWidth: "none", msOverflowStyle: "none"}}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as AdminTab); fetchData(tab.id); }}
              className={"shrink-0 px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 " + (activeTab === tab.id ? "bg-brand-primary text-brand-black" : "bg-brand-card/5 border border-brand-border text-brand-text/60")}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-screen">
        {/* Desktop Sidebar */}
        <div className="hidden md:flex flex-col w-56 shrink-0 border-r border-brand-border bg-brand-black sticky top-[120px] self-start h-[calc(100vh-120px)] overflow-y-auto py-4 px-3 gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as AdminTab); fetchData(tab.id); }}
              className={"w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-black transition-all text-left " + (activeTab === tab.id ? "bg-brand-primary text-brand-black" : "text-brand-text/60 hover:bg-brand-card/10 hover:text-brand-text")}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              {tab.label}
            </button>
          ))}
        </div>
        {/* Main Content */}
        <div className="flex-1 px-4 py-4 overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-brand-text/40 text-sm">Loading...</div>
          </div>
        ) : (
          <>
            {/* ── USERS TAB ── */}
            {activeTab === "users" && (() => {
              const q = userSearch.trim().toLowerCase();
              const filteredUsers = !q ? users : users.filter((u: any) =>
                (u.displayName || "").toLowerCase().includes(q) ||
                (u.username || "").toLowerCase().includes(q) ||
                (u.email || "").toLowerCase().includes(q) ||
                (u.referralCode || "").toLowerCase().includes(q)
              );
              return (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black">{q ? `${filteredUsers.length} of ${users.length}` : users.length} Total Users</p>
                  <button
                    onClick={handleUnlockAllReferralLinks}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    <Unlock className="w-3 h-3" />
                    Enable
                  </button>
                </div>
                <input
                  type="text"
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-2.5 px-4 text-sm text-brand-text focus:outline-none focus:border-brand-primary/50 placeholder:text-brand-text/20"
                  placeholder="Search by name, email, or username..."
                />
                {filteredUsers.length === 0 && (
                  <p className="text-center text-brand-text/40 py-8 font-bold">No users match "{userSearch}"</p>
                )}
                {filteredUsers.map((u) => (
                  <div key={u.id} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold">{u.displayName || "Unknown"}</p>
                        <p className="text-[10px] text-brand-text/40">{u.email}</p>
                        <p className="text-[9px] text-brand-text/20 font-mono mt-1">{u.referralCode}</p>
                      </div>
                      <div className="flex flex-col gap-1.5 items-end">
                        <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${u.isActivated ? "bg-brand-primary/20 text-brand-primary" : "bg-red-500/20 text-red-400"}`}>
                          {u.isActivated ? "Active" : "Inactive"}
                        </div>
                        <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${u.referralLinkEnabled ? "bg-blue-500/20 text-blue-400" : "bg-brand-text/10 text-brand-text/40"}`}>
                          {u.referralLinkEnabled ? "Link Unlocked" : "Link Locked"}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { label: "Balance", value: `₱${(u.balance || 0).toLocaleString()}`, color: "text-brand-primary" },
                        { label: "Earnings", value: `₱${(u.earningsWallet || 0).toLocaleString()}`, color: "text-green-400" },
                        { label: "Team", value: u.stats?.teamSize || 0, color: "text-blue-400" },
                      ].map(s => (
                        <div key={s.label} className="bg-brand-black/40 rounded-xl p-2 text-center">
                          <p className={`text-xs font-black ${s.color}`}>{s.value}</p>
                          <p className="text-[8px] text-brand-text/30 uppercase">{s.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {!u.isActivated ? (
                        <button onClick={() => handleActivateUser(u.id)} className="flex-1 py-2 rounded-xl bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Activate
                        </button>
                      ) : (
                        <button onClick={() => handleDeactivateUser(u.id)} className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                          <Ban className="w-3 h-3" /> Deactivate
                        </button>
                      )}
                      <button onClick={() => handleAdjustBalance(u.id, u.balance || 0)} className="flex-1 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1">
                        <Wallet className="w-3 h-3" /> Balance
                      </button>
                      <button
                        onClick={() => handleToggleReferralLink(u.id, !!u.referralLinkEnabled)}
                        className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 ${
                          u.referralLinkEnabled
                            ? "bg-yellow-500/10 border border-yellow-500/20 text-yellow-400"
                            : "bg-brand-primary/10 border border-brand-primary/20 text-brand-primary"
                        }`}
                      >
                        {u.referralLinkEnabled ? (
                          <><Lock className="w-3 h-3" /> Lock Link</>
                        ) : (
                          <><Unlock className="w-3 h-3" /> Unlock Link</>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              );
            })()}

            {/* ── WITHDRAWALS TAB ── */}
            {activeTab === "withdrawals" && (
              <div className="flex flex-col gap-3">
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {(["pending", "approved", "rejected", "all"] as const).map((f) => (
                    <button key={f} onClick={() => setWithdrawalFilter(f)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex items-center gap-2 transition-all ${withdrawalFilter === f ? "bg-brand-primary text-brand-black" : "bg-brand-card/5 border border-brand-border text-brand-text/40"}`}>
                      {f}
                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${withdrawalFilter === f ? "bg-brand-black/20" : "bg-brand-border"}`}>{withdrawalCounts[f]}</span>
                    </button>
                  ))}
                </div>
                {filteredWithdrawals.length === 0 && <div className="text-center py-12 text-brand-text/40 text-sm">No {withdrawalFilter} requests</div>}
                <AnimatePresence>
                  {filteredWithdrawals.map((w) => {
                    const isExpanded = expandedId === w.id;
                    return (
                      <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-brand-card/5 border border-brand-border rounded-2xl overflow-hidden">
                        <button onClick={() => setExpandedId(isExpanded ? null : w.id)} className="w-full p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                              <Wallet className="w-5 h-5 text-brand-primary" />
                            </div>
                            <div className="text-left">
                              <p className="text-sm font-black">₱{(w.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                              <p className="text-[10px] text-brand-text/40">{w.methodLabel || w.method} · {formatDate(w.createdAt)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${STATUS_COLORS[w.status] || STATUS_COLORS.pending}`}>{w.status || "pending"}</span>
                            {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-text/20" /> : <ChevronDown className="w-4 h-4 text-brand-text/20" />}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-brand-border">
                              <div className="p-4 flex flex-col gap-3">
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-brand-black/40 rounded-xl p-3">
                                    <div className="flex items-center gap-1 mb-1"><User className="w-3 h-3 text-brand-text/30" /><span className="text-[9px] text-brand-text/30 font-black uppercase">Account Name</span></div>
                                    <p className="text-xs font-bold">{w.accountName}</p>
                                  </div>
                                  <div className="bg-brand-black/40 rounded-xl p-3">
                                    <div className="flex items-center gap-1 mb-1"><Hash className="w-3 h-3 text-brand-text/30" /><span className="text-[9px] text-brand-text/30 font-black uppercase">{w.method === "bank" ? "Acct No." : w.method === "crypto" ? "Address" : "Mobile No."}</span></div>
                                    <p className="text-xs font-bold break-all">{w.accountNumber}</p>
                                  </div>
                                </div>
                                <div className="bg-brand-black/40 rounded-xl p-3">
                                  <span className="text-[9px] text-brand-text/30 font-black uppercase">User ID</span>
                                  <p className="text-[10px] font-mono mt-1 text-brand-text/50 break-all">{w.userId}</p>
                                </div>
                                {w.status === "pending" && (
                                  <>
                                    <input type="text" placeholder="Add a note (optional)" value={note} onChange={(e) => setNote(e.target.value)}
                                      className="w-full bg-brand-black/40 border border-brand-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-primary/50 placeholder:text-brand-text/20" />
                                    <div className="grid grid-cols-2 gap-3">
                                      <button disabled={processingId === w.id} onClick={() => handleReject(w)} className="py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 disabled:opacity-50">
                                        <XCircle className="w-3 h-3" />{processingId === w.id ? "..." : "Reject"}
                                      </button>
                                      <button disabled={processingId === w.id} onClick={() => handleApprove(w)} className="py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1 disabled:opacity-50">
                                        <CheckCircle2 className="w-3 h-3" />{processingId === w.id ? "..." : "Approve"}
                                      </button>
                                    </div>
                                  </>
                                )}
                                {w.status !== "pending" && w.note && (
                                  <div className="bg-brand-black/40 rounded-xl p-3">
                                    <span className="text-[9px] text-brand-text/30 font-black uppercase">Note</span>
                                    <p className="text-xs mt-1">{w.note}</p>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}

            {/* ── TRANSACTIONS TAB ── */}
            {activeTab === "transactions" && (() => {
              const filteredTx = transactions.filter((t: any) => {
                const txUser = users.find((u: any) => u.id === t.userId);
                const uName = (txUser?.displayName || txUser?.username || "").toLowerCase();
                const matchSearch = !txSearch ||
                  (t.title || "").toLowerCase().includes(txSearch.toLowerCase()) ||
                  (t.referenceNo || "").toLowerCase().includes(txSearch.toLowerCase()) ||
                  (t.userId || "").toLowerCase().includes(txSearch.toLowerCase()) ||
                  uName.includes(txSearch.toLowerCase());
                const matchType = txTypeFilter === "all" || (t.category || "").toLowerCase() === txTypeFilter.toLowerCase() || t.type === txTypeFilter;
                const matchStatus = txStatusFilter === "all" || (t.status || "").toLowerCase() === txStatusFilter.toLowerCase();
                return matchSearch && matchType && matchStatus;
              });
              return (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    <input type="text" value={txSearch} onChange={e => setTxSearch(e.target.value)}
                      className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-2.5 px-4 text-sm text-brand-text focus:outline-none focus:border-brand-primary/50"
                      placeholder="Search by name, title, reference..." />
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth: "none"}}>
                      {["all", "in", "out", "Commission", "Transfer", "Cash In", "Withdrawal", "Activation", "Trading", "Bonus"].map(f => (
                        <button key={f} onClick={() => setTxTypeFilter(f)}
                          className={"shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all " + (txTypeFilter === f ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60")}>
                          {f === "all" ? "All" : f}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1" style={{scrollbarWidth: "none"}}>
                      {["all", "Completed", "Pending", "Failed"].map(s => (
                        <button key={s} onClick={() => setTxStatusFilter(s)}
                          className={"shrink-0 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase transition-all " + (txStatusFilter === s ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60")}>
                          {s === "all" ? "All Status" : s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <p className="text-[10px] text-brand-text/40 font-black px-1">{filteredTx.length} of {transactions.length} Transactions</p>
                  {filteredTx.length === 0 ? (
                    <p className="text-center text-brand-text/40 py-8 font-bold">No transactions found</p>
                  ) : filteredTx.map((t: any) => {
                    const ts = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp || Date.now());
                    const txUser = users.find((u: any) => u.id === t.userId);
                    const uName = txUser?.displayName || txUser?.username || t.userId?.substring(0, 8) + "...";
                    return (
                      <div key={t.id} onClick={() => setSelectedTx(t)} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 cursor-pointer hover:border-brand-primary/30 transition-all">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                              <span className={"text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase " + (t.type === "in" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                                {t.type === "in" ? "IN" : "OUT"}
                              </span>
                              <span className="text-[8px] font-black text-brand-text/30 uppercase">{t.category || "General"}</span>
                              <span className={"text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase " + (t.status === "Completed" ? "bg-brand-primary/20 text-brand-primary" : "bg-yellow-500/20 text-yellow-400")}>
                                {t.status || "Completed"}
                              </span>
                            </div>
                            <p className="text-sm font-black text-brand-text truncate">{t.title}</p>
                            <p className="text-[9px] text-blue-400 font-black mt-0.5">{uName}</p>
                            <p className="text-[9px] text-brand-text/30 font-mono mt-0.5">{t.referenceNo}</p>
                            <p className="text-[9px] text-brand-text/30">{ts.toLocaleString()}</p>
                          </div>
                          <p className={"text-base font-black shrink-0 " + (t.type === "in" ? "text-brand-primary" : "text-red-400")}>
                            {t.type === "in" ? "+" : "-"}&#8369;{(t.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
            {selectedTx && (
              <div className="fixed inset-0 z-[300] bg-brand-black/95 backdrop-blur-xl flex flex-col overflow-y-auto">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-brand-border sticky top-0 bg-brand-black z-10">
                  <button onClick={() => setSelectedTx(null)} className="w-10 h-10 rounded-full bg-brand-card/20 border border-brand-border flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-base font-black text-brand-text">Transaction Details</h3>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="flex justify-center gap-2">
                    <span className={"text-xs font-black px-3 py-1.5 rounded-full " + (selectedTx.type === "in" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30")}>
                      {selectedTx.type === "in" ? "INCOMING" : "OUTGOING"}
                    </span>
                  </div>
                  <div className="text-center">
                    <p className={"text-4xl font-black " + (selectedTx.type === "in" ? "text-brand-primary" : "text-red-400")}>
                      {selectedTx.type === "in" ? "+" : "-"}&#8369;{(selectedTx.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-brand-card/10 border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-text/40">Transaction Info</p>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">User</span><span className="text-[10px] font-black text-brand-text">{users.find((u: any) => u.id === selectedTx.userId)?.displayName || "Unknown"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Title</span><span className="text-[10px] font-black text-brand-text text-right max-w-[60%]">{selectedTx.title}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Type</span><span className="text-[10px] font-black text-brand-text">{selectedTx.category || "General"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Reference</span><span className="text-[10px] font-mono font-black text-brand-text">{selectedTx.referenceNo || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Method</span><span className="text-[10px] font-black text-brand-text">{selectedTx.paymentMethod || "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Status</span><span className="text-[10px] font-black text-brand-primary">{selectedTx.status || "Completed"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Date</span><span className="text-[10px] font-black text-brand-text">{selectedTx.timestamp?.toDate ? selectedTx.timestamp.toDate().toLocaleString() : "N/A"}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">User ID</span><span className="text-[9px] font-mono text-brand-text/60 truncate max-w-[60%]">{selectedTx.userId}</span></div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === "products" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black">{products.length} Products</p>
                  <button onClick={openAddProduct} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-primary text-brand-black text-[10px] font-black uppercase tracking-widest">
                    <Plus className="w-3.5 h-3.5" /> Add Product
                  </button>
                </div>

                {products.length === 0 && (
                  <div className="text-center py-16">
                    <ShoppingBag className="w-10 h-10 text-brand-text/20 mx-auto mb-3" />
                    <p className="text-brand-text/40 text-sm font-bold">No products yet</p>
                    <p className="text-brand-text/20 text-xs mt-1">Tap "Add Product" to get started</p>
                  </div>
                )}

                {products.map((p) => (
                  <div key={p.id} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-brand-card/20 shrink-0">
                      {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <ShoppingBag className="w-6 h-6 text-brand-text/20 m-auto mt-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{p.title}</p>
                      <p className="text-[10px] text-brand-text/40">{p.category} · Stock: {p.stock ?? "∞"}</p>
                      <p className="text-brand-primary font-black text-sm">₱{(p.price || 0).toLocaleString()}</p>
                    </div>
                    <div className="flex flex-col gap-2 shrink-0">
                      <button onClick={() => openEditProduct(p)} className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── ORDERS TAB ── */}
            {activeTab === "orders" && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black px-1">{orders.length} Orders</p>
                {orders.length === 0 && (
                  <div className="text-center py-16">
                    <Package className="w-10 h-10 text-brand-text/20 mx-auto mb-3" />
                    <p className="text-brand-text/40 text-sm font-bold">No orders yet</p>
                  </div>
                )}
                {orders.map((o) => {
                  const isExpanded = expandedId === o.id;
                  return (
                    <div key={o.id} className="bg-brand-card/5 border border-brand-border rounded-2xl overflow-hidden">
                      <button onClick={() => setExpandedId(isExpanded ? null : o.id)} className="w-full p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-brand-card/20 shrink-0">
                            {o.productImage
                              ? <img src={o.productImage} alt={o.productTitle} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                              : <Package className="w-5 h-5 text-brand-text/20 m-auto mt-3.5" />}
                          </div>
                          <div className="text-left">
                            <p className="text-sm font-bold line-clamp-1">{o.productTitle}</p>
                            <p className="text-[10px] text-brand-text/40">{o.buyerName} · {formatDate(o.createdAt)}</p>
                            <p className="text-brand-primary font-black text-xs">₱{(o.total || 0).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase border ${STATUS_COLORS[o.status] || STATUS_COLORS.Pending}`}>{o.status}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-text/20" /> : <ChevronDown className="w-4 h-4 text-brand-text/20" />}
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-brand-border">
                            <div className="p-4 flex flex-col gap-3">
                              <div className="grid grid-cols-2 gap-3">
                                <div className="bg-brand-black/40 rounded-xl p-3">
                                  <p className="text-[9px] text-brand-text/30 font-black uppercase mb-1">Delivery Address</p>
                                  <p className="text-xs">{o.deliveryAddress || "—"}</p>
                                </div>
                                <div className="bg-brand-black/40 rounded-xl p-3">
                                  <p className="text-[9px] text-brand-text/30 font-black uppercase mb-1">Phone</p>
                                  <p className="text-xs font-bold">{o.phone || "—"}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-brand-black/40 rounded-xl p-3 text-center">
                                  <p className="text-[9px] text-brand-text/30 uppercase">Qty</p>
                                  <p className="text-xs font-black">{o.quantity}</p>
                                </div>
                                <div className="bg-brand-black/40 rounded-xl p-3 text-center">
                                  <p className="text-[9px] text-brand-text/30 uppercase">Payment</p>
                                  <p className="text-xs font-black">{o.paymentMethod}</p>
                                </div>
                                <div className="bg-brand-black/40 rounded-xl p-3 text-center">
                                  <p className="text-[9px] text-brand-text/30 uppercase">Total</p>
                                  <p className="text-xs font-black text-brand-primary">₱{(o.total || 0).toLocaleString()}</p>
                                </div>
                              </div>

                              {/* Status updater */}
                              <div>
                                <p className="text-[9px] text-brand-text/30 font-black uppercase mb-2">Update Status</p>
                                <div className="flex flex-wrap gap-2">
                                  {ORDER_STATUSES.map(s => (
                                    <button key={s} onClick={() => handleUpdateOrderStatus(o.id, s)}
                                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${o.status === s ? 'bg-brand-primary text-brand-black' : 'bg-brand-card/20 border border-brand-border text-brand-text/50 hover:border-brand-primary/40'}`}>
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "deposits" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1 mb-2">
                  <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black">{deposits.length} Deposit Requests</p>
                  <div className="flex gap-2">
                    <span className="text-[9px] bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded-lg font-black">{deposits.filter((d) => d.status === "pending").length} Pending</span>
                  </div>
                </div>
                {deposits.length === 0 ? (
                  <p className="text-center text-brand-text/40 py-12 font-bold">No deposit requests yet</p>
                ) : deposits.map((d) => (
                  <div key={d.id} onClick={() => { setSelectedDeposit(d); setAdminNote(""); }} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 cursor-pointer hover:border-brand-primary/30 transition-all">
                    <div className="flex items-start gap-3">
                      {d.screenshot && <img src={d.screenshot} alt="Receipt" className="w-16 h-16 rounded-xl object-cover shrink-0" />}
                      <div className="flex-1">
                        <div className="flex justify-between">
                          <p className="text-sm font-black text-brand-text">{d.userName}</p>
                          <span className={"text-[9px] font-black px-2 py-0.5 rounded-full " + (d.status === "approved" ? "bg-green-500/20 text-green-400" : d.status === "rejected" ? "bg-red-500/20 text-red-400" : "bg-yellow-500/20 text-yellow-400")}>
                            {(d.status || "pending").toUpperCase()}
                          </span>
                        </div>
                        <p className="text-lg font-black text-brand-primary">&#8369;{(d.amount || 0).toLocaleString()}</p>
                        <p className="text-[9px] text-brand-text/30">{d.createdAt?.toDate?.()?.toLocaleString() || "Recently"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedDeposit && (
              <div className="fixed inset-0 z-[300] bg-brand-black/95 backdrop-blur-xl flex flex-col overflow-y-auto">
                <div className="flex items-center gap-3 px-4 py-4 border-b border-brand-border sticky top-0 bg-brand-black z-10">
                  <button onClick={() => { setSelectedDeposit(null); setZoomImage(false); }} className="w-10 h-10 rounded-full bg-brand-card/20 border border-brand-border flex items-center justify-center">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <h3 className="text-base font-black text-brand-text">Deposit Details</h3>
                </div>
                <div className="p-4 flex flex-col gap-4">
                  <div className="bg-brand-card/10 border border-brand-border rounded-2xl p-4 flex flex-col gap-2">
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Name</span><span className="text-sm font-black text-brand-text">{selectedDeposit.userName}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Email</span><span className="text-[10px] text-brand-text">{selectedDeposit.userEmail}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Amount</span><span className="text-base font-black text-brand-primary">&#8369;{(selectedDeposit.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Reference</span><span className="text-[10px] font-mono text-brand-text">{selectedDeposit.referenceNo}</span></div>
                    <div className="flex justify-between"><span className="text-[10px] text-brand-text/40">Date</span><span className="text-[10px] text-brand-text">{selectedDeposit.createdAt?.toDate?.()?.toLocaleString() || "N/A"}</span></div>
                  </div>
                  {selectedDeposit.screenshot && (
                    <div className="bg-brand-card/10 border border-brand-border rounded-2xl p-4">
                      <div className="flex justify-between mb-2">
                        <p className="text-[9px] font-black uppercase text-brand-text/40">Proof of Payment</p>
                        <button onClick={() => setZoomImage(!zoomImage)} className="text-[9px] font-black text-brand-primary border border-brand-primary/30 px-2 py-1 rounded-lg">{zoomImage ? "Zoom Out" : "Zoom In"}</button>
                      </div>
                      <img src={selectedDeposit.screenshot} alt="Proof" className={"w-full rounded-xl object-contain " + (zoomImage ? "max-h-none" : "max-h-64")} />
                    </div>
                  )}
                  {selectedDeposit.status === "pending" && (
                    <div>
                      <label className="text-[9px] font-black uppercase text-brand-text/40 mb-2 block">Admin Note</label>
                      <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={2} className="w-full bg-brand-card/20 border border-brand-border rounded-2xl py-3 px-4 text-brand-text text-sm focus:outline-none resize-none" placeholder="Optional note..." />
                    </div>
                  )}
                  {selectedDeposit.status === "pending" ? (
                    <div className="flex gap-3 pb-8">
                      <button onClick={() => handleRejectDeposit(selectedDeposit)} disabled={processingDeposit} className="flex-1 py-4 bg-red-500/10 border border-red-500/20 text-red-400 font-black uppercase text-sm rounded-2xl disabled:opacity-50">
                        {processingDeposit ? "Processing..." : "Reject"}
                      </button>
                      <button onClick={() => handleApproveDeposit(selectedDeposit)} disabled={processingDeposit} className="flex-1 py-4 bg-green-500 text-white font-black uppercase text-sm rounded-2xl disabled:opacity-50">
                        {processingDeposit ? "Processing..." : "Approve"}
                      </button>
                    </div>
                  ) : (
                    <p className="text-center text-brand-text/40 pb-8">This request has been {selectedDeposit.status}.</p>
                  )}
                </div>
              </div>
            )}
            {activeTab === "gcash" && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black">GCash Accounts</p>
                  <button onClick={() => setShowGcashForm(!showGcashForm)} className="text-[9px] font-black text-brand-primary border border-brand-primary/30 px-3 py-1.5 rounded-xl">+ Add</button>
                </div>
                {showGcashForm && (
                  <div className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 flex flex-col gap-3">
                    <input type="text" value={gcashForm.accountName} onChange={e => setGcashForm(p => ({ ...p, accountName: e.target.value }))} className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none" placeholder="Account Name" />
                    <input type="text" value={gcashForm.accountNumber} onChange={e => setGcashForm(p => ({ ...p, accountNumber: e.target.value }))} className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none" placeholder="GCash Number" />
                    <input type="text" value={gcashForm.qrCode} onChange={e => setGcashForm(p => ({ ...p, qrCode: e.target.value }))} className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-brand-text text-sm focus:outline-none" placeholder="QR Code URL (/gcash-qr1.png)" />
                    <div className="flex gap-2">
                      <button onClick={() => setShowGcashForm(false)} className="flex-1 py-2 border border-brand-border rounded-xl text-brand-text/60 text-xs font-black uppercase">Cancel</button>
                      <button onClick={handleSaveGcash} disabled={savingGcash} className="flex-1 py-2 bg-brand-primary text-brand-black text-xs font-black uppercase rounded-xl">{savingGcash ? "Saving..." : "Save"}</button>
                    </div>
                  </div>
                )}
                {gcashAccounts.length === 0 ? (
                  <p className="text-center text-brand-text/40 py-8 font-bold">No GCash accounts yet. Click + Add above.</p>
                ) : gcashAccounts.map(acc => (
                  <div key={acc.id} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {acc.qrCode && <img src={acc.qrCode} alt="QR" className="w-12 h-12 rounded-xl bg-white p-1 object-contain" />}
                      <div>
                        <p className="text-sm font-black text-brand-text">{acc.accountName}</p>
                        <p className="text-[10px] text-brand-text/40">{acc.accountNumber}</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteGcash(acc.id)} className="text-red-400 text-[9px] font-black border border-red-400/30 px-2 py-1 rounded-lg">Remove</button>
                  </div>
                ))}
              </div>
            )}
            {activeTab === "settings" && (
              <div className="flex flex-col gap-4">
                <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black px-1">App Settings</p>
                <div className="bg-brand-card/5 border border-brand-border rounded-2xl p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-black text-brand-text">Trading Bot</p>
                    <p className="text-[10px] text-brand-text/40">Enable or disable Trading Bot for all users</p>
                  </div>
                  <button onClick={handleToggleTrading} disabled={savingSettings} className={tradingEnabled ? "bg-brand-primary text-brand-black px-4 py-2 rounded-xl text-xs font-black uppercase" : "bg-brand-card/20 border border-brand-border text-brand-text/60 px-4 py-2 rounded-xl text-xs font-black uppercase"}>
                    {savingSettings ? "Saving..." : tradingEnabled ? "ENABLED" : "DISABLED"}
                  </button>
                </div>
                <div className="bg-brand-card/5 border border-brand-border rounded-2xl p-5 flex flex-col gap-3">
                  <div>
                    <p className="text-sm font-black text-brand-text">Merchant Link</p>
                    <p className="text-[10px] text-brand-text/40">URL shown inside the Merchant screen on Home</p>
                  </div>
                  <input
                    type="text"
                    value={merchantLink}
                    onChange={e => setMerchantLink(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-sm text-brand-text focus:outline-none focus:border-brand-primary/50"
                  />
                  <button
                    onClick={handleSaveMerchantLink}
                    disabled={savingMerchantLink}
                    className="w-full py-3 bg-brand-primary text-brand-black text-xs font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all disabled:opacity-50"
                  >
                    {savingMerchantLink ? "Saving..." : "Save Merchant Link"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Add/Edit Product Modal ── */}
      <AnimatePresence>
        {showProductForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end">
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full bg-brand-black border-t border-brand-border rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-black">{editingProduct ? "Edit Product" : "Add Product"}</h3>
                <button onClick={() => setShowProductForm(false)} className="w-9 h-9 rounded-2xl bg-brand-card/20 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-[10px] text-brand-text/40 font-black uppercase tracking-widest mb-1.5">Product Name *</p>
                  <input type="text" placeholder="e.g. Premium Beauty Soap" value={productForm.title} onChange={e => setProductForm(p => ({ ...p, title: e.target.value }))}
                    className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-primary/50 text-brand-text" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-[10px] text-brand-text/40 font-black uppercase tracking-widest mb-1.5">Price (₱) *</p>
                    <input type="number" placeholder="360" value={productForm.price} onChange={e => setProductForm(p => ({ ...p, price: e.target.value }))}
                      className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-primary/50 text-brand-text" />
                  </div>
                  <div>
                    <p className="text-[10px] text-brand-text/40 font-black uppercase tracking-widest mb-1.5">Stock</p>
                    <input type="number" placeholder="50" value={productForm.stock} onChange={e => setProductForm(p => ({ ...p, stock: e.target.value }))}
                      className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-primary/50 text-brand-text" />
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-brand-text/40 font-black uppercase tracking-widest mb-1.5">Category</p>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setProductForm(p => ({ ...p, category: c }))}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase transition-all ${productForm.category === c ? 'bg-brand-primary text-brand-black' : 'bg-brand-card/20 border border-brand-border text-brand-text/50'}`}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-brand-text/40 font-black uppercase tracking-widest mb-1.5">Image URL</p>
                  <input type="text" placeholder="https://..." value={productForm.image} onChange={e => setProductForm(p => ({ ...p, image: e.target.value }))}
                    className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-primary/50 text-brand-text" />
                  {productForm.image ? (
                    <img src={productForm.image} alt="preview" className="mt-2 w-20 h-20 rounded-xl object-cover border border-brand-border" referrerPolicy="no-referrer" />
                  ) : null}
                </div>

                <div>
                  <p className="text-[10px] text-brand-text/40 font-black uppercase tracking-widest mb-1.5">Description</p>
                  <textarea placeholder="Product description..." value={productForm.description} onChange={e => setProductForm(p => ({ ...p, description: e.target.value }))} rows={3}
                    className="w-full bg-brand-card/20 border border-brand-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-brand-primary/50 text-brand-text resize-none" />
                </div>

                <button onClick={handleSaveProduct} disabled={savingProduct}
                  className="w-full py-4 rounded-2xl bg-brand-primary text-brand-black font-black uppercase tracking-widest text-xs active:scale-95 transition-all disabled:opacity-70">
                  {savingProduct ? "Saving..." : editingProduct ? "Save Changes" : "Add Product"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  );
}
