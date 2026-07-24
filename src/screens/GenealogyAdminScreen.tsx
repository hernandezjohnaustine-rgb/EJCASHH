import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { Network, Loader2, ShieldAlert, LogOut, Search, ChevronDown, Users, Maximize } from "lucide-react";

const MASTER_EMAIL = "austinejohnter17@gmail.com";

interface TreeUser {
  id: string;
  displayName: string;
  email?: string;
  isActivated?: boolean;
  teamSize?: number;
  children: TreeUser[];
}

const NODE_W = 200;
const NODE_H = 92;
const H_GAP = 32;
const V_GAP = 70;

// ── Layout: computes non-overlapping x/y for every visible (expanded) node ──
function computeLayout(root: TreeUser, expandedIds: Set<string>) {
  const positions = new Map<string, { x: number; y: number }>();

  function subtreeWidth(node: TreeUser): number {
    if (!expandedIds.has(node.id) || node.children.length === 0) return NODE_W;
    return node.children.reduce((sum, c) => sum + subtreeWidth(c), 0) + (node.children.length - 1) * H_GAP;
  }

  function place(node: TreeUser, leftX: number, depth: number) {
    const w = subtreeWidth(node);
    const centerX = leftX + w / 2;
    positions.set(node.id, { x: centerX - NODE_W / 2, y: depth * (NODE_H + V_GAP) });
    if (expandedIds.has(node.id) && node.children.length > 0) {
      let cursor = leftX;
      for (const child of node.children) {
        const cw = subtreeWidth(child);
        place(child, cursor, depth + 1);
        cursor += cw + H_GAP;
      }
    }
  }

  place(root, 0, 0);
  return positions;
}

function buildFlowElements(
  root: TreeUser,
  expandedIds: Set<string>,
  positions: Map<string, { x: number; y: number }>,
  highlightedId: string | null,
  onToggle: (id: string) => void
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function walk(node: TreeUser) {
    const pos = positions.get(node.id) || { x: 0, y: 0 };
    nodes.push({
      id: node.id,
      type: "genealogy",
      position: pos,
      data: {
        displayName: node.displayName,
        teamSize: node.teamSize || 0,
        directCount: node.children.length,
        isActivated: !!node.isActivated,
        hasChildren: node.children.length > 0,
        expanded: expandedIds.has(node.id),
        highlighted: node.id === highlightedId,
        onToggle: () => onToggle(node.id),
      },
      draggable: false,
    });
    if (expandedIds.has(node.id)) {
      for (const child of node.children) {
        edges.push({
          id: `${node.id}->${child.id}`,
          source: node.id,
          target: child.id,
          type: "smoothstep",
          style: { stroke: "#334155", strokeWidth: 1.5 },
        });
        walk(child);
      }
    }
  }

  walk(root);
  return { nodes, edges };
}

// ── Custom node card ─────────────────────────────────────────────────────
function GenealogyNode({ data }: any) {
  return (
    <div
      style={{ width: NODE_W }}
      className={
        "relative px-4 py-3 rounded-2xl border shadow-lg transition-all " +
        (data.highlighted
          ? "border-emerald-400 bg-emerald-500/20 shadow-emerald-500/40 scale-105"
          : "border-slate-700 bg-slate-900/95 hover:border-slate-600")
      }
    >
      <Handle type="target" position={Position.Top} style={{ background: "#475569", border: 0, width: 6, height: 6 }} />
      <div className="flex items-center gap-2 mb-1.5">
        <div className={"w-2 h-2 rounded-full shrink-0 " + (data.isActivated ? "bg-emerald-400" : "bg-slate-600")} />
        <span className="text-xs font-bold text-slate-100 truncate">{data.displayName}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-slate-400">
        <span className="flex items-center gap-1"><Users className="w-2.5 h-2.5" /> {data.directCount} direct</span>
        <span>{data.teamSize} team</span>
      </div>
      {data.hasChildren && (
        <button
          onClick={data.onToggle}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors z-10"
        >
          <ChevronDown className={"w-3 h-3 transition-transform " + (data.expanded ? "" : "-rotate-90")} />
        </button>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: "#475569", border: 0, width: 6, height: 6 }} />
    </div>
  );
}

const nodeTypes = { genealogy: GenealogyNode };

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

