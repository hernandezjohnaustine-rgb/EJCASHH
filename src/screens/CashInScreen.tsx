import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, Landmark, CreditCard, Banknote, PlusCircle, CheckCircle2, ShieldCheck, Loader2, QrCode } from "lucide-react";
import GlassCard from "../components/GlassCard";

const PAYMENT_METHODS = [
  { id: 'gcash', name: 'GCash', icon: <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 italic">G</div>, fee: '0%' },
  { id: 'bank', name: 'Bank Transfer', icon: <Landmark className="w-5 h-5 text-brand-primary" />, fee: '₱15.00' },
  { id: 'otc', name: 'Over the Counter', icon: <Banknote className="w-5 h-5 text-brand-primary" />, fee: '₱10.00' },
  { id: 'paymaya', name: 'Maya', icon: <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center font-black text-green-500 italic">M</div>, fee: '0%' },
];

export default function CashInScreen({ onBack, onConfirm }: any) {
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(PAYMENT_METHODS[0]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleCashIn = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;

    if (method.id === 'gcash') {
      setShowPaymentModal(true);
      // Try to open in new tab (might be blocked, so we show modal as fallback)
      window.open("https://m.gcash.com/", "_blank");
      return;
    }

    setIsProcessing(true);
    // Simulate payment processing for other methods
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    onConfirm(amt, method.name);
  };

  const confirmGcashPayment = async () => {
    setIsProcessing(true);
    // Simulate verification
    await new Promise(resolve => setTimeout(resolve, 3000));
    setIsProcessing(false);
    setShowPaymentModal(false);
    onConfirm(parseFloat(amount), method.name);
  };

  const presetAmounts = ["100", "500", "1000", "5000"];

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-brand-card/5 flex items-center justify-center border border-brand-border">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-black tracking-tight">Cash In Money</h1>
        <div className="w-10" />
      </header>

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

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 ml-2">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/40">Select Method</h3>
           <button onClick={() => setShowQr(true)} className="flex items-center gap-1.5 text-[10px] font-black text-brand-primary uppercase tracking-widest">
              <QrCode className="w-3.5 h-3.5" />
              Scan QR
           </button>
        </div>
        <div className="grid grid-cols-1 gap-3">
          {PAYMENT_METHODS.map((payMethod) => (
            <button
              key={payMethod.id}
              onClick={() => setMethod(payMethod)}
              className={`glass-card !p-4 flex items-center justify-between border transition-all ${
                method.id === payMethod.id ? "border-brand-primary bg-brand-primary/5" : "border-brand-border bg-brand-card/2"
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

      <div className="mt-auto space-y-6">
         <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-4 h-4 text-brand-primary/40" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-text/20">Secured via multi-layer merchant portal</span>
         </div>
         
         <div className="grid grid-cols-1 gap-3">
           <button 
             onClick={handleCashIn}
             disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
             className="btn-primary w-full h-16 text-lg tracking-tight disabled:opacity-50 flex items-center justify-center gap-3"
           >
             {isProcessing ? (
               <>
                 <Loader2 className="w-5 h-5 animate-spin" />
                 Processing...
               </>
             ) : (
               <>
                 <PlusCircle className="w-5 h-5" />
                 Cash In via {method.name}
               </>
             )}
           </button>

           <button 
             onClick={() => onConfirm(1000, "Demo Merchant")}
             className="w-full py-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-black uppercase tracking-widest hover:bg-brand-primary/20 transition-all"
           >
             Get Demo ₱1,000.00
           </button>
         </div>
      </div>

      <AnimatePresence>
        {showPaymentModal && (
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
              className="glass-card w-full max-w-sm p-8 text-center relative z-10 border-brand-primary/20 shadow-[0_0_50px_rgba(59,130,246,0.1)]"
            >
               <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                 <Loader2 className={`w-10 h-10 text-blue-500 ${isProcessing ? 'animate-spin' : ''}`} />
               </div>
               
               <h3 className="text-2xl font-display font-black tracking-tight mb-2 italic">GCash Payment</h3>
               <p className="text-sm text-brand-text/60 mb-8">
                 We've generated a secure payment link for ₱{parseFloat(amount).toLocaleString()}. Please complete the payment in the GCash app.
               </p>

               <div className="space-y-3 mb-8">
                  <a 
                    href="https://m.gcash.com/" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-center gap-3 w-full h-14 rounded-2xl bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] shadow-[0_10px_20px_rgba(37,99,235,0.3)] active:scale-95 transition-all"
                  >
                    Open GCash App
                  </a>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    className="w-full h-12 rounded-xl bg-brand-card/5 border border-brand-border text-[10px] font-black uppercase tracking-widest text-brand-text/40"
                  >
                    Cancel Transaction
                  </button>
               </div>

               <div className="pt-6 border-t border-brand-border/40">
                  <button 
                    onClick={confirmGcashPayment}
                    disabled={isProcessing}
                    className="btn-primary w-full h-16 text-lg tracking-tight shadow-[0_10px_30px_rgba(250,204,21,0.2)] disabled:opacity-50"
                  >
                    {isProcessing ? "Verifying Payment..." : "I've Paid Already"}
                  </button>
                  <p className="text-[10px] text-brand-text/30 font-bold uppercase tracking-[0.2em] mt-4 flex items-center justify-center gap-2">
                    <ShieldCheck className="w-3 h-3" />
                    Secure Verification
                  </p>
               </div>
            </motion.div>
          </div>
        )}

        {showQr && (
           <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowQr(false)}
                className="absolute inset-0 bg-brand-black/90 backdrop-blur-md"
              />
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass-card w-full max-w-sm p-8 text-center relative z-10"
              >
                 <h3 className="text-xl font-display font-black tracking-tight mb-2">Merchant QR</h3>
                 <p className="text-xs text-brand-text/40 uppercase tracking-widest font-black mb-8">Scan to pay directly</p>
                 
                 <div className="bg-white p-4 rounded-3xl inline-block mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                    <img 
                       src="https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EJCASHH-MERCHANT-QR&color=000000" 
                       alt="Merchant QR" 
                       className="w-48 h-48"
                    />
                 </div>

                 <p className="text-xs text-brand-text/60 mb-8 px-4">
                    Send funds to this QR and wait for 5-10 minutes for automatic processing.
                 </p>

                 <button 
                   onClick={() => setShowQr(false)}
                   className="w-full py-4 rounded-2xl bg-brand-card/5 border border-brand-border text-xs font-black uppercase tracking-widest"
                 >
                   Close Scanner
                 </button>
              </motion.div>
           </div>
        )}
      </AnimatePresence>
    </div>
  );
}
