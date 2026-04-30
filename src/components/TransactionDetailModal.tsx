import { motion, AnimatePresence } from "motion/react";
import { X, Share2, Download, ShieldCheck, CheckCircle2, ChevronRight, Copy } from "lucide-react";
import { Transaction } from "../types";
import GlassCard from "./GlassCard";

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export default function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  if (!transaction) return null;

  return (
    <AnimatePresence>
      {transaction && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-10 sm:pb-20">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-lg bg-brand-navy border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
          >
            {/* Header / Top Bar */}
            <div className="p-6 flex items-center justify-between border-b border-white/5">
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40">Transaction Details</h3>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10">
                  <Share2 className="w-4 h-4 text-brand-neon" />
                </button>
              </div>
            </div>

            <div className="p-8 flex flex-col items-center gap-6">
              {/* Status Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-brand-neon blur-2xl opacity-20"></div>
                <div className="relative w-20 h-20 rounded-[30px] bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-brand-neon" />
                </div>
              </div>

              <div className="text-center">
                <h4 className="text-2xl font-display font-black tracking-tight mb-1">{transaction.amount}</h4>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${transaction.status === 'Completed' ? 'text-brand-neon' : 'text-white/40'}`}>
                  {transaction.status}
                </p>
              </div>

              {/* Detail List */}
              <div className="w-full flex flex-col gap-1">
                <DetailRow label="Recipient / Merchant" value={transaction.title} />
                <DetailRow label="Category" value={transaction.category} />
                <DetailRow label="Date & Time" value={transaction.date} />
                <DetailRow label="Reference No." value={transaction.referenceNo || `EJ-${Math.random().toString(36).substr(2, 9).toUpperCase()}`} copyable />
                <DetailRow label="Payment Method" value={transaction.paymentMethod || "EJCASHH Wallet"} />
              </div>

              <div className="w-full mt-4 flex flex-col gap-3">
                <button className="btn-primary w-full gap-3">
                  <Download className="w-4 h-4" />
                  Save Receipt
                </button>
                <div className="flex items-center justify-center gap-2 py-4">
                  <ShieldCheck className="w-4 h-4 text-white/20" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Securely processed by EJCASHH</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function DetailRow({ label, value, copyable }: { label: string, value: string, copyable?: boolean }) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
      <div>
        <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold mb-1">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
      {copyable && (
        <button className="p-2 hover:bg-white/5 rounded-xl transition-colors">
          <Copy className="w-4 h-4 text-white/20" />
        </button>
      )}
    </div>
  );
}
