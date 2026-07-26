import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
import { toPng } from "html-to-image";
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, addDoc, query, where, limit, Timestamp } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile, User as FirebaseUser } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../lib/firebase";
import firebaseConfig from "../../firebase-applet-config.json";
import { Network, Loader2, ShieldAlert, LogOut, Search, ChevronDown, Users, Maximize, Plus, X, Edit3, Key, Mail, Zap, Wallet as WalletIcon, ArrowDownCircle, ArrowUpCircle, Smartphone, Phone, Hash, Calendar, Filter } from "lucide-react";

// Replace with your actual Netlify function URL once deployed.
const PASSWORD_UPDATE_URL = "https://ejcashh.vercel.app/api/updateUserPassword";

// Creates a new user account placed directly into the referral chain under
// a given node, without disrupting the currently logged-in admin's session
// (same secondary-app pattern used for Merchant/Deposit Admin accounts).
async function createPlacedUser(name: string, username: string, email: string, password: string, referrerId: string) {
  const secondaryApp = initializeApp(firebaseConfig, "genealogy-user-creation-" + Date.now());
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName: name });

    const generatedReferralCode = username ? username.toUpperCase() : ("EJ-" + cred.user.uid.substring(0, 6).toUpperCase());

    await setDoc(doc(db, "users", cred.user.uid), {
      uid: cred.user.uid,
      email,
      displayName: name,
      username: username || null,
      isActivated: false,
      referralLinkEnabled: true,
      balance: 0,
      earningsWallet: 0,
      creditsBalance: 0,
      tradingInvested: 0,
      tradingEarnings: 0,
      tradingActive: false,
      tradingClaimedToday: false,
      tradingDaysCompleted: 0,
      referralCode: generatedReferralCode,
      referredBy: null,
      originalReferrerId: referrerId, // places them in the referral chain directly under this node
      sponsorId: null, // NOT auto-placed in the team matrix — that happens normally on activation
      createdAt: new Date().toISOString(),
      stats: { vipLevel: 1, directReferrals: 0, totalReferrals: 0, teamSize: 0, totalEarnings: 0 },
    });

    try {
      await setDoc(doc(db, "referralCodes", generatedReferralCode), { uid: cred.user.uid });
    } catch (e) {
      console.error("Failed to create referralCodes lookup doc:", e);
    }

    await secondaryAuth.signOut();
    return cred.user.uid;
  } finally {
    await deleteApp(secondaryApp);
  }
}

// Calls the secure Netlify function to change another user's password —
// verified server-side against the caller's own admin status.
async function changeUserPassword(targetUserId: string, newPassword: string) {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error("Not signed in");
  const res = await fetch(PASSWORD_UPDATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ targetUserId, newPassword }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to update password");
}

// Performs a REAL activation for the target user — balance deduction,
// referrer resolution, matrix placement (first activation only), and full
// commission distribution (L1 cash, L2-10 referral chain, L11-20 matrix).
// Mirrors handleActivationComplete in App.tsx step-for-step, but kept as
// its own separate copy here rather than importing/refactoring App.tsx —
// so this new admin capability can never risk regressing the existing,
// already-tested normal in-app activation flow.
async function activateUserPackage(userId: string, packageId: string) {
  const amount = packageId === "package_1" ? 360 : packageId === "package_2" ? 3600 : 3960;
  const userDocRef = doc(db, "users", userId);
  const freshDoc = await getDoc(userDocRef);
  if (!freshDoc.exists()) throw new Error("User not found");
  const freshData = freshDoc.data();
  const freshBalance = freshData.balance || 0;
  const wasAlreadyActivated = freshData.isActivated === true;

  if (freshBalance < amount) {
    throw new Error(`Insufficient balance. Needs ₱${amount.toLocaleString()} but has ₱${freshBalance.toLocaleString()}`);
  }

  let originalReferrerId: string | null = freshData.originalReferrerId || null;
  if (!originalReferrerId) {
    originalReferrerId = freshData.sponsorId || null;
    if (freshData.referredBy) {
      const refQuery = query(collection(db, "users"), where("referralCode", "==", freshData.referredBy), limit(1));
      const refSnap = await getDocs(refQuery);
      if (!refSnap.empty) originalReferrerId = refSnap.docs[0].id;
    }
    await setDoc(userDocRef, { originalReferrerId }, { merge: true });
  }

  const sponsorId = originalReferrerId;
  if (!wasAlreadyActivated && sponsorId) {
    const { autoPlaceUser } = await import("../services/autoPlacementService");
    await autoPlaceUser(userId, sponsorId);
  }

  const freshDoc2 = await getDoc(userDocRef);
  const updatedSponsorId = freshDoc2.data()?.sponsorId || originalReferrerId;
  const actualReferrerId = originalReferrerId;

  const packageMultiplier = packageId === "package_1" ? 1 : 10;
  const packageName = packageId === "package_1" ? "EJCASHH Subscription" : packageId === "package_2" ? "Activation Livelihood Program" : "Complete Activation Bundle";

  await setDoc(userDocRef, {
    balance: freshBalance - amount,
    isActivated: true,
    activatedAt: new Date().toISOString(),
    activePackage: packageId,
    packageMultiplier,
    hasPackage1: packageId === "package_1" || packageId === "combined",
    hasPackage2: packageId === "package_2" || packageId === "combined",
  }, { merge: true });

  const { processActivation } = await import("../services/earningsService");
  await processActivation(userId, updatedSponsorId, packageId, actualReferrerId, !wasAlreadyActivated);

  await addDoc(collection(db, "transactions"), {
    userId,
    type: "out",
    title: `${packageName} Activation (Admin)`,
    amount,
    category: "Activation",
    status: "Completed",
    referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
    paymentMethod: "Admin Panel",
    timestamp: Timestamp.now(),
  });
}

