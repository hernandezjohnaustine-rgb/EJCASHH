import { useState, useEffect } from "react";
import { collection, getDocs, doc, updateDoc, setDoc, query, orderBy, limit, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { Users, Wallet, CheckCircle2, XCircle, TrendingUp, ArrowLeft, RefreshCw, Shield, Ban } from "lucide-react";

type AdminTab = "users" | "withdrawals" | "transactions";

export default function AdminScreen({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activatedUsers: 0,
    totalBalance: 0,
    pendingWithdrawals: 0,
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch users
      const usersSnap = await getDocs(collection(db, "users"));
      const usersData = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setUsers(usersData);

      // Calculate stats
      const totalBalance = usersData.reduce((sum: number, u: any) => sum + (u.balance || 0), 0);
      const activatedUsers = usersData.filter((u: any) => u.isActivated).length;
      setStats({
        totalUsers: usersData.length,
        activatedUsers,
        totalBalance,
        pendingWithdrawals: 0,
      });

      // Fetch withdrawals
      const wSnap = await getDocs(collection(db, "withdrawals"));
      const wData = wSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setWithdrawals(wData.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setStats(prev => ({ ...prev, pendingWithdrawals: wData.filter((w: any) => w.status === "PENDING").length }));

      // Fetch transactions
      const tSnap = await getDocs(collection(db, "transactions"));
      const tData = tSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTransactions(tData.sort((a: any, b: any) => {
        const aTime = a.timestamp?.toDate?.() || new Date(a.timestamp);
        const bTime = b.timestamp?.toDate?.() || new Date(b.timestamp);
        return bTime.getTime() - aTime.getTime();
      }));

    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleActivateUser = async (userId: string) => {
    if (!confirm("Manually activate this account?")) return;
    try {
      await updateDoc(doc(db, "users", userId), {
        isActivated: true,
        activatedAt: new Date().toISOString(),
        manuallyActivated: true,
      });
      alert("✅ Account activated successfully!");
      fetchData();
    } catch (err) {
      alert("❌ Failed to activate account");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!confirm("Deactivate this account?")) return;
    try {
      await updateDoc(doc(db, "users", userId), { isActivated: false });
      alert("✅ Account deactivated");
      fetchData();
    } catch (err) {
      alert("❌ Failed to deactivate");
    }
  };

  const handleApproveWithdrawal = async (withdrawal: any) => {
    if (!confirm(`Approve withdrawal of ₱${withdrawal.amount}?`)) return;
    try {
      await updateDoc(doc(db, "withdrawals", withdrawal.id), {
        status: "COMPLETED",
        approvedAt: new Date().toISOString(),
      });
      alert("✅ Withdrawal approved!");
      fetchData();
    } catch (err) {
      alert("❌ Failed to approve");
    }
  };

  const handleRejectWithdrawal = async (withdrawal: any) => {
    if (!confirm(`Reject withdrawal of ₱${withdrawal.amount}? This will refund the user.`)) return;
    try {
      // Refund user
      const userRef = doc(db, "users", withdrawal.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        await updateDoc(userRef, {
          earningsWallet: (data.earningsWallet || 0) + withdrawal.amount,
          balance: (data.balance || 0) + withdrawal.amount,
        });
      }
      await updateDoc(doc(db, "withdrawals", withdrawal.id), {
        status: "REJECTED",
        rejectedAt: new Date().toISOString(),
      });
      alert("✅ Withdrawal rejected and refunded!");
      fetchData();
    } catch (err) {
      alert("❌ Failed to reject");
    }
  };

  const handleAdjustBalance = async (userId: string, currentBalance: number) => {
    const input = prompt(`Current balance: ₱${currentBalance}\nEnter new balance:`);
    if (!input) return;
    const newBalance = parseFloat(input);
    if (isNaN(newBalance) || newBalance < 0) {
      alert("Invalid amount");
      return;
    }
    try {
      await updateDoc(doc(db, "users", userId), { balance: newBalance });
      alert("✅ Balance updated!");
      fetchData();
    } catch (err) {
      alert("❌ Failed to update balance");
    }
  };

  const TABS = [
    { id: "users", label: "Users", icon: Users },
    { id: "withdrawals", label: "Withdrawals", icon: Wallet },
    { id: "transactions", label: "Transactions", icon: TrendingUp },
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

        {/* Stats */}
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

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-1 ${
                activeTab === tab.id
                  ? "bg-brand-primary text-brand-black"
                  : "bg-brand-card/5 border border-brand-border text-brand-text/60"
              }`}
            >
              <tab.icon className="w-3 h-3" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-brand-text/40 text-sm">Loading...</div>
          </div>
        ) : (
          <>
            {/* USERS TAB */}
            {activeTab === "users" && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black px-1">{users.length} Total Users</p>
                {users.map((u) => (
                  <div key={u.id} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-sm font-bold">{u.displayName || "Unknown"}</p>
                        <p className="text-[10px] text-brand-text/40">{u.email}</p>
                        <p className="text-[9px] text-brand-text/20 font-mono mt-1">{u.referralCode}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                        u.isActivated ? "bg-brand-primary/20 text-brand-primary" : "bg-red-500/20 text-red-400"
                      }`}>
                        {u.isActivated ? "Active" : "Inactive"}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-brand-black/40 rounded-xl p-2 text-center">
                        <p className="text-xs font-black text-brand-primary">₱{(u.balance || 0).toLocaleString()}</p>
                        <p className="text-[8px] text-brand-text/30 uppercase">Balance</p>
                      </div>
                      <div className="bg-brand-black/40 rounded-xl p-2 text-center">
                        <p className="text-xs font-black text-green-400">₱{(u.earningsWallet || 0).toLocaleString()}</p>
                        <p className="text-[8px] text-brand-text/30 uppercase">Earnings</p>
                      </div>
                      <div className="bg-brand-black/40 rounded-xl p-2 text-center">
                        <p className="text-xs font-black text-blue-400">{u.stats?.teamSize || 0}</p>
                        <p className="text-[8px] text-brand-text/30 uppercase">Team</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!u.isActivated ? (
                        <button
                          onClick={() => handleActivateUser(u.id)}
                          className="flex-1 py-2 rounded-xl bg-brand-primary/20 border border-brand-primary/30 text-brand-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Activate
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDeactivateUser(u.id)}
                          className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                        >
                          <Ban className="w-3 h-3" />
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleAdjustBalance(u.id, u.balance || 0)}
                        className="flex-1 py-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                      >
                        <Wallet className="w-3 h-3" />
                        Balance
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* WITHDRAWALS TAB */}
            {activeTab === "withdrawals" && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black px-1">{withdrawals.length} Total Withdrawals</p>
                {withdrawals.length === 0 && (
                  <div className="text-center py-12 text-brand-text/40 text-sm">No withdrawals yet</div>
                )}
                {withdrawals.map((w) => (
                  <div key={w.id} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="text-lg font-black text-brand-primary">₱{(w.amount || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-brand-text/40">{w.method} — {w.accountNumber}</p>
                        <p className="text-[10px] text-brand-text/40">{w.accountName}</p>
                        <p className="text-[9px] text-brand-text/20 mt-1">{w.createdAt ? new Date(w.createdAt).toLocaleString() : ""}</p>
                      </div>
                      <div className={`px-2 py-1 rounded-full text-[9px] font-black uppercase ${
                        w.status === "COMPLETED" ? "bg-green-500/20 text-green-400" :
                        w.status === "REJECTED" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {w.status || "PENDING"}
                      </div>
                    </div>

                    {(w.status === "PENDING" || !w.status) && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApproveWithdrawal(w)}
                          className="flex-1 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectWithdrawal(w)}
                          className="flex-1 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3 h-3" />
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* TRANSACTIONS TAB */}
            {activeTab === "transactions" && (
              <div className="flex flex-col gap-3">
                <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black px-1">{transactions.length} Total Transactions</p>
                {transactions.slice(0, 50).map((t) => {
                  const ts = t.timestamp?.toDate ? t.timestamp.toDate() : new Date(t.timestamp);
                  return (
                    <div key={t.id} className="bg-brand-card/5 border border-brand-border rounded-2xl p-4 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold">{t.title}</p>
                        <p className="text-[10px] text-brand-text/40">{t.category} • {ts.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        <p className="text-[9px] text-brand-text/20 font-mono">{t.referenceNo}</p>
                      </div>
                      <p className={`text-sm font-black ${t.type === 'in' ? 'text-brand-primary' : 'text-brand-text'}`}>
                        {t.type === 'in' ? '+' : '-'}₱{(t.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
