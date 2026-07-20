import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Store, Loader2, ExternalLink, AlertCircle, Lock, X } from "lucide-react";
import { collection, getDocs, doc, getDoc, setDoc, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Merchant {
  id: string;
  name: string;
  iconUrl?: string;
  link: string;
  order?: number;
  requiresPayment?: boolean;
  price?: number;
}

export default function MerchantScreen({ onBack, userId, balance }: { onBack: () => void, userId: string, balance: number }) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingMerchant, setPendingMerchant] = useState<Merchant | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    getDocs(collection(db, "merchants"))
      .then(snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Merchant));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setMerchants(list);
      })
      .catch(err => console.error("Failed to load merchants:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleMerchantClick = (merchant: Merchant) => {
    if (merchant.requiresPayment && (merchant.price || 0) > 0) {
      setPendingMerchant(merchant);
    } else {
      window.open(merchant.link, "_blank", "noopener,noreferrer");
    }
  };

  const handleConfirmPayment = async () => {
    if (!pendingMerchant || !userId) return;
    const price = pendingMerchant.price || 0;
    setIsPaying(true);
    try {
      const userDocRef = doc(db, "users", userId);
      const freshDoc = await getDoc(userDocRef);
      if (!freshDoc.exists()) return;
      const freshBalance = freshDoc.data().balance || 0;

      if (freshBalance < price) {
        alert(`❌ Insufficient balance.\nYou need ₱${price.toLocaleString()} but have ₱${freshBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
        setIsPaying(false);
        return;
      }

      await setDoc(userDocRef, { balance: freshBalance - price }, { merge: true });

      await addDoc(collection(db, "transactions"), {
        userId,
        type: "out",
        title: `${pendingMerchant.name} Access Fee`,
        amount: price,
        category: "Merchant Access",
        status: "Completed",
        referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: "EJCASHH Wallet",
        timestamp: Timestamp.now(),
      });

      const link = pendingMerchant.link;
      setPendingMerchant(null);
      window.open(link, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Merchant payment error:", err);
      alert("❌ Payment failed. Please try again.");
    } finally {
      setIsPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col pt-12 relative overflow-hidden pb-32">
      <div className="absolute top-0 left-0 w-full h-64 bg-brand-primary/10 blur-[100px] pointer-events-none"></div>

      <header className="px-6 flex items-center justify-between mb-8 relative z-10">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-brand-primary" />
          <h1 className="text-xl font-display font-black tracking-tight">Merchant</h1>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 px-6 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center py-24">
            <AlertCircle className="w-10 h-10 text-brand-text/20" />
            <p className="text-sm font-bold text-brand-text/40">No merchants have been added yet.</p>
            <p className="text-[10px] text-brand-text/20">Contact admin support for assistance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {merchants.map((m, i) => (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleMerchantClick(m)}
                className="flex flex-col items-center gap-2 glass-card !p-4 hover:scale-105 active:scale-95 transition-all border-brand-primary/10 bg-brand-primary/5 relative"
              >
                {m.requiresPayment && (m.price || 0) > 0 && (
                  <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-brand-primary/20 flex items-center justify-center">
                    <Lock className="w-2.5 h-2.5 text-brand-primary" />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center overflow-hidden">
                  {m.iconUrl ? (
                    <img src={m.iconUrl} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Store className="w-5 h-5 text-brand-primary" />
                  )}
                </div>
                <span className="text-[9px] font-black text-brand-text/80 tracking-widest uppercase text-center leading-tight">{m.name}</span>
                {m.requiresPayment && (m.price || 0) > 0 ? (
                  <span className="text-[8px] text-brand-primary font-black">₱{m.price}</span>
                ) : (
                  <ExternalLink className="w-3 h-3 text-brand-text/20" />
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>

      {/* Payment Confirmation Modal */}
      <AnimatePresence>
        {pendingMerchant && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end justify-center"
            onClick={(e) => e.target === e.currentTarget && !isPaying && setPendingMerchant(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-md bg-brand-navy border border-brand-border rounded-t-3xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-black text-brand-text">Confirm Access</h3>
                <button onClick={() => !isPaying && setPendingMerchant(null)} className="text-brand-text/40">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="w-16 h-16 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center overflow-hidden">
                  {pendingMerchant.iconUrl ? (
                    <img src={pendingMerchant.iconUrl} alt={pendingMerchant.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Store className="w-7 h-7 text-brand-primary" />
                  )}
                </div>
                <p className="text-sm font-bold text-brand-text">{pendingMerchant.name}</p>
                <p className="text-2xl font-display font-black text-brand-primary">₱{(pendingMerchant.price || 0).toLocaleString()}</p>
                <p className="text-[10px] text-brand-text/40 text-center px-4">
                  This amount will be deducted from your Main Balance before the link opens.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPendingMerchant(null)}
                  disabled={isPaying}
                  className="flex-1 py-4 rounded-2xl border border-brand-border text-brand-text font-black uppercase tracking-widest text-xs disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmPayment}
                  disabled={isPaying}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-brand-black bg-brand-primary disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {isPaying ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                  ) : (
                    `Pay ₱${(pendingMerchant.price || 0).toLocaleString()}`
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
