import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Landmark, Banknote, PlusCircle, CheckCircle2, ShieldCheck, Loader2, QrCode, ExternalLink } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { createPaymentLink } from "../services/paymongoService";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

const PAYMENT_METHODS = [
  { 
    id: 'gcash', 
    name: 'GCash', 
    icon: <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 italic text-lg">G</div>, 
    fee: '0%',
    color: 'blue'
  },
  { 
    id: 'paymaya', 
    name: 'Maya', 
    icon: <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center font-black text-green-500 italic text-lg">M</div>, 
    fee: '0%',
    color: 'green'
  },
  { 
    id: 'bank', 
    name: 'Bank Transfer', 
    icon: <Landmark className="w-5 h-5 text-brand-primary" />, 
    fee: '₱15.00',
    color: 'yellow'
  },
  { 
    id: 'otc', 
    name: 'Over the Counter', 
    icon: <Banknote className="w-5 h-5 text-brand-primary" />, 
    fee: '₱10.00',
    color: 'yellow'
  },
];

export default function CashInScreen({ onBack, onConfirm }: any) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [linkId, setLinkId] = useState<string | null>(null);
  const [showVerify, setShowVerify] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const presetAmounts = ["100", "500", "1000", "5000"];
  const userId = auth.currentUser?.uid;

  const handleCashIn = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt < 100) {
      setError("Minimum cash in amount is ₱100");
      return;
    }
    if (!userId) {
      setError("Please log in first");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Create PayMongo payment link
      const link = await createPaymentLink(
        amt,
        `EJCASHH Cash In - ₱${amt.toLocaleString()}`,
        { userId, type: "cashin", amount: amt.toString() }
      );

      // Save pending payment to Firestore
      await setDoc(doc(db, "pendingPayments", link.id), {
        userId,
        type: "cashin",
        amount: amt,
        linkId: link.id,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setPaymentLink(link.attributes.checkout_url);
      setLinkId(link.id);
      setShowVerify(true);

      // Open PayMongo checkout in new tab
      window.open(link.attributes.checkout_url, "_blank");

    } catch (err: any) {
      setError(err.message || "Failed to create payment. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!linkId || !userId) return;
    setIsVerifying(true);
    setError(null);

    try {
      const { getPaymentLinkStatus } = await import("../services/paymongoService");
      const linkData = await getPaymentLinkStatus(linkId);
      const status = linkData.attributes.status;

      if (status === "paid") {
        const amt = parseFloat(amount);

        // Update user balance in Firestore
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        const currentBalance = userSnap.exists() ? (userSnap.data().balance || 0) : 0;

        await setDoc(userRef, {
          balance: currentBalance + amt
        }, { merge: true });

        // Mark payment as completed
        await setDoc(doc(db, "pendingPayments", linkId), {
          status: "completed",
          completedAt: new Date().toISOString()
        }, { merge: true });

        setShowVerify(false);
        onConfirm(amt, method.name);

      } else if (status === "unpaid") {
        setError("Payment not completed yet. Please pay first then verify.");
      } else {
        setError(`Payment status: ${status}. Please try again.`);
      }
    } catch (err: any) {
      setError(err.message || "Verification failed. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-brand-card/5 flex items-center justify-center border border-brand-border">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-black tracking-tight">Cash In Money</h1>
        <div className="w-10" />
      </header>

      {/* Amount Input */}
      <section className="mb-8">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/40 mb-4 ml-2">Enter Amount</h3>
        <div className="glass-card !p-6 border-brand-border">
          <div className="relative mb-6">
            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-3xl font-display font-black text-brand-primary italic">₱</span>
            <input
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-brand-card/5 border border-brand-border rounded-2xl py-6 pl-12 pr-6 text-3xl font-display font-black focus:outline-none focus:border-brand-primary/50 text-center"
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {presetAmounts.map((preset) => (
              <button
                key={preset}
                onClick={() => setAmount(preset)}
                className="py-2.5 rounded-xl bg-brand-card/5 border border-brand-border text-xs font-bold hover:bg-brand-primary hover:text-brand-black transition-all"
              >
                +{preset}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Payment Methods */}
      <section className="mb-8">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/40 mb-4 ml-2">Select Method</h3>
        <div className="grid grid-cols-1 gap-3">
          {PAYMENT_METHODS.map((payMethod) => (
            <button
              key={payMethod.id}
              onClick={() => setMethod(payMethod)}
              className={`glass-card !p-4 flex items-center justify-between border transition-all ${
                method.id === payMethod.id
                  ? "border-brand-primary bg-brand-primary/5"
                  : "border-brand-border bg-brand-card/2"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-brand-card/5 flex items-center justify-center">
                  {payMethod.icon}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold">{payMethod.name}</h4>
                  <p className="text-[10px] text-brand-text/40 font-medium">Service Fee: {payMethod.fee}</p>
                </div>
              </div>
              {method.id === payMethod.id && (
                <div className="w-5 h-5 rounded-full bg-brand-primary flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5 text-brand-black" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Error */}
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
          <p className="text-xs text-red-400 font-bold text-center">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-auto space-y-3">
        <div className="flex items-center justify-center gap-2 mb-4">
          <ShieldCheck className="w-4 h-4 text-brand-primary/40" />
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-text/20">
            Powered by PayMongo
          </span>
        </div>

        <button
          onClick={handleCashIn}
          disabled={!amount || parseFloat(amount) < 100 || isProcessing}
          className="btn-primary w-full h-16 text-lg tracking-tight disabled:opacity-50 flex items-center justify-center gap-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Creating Payment Link...
            </>
          ) : (
            <>
              <PlusCircle className="w-5 h-5" />
              Cash In via {method.name}
            </>
          )}
        </button>

        {/* Demo button for testing */}
        <button
          onClick={() => onConfirm(1000, "Demo")}
          className="w-full py-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-black uppercase tracking-widest hover:bg-brand-primary/20 transition-all"
        >
          Get Demo ₱1,000.00
        </button>
      </div>

      {/* Payment Verify Modal */}
      <AnimatePresence>
        {showVerify && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-black/95 backdrop-blur-xl"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass-card w-full max-w-sm p-8 text-center relative z-10 border-brand-primary/20"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6">
                <PlusCircle className="w-10 h-10 text-brand-primary" />
              </div>

              <h3 className="text-2xl font-display font-black tracking-tight mb-2">Complete Payment</h3>
              <p className="text-sm text-brand-text/60 mb-2">
                Pay <span className="text-brand-primary font-black">₱{parseFloat(amount).toLocaleString()}</span> via {method.name}
              </p>
              <p className="text-xs text-brand-text/40 mb-8">
                A payment page has opened in a new tab. Complete your payment there, then come back and click verify.
              </p>

              <div className="space-y-3">
                {/* Reopen payment link */}
                {paymentLink && (
                  <a 
                    href={paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-14 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] active:scale-95 transition-all"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Payment Page
                  </a>
                )}

                <button
                  onClick={handleVerifyPayment}
                  disabled={isVerifying}
                  className="btn-primary w-full h-14 text-sm tracking-tight flex items-center justify-center gap-2"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      I've Paid — Verify Now
                    </>
                  )}
                </button>

                <button
                  onClick={() => { setShowVerify(false); setError(null); }}
                  className="w-full h-12 rounded-xl bg-brand-card/5 border border-brand-border text-[10px] font-black uppercase tracking-widest text-brand-text/40"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <p className="text-xs text-red-400 font-bold mt-4">{error}</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}