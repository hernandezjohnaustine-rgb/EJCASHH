import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, ShieldCheck, CreditCard, ChevronRight, Check, X, Loader2, AlertCircle } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { processActivation } from "../services/earningsService";
import { createPaymentLink } from "../services/paymongoService";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function ActivationScreen({ uid, onActivate, balance, onBack }: { uid: string, onActivate: () => void, balance: number, onBack?: () => void }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"GCash" | "Wallet">("GCash");
  const [error, setError] = useState<string | null>(null);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);
  const [showVerifyButton, setShowVerifyButton] = useState(false);

  const ACTIVATION_FEE = 360;
  const hasEnoughBalance = (balance || 0) >= ACTIVATION_FEE;

  const benefits = [
    "30% Direct Referral Commission",
    "MLM Profit Sharing (Level 1-10)",
    "Unlock Full Withdrawal Features",
    "Daily Login Bonus Activation",
    "Unlock VIP Ranking System",
    "Instant EJCASHH ID Verification"
  ];

  const handlePay = async () => {
    setIsProcessing(true);
    setError(null);
    try {
      if (paymentMethod === "Wallet") {
        if ((balance || 0) < ACTIVATION_FEE) {
          setError(`Insufficient Balance. You need ₱${ACTIVATION_FEE} to activate.`);
          setIsProcessing(false);
          return;
        }
        await processActivation(uid);
        onActivate();
      } else {
        const link = await createPaymentLink(
          360,
          "EJCASHH Starter Activation Fee",
          { userId: uid, type: "activation" }
        );

        // Save pending payment
        await updateDoc(doc(db, "users", uid), {
          pendingActivationLinkId: link.id,
        });

        // Open payment page
        window.open(link.attributes.checkout_url, "_blank");

        // Show verify button
        setPaymentLink(link.attributes.checkout_url);
        setShowVerifyButton(true);
      }
    } catch (err: any) {
      console.error(err);
      let message = "Failed to process activation. Please try again.";
      try {
        const parsed = JSON.parse(err.message);
        message = parsed.error || message;
      } catch (e) {
        message = err.message || message;
      }
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-6 pt-12 overflow-y-auto pb-32 relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-96 bg-brand-primary/20 blur-[100px] pointer-events-none"></div>

      <header className="text-center mb-12 relative z-10">
        {onBack && (
          <button 
            onClick={onBack}
            className="absolute top-0 right-0 p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-all transform hover:scale-110 active:scale-90"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-primary/10 border border-brand-primary/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(250,204,21,0.2)]">
          <Zap className="w-10 h-10 text-brand-primary animate-pulse" />
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight mb-2">Account Activation</h1>
        <p className="text-sm text-white/40 font-medium">Activate your account to unlock the full earning potential of EJCASHH.</p>
      </header>

      <section className="flex flex-col gap-6 relative z-10">
        <GlassCard className="!p-8 border-brand-primary/20 bg-gradient-to-br from-brand-primary/10 to-brand-accent/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <div className="px-3 py-1 bg-brand-primary text-brand-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_#FACC15]">Featured</div>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-bold mb-2">Activation Package</p>
            <h2 className="text-5xl font-display font-black tracking-tighter">₱360</h2>
            <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 bg-brand-primary/5 rounded-2xl border border-brand-primary/10">
               <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Included Product:</span>
               <span className="text-[10px] text-brand-primary font-black uppercase tracking-widest">Premium Beauty Soap</span>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-primary/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-brand-primary" />
                </div>
                <span className="text-sm font-medium text-white/80">{benefit}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="flex flex-col gap-4 mt-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 ml-2">Payment Method</h3>
           <button 
             onClick={() => {
               setPaymentMethod("GCash");
               setShowConfirmation(true);
             }}
             className={`glass-card !p-5 flex items-center justify-between border-transparent transition-all active:scale-95 ${paymentMethod === 'GCash' ? 'ring-2 ring-brand-primary bg-white/10' : 'bg-white/5'}`}
           >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 italic">G</div>
                 <div className="text-left">
                    <h4 className="text-sm font-bold">GCash Pay</h4>
                    <p className="text-[10px] text-white/40 font-medium tracking-wider">Manual Verification</p>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20" />
           </button>
           <button 
             onClick={() => {
               if (hasEnoughBalance) {
                 setPaymentMethod("Wallet");
                 setShowConfirmation(true);
               } else {
                 setError("Insufficient Wallet Balance. Please cash in first.");
               }
             }}
             disabled={!hasEnoughBalance}
             className={`glass-card !p-5 flex items-center justify-between border-transparent transition-all active:scale-95 ${paymentMethod === 'Wallet' ? 'ring-2 ring-brand-primary bg-white/10' : 'bg-white/5'} ${!hasEnoughBalance ? 'opacity-60 grayscale' : ''}`}
           >
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                   <CreditCard className="w-6 h-6 text-brand-primary" />
                 </div>
                 <div className="text-left">
                    <h4 className="text-sm font-bold">Main Wallet</h4>
                    <p className={`text-[10px] font-bold tracking-wider ${hasEnoughBalance ? 'text-emerald-500' : 'text-red-500'}`}>
                      {hasEnoughBalance ? `Balance: ₱${balance.toLocaleString()}` : 'Insufficient Balance'}
                    </p>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20" />
           </button>
        </div>
      </section>

      <div className="mt-auto pt-10 pb-8 relative z-10">
        <button 
          onClick={() => {
            if (!hasEnoughBalance) {
              setError("Insufficient Balance. Please cash in first.");
              return;
            }
            setShowConfirmation(true);
          }}
          disabled={!hasEnoughBalance}
          className={`btn-primary w-full h-16 text-lg tracking-tight shadow-[0_10px_30px_rgba(250,204,21,0.4)] ${!hasEnoughBalance ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
        >
          {!hasEnoughBalance ? "Insufficient Balance" : paymentMethod === "Wallet" ? `Activation via Wallet (₱360)` : "Activate via GCash (₱360)"}
        </button>
        <div className="flex items-center justify-center gap-2 mt-6">
           <ShieldCheck className="w-4 h-4 text-white/20" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Secure Multi-Layer Encryption</span>
        </div>
      </div>

      <AnimatePresence>
        {showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center p-6 z-[60]">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-black/80 backdrop-blur-md"
              onClick={() => !isProcessing && setShowConfirmation(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card w-full max-w-sm relative overflow-hidden"
            >
               {isProcessing ? (
                 <div className="py-12 flex flex-col items-center gap-6 px-4">
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-brand-primary animate-spin" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Zap className="w-6 h-6 text-brand-primary animate-pulse" />
                      </div>
                    </div>
                    <div className="text-center w-full">
                       <h3 className="text-xl font-display font-black mb-2 italic">Verifying Transaction</h3>
                       <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold mb-6">Processing on EJCASHH Network...</p>
                       
                       <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mb-2">
                          <motion.div 
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: 3, ease: "linear" }}
                            className="h-full bg-brand-primary shadow-[0_0_10px_#FACC15]"
                          />
                       </div>
                       <p className="text-[10px] text-brand-primary/60 font-black uppercase tracking-widest">Please do not refresh</p>
                    </div>
                 </div>
               ) : (
                 <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <h3 className="text-xl font-display font-black tracking-tight mb-1">Confirm Payment</h3>
                          <p className="text-xs text-white/40 uppercase font-black tracking-widest">Digital Activation Fee</p>
                       </div>
                       <button onClick={() => setShowConfirmation(false)} className="text-white/20 hover:text-white transition-colors">
                          <X className="w-6 h-6" />
                       </button>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8">
                       <div className="flex justify-between items-center mb-4">
                          <span className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Amount to Pay</span>
                          <span className="text-2xl font-display font-black text-brand-primary italic">₱360.00</span>
                       </div>
                       <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                          <span className="text-white/40">Reference</span>
                          <span>EJ-ACT-2024</span>
                       </div>
                    </div>

                    <button 
                      onClick={handlePay}
                      disabled={isProcessing || !hasEnoughBalance}
                      className={`btn-primary w-full h-16 text-lg tracking-tight mb-4 ${(!hasEnoughBalance || isProcessing) ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                      {isProcessing ? "Processing..." : !hasEnoughBalance ? "Insufficient Balance" : "Pay Now"}
                    </button>
                    {showVerifyButton && (
  <button
    onClick={async () => {
      setIsProcessing(true);
      try {
        await processActivation(uid);
        onActivate();
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsProcessing(false);
      }
    }}
    className="w-full h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-black uppercase tracking-widest mt-3"
  >
    I've Paid — Activate Now
  </button>
)}
                    {error && (
                       <p className="text-[10px] text-center text-red-400 font-bold mb-4 uppercase tracking-widest">{error}</p>
                    )}
                    <p className="text-[10px] text-center text-white/30 font-bold uppercase tracking-widest">By activating, you agree to our Terms of Earnings.</p>
                 </div>
               )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