// ── The actual React Flow canvas (needs to be inside ReactFlowProvider to use useReactFlow) ──
function TreeCanvas({ root, allById }: { root: TreeUser; allById: Map<string, TreeUser> }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const s = new Set<string>([root.id]);
    root.children.forEach((c) => s.add(c.id));
    return s;
  });
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<TreeUser[]>([]);
  const { setCenter, fitView } = useReactFlow();

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const positions = useMemo(() => computeLayout(root, expandedIds), [root, expandedIds]);
  const { nodes, edges } = useMemo(
    () => buildFlowElements(root, expandedIds, positions, highlightedId, toggleNode),
    [root, expandedIds, positions, highlightedId, toggleNode]
  );

  const flatList = useMemo(() => {
    const list: TreeUser[] = [];
    function walk(n: TreeUser) { list.push(n); n.children.forEach(walk); }
    walk(root);
    return list;
  }, [root]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.trim().length < 2) { setSearchResults([]); return; }
    setSearchResults(
      flatList.filter((n) => n.displayName.toLowerCase().includes(term.toLowerCase()) || (n.email || "").toLowerCase().includes(term.toLowerCase())).slice(0, 8)
    );
  };

  function getAncestorIds(id: string): string[] {
    const ancestors: string[] = [];
    function findParent(childId: string, node: TreeUser): TreeUser | null {
      for (const c of node.children) {
        if (c.id === childId) return node;
        const found = findParent(childId, c);
        if (found) return found;
      }
      return null;
    }
    let childId = id;
    while (true) {
      const parent = findParent(childId, root);
      if (!parent) break;
      ancestors.push(parent.id);
      childId = parent.id;
    }
    return ancestors;
  }

  const jumpToNode = (id: string) => {
    setSearchTerm("");
    setSearchResults([]);
    const ancestors = getAncestorIds(id);
    const newExpanded = new Set([...expandedIds, ...ancestors, id]);
    setExpandedIds(newExpanded);
    setHighlightedId(id);
    setTimeout(() => {
      const pos = computeLayout(root, newExpanded).get(id);
      if (pos) setCenter(pos.x + NODE_W / 2, pos.y + NODE_H / 2, { zoom: 1.1, duration: 700 });
    }, 150);
  };

  const expandAll = () => {
    const all = new Set<string>();
    flatList.forEach((n) => all.add(n.id));
    setExpandedIds(all);
  };
  const collapseAll = () => {
    setExpandedIds(new Set([root.id]));
  };

  return (
    <div className="relative w-full h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
        className="bg-transparent"
      >
        <Background color="#1e293b" gap={24} />
        <Controls className="!bg-slate-900 !border !border-slate-800 !rounded-xl overflow-hidden [&>button]:!bg-slate-900 [&>button]:!border-slate-800 [&>button]:!text-slate-400 [&>button:hover]:!bg-slate-800" />
        <MiniMap
          nodeColor={(n: any) => (n.data.isActivated ? "#10b981" : "#475569")}
          maskColor="rgba(7,11,23,0.75)"
          className="!bg-slate-900 !border !border-slate-800 !rounded-xl"
        />
      </ReactFlow>

      <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-3 flex-wrap z-10 pointer-events-none">
        <div className="flex gap-2 pointer-events-auto">
          <button onClick={expandAll} className="px-3 py-2 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
            Expand All
          </button>
          <button onClick={collapseAll} className="px-3 py-2 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
            Collapse All
          </button>
          <button onClick={() => fitView({ duration: 500 })} className="px-3 py-2 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <Maximize className="w-3 h-3" /> Fit
          </button>
        </div>

        <div className="relative w-64 pointer-events-auto">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search a user, jump to them..."
            className="w-full bg-slate-900/90 backdrop-blur border border-slate-800 rounded-lg py-2 pl-8 pr-3 text-xs focus:outline-none focus:border-emerald-500/50"
          />
          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="absolute top-full mt-1 w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl max-h-56 overflow-y-auto">
                {searchResults.map((r) => (
                  <button key={r.id} onClick={() => jumpToNode(r.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-800 transition-colors flex items-center justify-between">
                    <span>{r.displayName}</span>
                    <span className="text-slate-500">{r.teamSize || 0} team</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────
function GenealogyDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tree, setTree] = useState<TreeUser | null>(null);
  const [allById, setAllById] = useState<Map<string, TreeUser>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [totalNodes, setTotalNodes] = useState(0);

  useEffect(() => {
    async function loadFullTree() {
      setIsLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, "users"));
        const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

        const childrenOf = new Map<string, any[]>();
        for (const u of allUsers) {
          if (u.sponsorId) {
            if (!childrenOf.has(u.sponsorId)) childrenOf.set(u.sponsorId, []);
            childrenOf.get(u.sponsorId)!.push(u);
          }
        }

        const master = allUsers.find((u) => u.email === MASTER_EMAIL);
        if (!master) { setIsLoading(false); return; }

        const byId = new Map<string, TreeUser>();
        function buildNode(u: any): TreeUser {
          const kids = (childrenOf.get(u.id) || []).map(buildNode);
          const node: TreeUser = {
            id: u.id,
            displayName: u.displayName || "Unknown",
            email: u.email,
            isActivated: u.isActivated,
            teamSize: u.stats?.teamSize || 0,
            children: kids,
          };
          byId.set(u.id, node);
          return node;
        }

        const rootNode = buildNode(master);
        setTree(rootNode);
        setAllById(byId);
        setTotalNodes(allUsers.length);
      } catch (err) {
        console.error("Failed to load genealogy tree:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadFullTree();
  }, []);

  return (
    <div className="h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-100 flex flex-col">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur-md z-30 shrink-0">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Network className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Genealogy Dashboard</h1>
              <p className="text-xs text-slate-500">{totalNodes} total accounts in the network</p>
            </div>
          </div>
          <button onClick={onSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex-1 relative">
        {isLoading || !tree ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-500">Building tree...</p>
          </div>
        ) : (
          <ReactFlowProvider>
            <TreeCanvas root={tree} allById={allById} />
          </ReactFlowProvider>
        )}
      </div>
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
