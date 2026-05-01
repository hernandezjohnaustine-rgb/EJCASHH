import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, Shield, Zap, ChevronLeft, ChevronRight, CheckCircle2, Info } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import GlassCard from "../components/GlassCard";

const PACKAGES = [
  { id: '10-day', title: 'Aggressive Bot', roi: '10%', duration: 10, min: 360, icon: <Zap className="w-6 h-6" />, color: 'from-orange-500 to-red-500' },
  { id: '15-day', title: 'Steady Bot', roi: '6%', duration: 15, min: 1000, icon: <TrendingUp className="w-6 h-6" />, color: 'from-brand-primary to-brand-accent' },
  { id: '30-day', title: 'Safe Bot', roi: '3%', duration: 30, min: 5000, icon: <Shield className="w-6 h-6" />, color: 'from-blue-500 to-indigo-500' },
];

const MOCK_CHART_DATA = [
  { day: 'Day 1', val: 10 },
  { day: 'Day 2', val: 25 },
  { day: 'Day 3', val: 40 },
  { day: 'Day 4', val: 65 },
  { day: 'Day 5', val: 80 },
  { day: 'Day 6', val: 120 },
  { day: 'Day 7', val: 150 },
];

export default function TradingBotScreen({ onBack, onInvest, balance }: any) {
  const [selectedPkg, setSelectedPkg] = useState(PACKAGES[0]);
  const [amount, setAmount] = useState(360);
  const [isConfirming, setIsConfirming] = useState(false);

  const calculateTotalReturn = () => {
    const roiNum = parseInt(selectedPkg.roi);
    const total = amount + (amount * (roiNum / 100) * selectedPkg.duration);
    return total.toLocaleString('en-US', { minimumFractionDigits: 2 });
  };

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-brand-card/5 flex items-center justify-center border border-brand-border">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-display font-black tracking-tight">Trading Bot</h1>
        <div className="w-10" />
      </header>

      <section className="mb-8">
        <GlassCard className="!p-6 bg-gradient-to-br from-brand-primary/20 to-transparent border-brand-primary/20">
          <div className="flex items-center justify-between mb-4">
            <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-1">Bot Performance</p>
               <h2 className="text-2xl font-display font-black tracking-tighter">AI Trading Suite</h2>
            </div>
            <div className="px-3 py-1 bg-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest rounded-lg border border-brand-primary/30">
               Active
            </div>
          </div>
          
          <div className="h-40 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={MOCK_CHART_DATA}>
                <defs>
                  <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="val" stroke="#10B981" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4 px-2">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/40">Select Package</h3>
           <div className="flex items-center gap-1 text-brand-primary">
              <Info className="w-3 h-3" />
              <span className="text-[10px] font-bold">100% Automated</span>
           </div>
        </div>

        <div className="flex flex-col gap-4">
          {PACKAGES.map((pkg) => (
            <button
              key={pkg.id}
              onClick={() => {
                setSelectedPkg(pkg);
                setAmount(Math.max(amount, pkg.min));
              }}
              className={`glass-card !p-5 flex items-center justify-between border-2 transition-all ${
                selectedPkg.id === pkg.id 
                ? "border-brand-primary bg-brand-primary/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                : "border-transparent bg-brand-card/5 opacity-60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pkg.color} flex items-center justify-center text-white shadow-lg`}>
                  {pkg.icon}
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-bold">{pkg.title}</h4>
                  <p className="text-[10px] text-brand-text/40 font-bold uppercase tracking-wider">{pkg.duration} Days • {pkg.roi}/Day</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-display font-black tracking-tighter text-brand-primary">{pkg.roi}</p>
                <p className="text-[10px] text-brand-text/40 font-bold">Min ₱{pkg.min}</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <div className="px-2 mb-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/40">Investment Amount</h3>
        </div>
        <GlassCard className="!p-6">
           <div className="flex items-center justify-between mb-6">
              <div className="text-[10px] text-brand-text/40 font-bold uppercase tracking-widest">Available Balance: ₱{balance.toLocaleString()}</div>
           </div>
           <div className="text-center mb-8">
             <input 
               type="number" 
               value={amount}
               onChange={(e) => setAmount(Number(e.target.value))}
               className="bg-transparent text-5xl font-display font-black tracking-tighter text-center w-full focus:outline-none placeholder-brand-text/20"
               placeholder="0.00"
             />
             <p className="text-sm text-brand-primary/60 font-bold uppercase tracking-widest mt-2">PHP Pesos</p>
           </div>
           
           <div className="grid grid-cols-4 gap-2">
             {[360, 1000, 5000, 10000].map((val) => (
               <button 
                 key={val}
                 onClick={() => setAmount(val)}
                 className={`py-2 rounded-xl text-xs font-black border transition-all ${amount === val ? "bg-brand-primary text-brand-black border-brand-primary" : "bg-brand-card/5 text-brand-text/60 border-brand-border"}`}
               >
                 ₱{val >= 1000 ? (val/1000) + 'K' : val}
               </button>
             ))}
           </div>
        </GlassCard>
      </section>

      <section className="mt-auto">
        <GlassCard className="border-t border-brand-border bg-brand-card/5 !p-6 mb-6">
           <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-brand-text/40 font-medium">Daily Return ({selectedPkg.roi})</span>
              <span className="text-sm font-bold text-brand-primary">₱{(amount * (parseInt(selectedPkg.roi)/100)).toLocaleString()}</span>
           </div>
           <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-brand-text/40 font-medium">Total Return ({selectedPkg.duration} Days)</span>
              <span className="text-sm font-black text-brand-primary text-xl">₱{calculateTotalReturn()}</span>
           </div>
           <div className="h-px bg-brand-border w-full mb-4"></div>
           <div className="flex items-center gap-2 text-[10px] text-brand-text/30 font-medium leading-relaxed">
              <Shield className="w-3 h-3 shrink-0" />
              <span>Investment carries risk. Returns are estimated based on past performance. Capital is locked for {selectedPkg.duration} days.</span>
           </div>
        </GlassCard>

        <button 
          onClick={() => setIsConfirming(true)}
          disabled={amount < selectedPkg.min || amount > balance}
          className="btn-primary w-full h-16 text-lg tracking-tight disabled:opacity-50"
        >
          {amount > balance ? "Insufficient Balance" : amount < selectedPkg.min ? `Min ₱${selectedPkg.min} required` : "Confirm Investment"}
        </button>
      </section>

      <AnimatePresence>
        {isConfirming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-black/90 backdrop-blur-md flex items-end justify-center"
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="w-full max-w-lg bg-brand-navy border-t border-brand-primary/30 rounded-t-[40px] p-8"
            >
              <div className="w-12 h-1 bg-brand-text/10 rounded-full mx-auto mb-8"></div>
              <div className="text-center mb-10">
                 <div className="w-20 h-20 bg-brand-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-10 h-10 text-brand-primary" />
                 </div>
                 <h2 className="text-3xl font-display font-black tracking-tight mb-2">Confirm Boot</h2>
                 <p className="text-sm text-brand-text/40 font-medium">Are you sure you want to deploy the {selectedPkg.title} for ₱{amount.toLocaleString()}?</p>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => {
                    onInvest(amount, selectedPkg);
                    setIsConfirming(false);
                  }}
                  className="btn-primary w-full h-16 text-lg"
                >
                  Yes, Deploy Bot
                </button>
                <button 
                  onClick={() => setIsConfirming(false)}
                  className="w-full h-16 rounded-2xl bg-brand-card/5 text-brand-text/60 font-bold uppercase tracking-widest text-[10px]"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
