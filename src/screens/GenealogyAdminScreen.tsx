import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { Network, Loader2, ShieldAlert, LogOut, Search, ChevronDown, Users } from "lucide-react";

const MASTER_EMAIL = "austinejohnter17@gmail.com";

interface Node {
  id: string;
  displayName: string;
  email?: string;
  isActivated?: boolean;
  teamSize?: number;
  children: Node[];
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 flex items-center justify-center p-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: "easeOut" }} className="w-full max-w-sm">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: "spring", damping: 15 }} className="flex flex-col items-center gap-3 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
            <Network className="w-7 h-7 text-emerald-400" />
          </div>
          <h1 className="text-xl font-bold">Genealogy Dashboard</h1>
          <p className="text-xs text-slate-500">Main admin sign-in required</p>
        </motion.div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Email</label>
            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              placeholder="admin@example.com" />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-400 mb-1.5 block">Password</label>
            <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 px-4 text-sm focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/30 transition-all"
              placeholder="••••••••" />
          </div>
          {error && <p className="text-red-400 text-xs font-medium">{error}</p>}
          <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 disabled:opacity-60 flex items-center justify-center gap-2">
            {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : "Sign In"}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}

// ── Recursive collapsible tree node ─────────────────────────────────────
function TreeNode({ node, depth }: { node: Node; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 2); // auto-expand first 2 levels, collapse deeper by default to stay manageable
  const hasChildren = node.children.length > 0;

  const palette = [
    { border: "border-emerald-500/40", bg: "bg-emerald-500/10", text: "text-emerald-400" },
    { border: "border-sky-500/40", bg: "bg-sky-500/10", text: "text-sky-400" },
    { border: "border-violet-500/40", bg: "bg-violet-500/10", text: "text-violet-400" },
    { border: "border-amber-500/40", bg: "bg-amber-500/10", text: "text-amber-400" },
  ];
  const color = palette[depth % palette.length];

  return (
    <div className="flex flex-col items-center">
      <motion.div
        id={`node-${node.id}`}
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl border ${color.border} ${color.bg} shadow-sm shrink-0`}
      >
        {hasChildren && (
          <motion.button
            onClick={() => setExpanded((e) => !e)}
            animate={{ rotate: expanded ? 0 : -90 }}
            transition={{ duration: 0.2 }}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </motion.button>
        )}
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${node.isActivated ? "bg-emerald-400" : "bg-slate-600"}`} />
        <div className="flex flex-col">
          <span className="text-xs font-bold whitespace-nowrap max-w-[130px] truncate">{node.displayName}</span>
          <span className={`text-[9px] font-semibold flex items-center gap-1 ${color.text}`}>
            <Users className="w-2.5 h-2.5" /> {node.children.length} direct · {node.teamSize || 0} team
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {hasChildren && expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="overflow-hidden flex flex-col items-center"
          >
            <div className="w-px h-5 bg-slate-800" />
            <div className="flex gap-5 pb-1 relative">
              {node.children.map((child) => (
                <div key={child.id} className="flex flex-col items-center">
                  <div className="w-px h-5 bg-slate-800" />
                  <TreeNode node={child} depth={depth + 1} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────
function GenealogyDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tree, setTree] = useState<Node | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<Node[]>([]);
  const [totalNodes, setTotalNodes] = useState(0);

  const loadFullTree = async () => {
    setIsLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const childrenOf = new Map<string, any[]>();
      for (const u of allUsers) {
        if (u.sponsorId) {
          if (!childrenOf.has(u.sponsorId)) childrenOf.set(u.sponsorId, []);
          childrenOf.get(u.sponsorId)!.push(u);
        }
      }

      const master = allUsers.find(u => u.email === MASTER_EMAIL);
      if (!master) { setIsLoading(false); return; }

      function buildNode(u: any): Node {
        const kids = (childrenOf.get(u.id) || []).map(buildNode);
        return {
          id: u.id,
          displayName: u.displayName || "Unknown",
          email: u.email,
          isActivated: u.isActivated,
          teamSize: u.stats?.teamSize || 0,
          children: kids,
        };
      }

      const rootNode = buildNode(master);
      setTree(rootNode);
      setTotalNodes(allUsers.length);
    } catch (err) {
      console.error("Failed to load genealogy tree:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadFullTree(); }, []);

  const flatNodes = useMemo(() => {
    const list: Node[] = [];
    function walk(n: Node) { list.push(n); n.children.forEach(walk); }
    if (tree) walk(tree);
    return list;
  }, [tree]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim().length < 2) { setSearchResults([]); return; }
    const matches = flatNodes
      .filter(n => n.displayName.toLowerCase().includes(term.toLowerCase()) || (n.email || "").toLowerCase().includes(term.toLowerCase()))
      .slice(0, 8);
    setSearchResults(matches);
  };

  const jumpToNode = (id: string) => {
    setSearchTerm("");
    setSearchResults([]);
    setTimeout(() => {
      const el = document.getElementById(`node-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
        el.animate([{ boxShadow: "0 0 0 4px rgba(16,185,129,0.6)" }, { boxShadow: "0 0 0 0px rgba(16,185,129,0)" }], { duration: 1200 });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Genealogy Dashboard</h1>
              <p className="text-xs text-slate-500">{totalNodes} total accounts in the network</p>
            </div>
          </div>

          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Search a user, jump to them..."
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-emerald-500/50"
            />
            <AnimatePresence>
              {searchResults.length > 0 && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-full mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden z-30 max-h-56 overflow-y-auto shadow-xl">
                  {searchResults.map(r => (
                    <button key={r.id} onClick={() => jumpToNode(r.id)}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition-colors flex items-center justify-between">
                      <span>{r.displayName}</span>
                      <span className="text-slate-500">{r.teamSize || 0} team</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={onSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12 overflow-x-auto">
        {isLoading || !tree ? (
          <div className="flex flex-col items-center justify-center gap-4 py-24">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-500">Building tree...</p>
          </div>
        ) : (
          <div className="flex justify-center min-w-max mx-auto pb-8">
            <TreeNode node={tree} depth={0} />
          </div>
        )}
      </main>

      {!isLoading && tree && (
        <div className="fixed bottom-6 right-6 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-[10px] text-slate-500 shadow-lg">
          Tip: click the arrow on any node to collapse/expand its branch
        </div>
      )}
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
