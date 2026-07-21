import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, query, where, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, User as FirebaseUser } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { Wallet, Plus, Edit3, Trash2, X, Upload, Loader2, Lock, LogOut, ShieldAlert, Users, UserPlus, CheckCircle2, XCircle, QrCode } from "lucide-react";

const EMPTY_GCASH = { accountName: "", accountNumber: "", qrCode: "" };

function compressQr(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 400; // QR codes need more detail than avatars
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// Creates a new Deposit Admin account without disrupting the currently
// logged-in admin's session — same secondary-app pattern used for Merchant
// Admin accounts.
async function createDepositAdminAccount(name: string, email: string, password: string) {
  const secondaryApp = initializeApp(firebaseConfig, "deposit-admin-creation-" + Date.now());
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName: name });

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      displayName: name,
      isDepositAdmin: true, // grants access to /deposit-admin's "Deposit Requests" tab ONLY, scoped to their assigned account
      isAdmin: false, // deliberately NOT admin — no access to the main Admin Panel, cannot create more Deposit Admin accounts
      isActivated: true, // bypasses the normal activation flow entirely
      referralLinkEnabled: false,
      referralCode: null,
      referredBy: null,
      sponsorId: null,
      balance: 0,
      earningsWallet: 0,
      creditsBalance: 0,
      createdAt: new Date().toISOString(),
      stats: { vipLevel: 1, directReferrals: 0, totalReferrals: 0, teamSize: 0, totalEarnings: 0 },
    });

    await secondaryAuth.signOut();
  } finally {
    await deleteApp(secondaryApp);
  }
}

function TableSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="border border-slate-800 rounded-2xl overflow-hidden">
      <div className="bg-slate-900/60 px-5 py-3">
        <div className="w-24 h-3 rounded-full bg-slate-800 animate-pulse" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-t border-slate-800 px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-800 animate-pulse shrink-0" />
          <div className="flex-1 flex flex-col gap-2">
            <div className="w-1/3 h-3 rounded-full bg-slate-800 animate-pulse" />
            <div className="w-1/2 h-2.5 rounded-full bg-slate-800/60 animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Self-contained login gate ──────────────────────────────────────────────
function DepositAdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.code === "auth/invalid-credential" ? "Incorrect email or password." : "Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="w-full max-w-sm">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", damping: 15 }} className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold">Deposit Dashboard</h1>
          <p className="text-xs text-slate-500">Admin sign-in required</p>
        </motion.div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
              placeholder="admin@example.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
              placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
          <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={isLoading}
            className="w-full py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────
