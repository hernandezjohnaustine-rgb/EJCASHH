import { motion } from "motion/react";
import { Zap, ShieldCheck, CreditCard, ChevronRight, Check } from "lucide-react";
import GlassCard from "../components/GlassCard";

export default function ActivationScreen({ onActivate }: { onActivate: () => void }) {
  const benefits = [
    "30% Direct Referral Commission",
    "10-Level Indirect Income Stream",
    "Daily Login Bonus Activation",
    "Unlock VIP Ranking System",
    "Instant EJCASHH ID Verification"
  ];

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-6 pt-12 overflow-y-auto pb-32 relative">
      {/* Background Glow */}
      <div className="absolute top-0 left-0 w-full h-96 bg-brand-blue/20 blur-[100px] pointer-events-none"></div>

      <header className="text-center mb-12 relative z-10">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-brand-blue/10 border border-brand-blue/30 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(0,102,255,0.2)]">
          <Zap className="w-10 h-10 text-brand-neon animate-pulse" />
        </div>
        <h1 className="text-3xl font-display font-black tracking-tight mb-2">Account Activation</h1>
        <p className="text-sm text-white/40 font-medium">Activate your account to unlock the full earning potential of UWINS.</p>
      </header>

      <section className="flex flex-col gap-6 relative z-10">
        <GlassCard className="!p-8 border-brand-neon/20 bg-gradient-to-br from-brand-blue/10 to-brand-neon/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4">
             <div className="px-3 py-1 bg-brand-neon text-brand-black text-[10px] font-black uppercase tracking-widest rounded-full shadow-[0_0_15px_#00F2FF]">Featured</div>
          </div>
          
          <div className="text-center mb-8">
            <p className="text-xs text-white/40 uppercase tracking-[0.2em] font-bold mb-2">Activation Package</p>
            <h2 className="text-5xl font-display font-black tracking-tighter">₱360</h2>
            <p className="text-xs text-brand-neon font-bold tracking-widest mt-2">ONE-TIME PAYMENT</p>
          </div>

          <div className="flex flex-col gap-4">
            {benefits.map((benefit, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-neon/20 flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3 text-brand-neon" />
                </div>
                <span className="text-sm font-medium text-white/80">{benefit}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="flex flex-col gap-4 mt-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 ml-2">Payment Method</h3>
           <button className="glass-card !p-5 flex items-center justify-between border-transparent hover:border-white/10 transition-all bg-white/5 active:scale-95">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center font-black text-blue-500 italic">G</div>
                 <div className="text-left">
                    <h4 className="text-sm font-bold">GCash Pay</h4>
                    <p className="text-[10px] text-white/40 font-medium tracking-wider">Fast & Secure</p>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20" />
           </button>
           <button className="glass-card !p-5 flex items-center justify-between border-transparent hover:border-white/10 transition-all bg-white/5 active:scale-95 opacity-60">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-xl bg-brand-blue/10 flex items-center justify-center uppercase font-black text-brand-blue">W</div>
                 <div className="text-left">
                    <h4 className="text-sm font-bold">Main Wallet</h4>
                    <p className="text-[10px] text-red-500 font-bold tracking-wider">Insufficient Balance</p>
                 </div>
              </div>
              <ChevronRight className="w-5 h-5 text-white/20" />
           </button>
        </div>
      </section>

      <div className="mt-auto pt-10 pb-8 relative z-10">
        <button 
          onClick={onActivate}
          className="btn-primary w-full h-16 text-lg tracking-tight shadow-[0_10px_30px_rgba(0,102,255,0.4)]"
        >
          Pay ₱360 to Activate
        </button>
        <div className="flex items-center justify-center gap-2 mt-6">
           <ShieldCheck className="w-4 h-4 text-white/20" />
           <span className="text-[10px] font-black uppercase tracking-widest text-white/20">Secure Multi-Layer Encryption</span>
        </div>
      </div>
    </div>
  );
}