const MASTER_EMAIL = "austinejohnter17@gmail.com";

interface TreeUser {
  id: string;
  displayName: string;
  email?: string;
  isActivated?: boolean;
  teamSize?: number;
  activePackage?: string;
  vipLevel?: number;
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
  onToggle: (id: string) => void,
  onAddUser: ((node: TreeUser) => void) | undefined,
  onOpenDetails: (node: TreeUser) => void,
  matchedIds: Set<string> | null
) {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  function walk(node: TreeUser, level: number) {
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
        dimmed: matchedIds ? !matchedIds.has(node.id) : false,
        level,
        onToggle: () => onToggle(node.id),
        onAddUser: onAddUser ? () => onAddUser(node) : undefined,
        onOpenDetails: () => onOpenDetails(node),
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
        walk(child, level + 1);
      }
    }
  }

  walk(root, 1);
  return { nodes, edges };
}

// ── Custom node card ─────────────────────────────────────────────────────
function GenealogyNode({ data }: any) {
  return (
    <div
      style={{ width: NODE_W, opacity: data.dimmed ? 0.25 : 1 }}
      onClick={data.onOpenDetails}
      className={
        "relative px-4 py-3 rounded-2xl border shadow-lg transition-all cursor-pointer " +
        (data.highlighted
          ? "border-emerald-400 bg-emerald-500/20 shadow-emerald-500/40 scale-105"
          : "border-slate-700 bg-slate-900/95 hover:border-slate-600")
      }
    >
      <Handle type="target" position={Position.Top} style={{ background: "#475569", border: 0, width: 6, height: 6 }} />
      <div className="absolute -top-2.5 -left-2.5 min-w-[22px] h-[22px] px-1 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[9px] font-black text-emerald-400 z-10">
        L{data.level}
      </div>
      {data.onAddUser && (
        <button
          onClick={(e) => { e.stopPropagation(); data.onAddUser(); }}
          title="Add user under this person"
          className="absolute -top-2.5 -right-2.5 w-6 h-6 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-md hover:bg-emerald-400 transition-colors z-10"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      )}
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
          onClick={(e) => { e.stopPropagation(); data.onToggle(); }}
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
function TreeCanvas({ root, allById, onRefresh, canEditPlacement }: { root: TreeUser; allById: Map<string, TreeUser>; onRefresh: () => void; canEditPlacement: boolean }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const s = new Set<string>([root.id]);
    root.children.forEach((c) => s.add(c.id));
    return s;
  });
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<TreeUser[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ activePackage: "", status: "", minTeamSize: "", vipLevel: "" });
  const { setCenter, fitView } = useReactFlow();

  // Add User modal
  const [addUserParent, setAddUserParent] = useState<TreeUser | null>(null);
  const [addUserForm, setAddUserForm] = useState({ name: "", username: "", email: "", password: "" });
  const [creatingUser, setCreatingUser] = useState(false);
  const [addUserError, setAddUserError] = useState<string | null>(null);

  // Detail drawer
  const [selectedNode, setSelectedNode] = useState<TreeUser | null>(null);
  const [drawerTab, setDrawerTab] = useState<"profile" | "wallet" | "deposits" | "withdrawals" | "team" | "devices">("profile");
  const [fullUserData, setFullUserData] = useState<any>(null);
  const [loadingDrawerData, setLoadingDrawerData] = useState(false);
  const [memberDeposits, setMemberDeposits] = useState<any[]>([]);
  const [memberWithdrawals, setMemberWithdrawals] = useState<any[]>([]);
  const [memberDevices, setMemberDevices] = useState<any[]>([]);
  const [editName, setEditName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [selectedPackage, setSelectedPackage] = useState("package_1");
  const [activating, setActivating] = useState(false);
  const [activationMessage, setActivationMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const openAddUser = useCallback((node: TreeUser) => {
    setAddUserError(null);
    setAddUserForm({ name: "", username: "", email: "", password: "" });
    setAddUserParent(node);
  }, []);

  const openDetails = useCallback((node: TreeUser) => {
    setSelectedNode(node);
    setEditName(node.displayName);
    setNewPasswordInput("");
    setPasswordMessage(null);
    setSelectedPackage("package_1");
    setActivationMessage(null);
    setDrawerTab("profile");
    setFullUserData(null);
    setMemberDeposits([]);
    setMemberWithdrawals([]);
    setMemberDevices([]);

    setLoadingDrawerData(true);
    (async () => {
      try {
        const [userSnap, depositsSnap, withdrawalsSnap, devicesSnap] = await Promise.all([
          getDoc(doc(db, "users", node.id)),
          getDocs(query(collection(db, "depositRequests"), where("userId", "==", node.id))),
          getDocs(query(collection(db, "withdrawalRequests"), where("userId", "==", node.id))),
          getDocs(collection(db, "users", node.id, "devices")),
        ]);
        if (userSnap.exists()) setFullUserData(userSnap.data());
        setMemberDeposits(depositsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setMemberWithdrawals(withdrawalsSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
        setMemberDevices(devicesSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error("Failed to load member details:", err);
      } finally {
        setLoadingDrawerData(false);
      }
    })();
  }, []);

  const handleCreateUser = async () => {
    if (!addUserParent) return;
    if (!addUserForm.name || !addUserForm.email || addUserForm.password.length < 6) {
      setAddUserError("Fill in name, email, and a password of at least 6 characters.");
      return;
    }
    setCreatingUser(true);
    setAddUserError(null);
    try {
      await createPlacedUser(addUserForm.name, addUserForm.username, addUserForm.email, addUserForm.password, addUserParent.id);
      setAddUserParent(null);
      setExpandedIds((prev) => new Set([...prev, addUserParent.id]));
      onRefresh();
    } catch (err: any) {
      setAddUserError(err.code === "auth/email-already-in-use" ? "This email is already registered." : "Failed to create account.");
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSaveName = async () => {
    if (!selectedNode || !editName.trim()) return;
    setSavingName(true);
    try {
      await updateDoc(doc(db, "users", selectedNode.id), { displayName: editName.trim() });
      onRefresh();
      setSelectedNode({ ...selectedNode, displayName: editName.trim() });
    } catch (err) {
      alert("Failed to save name.");
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedNode || newPasswordInput.length < 6) {
      setPasswordMessage({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }
    setChangingPassword(true);
    setPasswordMessage(null);
    try {
      await changeUserPassword(selectedNode.id, newPasswordInput);
      setPasswordMessage({ type: "success", text: "Password updated successfully." });
      setNewPasswordInput("");
    } catch (err: any) {
      setPasswordMessage({ type: "error", text: err.message || "Failed to update password." });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleActivatePackage = async () => {
    if (!selectedNode) return;
    const amount = selectedPackage === "package_1" ? 360 : selectedPackage === "package_2" ? 3600 : 3960;
    if (!confirm(`This will deduct ₱${amount.toLocaleString()} from ${selectedNode.displayName}'s balance and distribute real commissions up the chain, exactly like a normal activation. Continue?`)) {
      return;
    }
    setActivating(true);
    setActivationMessage(null);
    try {
      await activateUserPackage(selectedNode.id, selectedPackage);
      setActivationMessage({ type: "success", text: "Activation completed — balance deducted and commissions distributed." });
      onRefresh();
    } catch (err: any) {
      setActivationMessage({ type: "error", text: err.message || "Activation failed." });
    } finally {
      setActivating(false);
    }
  };

  const positions = useMemo(() => computeLayout(root, expandedIds), [root, expandedIds]);

  const flatList = useMemo(() => {
    const list: TreeUser[] = [];
    function walk(n: TreeUser) { list.push(n); n.children.forEach(walk); }
    walk(root);
    return list;
  }, [root]);

  const filtersActive = !!(filters.activePackage || filters.status || filters.minTeamSize || filters.vipLevel);
  const matchedIds = useMemo(() => {
    if (!filtersActive) return null;
    const s = new Set<string>();
    for (const n of flatList) {
      if (filters.activePackage && n.activePackage !== filters.activePackage) continue;
      if (filters.status === "activated" && !n.isActivated) continue;
      if (filters.status === "not_activated" && n.isActivated) continue;
      if (filters.minTeamSize && (n.teamSize || 0) < parseInt(filters.minTeamSize, 10)) continue;
      if (filters.vipLevel && String(n.vipLevel || 1) !== filters.vipLevel) continue;
      s.add(n.id);
    }
    return s;
  }, [flatList, filters, filtersActive]);

  const { nodes, edges } = useMemo(
    () => buildFlowElements(root, expandedIds, positions, highlightedId, toggleNode, canEditPlacement ? openAddUser : undefined, openDetails, matchedIds),
    [root, expandedIds, positions, highlightedId, toggleNode, openAddUser, openDetails, canEditPlacement, matchedIds]
  );

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

  const handleExportPng = async () => {
    const viewportEl = document.querySelector(".react-flow__viewport") as HTMLElement | null;
    if (!viewportEl) return;
    try {
      const dataUrl = await toPng(viewportEl, { backgroundColor: "#020617", cacheBust: true });
      const link = document.createElement("a");
      link.download = `genealogy-tree-${new Date().toISOString().slice(0, 10)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("PNG export failed:", err);
      alert("Failed to export image.");
    }
  };

  const handleExportCsv = () => {
    const header = ["Name", "Email", "Status", "Package", "VIP Rank", "Direct", "Team Size"];
    const rows = flatList.map((n) => [
      n.displayName,
      n.email || "",
      n.isActivated ? "Activated" : "Not Activated",
      n.activePackage || "",
      String(n.vipLevel || 1),
      String(n.children.length),
      String(n.teamSize || 0),
    ]);
    const csv = [header, ...rows].map((r) => r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `genealogy-export-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const handlePrint = () => window.print();

  const handleFullscreen = () => {
    const el = document.getElementById("genealogy-canvas-container");
    if (!document.fullscreenElement && el) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <div id="genealogy-canvas-container" className="relative w-full h-full">
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
          <div className="relative">
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={"px-3 py-2 rounded-lg backdrop-blur border text-xs font-semibold transition-colors flex items-center gap-1.5 " + (filtersActive ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" : "bg-slate-900/90 border-slate-800 text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400")}
            >
              <Filter className="w-3 h-3" /> Filters {filtersActive && `(${matchedIds?.size || 0})`}
            </button>
            <AnimatePresence>
              {showFilters && (
                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="absolute top-full mt-1 w-56 bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-xl flex flex-col gap-2.5 z-20">
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Package</label>
                    <select value={filters.activePackage} onChange={(e) => setFilters((f) => ({ ...f, activePackage: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-md py-1.5 px-2 text-xs text-slate-100">
                      <option value="">All</option>
                      <option value="package_1">Package 1</option>
                      <option value="package_2">Package 2</option>
                      <option value="combined">Combined</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Status</label>
                    <select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                      className="w-full bg-slate-800 border border-slate-700 rounded-md py-1.5 px-2 text-xs text-slate-100">
                      <option value="">All</option>
                      <option value="activated">Activated</option>
                      <option value="not_activated">Not Activated</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold mb-1 block">Min. Team Size</label>
                    <input type="number" value={filters.minTeamSize} onChange={(e) => setFilters((f) => ({ ...f, minTeamSize: e.target.value }))}
                      placeholder="e.g. 10" className="w-full bg-slate-800 border border-slate-700 rounded-md py-1.5 px-2 text-xs text-slate-100" />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-500 font-semibold mb-1 block">VIP Rank</label>
                    <input type="number" value={filters.vipLevel} onChange={(e) => setFilters((f) => ({ ...f, vipLevel: e.target.value }))}
                      placeholder="e.g. 1" className="w-full bg-slate-800 border border-slate-700 rounded-md py-1.5 px-2 text-xs text-slate-100" />
                  </div>
                  {filtersActive && (
                    <button onClick={() => setFilters({ activePackage: "", status: "", minTeamSize: "", vipLevel: "" })}
                      className="mt-1 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-[10px] font-bold text-slate-300 hover:text-red-400 hover:border-red-500/40 transition-colors">
                      Clear Filters
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button onClick={handleExportPng} className="px-3 py-2 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
            Export PNG
          </button>
          <button onClick={handleExportCsv} className="px-3 py-2 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
            Export Excel
          </button>
          <button onClick={handlePrint} className="px-3 py-2 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
            Print / PDF
          </button>
          <button onClick={handleFullscreen} className="px-3 py-2 rounded-lg bg-slate-900/90 backdrop-blur border border-slate-800 text-xs font-semibold text-slate-300 hover:border-emerald-500/40 hover:text-emerald-400 transition-colors">
            Fullscreen
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

      {/* Add User Modal */}
      <AnimatePresence>
        {addUserParent && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.target === e.currentTarget && !creatingUser && setAddUserParent(null)}>
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-base font-bold text-slate-100">Add User</h3>
                <button onClick={() => setAddUserParent(null)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-5">Placed directly under <span className="text-emerald-400 font-semibold">{addUserParent.displayName}</span> in the referral chain.</p>
              <div className="flex flex-col gap-3">
                <input type="text" placeholder="Full Name" value={addUserForm.name} onChange={(e) => setAddUserForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50" />
                <input type="text" placeholder="Username (optional)" value={addUserForm.username} onChange={(e) => setAddUserForm((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/\s/g, "") }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50" />
                <input type="email" placeholder="Email" value={addUserForm.email} onChange={(e) => setAddUserForm((p) => ({ ...p, email: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50" />
                <input type="password" placeholder="Password (min. 6 characters)" value={addUserForm.password} onChange={(e) => setAddUserForm((p) => ({ ...p, password: e.target.value }))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50" />
                {addUserError && <p className="text-red-400 text-xs font-medium">{addUserError}</p>}
                <button onClick={handleCreateUser} disabled={creatingUser}
                  className="w-full py-3 rounded-lg bg-emerald-500 text-slate-950 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60 mt-1">
                  {creatingUser ? "Creating..." : "Create & Place User"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Drawer */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end"
            onClick={(e) => e.target === e.currentTarget && setSelectedNode(null)}>
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-md h-full bg-slate-900 border-l border-slate-800 flex flex-col">

              <div className="flex items-center justify-between px-6 pt-6 pb-4 shrink-0">
                <div>
                  <h3 className="text-base font-bold text-slate-100">{selectedNode.displayName}</h3>
                  <p className="text-[10px] text-slate-500">{selectedNode.isActivated ? "Activated" : "Not Activated"}</p>
                </div>
                <button onClick={() => setSelectedNode(null)} className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-200">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 px-6 pb-3 overflow-x-auto shrink-0 border-b border-slate-800">
                {([
                  { id: "profile", label: "Profile" },
                  { id: "wallet", label: "Wallet" },
                  { id: "deposits", label: "Deposits" },
                  { id: "withdrawals", label: "Withdrawals" },
                  { id: "team", label: "Team" },
                  { id: "devices", label: "Devices" },
                ] as const).map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setDrawerTab(t.id)}
                    className={"px-3 py-1.5 rounded-md text-[11px] font-bold whitespace-nowrap transition-colors " + (drawerTab === t.id ? "bg-emerald-500 text-slate-950" : "text-slate-500 hover:text-slate-300")}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="flex-1 overflow-y-auto px-6 py-5">
                {loadingDrawerData ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
                  </div>
                ) : (
                  <>
                    {/* ── PROFILE TAB ── */}
                    {drawerTab === "profile" && (
                      <div className="flex flex-col gap-6">
                        <div>
                          <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5"><Edit3 className="w-3 h-3" /> Display Name</label>
                          <div className="flex gap-2">
                            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50" />
                            <button onClick={handleSaveName} disabled={savingName} className="px-4 py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors disabled:opacity-60">
                              {savingName ? "..." : "Save"}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 text-xs text-slate-400 border-t border-slate-800 pt-5">
                          <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5 text-slate-600" /> {fullUserData?.email || selectedNode.email || "No email on file"}</div>
                          <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-slate-600" /> {fullUserData?.phoneNumber ? `+63 ${fullUserData.phoneNumber}` : "No phone on file"}</div>
                          <div className="flex items-center gap-2"><Hash className="w-3.5 h-3.5 text-slate-600" /> {fullUserData?.referralCode || "No referral code"}</div>
                          <div className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-slate-600" /> {fullUserData?.activePackage ? fullUserData.activePackage.replace("_", " ") : "No active package"}</div>
                          <div className="flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-slate-600" /> Joined {fullUserData?.createdAt ? new Date(fullUserData.createdAt).toLocaleDateString() : "Unknown"}</div>
                        </div>

                        <div className="border-t border-slate-800 pt-5">
                          <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5"><Key className="w-3 h-3" /> Change Password</label>
                          <p className="text-[10px] text-slate-500 mb-2">Sets a brand-new password for this account directly.</p>
                          <input type="password" placeholder="New password (min. 6 characters)" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 mb-2" />
                          {passwordMessage && (
                            <p className={"text-xs font-medium mb-2 " + (passwordMessage.type === "success" ? "text-emerald-400" : "text-red-400")}>{passwordMessage.text}</p>
                          )}
                          <button onClick={handleChangePassword} disabled={changingPassword}
                            className="w-full py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold hover:border-emerald-500/40 hover:text-emerald-400 transition-colors disabled:opacity-60">
                            {changingPassword ? "Updating..." : "Update Password"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── WALLET TAB ── */}
                    {drawerTab === "wallet" && (
                      <div className="flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
                            <p className="text-[10px] text-slate-500 mb-1">Main Balance</p>
                            <p className="text-base font-bold text-slate-100">₱{(fullUserData?.balance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
                            <p className="text-[10px] text-slate-500 mb-1">Earnings Wallet</p>
                            <p className="text-base font-bold text-slate-100">₱{(fullUserData?.earningsWallet || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
                            <p className="text-[10px] text-slate-500 mb-1">Credits (Locked)</p>
                            <p className="text-base font-bold text-amber-400">₱{(fullUserData?.creditsBalance || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                          </div>
                          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5">
                            <p className="text-[10px] text-slate-500 mb-1">Total Earnings</p>
                            <p className="text-base font-bold text-emerald-400">₱{(fullUserData?.stats?.totalEarnings || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>

                        <div className="border-t border-slate-800 pt-5">
                          <label className="text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1.5"><Zap className="w-3 h-3" /> Activate Package</label>
                          <p className="text-[10px] text-slate-500 mb-2">Deducts real balance and distributes real commissions, same as a normal activation.</p>
                          <select value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 px-3.5 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 mb-2">
                            <option value="package_1">Package 1 — ₱360</option>
                            <option value="package_2">Package 2 — ₱3,600</option>
                            <option value="combined">Combined — ₱3,960</option>
                          </select>
                          {activationMessage && (
                            <p className={"text-xs font-medium mb-2 " + (activationMessage.type === "success" ? "text-emerald-400" : "text-red-400")}>{activationMessage.text}</p>
                          )}
                          <button onClick={handleActivatePackage} disabled={activating}
                            className="w-full py-2.5 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors disabled:opacity-60">
                            {activating ? "Processing..." : "Activate"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── DEPOSITS TAB ── */}
                    {drawerTab === "deposits" && (
                      memberDeposits.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-10">No deposit requests on file.</p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {memberDeposits.map((d) => (
                            <div key={d.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <ArrowDownCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-slate-200">₱{(d.amount || 0).toLocaleString()}</p>
                                  <p className="text-[10px] text-slate-500">{d.createdAt?.toDate ? d.createdAt.toDate().toLocaleDateString() : ""}</p>
                                </div>
                              </div>
                              <span className={"text-[9px] font-bold uppercase px-2 py-0.5 rounded-full " + (d.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : d.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400")}>
                                {d.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {/* ── WITHDRAWALS TAB ── */}
                    {drawerTab === "withdrawals" && (
                      memberWithdrawals.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-10">No withdrawal requests on file.</p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {memberWithdrawals.map((w) => (
                            <div key={w.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 flex items-center justify-between">
                              <div className="flex items-center gap-2.5">
                                <ArrowUpCircle className="w-4 h-4 text-red-400 shrink-0" />
                                <div>
                                  <p className="text-xs font-bold text-slate-200">₱{(w.amount || 0).toLocaleString()}</p>
                                  <p className="text-[10px] text-slate-500">{w.createdAt?.toDate ? w.createdAt.toDate().toLocaleDateString() : ""}</p>
                                </div>
                              </div>
                              <span className={"text-[9px] font-bold uppercase px-2 py-0.5 rounded-full " + (w.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : w.status === "rejected" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-400")}>
                                {w.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    )}

                    {/* ── TEAM TAB ── */}
                    {drawerTab === "team" && (
                      <div className="flex flex-col gap-5">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-slate-100">{fullUserData?.stats?.directReferrals || 0}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-semibold">Direct</p>
                          </div>
                          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-slate-100">{selectedNode.children.length}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-semibold">This Tree</p>
                          </div>
                          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-3 text-center">
                            <p className="text-lg font-bold text-slate-100">{fullUserData?.stats?.teamSize || 0}</p>
                            <p className="text-[9px] text-slate-500 uppercase font-semibold">Team Size</p>
                          </div>
                        </div>
                        {selectedNode.children.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold text-slate-400 mb-2">Direct in this tree</p>
                            <div className="flex flex-col gap-2">
                              {selectedNode.children.map((c) => (
                                <div key={c.id} className="bg-slate-800/60 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300">{c.displayName}</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── DEVICES TAB ── */}
                    {drawerTab === "devices" && (
                      memberDevices.length === 0 ? (
                        <p className="text-xs text-slate-500 text-center py-10">No linked devices on file.</p>
                      ) : (
                        <div className="flex flex-col gap-2.5">
                          {memberDevices.map((d) => (
                            <div key={d.id} className="bg-slate-800/60 border border-slate-700 rounded-xl p-3.5 flex items-center gap-2.5">
                              <Smartphone className="w-4 h-4 text-slate-500 shrink-0" />
                              <div>
                                <p className="text-xs font-bold text-slate-200">{d.name || "Unknown device"}</p>
                                <p className="text-[10px] text-slate-500">{d.browser || ""} {d.lastActive?.toDate ? "· " + d.lastActive.toDate().toLocaleDateString() : ""}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main dashboard ───────────────────────────────────────────────────────
function GenealogyDashboard({ onSignOut }: { onSignOut: () => void }) {
  const [tree, setTree] = useState<TreeUser | null>(null);
  const [allById, setAllById] = useState<Map<string, TreeUser>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [totalNodes, setTotalNodes] = useState(0);
  const [treeMode, setTreeMode] = useState<"referral" | "matrix">("referral");
  const [viewMode, setViewMode] = useState<"tree" | "analytics">("tree");
  const [analyticsData, setAnalyticsData] = useState<{
    dailyRegistrations: { date: string; count: number }[];
    incomeByDay: { date: string; income: number; deposits: number; withdrawals: number }[];
    topEarners: { name: string; amount: number }[];
    topRecruiters: { name: string; count: number }[];
  }>({ dailyRegistrations: [], incomeByDay: [], topEarners: [], topRecruiters: [] });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [headerStats, setHeaderStats] = useState({ activeMembers: 0, newToday: 0, revenue: 0 });
  const [maintenanceOn, setMaintenanceOn] = useState(false);

  const loadFullTree = async (mode: "referral" | "matrix" = treeMode) => {
    setIsLoading(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

      // ── Header stats ──
      const todayStr = new Date().toDateString();
      const activeMembers = allUsers.filter((u) => u.isActivated === true).length;
      const newToday = allUsers.filter((u) => u.createdAt && new Date(u.createdAt).toDateString() === todayStr).length;

      let revenue = 0;
      try {
        const activationTxSnap = await getDocs(query(collection(db, "transactions"), where("category", "==", "Activation")));
        activationTxSnap.forEach((d) => { revenue += d.data().amount || 0; });
      } catch (e) { console.error("Failed to compute revenue:", e); }

      setHeaderStats({ activeMembers, newToday, revenue });

      try {
        const maintenanceSnap = await getDoc(doc(db, "settings", "maintenance"));
        setMaintenanceOn(maintenanceSnap.exists() && maintenanceSnap.data().enabled === true);
      } catch (e) { /* non-critical */ }

      // "referral" = the REFERRAL CHAIN (originalReferrerId) — the new
      // Level 2-10 tier, one direct connection per level.
      // "matrix" = the TEAM MATRIX (sponsorId) — the original Level 11-20
      // tier, 10-wide global placement.
      const linkField = mode === "referral" ? "originalReferrerId" : "sponsorId";
      const childrenOf = new Map<string, any[]>();
      for (const u of allUsers) {
        const parentId = u[linkField];
        if (parentId) {
          if (!childrenOf.has(parentId)) childrenOf.set(parentId, []);
          childrenOf.get(parentId)!.push(u);
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
          activePackage: u.activePackage,
          vipLevel: u.stats?.vipLevel || 1,
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
  };

  useEffect(() => { loadFullTree(treeMode); }, [treeMode]);

  const loadAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const usersSnap = await getDocs(collection(db, "users"));
      const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() } as any));

      // Daily registrations, last 14 days
      const dayLabels: string[] = [];
      const dayKeys: string[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dayKeys.push(d.toDateString());
        dayLabels.push(d.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
      }
      const regCounts = new Map(dayKeys.map((k) => [k, 0]));
      allUsers.forEach((u) => {
        if (!u.createdAt) return;
        const key = new Date(u.createdAt).toDateString();
        if (regCounts.has(key)) regCounts.set(key, (regCounts.get(key) || 0) + 1);
      });
      const dailyRegistrations = dayKeys.map((k, i) => ({ date: dayLabels[i], count: regCounts.get(k) || 0 }));

      // Income (activations) / Deposits (approved) / Withdrawals (approved), last 14 days
      const incomeMap = new Map(dayKeys.map((k) => [k, { income: 0, deposits: 0, withdrawals: 0 }]));
      const [activationTxSnap, depositsSnap, withdrawalsSnap] = await Promise.all([
        getDocs(query(collection(db, "transactions"), where("category", "==", "Activation"))),
        getDocs(query(collection(db, "depositRequests"), where("status", "==", "approved"))),
        getDocs(query(collection(db, "withdrawalRequests"), where("status", "==", "approved"))),
      ]);
      activationTxSnap.forEach((d) => {
        const tx = d.data();
        const ts = tx.timestamp?.toDate ? tx.timestamp.toDate() : null;
        if (!ts) return;
        const key = ts.toDateString();
        if (incomeMap.has(key)) incomeMap.get(key)!.income += tx.amount || 0;
      });
      depositsSnap.forEach((d) => {
        const dep = d.data();
        const ts = dep.createdAt?.toDate ? dep.createdAt.toDate() : null;
        if (!ts) return;
        const key = ts.toDateString();
        if (incomeMap.has(key)) incomeMap.get(key)!.deposits += dep.amount || 0;
      });
      withdrawalsSnap.forEach((d) => {
        const w = d.data();
        const ts = w.createdAt?.toDate ? w.createdAt.toDate() : null;
        if (!ts) return;
        const key = ts.toDateString();
        if (incomeMap.has(key)) incomeMap.get(key)!.withdrawals += w.amount || 0;
      });
      const incomeByDay = dayKeys.map((k, i) => ({ date: dayLabels[i], ...(incomeMap.get(k) || { income: 0, deposits: 0, withdrawals: 0 }) }));

      // Top Earners & Top Recruiters
      const topEarners = [...allUsers]
        .sort((a, b) => (b.stats?.totalEarnings || 0) - (a.stats?.totalEarnings || 0))
        .slice(0, 8)
        .map((u) => ({ name: u.displayName || "Unknown", amount: u.stats?.totalEarnings || 0 }));

      const topRecruiters = [...allUsers]
        .sort((a, b) => (b.stats?.directReferrals || 0) - (a.stats?.directReferrals || 0))
        .slice(0, 8)
        .map((u) => ({ name: u.displayName || "Unknown", count: u.stats?.directReferrals || 0 }));

      setAnalyticsData({ dailyRegistrations, incomeByDay, topEarners, topRecruiters });
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  useEffect(() => { if (viewMode === "analytics") loadAnalytics(); }, [viewMode]);


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

          <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
            <button
              onClick={() => setViewMode("tree")}
              className={"px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors " + (viewMode === "tree" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200")}
            >
              Genealogy Tree
            </button>
            <button
              onClick={() => setViewMode("analytics")}
              className={"px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors " + (viewMode === "analytics" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200")}
            >
              Analytics
            </button>
          </div>

          {viewMode === "tree" && (
            <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1 gap-1">
              <button
                onClick={() => setTreeMode("referral")}
                className={"px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors " + (treeMode === "referral" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200")}
              >
                Referral Chain (1-10)
              </button>
              <button
                onClick={() => setTreeMode("matrix")}
                className={"px-3.5 py-1.5 rounded-md text-xs font-bold transition-colors " + (treeMode === "matrix" ? "bg-emerald-500 text-slate-950" : "text-slate-400 hover:text-slate-200")}
              >
                Team Matrix (11-20)
              </button>
            </div>
          )}

          <button onClick={onSignOut} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-800 text-slate-400 text-sm font-semibold hover:border-red-500/40 hover:text-red-400 transition-colors" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        <div className="max-w-7xl mx-auto px-6 pb-4 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Members</p>
            <p className="text-lg font-bold text-slate-100">{totalNodes.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Active Members</p>
            <p className="text-lg font-bold text-emerald-400">{headerStats.activeMembers.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">New Today</p>
            <p className="text-lg font-bold text-sky-400">{headerStats.newToday.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Revenue</p>
            <p className="text-lg font-bold text-amber-400">₱{headerStats.revenue.toLocaleString()}</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 flex flex-col justify-center">
            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">System Status</p>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className={"w-1.5 h-1.5 rounded-full " + (maintenanceOn ? "bg-red-400" : "bg-emerald-400")} />
              <span className={"text-sm font-bold " + (maintenanceOn ? "text-red-400" : "text-emerald-400")}>{maintenanceOn ? "Maintenance" : "Operational"}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 relative overflow-y-auto">
        {viewMode === "analytics" ? (
          loadingAnalytics ? (
            <div className="flex flex-col items-center justify-center gap-4 h-full">
              <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs text-slate-500">Crunching numbers...</p>
            </div>
          ) : (
            <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Daily Registrations (Last 14 Days)</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={analyticsData.dailyRegistrations}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} name="New Signups" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-slate-200 mb-4">Income, Deposits & Withdrawals (Last 14 Days)</h3>
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={analyticsData.incomeByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                    <YAxis stroke="#64748b" fontSize={10} />
                    <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="income" stroke="#f59e0b" strokeWidth={2} name="Activation Income" dot={false} />
                    <Line type="monotone" dataKey="deposits" stroke="#10b981" strokeWidth={2} name="Deposits" dot={false} />
                    <Line type="monotone" dataKey="withdrawals" stroke="#ef4444" strokeWidth={2} name="Withdrawals" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid sm:grid-cols-2 gap-6">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-4">Top Earners</h3>
                  <div className="flex flex-col gap-2">
                    {analyticsData.topEarners.map((e, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400"><span className="text-slate-600 mr-2">#{i + 1}</span>{e.name}</span>
                        <span className="font-bold text-amber-400">₱{e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                  <h3 className="text-sm font-bold text-slate-200 mb-4">Top Recruiters</h3>
                  <div className="flex flex-col gap-2">
                    {analyticsData.topRecruiters.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="text-slate-400"><span className="text-slate-600 mr-2">#{i + 1}</span>{r.name}</span>
                        <span className="font-bold text-emerald-400">{r.count} direct</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )
        ) : isLoading || !tree ? (
          <div className="flex flex-col items-center justify-center gap-4 h-full">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <p className="text-xs text-slate-500">Building tree...</p>
          </div>
        ) : (
          <ReactFlowProvider>
            <TreeCanvas root={tree} allById={allById} onRefresh={() => loadFullTree(treeMode)} canEditPlacement={treeMode === "referral"} />
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