function DepositDashboard({ onSignOut, canManageAccounts, currentUid }: { onSignOut: () => void, canManageAccounts: boolean, currentUid: string }) {
  const [activeSection, setActiveSection] = useState<"requests" | "accounts" | "admins">("requests");

  // GCash accounts
  const [gcashAccounts, setGcashAccounts] = useState<any[]>([]);
  const [isLoadingAccounts, setIsLoadingAccounts] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any>(null);
  const [accountForm, setAccountForm] = useState(EMPTY_GCASH);
  const [savingAccount, setSavingAccount] = useState(false);
  const [uploadingQr, setUploadingQr] = useState(false);
  const qrInputRef = useRef<HTMLInputElement>(null);

  // Deposit requests
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [requestFilter, setRequestFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Deposit Admin accounts (true-admin only)
  const [depositAdmins, setDepositAdmins] = useState<any[]>([]);
  const [loadingDepositAdmins, setLoadingDepositAdmins] = useState(true);
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [adminError, setAdminError] = useState<string | null>(null);

  // ── Fetchers ──────────────────────────────────────────────────────────
  const fetchGcashAccounts = async () => {
    setIsLoadingAccounts(true);
    try {
      const q = canManageAccounts
        ? collection(db, "gcashSettings")
        : query(collection(db, "gcashSettings"), where("ownerId", "==", currentUid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setGcashAccounts(list);
    } catch (err) {
      console.error("Failed to load GCash accounts:", err);
    } finally {
      setIsLoadingAccounts(false);
    }
  };

  const fetchRequests = async (accountIds: string[]) => {
    setIsLoadingRequests(true);
    try {
      if (!canManageAccounts && accountIds.length === 0) {
        setRequests([]);
        return;
      }
      const base = collection(db, "depositRequests");
      let snapDocs: any[] = [];
      if (canManageAccounts) {
        const snap = await getDocs(base);
        snapDocs = snap.docs;
      } else {
        // Firestore 'in' queries support up to 30 values — plenty for a
        // handful of assigned accounts per Deposit Admin.
        const q = query(base, where("gcashAccountId", "in", accountIds.slice(0, 30)));
        const snap = await getDocs(q);
        snapDocs = snap.docs;
      }
      const list = snapDocs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : 0;
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : 0;
        return bTime - aTime;
      });
      setRequests(list);
    } catch (err) {
      console.error("Failed to load deposit requests:", err);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  const fetchDepositAdmins = async () => {
    setLoadingDepositAdmins(true);
    try {
      const q = query(collection(db, "users"), where("isDepositAdmin", "==", true));
      const snap = await getDocs(q);
      setDepositAdmins(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to load Deposit Admin accounts:", err);
    } finally {
      setLoadingDepositAdmins(false);
    }
  };

  useEffect(() => { fetchGcashAccounts(); }, [canManageAccounts, currentUid]);
  useEffect(() => { if (canManageAccounts) fetchDepositAdmins(); }, [canManageAccounts]);
  useEffect(() => {
    // Once we know which accounts this session can see, fetch matching requests.
    if (isLoadingAccounts) return;
    fetchRequests(gcashAccounts.map(a => a.id));
  }, [isLoadingAccounts, gcashAccounts.length, canManageAccounts]);

  // ── GCash account CRUD ────────────────────────────────────────────────
  const openAddAccount = () => {
    setEditingAccount(null);
    setAccountForm(EMPTY_GCASH);
    setShowAccountForm(true);
  };

  const openEditAccount = (a: any) => {
    setEditingAccount(a);
    setAccountForm({ accountName: a.accountName || "", accountNumber: a.accountNumber || "", qrCode: a.qrCode || "" });
    setShowAccountForm(true);
  };

  const handleQrUpload = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingQr(true);
    try {
      const compressed = await compressQr(file);
      setAccountForm(p => ({ ...p, qrCode: compressed }));
    } catch {
      alert("Failed to process image.");
    } finally {
      setUploadingQr(false);
    }
  };

  const handleSaveAccount = async () => {
    if (!accountForm.accountName || !accountForm.accountNumber) { alert("Account name and number are required."); return; }
    setSavingAccount(true);
    try {
      const data = {
        accountName: accountForm.accountName,
        accountNumber: accountForm.accountNumber,
        qrCode: accountForm.qrCode,
        order: editingAccount?.order ?? gcashAccounts.length,
        ownerId: canManageAccounts ? (editingAccount?.ownerId ?? null) : currentUid,
      };
      if (editingAccount) {
        await updateDoc(doc(db, "gcashSettings", editingAccount.id), data);
      } else {
        await addDoc(collection(db, "gcashSettings"), { ...data, createdAt: Timestamp.now() });
      }
      setShowAccountForm(false);
      fetchGcashAccounts();
    } catch {
      alert("Failed to save GCash account.");
    } finally {
      setSavingAccount(false);
    }
  };

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Delete this GCash account?")) return;
    try {
      await deleteDoc(doc(db, "gcashSettings", id));
      fetchGcashAccounts();
    } catch {
      alert("Failed to delete.");
    }
  };

  const handleAssignAccount = async (accountId: string, ownerId: string) => {
    try {
      await updateDoc(doc(db, "gcashSettings", accountId), { ownerId: ownerId || null });
      fetchGcashAccounts();
    } catch {
      alert("Failed to assign account.");
    }
  };

  // ── Deposit approval (same balance-crediting logic as the main Admin Panel) ──
  const handleApprove = async (req: any) => {
    setProcessingId(req.id);
    try {
      await updateDoc(doc(db, "depositRequests", req.id), { status: "approved", approvedAt: Timestamp.now() });
      const userRef = doc(db, "users", req.userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error("User not found");
      await updateDoc(userRef, { balance: (userSnap.data().balance || 0) + req.amount });
      await addDoc(collection(db, "transactions"), {
        userId: req.userId, type: "in", title: "GCash Deposit", amount: req.amount,
        category: "Cash In", status: "Completed", referenceNo: req.referenceNo || "",
        paymentMethod: "GCash", timestamp: Timestamp.now(),
      });
      await addDoc(collection(db, "users", req.userId, "notifications"), {
        title: "Deposit Approved!",
        message: "Your GCash deposit of \u20B1" + (req.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " has been credited to your wallet.",
        type: "deposit", read: false, createdAt: Timestamp.now(),
      });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "approved" } : r));
    } catch (err) {
      console.error(err);
      alert("Failed to approve. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: any) => {
    setProcessingId(req.id);
    try {
      await updateDoc(doc(db, "depositRequests", req.id), { status: "rejected", rejectedAt: Timestamp.now() });
      await addDoc(collection(db, "users", req.userId, "notifications"), {
        title: "Deposit Rejected",
        message: "Your GCash deposit of \u20B1" + (req.amount || 0).toLocaleString() + " was rejected.",
        type: "deposit", read: false, createdAt: Timestamp.now(),
      });
      setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: "rejected" } : r));
    } catch (err) {
      console.error(err);
      alert("Failed to reject. Please try again.");
    } finally {
      setProcessingId(null);
    }
  };

  // ── Deposit Admin account creation (true-admin only) ────────────────────
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    if (!adminName || !adminEmail || adminPassword.length < 6) {
      setAdminError("Fill in all fields — password needs at least 6 characters.");
      return;
    }
    setCreatingAdmin(true);
    try {
      await createDepositAdminAccount(adminName, adminEmail, adminPassword);
      setAdminName(""); setAdminEmail(""); setAdminPassword("");
      setShowAdminForm(false);
      fetchDepositAdmins();
    } catch (err: any) {
      setAdminError(err.code === "auth/email-already-in-use" ? "This email is already registered." : "Failed to create account.");
    } finally {
      setCreatingAdmin(false);
    }
  };

  const filteredRequests = requestFilter === "all" ? requests : requests.filter(r => r.status === requestFilter);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Deposit Dashboard</h1>
              <p className="text-xs text-slate-500">Review and approve GCash deposits</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeSection === "accounts" && canManageAccounts && (
              <button onClick={openAddAccount} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-colors">
                <Plus className="w-4 h-4" /> Add Account
              </button>
            )}
            {activeSection === "admins" && canManageAccounts && (
              <button onClick={() => { setAdminError(null); setShowAdminForm(true); }} className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-colors">
                <UserPlus className="w-4 h-4" /> New Deposit Admin
              </button>
            )}
            <button onClick={onSignOut} className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 pb-3 flex gap-2">
          <button onClick={() => setActiveSection("requests")} className={"px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors " + (activeSection === "requests" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-slate-300")}>
            Deposit Requests
          </button>
          <button onClick={() => setActiveSection("accounts")} className={"px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors " + (activeSection === "accounts" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-slate-300")}>
            GCash Accounts
          </button>
          {canManageAccounts && (
            <button onClick={() => setActiveSection("admins")} className={"px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors " + (activeSection === "admins" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-slate-300")}>
              Deposit Admins
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {activeSection === "requests" && (
            <motion.div key="requests" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {!canManageAccounts && gcashAccounts.length === 0 && !isLoadingAccounts ? (
                <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
                  <QrCode className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No GCash account has been assigned to you yet</p>
                  <p className="text-slate-600 text-sm mt-1">Contact the main admin to get one assigned</p>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
                    {(["pending", "approved", "rejected", "all"] as const).map(f => (
                      <button key={f} onClick={() => setRequestFilter(f)}
                        className={"px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors shrink-0 " + (requestFilter === f ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-slate-900 border border-slate-800 text-slate-500")}>
                        {f} <span className="opacity-60">({requests.filter(r => f === "all" || r.status === f).length})</span>
                      </button>
                    ))}
                  </div>
                  {isLoadingRequests ? (
                    <TableSkeleton rows={3} />
                  ) : filteredRequests.length === 0 ? (
                    <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
                      <Wallet className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No {requestFilter !== "all" ? requestFilter : ""} deposit requests</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {filteredRequests.map(r => (
                        <div key={r.id} className="border border-slate-800 rounded-2xl p-4 flex items-center gap-4">
                          {r.screenshot && <img src={r.screenshot} alt="Receipt" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-sm font-bold">{r.userName}</p>
                              <span className={
                                "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase " +
                                (r.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : r.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-yellow-500/10 text-yellow-400")
                              }>
                                {r.status}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">{r.userEmail}</p>
                            <p className="text-[10px] text-slate-600 font-mono mt-0.5">Ref: {r.referenceNo}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-base font-bold text-emerald-400">₱{(r.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                          </div>
                          {r.status === "pending" && (
                            <div className="flex gap-2 shrink-0">
                              <button onClick={() => handleReject(r)} disabled={processingId === r.id}
                                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-red-500/20 flex items-center justify-center text-red-400 transition-colors disabled:opacity-50">
                                <XCircle className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleApprove(r)} disabled={processingId === r.id}
                                className="w-9 h-9 rounded-lg bg-slate-800 hover:bg-emerald-500/20 flex items-center justify-center text-emerald-400 transition-colors disabled:opacity-50">
                                {processingId === r.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {activeSection === "accounts" && (
            <motion.div key="accounts" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              {isLoadingAccounts ? (
                <TableSkeleton rows={3} />
              ) : gcashAccounts.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
                  <QrCode className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">{canManageAccounts ? "No GCash accounts yet" : "No account assigned to you yet"}</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 gap-4">
                  {gcashAccounts.map(a => (
                    <div key={a.id} className="border border-slate-800 rounded-2xl p-5 flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        {a.qrCode ? (
                          <img src={a.qrCode} alt="QR" className="w-14 h-14 rounded-lg bg-white p-1 object-contain shrink-0" />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-slate-800 flex items-center justify-center shrink-0"><QrCode className="w-6 h-6 text-slate-600" /></div>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">{a.accountName}</p>
                          <p className="text-xs text-slate-500">{a.accountNumber}</p>
                        </div>
                      </div>
                      {canManageAccounts && (
                        <>
                          <div>
                            <label className="text-[10px] font-semibold text-slate-500 mb-1 block">Assign to Deposit Admin</label>
                            <select
                              value={a.ownerId || ""}
                              onChange={(e) => handleAssignAccount(a.id, e.target.value)}
                              className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-xs focus:outline-none focus:border-emerald-500/50"
                            >
                              <option value="">— Unassigned (managed by admins) —</option>
                              {depositAdmins.map(da => (
                                <option key={da.id} value={da.id}>{da.displayName} ({da.email})</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openEditAccount(a)} className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-400 text-xs font-bold transition-colors">Edit</button>
                            <button onClick={() => handleDeleteAccount(a.id)} className="flex-1 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-red-400 text-xs font-bold transition-colors">Delete</button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeSection === "admins" && canManageAccounts && (
            <motion.div key="admins" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
              <div className="mb-5 bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Accounts created here get instant access to this dashboard's "Deposit Requests" tab, scoped to
                  whichever GCash account you assign them under "GCash Accounts." No package activation required,
                  and they're structurally excluded from the referral/unilevel system.
                </p>
              </div>
              {loadingDepositAdmins ? (
                <TableSkeleton rows={3} />
              ) : depositAdmins.length === 0 ? (
                <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
                  <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                  <p className="text-slate-500 font-medium">No Deposit Admin accounts yet</p>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-900/60 text-left text-slate-400 text-xs uppercase tracking-wider">
                        <th className="px-5 py-3 font-semibold">Name</th>
                        <th className="px-5 py-3 font-semibold">Email</th>
                        <th className="px-5 py-3 font-semibold">Assigned Account</th>
                      </tr>
                    </thead>
                    <tbody>
                      {depositAdmins.map(da => {
                        const assigned = gcashAccounts.find(a => a.ownerId === da.id);
                        return (
                          <tr key={da.id} className="border-t border-slate-800">
                            <td className="px-5 py-4 font-semibold">{da.displayName}</td>
                            <td className="px-5 py-4 text-slate-400">{da.email}</td>
                            <td className="px-5 py-4 text-slate-400">{assigned ? assigned.accountName : <span className="text-slate-600">None yet</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Add/Edit GCash Account Modal */}
      <AnimatePresence>
        {showAccountForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAccountForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold">{editingAccount ? "Edit GCash Account" : "Add GCash Account"}</h3>
                <button onClick={() => setShowAccountForm(false)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Account Name</label>
                  <input type="text" value={accountForm.accountName} onChange={e => setAccountForm(p => ({ ...p, accountName: e.target.value }))}
                    placeholder="J***y P." className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">GCash Number</label>
                  <input type="text" value={accountForm.accountNumber} onChange={e => setAccountForm(p => ({ ...p, accountNumber: e.target.value }))}
                    placeholder="0915 520 9950" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">QR Code</label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-white flex items-center justify-center shrink-0">
                      {uploadingQr ? <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" /> : accountForm.qrCode ? (
                        <img src={accountForm.qrCode} alt="preview" className="w-full h-full object-contain" />
                      ) : <QrCode className="w-6 h-6 text-slate-400" />}
                    </div>
                    <button type="button" onClick={() => qrInputRef.current?.click()} disabled={uploadingQr}
                      className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:border-emerald-500/40 transition-colors disabled:opacity-50">
                      <Upload className="w-3.5 h-3.5" /> {accountForm.qrCode ? "Change" : "Upload"}
                    </button>
                    <input ref={qrInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleQrUpload(e.target.files?.[0] ?? null)} />
                  </div>
                </div>
                <button onClick={handleSaveAccount} disabled={savingAccount}
                  className="w-full py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60">
                  {savingAccount ? "Saving..." : editingAccount ? "Save Changes" : "Add Account"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* New Deposit Admin Modal */}
      <AnimatePresence>
        {showAdminForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAdminForm(false)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }} transition={{ duration: 0.2 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-bold">New Deposit Admin Account</h3>
                <button onClick={() => setShowAdminForm(false)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleCreateAdmin} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Name</label>
                  <input required type="text" value={adminName} onChange={(e) => setAdminName(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50" placeholder="Deposit Team" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email</label>
                  <input required type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50" placeholder="deposits@example.com" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
                  <input required type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50" placeholder="At least 6 characters" />
                </div>
                {adminError && <p className="text-red-400 text-xs font-medium">{adminError}</p>}
                <button type="submit" disabled={creatingAdmin}
                  className="w-full py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60">
                  {creatingAdmin ? "Creating..." : "Create Account"}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Top-level gate ─────────────────────────────────────────────────────
export default function DepositAdminScreen() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [access, setAccess] = useState<"admin" | "deposit" | "denied" | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthUser(fbUser);
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, "users", fbUser.uid));
          const data = snap.exists() ? snap.data() : null;
          if (data?.isAdmin === true) {
            setAccess("admin");
          } else if (data?.isDepositAdmin === true) {
            setAccess("deposit");
          } else {
            setAccess("denied");
          }
        } catch {
          setAccess("denied");
        }
      } else {
        setAccess(null);
      }
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => { await signOut(auth); };

  if (checkingAuth) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }
  if (!authUser) {
    return <DepositAdminLogin onSuccess={() => {}} />;
  }
  if (access === "denied") {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="w-10 h-10 text-red-400" />
          <div>
            <p className="text-lg font-bold mb-1">Access Denied</p>
            <p className="text-sm text-slate-500">This account does not have admin access.</p>
          </div>
          <button onClick={handleSignOut} className="mt-2 px-4 py-2 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    );
  }
  if (access === null) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return <DepositDashboard onSignOut={handleSignOut} canManageAccounts={access === "admin"} currentUid={authUser.uid} />;
}
