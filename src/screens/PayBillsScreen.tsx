import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Receipt, CheckCircle2, ChevronRight, Search, Zap, Droplets, Wifi, ShieldCheck, CreditCard, ChevronDown } from "lucide-react";
import GlassCard from "../components/GlassCard";

const categories = [
  { id: "electricity", name: "Electricity", icon: Zap, color: "text-amber-400" },
  { id: "water", name: "Water", icon: Droplets, color: "text-blue-400" },
  { id: "internet", name: "Internet", icon: Wifi, color: "text-indigo-400" },
  { id: "government", name: "Government", icon: ShieldCheck, color: "text-emerald-400" },
  { id: "creditcard", name: "Credit Card", icon: CreditCard, color: "text-rose-400" },
];

const billers: Record<string, any[]> = {
  electricity: [
    { id: "meralco", name: "MERALCO", fee: 7.00 },
    { id: "veco", name: "VECO", fee: 10.00 },
  ],
  water: [
    { id: "maynilad", name: "Maynilad Water", fee: 15.00 },
    { id: "manilawater", name: "Manila Water", fee: 15.00 },
  ],
  internet: [
    { id: "pldt", name: "PLDT", fee: 0 },
    { id: "globeathome", name: "Globe At Home", fee: 0 },
    { id: "converge", name: "Converge ICT", fee: 0 },
  ]
};

export default function PayBillsScreen({ onBack, onConfirm, balance }: { 
  onBack: () => void, 
  onConfirm: (amount: number, biller: string) => void,
  balance: number 
}) {
  const [step, setStep] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedBiller, setSelectedBiller] = useState<any>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");

  const handleNext = () => {
    if (step === 1 && selectedCategory) setStep(2);
    else if (step === 2 && selectedBiller) setStep(3);
    else if (step === 3 && accountNumber && amount) setStep(4);
  };

  if (step === 4) {
    return (
      <div className="flex flex-col gap-8 h-full bg-brand-black p-6 pt-12 overflow-y-auto">
        <header className="flex items-center justify-between">
          <button onClick={() => setStep(3)} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-display font-bold">Review Payment</h2>
          <div className="w-10"></div>
        </header>

        <section className="flex flex-col gap-8 py-4">
           <div className="flex flex-col items-center gap-2 text-center">
              <h3 className="text-4xl font-display font-black text-brand-primary">₱{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</h3>
              <p className="text-xs text-brand-primary/60 font-bold uppercase tracking-widest">{selectedBiller.name}</p>
           </div>

           <GlassCard className="flex flex-col gap-6 p-6 border-white/5">
              <div className="flex justify-between items-start">
                 <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Biller</span>
                 <span className="text-sm font-bold text-right">{selectedBiller.name}</span>
              </div>
              <div className="flex justify-between items-start">
                 <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Account Number</span>
                 <span className="text-sm font-mono font-bold text-right">{accountNumber}</span>
              </div>
              <div className="flex justify-between items-start pt-4 border-t border-white/5">
                 <span className="text-[10px] text-white/40 uppercase font-black tracking-widest">Service Fee</span>
                 <span className="text-sm font-bold">₱{selectedBiller.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-start pt-4 border-t border-white/10">
                 <span className="text-sm text-brand-primary font-black uppercase tracking-widest">Total to Pay</span>
                 <span className="text-xl font-display font-black text-brand-primary">₱{(parseFloat(amount) + selectedBiller.fee).toLocaleString()}</span>
              </div>
           </GlassCard>
        </section>

        <div className="mt-auto pb-4">
          <button 
            onClick={() => onConfirm(parseFloat(amount) + selectedBiller.fee, selectedBiller.name)}
            disabled={balance < (parseFloat(amount) + selectedBiller.fee)}
            className="btn-primary w-full h-16 disabled:opacity-20 shadow-[0_0_30px_#FACC1544]"
          >
            {balance < (parseFloat(amount) + selectedBiller.fee) ? "Insufficient Funds" : "Pay Bill Now"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full bg-brand-black p-6 pt-12 overflow-y-auto">
      <header className="flex items-center justify-between">
        <button onClick={step > 1 ? () => setStep(step - 1) : onBack} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold uppercase tracking-tight">Pay Bills</h2>
        <div className="w-10"></div>
      </header>

      {step === 1 && (
        <section className="flex flex-col gap-6">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2">Biller Categories</h3>
           <div className="grid grid-cols-2 gap-4">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setSelectedCategory(cat.id); setStep(2); }}
                  className="glass-card !p-6 flex flex-col items-center gap-4 group hover:border-brand-primary/30 transition-all border-white/5"
                >
                   <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110`}>
                      <cat.icon className={`w-8 h-8 ${cat.color}`} />
                   </div>
                   <span className="text-xs font-bold uppercase tracking-widest tracking-tighter">{cat.name}</span>
                </button>
              ))}
           </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-6">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2">Select Biller</h3>
           <div className="flex flex-col gap-3">
              {(billers[selectedCategory || ""] || []).map(biller => (
                <button
                  key={biller.id}
                  onClick={() => { setSelectedBiller(biller); setStep(3); }}
                  className="glass-card !p-5 flex items-center justify-between group hover:bg-white/10 transition-all border-white/5"
                >
                   <span className="font-bold">{biller.name}</span>
                   <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white" />
                </button>
              ))}
              {(!billers[selectedCategory || ""]) && (
                <p className="text-center text-white/20 text-sm py-12">No billers found for this category.</p>
              )}
           </div>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-8">
           <div className="flex items-center justify-between p-5 glass-card bg-brand-primary/5 border-brand-primary/20">
              <span className="text-sm font-bold">{selectedBiller.name}</span>
              <span className="text-[10px] font-black tracking-widest uppercase text-brand-primary/60">Service Fee: ₱{selectedBiller.fee.toFixed(2)}</span>
           </div>

           <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">Account Number</label>
                 <input 
                    type="tel"
                    placeholder="Enter Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 focus:outline-none focus:border-brand-primary/30 transition-all font-mono font-bold tracking-widest"
                 />
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">Amount to Pay</label>
                 <div className="relative">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-display font-bold text-white/10">₱</span>
                    <input 
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-6 pl-12 pr-6 text-3xl font-display font-black focus:outline-none focus:border-brand-primary/50 transition-all"
                    />
                 </div>
              </div>
           </div>

           <div className="mt-8">
              <button 
                onClick={handleNext}
                disabled={!accountNumber || !amount || parseFloat(amount) <= 0}
                className="btn-primary w-full h-16 disabled:opacity-20"
              >
                 Review Payment
              </button>
           </div>
        </section>
      )}
    </div>
  );
}
