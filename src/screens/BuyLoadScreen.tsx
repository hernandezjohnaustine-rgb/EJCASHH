import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Smartphone, CheckCircle2, ChevronRight, Search } from "lucide-react";
import GlassCard from "../components/GlassCard";

const providers = [
  { id: "globe", name: "Globe", logo: "G", color: "bg-blue-600" },
  { id: "smart", name: "Smart", logo: "S", color: "bg-green-600" },
  { id: "tnt", name: "TNT", logo: "T", color: "bg-orange-500" },
  { id: "dito", name: "DITO", logo: "D", color: "bg-red-600" },
];

const amounts = [10, 20, 50, 100, 300, 500, 1000];

export default function BuyLoadScreen({ onBack, onConfirm, balance }: { 
  onBack: () => void, 
  onConfirm: (amount: number, provider: string) => void,
  balance: number 
}) {
  const [step, setStep] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);

  const handleNext = () => {
    if (step === 1 && phoneNumber.length >= 10 && selectedProvider) {
      setStep(2);
    } else if (step === 2 && selectedAmount) {
      setStep(3); // Review
    }
  };

  const handleConfirm = () => {
    if (selectedAmount) {
      onConfirm(selectedAmount, selectedProvider || "Mobile");
    }
  };

  if (step === 3) {
    return (
      <div className="flex flex-col gap-8 h-full bg-brand-black p-6 pt-12">
        <header className="flex items-center justify-between">
          <button onClick={() => setStep(2)} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-display font-bold">Review Order</h2>
          <div className="w-10"></div>
        </header>

        <section className="flex flex-col gap-6 py-8">
          <GlassCard className="!p-8 flex flex-col items-center gap-4 text-center">
             <div className={`w-20 h-20 rounded-[30px] ${providers.find(p => p.id === selectedProvider)?.color} flex items-center justify-center text-3xl font-black italic shadow-2xl`}>
                {providers.find(p => p.id === selectedProvider)?.logo}
             </div>
             <div>
                <h3 className="text-2xl font-display font-bold">₱{selectedAmount?.toLocaleString()}</h3>
                <p className="text-sm text-white/40 mt-1">{phoneNumber}</p>
             </div>
          </GlassCard>

          <div className="flex flex-col gap-4">
             <div className="flex justify-between text-sm py-3 border-b border-white/5">
                <span className="text-white/40">Product</span>
                <span className="font-bold">{selectedProvider?.toUpperCase()} Regular Load</span>
             </div>
             <div className="flex justify-between text-sm py-3 border-b border-white/5">
                <span className="text-white/40">Fee</span>
                <span className="font-bold text-brand-primary">FREE</span>
             </div>
             <div className="flex justify-between text-lg py-4">
                <span className="font-display font-bold">Total Amount</span>
                <span className="font-display font-bold text-brand-primary">₱{selectedAmount?.toLocaleString()}</span>
             </div>
          </div>
        </section>

        <div className="mt-auto pb-4">
          <button 
            onClick={handleConfirm}
            disabled={balance < (selectedAmount || 0)}
            className={`w-full h-16 rounded-2xl text-lg font-bold transition-all shadow-[0_0_30px_rgba(250,204,21,0.4)] ${
                balance < (selectedAmount || 0) ? 'bg-white/5 text-white/20' : 'bg-brand-primary text-brand-black'
            }`}
          >
            {balance < (selectedAmount || 0) ? "Insufficient Balance" : "Confirm Purchase"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full bg-brand-black p-6 pt-12">
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold uppercase tracking-tight">Buy Load</h2>
        <div className="w-10"></div>
      </header>

      {step === 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2">Recipients Number</h3>
            <div className="relative">
              <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input 
                type="tel" 
                placeholder="09XX XXX XXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all text-lg font-bold tracking-widest placeholder:tracking-normal placeholder:font-normal placeholder:text-sm"
              />
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2">Select Provider</h3>
            <div className="grid grid-cols-2 gap-3">
               {providers.map(p => (
                 <button
                   key={p.id}
                   onClick={() => setSelectedProvider(p.id)}
                   className={`glass-card !p-4 flex items-center gap-4 transition-all ${selectedProvider === p.id ? 'border-brand-primary/50 bg-brand-primary/10' : 'border-white/5'}`}
                 >
                    <div className={`w-10 h-10 rounded-xl ${p.color} flex items-center justify-center font-black italic`}>
                       {p.logo}
                    </div>
                    <span className="font-bold text-sm">{p.name}</span>
                 </button>
               ))}
            </div>
          </section>

          <div className="mt-8">
             <button 
               onClick={handleNext}
               disabled={!selectedProvider || phoneNumber.length < 10}
               className="btn-primary w-full h-16 disabled:opacity-20"
             >
                Select Amount
             </button>
          </div>
        </motion.div>
      )}

      {step === 2 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-8">
          <section className="flex flex-col gap-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2">Select Amount</h3>
            <div className="grid grid-cols-2 gap-3">
               {amounts.map(amt => (
                 <button
                    key={amt}
                    onClick={() => setSelectedAmount(amt)}
                    className={`glass-card !p-6 flex flex-col items-center justify-center gap-1 transition-all ${selectedAmount === amt ? 'border-brand-primary/50 bg-brand-primary/10' : 'border-white/5'}`}
                 >
                    <span className="text-2xl font-display font-black tracking-tight">₱{amt}</span>
                    <span className="text-[10px] text-white/40 font-bold uppercase">Basic Load</span>
                 </button>
               ))}
            </div>
          </section>

          <div className="mt-auto">
             <button 
               onClick={handleNext}
               disabled={!selectedAmount}
               className="btn-primary w-full h-16 disabled:opacity-20 shadow-[0_0_20px_#FACC1544]"
             >
                Review Order
             </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
