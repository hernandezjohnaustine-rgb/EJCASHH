import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { collection, getDocs, doc, getDoc, query, where } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { Network, Loader2, ShieldAlert, LogOut, Search, ChevronRight, Home, Users } from "lucide-react";

const MASTER_EMAIL = "austinejohnter17@gmail.com";

interface Node {
  id: string;
  displayName: string;
  isActivated?: boolean;
  teamSize?: number;
}

// ── Self-contained login gate ──────────────────────────────────────────────
function GenealogyLogin({ onSuccess }: { onSuccess: () => void }) {
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
            <Network className="w-6 h-6 text-emerald-400" />
          </div>
          <h1 className="text-lg font-bold">Genealogy Dashboard</h1>
          <p className="text-xs text-slate-500">Main admin sign-in required</p>
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

// ── Tree node card ───────────────────────────────────────────────────────
function NodeCard({ node, onClick, highlight }: { node: Node; onClick?: () => void; highlight?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={
        "flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-left transition-all shrink-0 " +
        (highlight
          ? "bg-emerald-500/10 border-emerald-500/40"
          : "bg-slate-900 border-slate-800 hover:border-emerald-500/30 hover:bg-slate-800/60")
      }
    >
      <div className="flex items-center gap-1.5">
        <div className={"w-2 h-2 rounded-full " + (node.isActivated ? "bg-emerald-400" : "bg-slate-600")} />
        <span className="text-xs font-bold whitespace-nowrap max-w-[120px] truncate">{node.displayName}</span>
      </div>
      <span className="text-[9px] text-slate-500 flex items-center gap-1">
        <Users className="w-2.5 h-2.5" /> {node.teamSize || 0} team
      </span>
    </button>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────
function GenealogyDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [rootId, setRootId] = useState<string | null>(null);
  const [rootPath, setRootPath] = useState<Node[]>([]); // breadcrumb of recenters
  const [rootNode, setRootNode] = useState<Node | null>(null);
  const [level1, setLevel1] = useState<Node[]>([]);
  const [level2ByParent, setLevel2ByParent] = useState<Record<string, Node[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [searching, setSearching] = useState(false);

  // Resolve master account as the initial root.
  useEffect(() => {
    async function init() {
      const q = query(collection(db, "users"), where("email", "==", MASTER_EMAIL));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const d = snap.docs[0];
        setRootId(d.id);
        setRootNode({ id: d.id, displayName: d.data().displayName || "Master", isActivated: d.data().isActivated, teamSize: d.data().stats?.teamSize });
      }
    }
    init();
  }, []);

  const loadTree = async (uid: string) => {
    setIsLoading(true);
    try {
      const rootSnap = await getDoc(doc(db, "users", uid));
      if (!rootSnap.exists()) return;
      const rootData = rootSnap.data();
      setRootNode({ id: uid, displayName: rootData.displayName || "Unknown", isActivated: rootData.isActivated, teamSize: rootData.stats?.teamSize });

      const l1Snap = await getDocs(query(collection(db, "users"), where("sponsorId", "==", uid)));
      const l1Nodes: Node[] = l1Snap.docs.map(d => ({ id: d.id, displayName: d.data().displayName || "Unknown", isActivated: d.data().isActivated, teamSize: d.data().stats?.teamSize }));
      setLevel1(l1Nodes);

      const l2Map: Record<string, Node[]> = {};
      await Promise.all(l1Nodes.map(async (n) => {
        const l2Snap = await getDocs(query(collection(db, "users"), where("sponsorId", "==", n.id)));
        l2Map[n.id] = l2Snap.docs.map(d => ({ id: d.id, displayName: d.data().displayName || "Unknown", isActivated: d.data().isActivated, teamSize: d.data().stats?.teamSize }));
      }));
      setLevel2ByParent(l2Map);
    } catch (err) {
      console.error("Failed to load genealogy tree:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (rootId) loadTree(rootId); }, [rootId]);

  const recenterOn = (node: Node) => {
    if (rootNode) setRootPath(prev => [...prev, rootNode]);
    setRootId(node.id);
  };

  const goBackTo = (index: number) => {
    const target = rootPath[index];
    setRootPath(prev => prev.slice(0, index));
    setRootId(target.id);
  };

  const goHome = async () => {
    const q = query(collection(db, "users"), where("email", "==", MASTER_EMAIL));
    const snap = await getDocs(q);
    if (!snap.empty) {
      setRootPath([]);
      setRootId(snap.docs[0].id);
    }
  };

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const snap = await getDocs(collection(db, "users"));
      const matches = snap.docs
        .filter(d => (d.data().displayName || "").toLowerCase().includes(term.toLowerCase()) || (d.data().email || "").toLowerCase().includes(term.toLowerCase()))
        .slice(0, 8)
        .map(d => ({ id: d.id, displayName: d.data().displayName || "Unknown", isActivated: d.data().isActivated, teamSize: d.data().stats?.teamSize }));
      setSearchResults(matches);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Genealogy Dashboard</h1>
              <p className="text-xs text-slate-500">Placement tree — root + 2 levels at a time</p>
            </div>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search a user to jump to..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-emerald-500/50"
            />
            {searchResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden z-30 max-h-56 overflow-y-auto">
                {searching && <div className="px-3 py-2 text-xs text-slate-500">Searching...</div>}
                {searchResults.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { recenterOn(r); setSearchTerm(""); setSearchResults([]); }}
                    className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition-colors flex items-center justify-between"
                  >
                    <span>{r.displayName}</span>
                    <span className="text-slate-500">{r.teamSize || 0} team</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button onClick={goHome} className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-800 text-slate-400 text-xs font-semibold hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
              <Home className="w-3.5 h-3.5" /> Master
            </button>
            <button onClick={onSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {rootPath.length > 0 && (
          <div className="max-w-6xl mx-auto px-6 pb-3 flex items-center gap-1 flex-wrap text-xs">
            {rootPath.map((n, i) => (
              <div key={n.id} className="flex items-center gap-1">
                <button onClick={() => goBackTo(i)} className="text-slate-500 hover:text-emerald-400 transition-colors">{n.displayName}</button>
                <ChevronRight className="w-3 h-3 text-slate-700" />
              </div>
            ))}
            <span className="text-emerald-400 font-bold">{rootNode?.displayName}</span>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 overflow-x-auto">
        {isLoading || !rootNode ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 min-w-max mx-auto">
            {/* Root */}
            <NodeCard node={rootNode} highlight />

            {level1.length === 0 ? (
              <p className="text-slate-600 text-sm">No one is placed directly under this account yet.</p>
            ) : (
              <>
                {/* Connector */}
                <div className="w-px h-6 bg-slate-800" />

                {/* Level 1 row */}
                <div className="flex gap-6">
                  {level1.map((n) => {
                    const children = level2ByParent[n.id] || [];
                    return (
                      <div key={n.id} className="flex flex-col items-center gap-4">
                        <NodeCard node={n} onClick={() => recenterOn(n)} />
                        {children.length > 0 && (
                          <>
                            <div className="w-px h-5 bg-slate-800" />
                            <div className="flex gap-2 border-t border-slate-800 pt-3 max-w-[220px] flex-wrap justify-center">
                              {children.map((c) => (
                                <NodeCard key={c.id} node={c} onClick={() => recenterOn(c)} />
                              ))}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ── Top-level gate: TRUE ADMIN ONLY ─────────────────────────────────────
export default function GenealogyAdminScreen() {
  const [authUser, setAuthUser] = useState<FirebaseUser | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
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

  const handleSignOut = async () => { await signOut(auth); };

  if (checkingAuth) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }
  if (!authUser) {
    return <GenealogyLogin onSuccess={() => {}} />;
  }
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <ShieldAlert className="w-10 h-10 text-red-400" />
          <div>
            <p className="text-lg font-bold mb-1">Access Denied</p>
            <p className="text-sm text-slate-500">Only the main admin can view the genealogy dashboard.</p>
          </div>
          <button onClick={handleSignOut} className="mt-2 px-4 py-2 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    );
  }
  if (isAdmin === null) {
    return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><Loader2 className="w-8 h-8 text-emerald-400 animate-spin" /></div>;
  }

  return <GenealogyDashboard onSignOut={handleSignOut} />;
}
