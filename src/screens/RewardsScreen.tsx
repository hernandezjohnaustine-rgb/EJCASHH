import { motion } from "motion/react";
import { Gift, Zap, TrendingUp, Trophy, ArrowRight, Wallet, PartyPopper } from "lucide-react";
import GlassCard from "../components/GlassCard";

const rewards = [
  { id: 1, title: "10% Cashback", merchant: "Zalora Fashion", pts: "150 pts", expiry: "2 days left", category: "Fashion" },
  { id: 2, title: "₱100 Discount", merchant: "GrabFood", pts: "200 pts", expiry: "3 days left", category: "Food" },
  { id: 3, title: "Free Data 2GB", merchant: "Globe Telecom", pts: "500 pts", expiry: "7 days left", category: "Telco" },
];

export default function RewardsScreen() {
  return (
    <div className="flex flex-col gap-8 h-full bg-brand-black p-6 pb-32 overflow-y-auto">
      <header className="flex flex-col gap-4">
        <h2 className="text-2xl font-display font-bold tracking-tight">Rewards</h2>
        
        <GlassCard className="relative overflow-hidden bg-gradient-to-br from-brand-primary/20 to-brand-accent/20 border-brand-primary/20">
           <div className="flex flex-col gap-1 items-center justify-center py-4">
              <div className="flex items-center gap-2 mb-2">
                 <Trophy className="w-5 h-5 text-brand-primary" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Loyalty Status</span>
              </div>
              <h3 className="text-3xl font-display font-black tracking-tighter">Gold Tier</h3>
              <p className="text-xs text-brand-primary font-bold tracking-widest uppercase mt-4">2,450 / 5,000 pts to Platinum</p>
              
              <div className="w-full h-1.5 bg-white/5 rounded-full mt-4 overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '49%' }}
                   transition={{ duration: 1, delay: 0.5 }}
                   className="h-full bg-gradient-to-r from-brand-primary to-brand-accent shadow-[0_0_10px_#FACC15]"
                 />
              </div>
           </div>
        </GlassCard>
      </header>

      <section className="flex flex-col gap-6">
         <div className="flex items-center justify-between">
           <h3 className="text-lg font-display font-semibold tracking-tight">Daily Missions</h3>
           <Zap className="w-5 h-5 text-brand-primary animate-bounce" />
         </div>

         <div className="flex gap-4 overflow-x-auto -mx-6 px-6 pb-2">
            <button className="glass-card min-w-[200px] !p-4 flex flex-col gap-4 hover:border-brand-primary/40 transition-colors">
               <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-orange-500" />
               </div>
               <div>
                  <h4 className="text-sm font-bold">Transfer ₱1,000</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">+50 pts reward</p>
               </div>
               <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-brand-primary">Progress 60%</span>
                  <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-brand-primary w-[60%]"></div>
                  </div>
               </div>
            </button>
            <button className="glass-card min-w-[200px] !p-4 flex flex-col gap-4 hover:border-brand-primary/40 transition-colors">
               <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-purple-500" />
               </div>
               <div>
                  <h4 className="text-sm font-bold">Buy ₱100 Load</h4>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1">+20 pts reward</p>
               </div>
               <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] font-bold text-white/20">Waiting...</span>
                  <div className="w-20 h-1 bg-white/5 rounded-full overflow-hidden">
                     <div className="h-full bg-white/10 w-0"></div>
                  </div>
               </div>
            </button>
         </div>
      </section>

      <section className="flex flex-col gap-4">
         <h3 className="text-lg font-display font-semibold tracking-tight">Hot Deals</h3>
         <div className="flex flex-col gap-3">
            {rewards.map((reward, i) => (
               <motion.div
                 key={reward.id}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: i * 0.1 }}
                 className="glass-card !p-5 flex items-center justify-between group cursor-pointer"
               >
                  <div className="flex items-center gap-4">
                     <div className="w-14 h-14 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/5">
                        <span className="text-[8px] font-black uppercase text-white/40 tracking-tighter mb-1">{reward.category}</span>
                        <PartyPopper className="w-6 h-6 text-brand-primary" />
                     </div>
                     <div>
                        <h4 className="text-sm font-bold">{reward.title}</h4>
                        <p className="text-xs text-white/60 font-medium">{reward.merchant}</p>
                        <p className="text-[10px] text-brand-primary font-black uppercase tracking-widest mt-1">{reward.pts}</p>
                     </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                     <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">{reward.expiry}</span>
                     <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-brand-primary group-hover:text-brand-black transition-all">
                        <ArrowRight className="w-4 h-4" />
                     </div>
                  </div>
               </motion.div>
            ))}
         </div>
      </section>
    </div>
  );
}

import { Smartphone } from "lucide-react";
