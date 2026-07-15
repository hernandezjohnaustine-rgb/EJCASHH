import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft, CheckCircle2, XCircle, Clock, RefreshCw,
  User, Hash, Wallet, ChevronDown, ChevronUp, Shield
} from "lucide-react";
import {
  collection, query, orderBy, onSnapshot,
  doc, updateDoc, Timestamp, getDoc, setDoc
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  method: string;
  methodLabel: string;
  accountName: string;
  accountNumber: string;
  status: "pending" | "approved" | "rejected";
  createdAt: Timestamp;
  processedAt?: Timestamp;
  note?: string;
}

const STATUS_COLORS: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  approved: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  rejected: "text-red-400 bg-red-400/10 border-red-400/20",
};

const STATUS_ICONS: Record<string, any> = {
  pending: Clock,
  approved: CheckCircle2,
  rejected: XCircle,
};

export default function AdminWithdrawalScreen({ onBack }: { onBack: () => void }) {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    const q = query(collection(db, "withdrawalRequests"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() } as WithdrawalRequest)));
    });
    return () => unsub();
  }, []);

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const handleApprove = async (req: WithdrawalRequest) => {
    setProcessingId(req.id);
    try {
      // Update withdrawal request status
      await updateDoc(doc(db, "withdrawalRequests", req.id), {
        status: "approved",
        processedAt: Timestamp.now(),
        note: note || "",
      });

      // Add transaction record
      const { addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "transactions"), {
        userId: req.userId,
        type: "out",
        title: `Withdrawal via ${req.methodLabel}`,
        amount: req.amount,
        category: "Withdrawal",
        status: "Completed",
        referenceNo: "EJ-W-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: req.methodLabel,
        timestamp: Timestamp.now(),
      });

      setNote("");
      setExpandedId(null);
    } catch (err) {
      console.error("Approve error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req: WithdrawalRequest) => {
    setProcessingId(req.id);
    try {
      // Refund user balance
      const userRef = doc(db, "users", req.userId);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        await setDoc(userRef, {
          earningsWallet: (data.earningsWallet || 0) + req.amount,
        }, { merge: true });
      }

      await updateDoc(doc(db, "withdrawalRequests", req.id), {
        status: "rejected",
        processedAt: Timestamp.now(),
        note: note || "Rejected by admin",
      });

      setNote("");
      setExpandedId(null);
    } catch (err) {
      console.error("Reject error:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (ts: Timestamp) => {
    return ts?.toDate().toLocaleString("en-PH", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col pb-32">
      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-brand-border">
        <button onClick={onBack} className="p-2 rounded-2xl hover:bg-brand-card/10 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" />
          <h2 className="text-sm font-black uppercase tracking-widest">Withdrawal Requests</h2>
        </div>
        <div className="w-10" />
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-6 py-4 overflow-x-auto">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex items-center gap-2 ${
              filter === f
                ? "bg-brand-primary text-brand-black"
                : "bg-brand-card/5 border border-brand-border text-brand-text/40"
            }`}
          >
            {f}
            <span className={`px-1.5 py-0.5 rounded-full text-[9px] ${filter === f ? "bg-brand-black/20" : "bg-brand-border"}`}>
              {counts[f]}
            </span>
          </button>
        ))}
      </div>

      {/* List */}
      <div className="flex flex-col gap-3 px-6">
        <AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-brand-text/20 text-sm font-bold">
              No {filter} requests
            </div>
          )}

          {filtered.map((req) => {
            const StatusIcon = STATUS_ICONS[req.status];
            const isExpanded = expandedId === req.id;

            return (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card !p-0 overflow-hidden border-brand-border"
              >
                {/* Card Header */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="w-full p-5 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                      <Wallet className="w-5 h-5 text-brand-primary" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black">₱{req.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                      <p className="text-[10px] text-brand-text/40 font-medium">{req.methodLabel} · {formatDate(req.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[9px] font-black uppercase ${STATUS_COLORS[req.status]}`}>
                      <StatusIcon className="w-3 h-3" />
                      {req.status}
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-brand-text/20" /> : <ChevronDown className="w-4 h-4 text-brand-text/20" />}
                  </div>
                </button>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 flex flex-col gap-4 border-t border-brand-border pt-4">
                        {/* Account Info */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-brand-card/5 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <User className="w-3 h-3 text-brand-text/30" />
                              <span className="text-[9px] text-brand-text/30 font-black uppercase tracking-widest">Account Name</span>
                            </div>
                            <p className="text-sm font-bold">{req.accountName}</p>
                          </div>
                          <div className="bg-brand-card/5 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Hash className="w-3 h-3 text-brand-text/30" />
                              <span className="text-[9px] text-brand-text/30 font-black uppercase tracking-widest">
                                {req.method === "bank" ? "Acct No." : req.method === "crypto" ? "Address" : "Mobile No."}
                              </span>
                            </div>
                            <p className="text-sm font-bold break-all">{req.accountNumber}</p>
                          </div>
                        </div>

                        <div className="bg-brand-card/5 rounded-2xl p-4">
                          <span className="text-[9px] text-brand-text/30 font-black uppercase tracking-widest">User ID</span>
                          <p className="text-xs font-mono mt-1 text-brand-text/60 break-all">{req.userId}</p>
                        </div>

                        {req.status === "pending" && (
                          <>
                            {/* Note */}
                            <input
                              type="text"
                              placeholder="Add a note (optional)"
                              value={note}
                              onChange={(e) => setNote(e.target.value)}
                              className="w-full bg-brand-card/5 border border-brand-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:border-brand-primary/50 placeholder:text-brand-text/20"
                            />

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                              <button
                                disabled={processingId === req.id}
                                onClick={() => handleReject(req)}
                                className="py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all active:scale-95 disabled:opacity-50"
                              >
                                {processingId === req.id ? "..." : "Reject"}
                              </button>
                              <button
                                disabled={processingId === req.id}
                                onClick={() => handleApprove(req)}
                                className="py-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
                              >
                                {processingId === req.id ? "..." : "Approve"}
                              </button>
                            </div>
                          </>
                        )}

                        {req.status !== "pending" && req.note && (
                          <div className="bg-brand-card/5 rounded-2xl p-4">
                            <span className="text-[9px] text-brand-text/30 font-black uppercase tracking-widest">Note</span>
                            <p className="text-sm mt-1">{req.note}</p>
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
    </div>
  );
}

