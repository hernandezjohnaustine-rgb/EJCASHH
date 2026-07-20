import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, deleteDoc, query, where, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, User as FirebaseUser } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { Store, Plus, Edit3, Trash2, X, Upload, Loader2, ExternalLink, Lock, LogOut, ShieldAlert, Users, UserPlus, CheckCircle2 } from "lucide-react";

const EMPTY_MERCHANT = { name: "", iconUrl: "", link: "", requiresPayment: false, price: "", ownerId: "" };

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

function compressIcon(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 200;
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
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.7));
    };
    img.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    img.src = url;
  });
}

// Creates a new Merchant Admin account without disrupting the currently
// logged-in admin's session. Firebase's client Auth SDK normally signs you
// IN as whatever account you just created — using a temporary secondary app
// instance avoids that, since it has its own isolated auth state.
async function createMerchantAdminAccount(name: string, email: string, password: string) {
  const secondaryApp = initializeApp(firebaseConfig, "merchant-admin-creation-" + Date.now());
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName: name });

    // Written via the PRIMARY db instance (Firestore data is project-scoped,
    // not tied to which app instance performed the write) while still
    // authenticated as the ADMIN in the main session.
    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      displayName: name,
      isMerchantAccount: true, // grants access to /merchant-admin's "Merchants" tab ONLY
      isAdmin: false, // deliberately NOT admin — no access to the main Admin Panel, and cannot create more Merchant Admin accounts
      isActivated: true, // bypasses the normal activation flow entirely — no package purchase needed
      referralLinkEnabled: false,
      referralCode: null, // intentionally has no referral code — nobody can refer through this account
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
// This page does NOT rely on already being logged into the main app. It has
// its own login form, its own Firebase Auth check, and its own isAdmin
// verification — genuinely independent of the rest of EJCASHH's navigation.
// ── Self-contained login gate ──────────────────────────────────────────────
function MerchantAdminLogin({ onSuccess }: { onSuccess: () => void }) {
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
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full max-w-sm"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", damping: 15 }}
          className="flex flex-col items-center gap-3 mb-8"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold">Merchant Dashboard</h1>
          <p className="text-xs text-slate-500">Admin sign-in required</p>
        </motion.div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
          <motion.button
            whileTap={{ scale: 0.97 }}
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Main dashboard (shown only after successful admin login) ───────────────
function MerchantDashboard({ onSignOut, canManageAccounts, currentUid }: { onSignOut: () => void, canManageAccounts: boolean, currentUid: string }) {
  const [activeSection, setActiveSection] = useState<"merchants" | "accounts">("merchants");
  const [merchants, setMerchants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_MERCHANT);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Merchant Admin accounts state
  const [merchantAccounts, setMerchantAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [accountName, setAccountName] = useState("");
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [creatingAccount, setCreatingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);

  // Buyer list viewer (who unlocked/purchased a given merchant)
  const [viewingBuyersFor, setViewingBuyersFor] = useState<any | null>(null);
  const [buyers, setBuyers] = useState<any[]>([]);
  const [loadingBuyers, setLoadingBuyers] = useState(false);

  const fetchMerchants = async () => {
    setIsLoading(true);
    try {
      // True admins see every merchant; Merchant Admin accounts only see
      // (and can only ever manage) the ones assigned to them.
      const q = canManageAccounts
        ? collection(db, "merchants")
        : query(collection(db, "merchants"), where("ownerId", "==", currentUid));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setMerchants(list);
    } catch (err) {
      console.error("Failed to load merchants:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMerchants(); }, [canManageAccounts, currentUid]);

  const fetchMerchantAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const q = query(collection(db, "users"), where("isMerchantAccount", "==", true));
      const snap = await getDocs(q);
      setMerchantAccounts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Failed to load merchant accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => { if (canManageAccounts) fetchMerchantAccounts(); }, [canManageAccounts]);

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountError(null);
    if (!accountName || !accountEmail || accountPassword.length < 6) {
      setAccountError("Fill in all fields — password needs at least 6 characters.");
      return;
    }
    setCreatingAccount(true);
    try {
      await createMerchantAdminAccount(accountName, accountEmail, accountPassword);
      setAccountName("");
      setAccountEmail("");
      setAccountPassword("");
      setShowAccountForm(false);
      fetchMerchantAccounts();
    } catch (err: any) {
      setAccountError(err.code === "auth/email-already-in-use" ? "This email is already registered." : "Failed to create account.");
    } finally {
      setCreatingAccount(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_MERCHANT);
    setShowForm(true);
  };

  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      name: m.name || "",
      iconUrl: m.iconUrl || "",
      link: m.link || "",
      requiresPayment: m.requiresPayment || false,
      price: m.price ? String(m.price) : "",
      ownerId: m.ownerId || "",
    });
    setShowForm(true);
  };

  const handleToggleApproved = async (tx: any) => {
    try {
      await updateDoc(doc(db, "transactions", tx.id), {
        approved: !tx.approved,
        approvedAt: !tx.approved ? Timestamp.now() : null,
      });
      setBuyers(prev => prev.map(b => b.id === tx.id ? { ...b, approved: !tx.approved } : b));
    } catch {
      alert("Failed to update status.");
    }
  };

  const openViewBuyers = async (merchant: any) => {
    setViewingBuyersFor(merchant);
    setLoadingBuyers(true);
    setBuyers([]);
    try {
      const q = query(
        collection(db, "transactions"),
        where("category", "==", "Merchant Access"),
        where("merchantId", "==", merchant.id)
      );
      const snap = await getDocs(q);
      const txs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Resolve each buyer's display name / email for a readable list.
      const withNames = await Promise.all(
        txs.map(async (tx: any) => {
          try {
            const userSnap = await getDoc(doc(db, "users", tx.userId));
            const userData = userSnap.exists() ? userSnap.data() : null;
            return { ...tx, buyerName: userData?.displayName || "Unknown", buyerEmail: userData?.email || "", buyerPhone: userData?.phoneNumber || "" };
          } catch {
            return { ...tx, buyerName: "Unknown", buyerEmail: "" };
          }
        })
      );

      withNames.sort((a: any, b: any) => {
        const aTime = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : 0;
        const bTime = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : 0;
        return bTime - aTime;
      });
      setBuyers(withNames);
    } catch (err) {
      console.error("Failed to load buyers:", err);
    } finally {
      setLoadingBuyers(false);
    }
  };

  const handleIconUpload = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) return;
    setUploadingIcon(true);
    try {
      const compressed = await compressIcon(file);
      setForm(p => ({ ...p, iconUrl: compressed }));
    } catch {
      alert("Failed to process image.");
    } finally {
      setUploadingIcon(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.link) { alert("Name and link are required."); return; }
    if (form.requiresPayment && (!form.price || parseFloat(form.price) <= 0)) {
      alert("Please set a valid price.");
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name,
        iconUrl: form.iconUrl,
        link: form.link,
        requiresPayment: form.requiresPayment,
        price: form.requiresPayment ? parseFloat(form.price) : 0,
        order: editing?.order ?? merchants.length,
        // Merchant Admin accounts can only ever own their own listings —
        // true admins can optionally assign a merchant to a specific
        // Merchant Admin account, or leave it unassigned (admin-managed).
        ownerId: canManageAccounts ? (form.ownerId || null) : currentUid,
      };
      if (editing) {
        await updateDoc(doc(db, "merchants", editing.id), data);
      } else {
        await addDoc(collection(db, "merchants"), { ...data, createdAt: Timestamp.now() });
      }
      setShowForm(false);
      fetchMerchants();
    } catch {
      alert("Failed to save merchant.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this merchant?")) return;
    try {
      await deleteDoc(doc(db, "merchants", id));
      fetchMerchants();
    } catch {
      alert("Failed to delete.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Store className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Merchant Dashboard</h1>
              <p className="text-xs text-slate-500">Manage merchants shown to users</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeSection === "merchants" && canManageAccounts ? (
              <button
                onClick={openAdd}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add Merchant
              </button>
            ) : activeSection === "accounts" && canManageAccounts ? (
              <button
                onClick={() => { setAccountError(null); setShowAccountForm(true); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-colors"
              >
                <UserPlus className="w-4 h-4" /> New Merchant Admin
              </button>
            ) : null}
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="max-w-5xl mx-auto px-6 pb-3 flex gap-2">
          <button
            onClick={() => setActiveSection("merchants")}
            className={"px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors " + (activeSection === "merchants" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-slate-300")}
          >
            Merchants
          </button>
          {canManageAccounts && (
            <button
              onClick={() => setActiveSection("accounts")}
              className={"px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors " + (activeSection === "accounts" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "text-slate-500 hover:text-slate-300")}
            >
              Merchant Admin Accounts
            </button>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {activeSection === "merchants" ? (
          isLoading ? (
            <TableSkeleton rows={4} />
          ) : merchants.length === 0 ? (
            <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
              <Store className="w-10 h-10 text-slate-700 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No merchants yet</p>
              <p className="text-slate-600 text-sm mt-1">Click "Add Merchant" to create your first listing</p>
            </div>
          ) : (
            <div className="border border-slate-800 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-900/60 text-left text-slate-400 text-xs uppercase tracking-wider">
                    <th className="px-5 py-3 font-semibold">Merchant</th>
                    <th className="px-5 py-3 font-semibold">Link</th>
                    <th className="px-5 py-3 font-semibold">Price</th>
                    {canManageAccounts && <th className="px-5 py-3 font-semibold">Owner</th>}
                    <th className="px-5 py-3 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {merchants.map((m) => (
                    <tr key={m.id} className="border-t border-slate-800 hover:bg-slate-900/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                            {m.iconUrl ? (
                              <img src={m.iconUrl} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Store className="w-4 h-4 text-slate-600" />
                            )}
                          </div>
                          <span className="font-semibold">{m.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-400 max-w-xs truncate">
                        <a href={m.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-emerald-400 transition-colors">
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{m.link}</span>
                        </a>
                      </td>
                      <td className="px-5 py-4">
                        {m.requiresPayment && m.price > 0 ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                            <Lock className="w-3 h-3" /> ₱{m.price.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-600 text-xs">Free</span>
                        )}
                      </td>
                      {canManageAccounts && (
                        <td className="px-5 py-4 text-slate-400 text-xs">
                          {m.ownerId ? (merchantAccounts.find(a => a.id === m.ownerId)?.displayName || "Unknown") : <span className="text-slate-600">Admin</span>}
                        </td>
                      )}
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openViewBuyers(m)}
                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold transition-colors"
                          >
                            <Users className="w-3.5 h-3.5" /> View Buyers
                          </button>
                          {canManageAccounts && (
                            <>
                              <button onClick={() => openEdit(m)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-blue-400 transition-colors">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-red-400 transition-colors">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // ── Merchant Admin Accounts panel ──────────────────────────────
          <div>
            <div className="mb-5 bg-slate-900/40 border border-slate-800 rounded-xl p-4">
              <p className="text-xs text-slate-400 leading-relaxed">
                Accounts created here get instant access to this dashboard, with no package activation required.
                They are structurally excluded from the referral/unilevel system — no referral code, no team
                placement, no commissions in or out.
              </p>
            </div>
            {loadingAccounts ? (
              <TableSkeleton rows={3} />
            ) : merchantAccounts.length === 0 ? (
              <div className="text-center py-24 border border-dashed border-slate-800 rounded-2xl">
                <Users className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-slate-500 font-medium">No Merchant Admin accounts yet</p>
                <p className="text-slate-600 text-sm mt-1">Click "New Merchant Admin" to create one</p>
              </div>
            ) : (
              <div className="border border-slate-800 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-900/60 text-left text-slate-400 text-xs uppercase tracking-wider">
                      <th className="px-5 py-3 font-semibold">Name</th>
                      <th className="px-5 py-3 font-semibold">Email</th>
                      <th className="px-5 py-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {merchantAccounts.map((a) => (
                      <tr key={a.id} className="border-t border-slate-800">
                        <td className="px-5 py-4 font-semibold">{a.displayName}</td>
                        <td className="px-5 py-4 text-slate-400">{a.email}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>

      <AnimatePresence>
        {viewingBuyersFor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setViewingBuyersFor(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 max-h-[80vh] flex flex-col"
            >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-bold">{viewingBuyersFor.name}</h3>
                <p className="text-xs text-slate-500">Users who unlocked this merchant</p>
              </div>
              <button onClick={() => setViewingBuyersFor(null)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto mt-4">
              {loadingBuyers ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                </div>
              ) : buyers.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-8 h-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm font-medium">No one has unlocked this yet</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {buyers.map((b) => (
                    <div key={b.id} className="flex items-center justify-between bg-slate-800/60 border border-slate-800 rounded-lg px-4 py-3 gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{b.buyerName}</p>
                        <p className="text-xs text-slate-500 truncate">{b.buyerEmail}</p>
                        {b.buyerPhone && <p className="text-xs text-slate-400 truncate">+63 {b.buyerPhone}</p>}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-emerald-400">₱{(b.amount || 0).toLocaleString()}</p>
                        <p className="text-[10px] text-slate-500">
                          {b.timestamp?.toDate ? b.timestamp.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => handleToggleApproved(b)}
                        className={
                          "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold shrink-0 transition-colors " +
                          (b.approved
                            ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400"
                            : "bg-slate-700 text-slate-300 hover:bg-slate-600")
                        }
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {b.approved ? "Approved" : "Approve"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {buyers.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">Total collected</span>
                <span className="text-sm font-bold text-emerald-400">
                  ₱{buyers.reduce((sum, b) => sum + (b.amount || 0), 0).toLocaleString()}
                </span>
              </div>
            )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAccountForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowAccountForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold">New Merchant Admin Account</h3>
              <button onClick={() => setShowAccountForm(false)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAccount} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Name</label>
                <input
                  required
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="Merchant Team"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email</label>
                <input
                  required
                  type="email"
                  value={accountEmail}
                  onChange={(e) => setAccountEmail(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="merchant@example.com"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
                <input
                  required
                  type="password"
                  value={accountPassword}
                  onChange={(e) => setAccountPassword(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
                  placeholder="At least 6 characters"
                />
              </div>
              {accountError && <p className="text-red-400 text-xs font-medium">{accountError}</p>}
              <button
                type="submit"
                disabled={creatingAccount}
                className="w-full py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60"
              >
                {creatingAccount ? "Creating..." : "Create Account"}
              </button>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && setShowForm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6"
            >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-bold">{editing ? "Edit Merchant" : "Add Merchant"}</h3>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Merchant Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Digikash Coin"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Icon / Logo</label>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    {uploadingIcon ? (
                      <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                    ) : form.iconUrl ? (
                      <img src={form.iconUrl} alt="preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <Store className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingIcon}
                    className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:border-emerald-500/40 transition-colors disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {form.iconUrl ? "Change" : "Upload"}
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleIconUpload(e.target.files?.[0] ?? null)} />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Link</label>
                <input
                  type="text"
                  value={form.link}
                  onChange={e => setForm(p => ({ ...p, link: e.target.value }))}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-lg p-3.5">
                <div>
                  <p className="text-sm font-semibold">Requires Payment</p>
                  <p className="text-[11px] text-slate-500">One-time unlock fee per user</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, requiresPayment: !p.requiresPayment }))}
                  className={"w-11 h-6 rounded-full relative flex items-center px-1 transition-colors " + (form.requiresPayment ? "bg-emerald-500" : "bg-slate-700")}
                >
                  <div className={"w-4 h-4 bg-white rounded-full transition-transform " + (form.requiresPayment ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>

              {form.requiresPayment && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Price (₱)</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="300"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              )}

              {canManageAccounts && (
                <div>
                  <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Assign to Merchant Admin</label>
                  <select
                    value={form.ownerId}
                    onChange={e => setForm(p => ({ ...p, ownerId: e.target.value }))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">— Unassigned (managed by admins) —</option>
                    {merchantAccounts.map(a => (
                      <option key={a.id} value={a.id}>{a.displayName} ({a.email})</option>
                    ))}
                  </select>
                </div>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Merchant"}
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Top-level gate: handles its own auth state + isAdmin check ─────────────
export default function MerchantAdminScreen() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [access, setAccess] = useState<"admin" | "merchant" | "denied" | null>(null); // null = not checked yet
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthUser(fbUser);
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, "users", fbUser.uid));
          const data = snap.exists() ? snap.data() : null;
          if (data?.isAdmin === true) {
            setAccess("admin"); // full access: manage merchants AND create/view other Merchant Admin accounts
          } else if (data?.isMerchantAccount === true) {
            setAccess("merchant"); // limited access: manage merchants only
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

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (!authUser) {
    return <MerchantAdminLogin onSuccess={() => {}} />;
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
          <button
            onClick={handleSignOut}
            className="mt-2 px-4 py-2 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  if (access === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return <MerchantDashboard onSignOut={handleSignOut} canManageAccounts={access === "admin"} currentUid={authUser.uid} />;
}
