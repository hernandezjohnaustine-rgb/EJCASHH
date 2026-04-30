import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, Landmark, LandmarkIcon, CheckCircle2, ChevronRight, Search, CreditCard, User } from "lucide-react";
import GlassCard from "../components/GlassCard";

const banks = [
  { id: "bdo", name: "BDO Unibank", logo: "BDO", color: "bg-blue-800" },
  { id: "bpi", name: "Bank of the PI", logo: "BPI", color: "bg-red-700" },
  { id: "landbank", name: "Land Bank", logo: "LBP", color: "bg-green-700" },
  { id: "metrobank", name: "Metrobank", logo: "MB", color: "bg-blue-600" },
  { id: "unionbank", name: "UnionBank", logo: "UB", color: "bg-orange-600" },
];

export default function BankTransferScreen({ onBack, onConfirm, balance }: { 
  onBack: () => void, 
  onConfirm: (amount: number, bank: string) => void,
  balance: number 
}) {
  const [step, setStep] = useState(1);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [amount, setAmount] = useState("");

  const handleNext = () => {
    if (step === 1 && selectedBank) setStep(2);
    else if (step === 2 && accountName && accountNumber) setStep(3);
    else if (step === 3 && amount) setStep(4);
  };

  const currentBank = banks.find(b => b.id === selectedBank);

  if (step === 4) {
    return (
      <div className="flex flex-col gap-8 h-full bg-brand-black p-6 pt-12 overflow-y-auto">
        <header className="flex items-center justify-between">
          <button onClick={() => setStep(3)} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-display font-bold">Confirm Transfer</h2>
          <div className="w-10"></div>
        </header>

        <section className="flex flex-col gap-6 py-4">
           <GlassCard className="!p-8 flex flex-col items-center gap-6 text-center border-brand-primary/20 bg-brand-primary/5">
              <div className={`w-16 h-16 rounded-2xl ${currentBank?.color} flex items-center justify-center font-black italic shadow-lg`}>
                 {currentBank?.logo}
              </div>
              <div>
                 <h3 className="text-3xl font-display font-black tracking-tight mb-2 text-brand-primary">
                    ₱{parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                 </h3>
                 <p className="text-xs text-brand-primary/60 font-bold uppercase tracking-widest">To Bank Account</p>
              </div>
           </GlassCard>

           <div className="flex flex-col gap-5 p-2">
              <div className="flex justify-between items-start">
                 <span className="text-xs text-white/40 uppercase font-black">Bank</span>
                 <span className="text-sm font-bold text-right">{currentBank?.name}</span>
              </div>
              <div className="flex justify-between items-start">
                 <span className="text-xs text-white/40 uppercase font-black">Account Name</span>
                 <span className="text-sm font-bold text-right uppercase">{accountName}</span>
              </div>
              <div className="flex justify-between items-start">
                 <span className="text-xs text-white/40 uppercase font-black">Account Number</span>
                 <span className="text-sm font-mono font-bold text-right">{accountNumber}</span>
              </div>
              <div className="flex justify-between items-start pt-5 border-t border-white/5">
                 <span className="text-xs text-white/40 uppercase font-black">Transaction Fee</span>
                 <span className="text-sm font-bold text-brand-primary">₱15.00</span>
              </div>
           </div>
        </section>

        <div className="mt-auto pb-4">
          <button 
            onClick={() => onConfirm(parseFloat(amount) + 15, currentBank?.name || "Bank")}
            disabled={balance < (parseFloat(amount) + 15)}
            className="btn-primary w-full h-16 disabled:opacity-20"
          >
            {balance < (parseFloat(amount) + 15) ? "Insufficient Funds" : "Send Transfer"}
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
        <h2 className="text-lg font-display font-bold uppercase tracking-tight">Bank Transfer</h2>
        <div className="w-10"></div>
      </header>

      {step === 1 && (
        <section className="flex flex-col gap-6">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2">Select Destination Bank</h3>
           <div className="flex flex-col gap-3">
              {banks.map(bank => (
                <button
                  key={bank.id}
                  onClick={() => { setSelectedBank(bank.id); setStep(2); }}
                  className="glass-card !p-4 flex items-center justify-between group hover:bg-white/10 transition-all border-white/5"
                >
                   <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl ${bank.color} flex items-center justify-center font-black italic`}>
                         {bank.logo}
                      </div>
                      <span className="font-bold">{bank.name}</span>
                   </div>
                   <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white" />
                </button>
              ))}
           </div>
        </section>
      )}

      {step === 2 && (
        <section className="flex flex-col gap-8">
           <div className="flex items-center gap-4 p-4 glass-card bg-brand-primary/5 border-brand-primary/20">
              <div className={`w-10 h-10 rounded-xl ${currentBank?.color} flex items-center justify-center font-black italic text-xs`}>
                 {currentBank?.logo}
              </div>
              <span className="font-bold text-sm">{currentBank?.name}</span>
           </div>

           <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">Account Name</label>
                 <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="text" 
                      placeholder="e.g. JUAN DELA CRUZ"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all font-bold"
                    />
                 </div>
              </div>

              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase tracking-widest text-white/30 px-2">Account Number</label>
                 <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                    <input 
                      type="tel" 
                      placeholder="XXXXXXXXXX"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all font-mono font-bold tracking-widest"
                    />
                 </div>
              </div>
           </div>

           <div className="mt-8">
              <button 
                onClick={handleNext}
                disabled={!accountName || !accountNumber}
                className="btn-primary w-full h-16 disabled:opacity-20"
              >
                 Next
              </button>
           </div>
        </section>
      )}

      {step === 3 && (
        <section className="flex flex-col gap-8">
           <div className="flex flex-col gap-4">
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2 text-center">Amount to Transfer</h3>
              <div className="relative">
                 <span className="absolute left-8 top-1/2 -translate-y-1/2 text-3xl font-display font-black text-white/10">₱</span>
                 <input 
                   autoFocus
                   type="number"
                   value={amount}
                   onChange={(e) => setAmount(e.target.value)}
                   placeholder="0.00"
                   className="w-full bg-white/5 border border-white/10 rounded-[32px] py-14 px-12 text-5xl font-display font-black text-center focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/5"
                 />
              </div>
           </div>

           <div className="flex flex-wrap gap-2 justify-center">
              {[500, 1000, 5000, 10000].map(val => (
                <button
                  key={val}
                  onClick={() => setAmount(val.toString())}
                  className="bg-white/5 hover:bg-white/10 border border-white/5 px-6 py-2 rounded-xl text-xs font-bold transition-all"
                >
                   ₱{val.toLocaleString()}
                </button>
              ))}
           </div>

           <div className="mt-auto">
              <button 
                onClick={handleNext}
                disabled={!amount || parseFloat(amount) <= 0}
                className="btn-primary w-full h-16 disabled:opacity-20 shadow-[0_0_20px_#FACC1544]"
              >
                 Review Transfer
              </button>
           </div>
        </section>
      )}
    </div>
  );
}
