import { useState, useEffect, useRef } from "react";
import { collection, getDocs, doc, getDoc, updateDoc, addDoc, deleteDoc, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { Store, Plus, Edit3, Trash2, X, Upload, Loader2, ExternalLink, Lock, LogOut, ShieldAlert } from "lucide-react";

const EMPTY_MERCHANT = { name: "", iconUrl: "", link: "", requiresPayment: false, price: "" };

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

// ── Self-contained login gate ──────────────────────────────────────────────
// This page does NOT rely on already being logged into the main app. It has
// its own login form, its own Firebase Auth check, and its own isAdmin
// verification — genuinely independent of the rest of EJCASHH's navigation.
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
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Store className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold">Merchant Dashboard</h1>
          <p className="text-xs text-slate-500">Admin sign-in required</p>
        </div>

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
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Main dashboard (shown only after successful admin login) ───────────────
function MerchantDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_MERCHANT);
  const [saving, setSaving] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMerchants = async () => {
    setIsLoading(true);
    try {
      const snap = await getDocs(collection(db, "merchants"));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
      setMerchants(list);
    } catch (err) {
      console.error("Failed to load merchants:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchMerchants(); }, []);

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
    });
    setShowForm(true);
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
            <button
              onClick={openAdd}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-sm font-bold hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Merchant
            </button>
            <button
              onClick={onSignOut}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
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
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(m)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-blue-400 transition-colors">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDelete(m.id)} className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
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

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : editing ? "Save Changes" : "Add Merchant"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Top-level gate: handles its own auth state + isAdmin check ─────────────
export default function MerchantAdminScreen() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = not checked yet
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setAuthUser(fbUser);
      if (fbUser) {
        try {
          const snap = await getDoc(doc(db, "users", fbUser.uid));
          setIsAdmin(snap.exists() && snap.data().isAdmin === true);
        } catch {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(null);
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

  if (isAdmin === false) {
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

  // isAdmin === true (or still resolving right after login — loader covers that gap)
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return <MerchantDashboard onSignOut={handleSignOut} />;
}
