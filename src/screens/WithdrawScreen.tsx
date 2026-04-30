import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Landmark, Landmark as Maya, Wallet, CreditCard, ChevronRight, CheckCircle2 } from "lucide-react";
import GlassCard from "../components/GlassCard";

const methods = [
  { id: "gcash", label: "GCash", icon: "G", color: "bg-blue-500" },
  { id: "maya", label: "Maya", icon: "M", color: "bg-green-500" },
  { id: "bank", label: "Bank Transfer", icon: Landmark, color: "bg-brand-primary" },
  { id: "crypto", label: "Crypto Wallet", icon: "₿", color: "bg-orange-500" },
];

export default function WithdrawScreen({ onBack, balance, onConfirm }: { onBack: () => void, balance: number, onConfirm: (amount: number) => void }) {
  const [amount, setAmount] = useState("");
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("");

  const handleNext = () => {
    if (step === 1 && selectedMethod) setStep(2);
    if (step === 2 && amount) setStep(3);
  };

  const handleConfirm = () => {
     if (amount) {
        onConfirm(parseFloat(amount));
     }
  };

  if (step === 3) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-black p-6 pt-12 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-[40px] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-8">
           <CheckCircle2 className="w-12 h-12 text-brand-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold mb-2">Withdrawal Initiated</h2>
        <p className="text-sm text-white/40 text-center mb-12 max-w-[280px]">
          Your withdrawal of ₱{parseFloat(amount).toLocaleString()} is being processed. Expected arrival within 1-2 hours.
        </p>
        <button 
          onClick={onBack}
          className="btn-primary w-full max-w-[200px]"
        >
          Back to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold tracking-tight uppercase">Withdraw Funds</h2>
        <div className="w-10"></div>
      </header>

      {step === 1 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-6"
        >
           <div className="text-center px-4">
              <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Available for Withdrawal</p>
              <h3 className="text-3xl font-display font-black text-brand-primary italic">₱{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
           </div>

           <div className="flex flex-col gap-4 mt-4">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 ml-2">Select Method</h4>
              <div className="grid grid-cols-1 gap-3">
                 {methods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={`glass-card !p-5 flex items-center justify-between transition-all ${selectedMethod === m.id ? 'border-brand-primary/40 bg-brand-primary/5' : 'border-white/5 opacity-60'}`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl ${m.color} flex items-center justify-center font-black text-white italic`}>
                             {typeof m.icon === 'string' ? m.icon : <m.icon className="w-6 h-6" />}
                          </div>
                          <h5 className="font-bold">{m.label}</h5>
                       </div>
                       {selectedMethod === m.id && <CheckCircle2 className="w-5 h-5 text-brand-primary" />}
                    </button>
                 ))}
              </div>
           </div>

           <button 
             disabled={!selectedMethod}
             onClick={handleNext}
             className="btn-primary w-full mt-8 disabled:opacity-50"
           >
             Continue
           </button>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col gap-8"
        >
           <div className="relative mt-8">
              <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-display font-bold text-white/20">₱</span>
              <input
                autoFocus
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-white/5 border border-white/10 rounded-[32px] py-10 px-12 text-5xl font-display font-black text-center focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/5"
              />
           </div>

           <div className="flex flex-wrap gap-2 justify-center">
            {["1,000", "5,000", "10,000", "All"].map(val => (
                <button 
                  key={val}
                  onClick={() => setAmount(val === 'All' ? balance.toString() : val.replace(',', ''))}
                  className="bg-white/5 hover:bg-white/10 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors border border-white/5"
                >
                  {val === 'All' ? 'All' : `₱${val}`}
                </button>
            ))}
          </div>

          <div className="flex flex-col gap-4 mt-4">
             <div className="flex items-center justify-between text-xs px-2">
                <span className="text-white/40">Withdrawal Fee</span>
                <span className="font-bold">₱15.00</span>
             </div>
             <div className="flex items-center justify-between text-xs px-2">
                <span className="text-white/40">Net Amount</span>
                <span className="font-bold text-brand-primary">₱{amount ? (parseFloat(amount) - 15).toLocaleString() : '0.00'}</span>
             </div>
          </div>

          <button 
            disabled={!amount || parseFloat(amount) > balance}
            onClick={handleConfirm}
            className="btn-primary w-full mt-4 disabled:opacity-30"
          >
            Confirm Withdrawal
          </button>
        </motion.div>
      )}
    </div>
  );
}
