import { motion, AnimatePresence, useSpring, useTransform, animate } from "motion/react";
import { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  Smartphone, 
  Landmark, 
  Receipt, 
  CreditCard, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Gift, 
  Network, 
  Zap, 
  CheckCircle2, 
  Users, 
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Copy,
  Scan,
  Trophy
} from "lucide-react";
import { Wallet, UserStats, Transaction } from "../types";
import GlassCard from "../components/GlassCard";
import TransactionDetailModal from "../components/TransactionDetailModal";
import QrInviteModal from "../components/QrInviteModal";
import AnimatedNumber from "../components/AnimatedNumber";

interface HomeScreenProps {
  stats: UserStats;
  onActivate: () => void;
}

const services = [
  { id: "send", name: "Send", icon: ArrowUpRight, color: "#1A5CFF" },
  { id: "load", name: "Load", icon: Smartphone, color: "#00F0FF" },
  { id: "bank", name: "Bank", icon: Landmark, color: "#9D5CFF" },
  { id: "bills", name: "Bills", icon: Receipt, color: "#FF5C5C" },
  { id: "cards", name: "Cards", icon: CreditCard, color: "#FFD644" },
  { id: "cashin", name: "Cash In", icon: PlusCircle, color: "#44FF9D" },
];

const transactions: Transaction[] = [
  { id: 1, type: "out", title: "Starbucks Coffee", date: "Today, 10:45 AM", amount: "-₱185.00", category: "Food & Drinks", status: "Completed" },
  { id: 2, type: "in", title: "Monthly Salary", date: "Yesterday, 06:00 PM", amount: "+₱42,500.00", category: "Work", status: "Completed" },
  { id: 3, type: "out", title: "Meralco Bill", date: "April 25, 02:30 PM", amount: "-₱3,420.50", category: "Bills", status: "Completed" },
  { id: 4, type: "out", title: "Netflix Subscription", date: "April 24, 09:00 AM", amount: "-₱549.00", category: "Entertainment", status: "Completed" },
];

const WALLETS: Wallet[] = [
  { label: "Main Balance", balance: 85240.50, type: "main", color: "text-white" },
  { label: "Earnings", balance: 12450.00, type: "earnings", color: "text-brand-neon" },
];

export default function HomeScreen({ stats, onActivate }: HomeScreenProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeWalletIdx, setActiveWalletIdx] = useState(0);

  const activeWallet = WALLETS[activeWalletIdx];
  const referralCode = "EJ-JOHNAUSTINE-2026";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Branding Header */}
      <header className="px-6 pt-8 flex flex-col items-center">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-lg bg-brand-navy border border-brand-neon/30 flex items-center justify-center">
             <span className="text-[10px] font-black italic text-brand-neon">EJ</span>
          </div>
          <h1 className="text-xl font-display font-black tracking-[4px]">EJCASHH</h1>
        </div>
        <p className="text-[10px] text-brand-neon/60 font-bold uppercase tracking-[0.3em]">Fast • Secure • Smart Payments</p>
      </header>

      {/* Wallet Card */}
      <section className="px-6">
        <motion.div
           layout
           className="relative h-60 rounded-[40px] overflow-hidden group border border-white/10 shadow-2xl glass-card !p-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/30 via-brand-blue/10 to-brand-neon/5">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-neon/10 rounded-full blur-[80px] animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-blue/10 rounded-full blur-[80px]"></div>
          </div>
          
          <div className="relative h-full p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold">{activeWallet.label}</span>
                <div className="flex items-center gap-3">
                  <h1 className={`text-3xl font-display font-bold tracking-tight transition-all duration-300 ${activeWallet.color}`}>
                    {showBalance ? (
                      <AnimatedNumber value={activeWallet.balance} className={activeWallet.color} />
                    ) : (
                      "₱ ••••••••"
                    )}
                  </h1>
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
                  >
                    {showBalance ? <Eye className="w-4 h-4 text-white/80" /> : <EyeOff className="w-4 h-4 text-white/80" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-11 h-11 bg-brand-blue/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-brand-blue/30 shadow-[0_0_15px_rgba(0,102,255,0.2)]">
                  <div className="relative text-xs font-black italic tracking-tighter text-brand-neon">EJ</div>
                </div>
                <div className="flex gap-1 justify-center mt-2">
                   {WALLETS.map((_ , i) => (
                     <button 
                       key={i} 
                       onClick={() => setActiveWalletIdx(i)}
                       className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeWalletIdx ? 'bg-brand-neon w-4' : 'bg-white/20'}`}
                     />
                   ))}
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-bold mb-1">Total Earnings</span>
                  <div className="text-sm font-semibold text-brand-neon drop-shadow-[0_0_8px_rgba(0,242,255,0.4)]">
                    <AnimatedNumber value={stats.totalEarnings} className="text-brand-neon font-semibold" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-white/40 uppercase tracking-[0.1em] font-bold mb-1">Referrals</span>
                  <span className="text-sm font-semibold">{stats.directReferrals} Users</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-brand-neon/10 backdrop-blur-md py-1.5 px-4 rounded-full border border-brand-neon/30">
                <div className="w-1.5 h-1.5 bg-brand-neon rounded-full animate-pulse shadow-[0_0_8px_#00F2FF]"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-neon">Verified</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Activation Package Card */}
      <section className="px-6">
        <GlassCard className={`!p-0 overflow-hidden relative border-brand-neon/20 bg-brand-navy/60 backdrop-blur-3xl shadow-[0_0_40px_rgba(0,242,255,0.1)]`}>
          <div className="absolute top-0 right-0 p-4">
             <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${stats.isActivated ? 'bg-brand-neon text-brand-black shadow-[0_0_10px_#00F2FF]' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${stats.isActivated ? 'bg-brand-black' : 'bg-red-500 animate-pulse'}`}></span>
               {stats.isActivated ? 'Activated' : 'Not Activated'}
             </div>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-14 h-14 rounded-3xl bg-brand-neon/10 border border-brand-neon/20 flex items-center justify-center">
                  <Zap className="w-7 h-7 text-brand-neon" />
               </div>
               <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-1">Activation Package</h3>
                  <h4 className="text-lg font-display font-bold">EJCASHH Starter Activation</h4>
               </div>
            </div>

            <div className="flex items-center justify-between mb-8">
               <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Registration Fee</p>
                  <p className="text-3xl font-display font-black text-brand-neon italic tracking-tighter">₱360</p>
               </div>
               {!stats.isActivated && (
                 <button 
                  onClick={onActivate}
                  className="px-6 py-3 bg-brand-blue text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(26,92,255,0.4)] active:scale-95 transition-all"
                 >
                   Activate Now
                 </button>
               )}
            </div>

            <div className="flex flex-col gap-3 py-6 border-t border-white/5">
               <p className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-1">Exclusive Benefits</p>
               {[
                 "Earn 30% Direct Referral Bonus",
                 "Unlock 10-Level Rewards",
                 "Access Cashback & Rewards",
                 "Withdraw Earnings",
                 "Join VIP Ranking System"
               ].map((benefit, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-neon" />
                    <span className="text-[11px] font-medium text-white/60">{benefit}</span>
                 </div>
               ))}
            </div>

            <div className="mt-4 flex items-center gap-2">
               <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: stats.isActivated ? '100%' : '0%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-brand-neon shadow-[0_0_10px_#00F2FF]"
                  />
               </div>
               <span className="text-[10px] font-black text-brand-neon uppercase tracking-tighter">
                  {stats.isActivated ? '100%' : '0%'}
               </span>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Quick Actions */}
      <section className="px-6">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 mb-4 px-2">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-4">
          {services.slice(0, 4).map((service, i) => (
             <motion.button
               key={service.id}
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: i * 0.05 }}
               className="flex flex-col items-center gap-2 group"
             >
                <div className="w-16 h-16 glass-card flex items-center justify-center group-hover:scale-110 active:scale-95 transition-all duration-300 border-white/10">
                  <service.icon className="w-7 h-7" style={{ color: service.color }} />
                </div>
                <span className="text-[9px] font-black text-white/40 tracking-widest uppercase group-hover:text-white transition-colors">{service.name}</span>
             </motion.button>
          ))}
        </div>
      </section>

      {/* Rewards & Cashback Hub */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2">Rewards & Cashback</h3>
           <button className="text-[10px] font-black uppercase tracking-widest text-brand-neon">Hot Deals</button>
        </div>
        <GlassCard className="!p-0 overflow-hidden bg-gradient-to-r from-purple-500/10 to-brand-blue/10 border-white/5 group cursor-pointer active:scale-[0.98] transition-all">
          <div className="p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-brand-blue/20 transition-all">
               <Trophy className="w-8 h-8 text-brand-blue" />
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-blue">Active Promo</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-neon animate-pulse" />
               </div>
               <h4 className="text-base font-bold">10% Shopping Cashback</h4>
               <p className="text-[10px] text-white/40 mt-1 font-medium">Earn rebates on every utility payment.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-all transform group-hover:translate-x-1" />
          </div>
        </GlassCard>
      </section>

      {/* Referral Link & Dashboard Metrics */}
      <section className="px-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2">Network Progress</h3>
           <button className="text-[10px] font-black uppercase tracking-widest text-brand-neon flex items-center gap-1">
             Team Stats <ChevronRight className="w-3 h-3" />
           </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <GlassCard className="!p-5 border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-4">
                 <Users className="w-5 h-5 text-brand-blue" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Directs</span>
              </div>
              <p className="text-2xl font-display font-bold mb-1">{stats.directReferrals}</p>
              <div className="flex items-center gap-1 text-[10px] text-brand-neon font-black italic">
                 <TrendingUp className="w-3 h-3" />
                 <span>+12%</span>
              </div>
           </GlassCard>

           <GlassCard className="!p-5 border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-3 mb-4">
                 <Network className="w-5 h-5 text-purple-400" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-white/40">Team Size</span>
              </div>
              <p className="text-2xl font-display font-bold mb-1">{stats.teamSize}</p>
              <p className="text-[9px] font-black uppercase tracking-tighter text-white/20">Active Network</p>
           </GlassCard>
        </div>

        {/* Invite Area */}
        <div className="flex flex-col gap-4">
          <GlassCard className="!p-4 flex items-center justify-between border-brand-blue/20 bg-brand-blue/5">
              <div className="flex items-center gap-4 flex-1 mr-4 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-brand-blue/20 flex items-center justify-center shrink-0">
                    <PlusCircle className="w-5 h-5 text-brand-blue" />
                </div>
                <div className="overflow-hidden">
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Share Code</p>
                    <p className="text-xs font-mono font-bold truncate">{referralCode}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="p-3 bg-white/5 hover:bg-brand-blue/20 rounded-xl transition-all active:scale-90"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsQrModalOpen(true)}
                  className="p-3 bg-white/5 hover:bg-brand-blue/20 rounded-xl transition-all active:scale-90"
                >
                  <Scan className="w-4 h-4" />
                </button>
              </div>
          </GlassCard>
        </div>
      </section>

      {/* Transaction History */}
      <section className="px-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30 px-2">Recent Activity</h3>
          <button className="text-[10px] font-black uppercase tracking-widest text-brand-neon hover:opacity-80 transition-opacity">View History</button>
        </div>
        
        <div className="flex flex-col gap-3">
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={() => setSelectedTx(tx)}
              className="glass-card !p-4 flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'in' ? 'bg-brand-neon/10' : 'bg-white/5 opacity-80'}`}>
                  {tx.type === 'in' ? <ArrowDownLeft className="w-5 h-5 text-brand-neon" /> : <ArrowUpRight className="w-5 h-5 text-white/60" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{tx.title}</h4>
                  <p className="text-[10px] text-white/40 tracking-wider font-medium">{tx.date} • {tx.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-display font-bold ${tx.type === 'in' ? 'text-brand-neon' : 'text-white'}`}>
                  {tx.amount}
                </p>
                <p className="text-[8px] text-white/20 uppercase tracking-[0.3em] font-black">Success</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Footer */}
      <footer className="flex flex-col items-center gap-2 mt-4 px-6 mb-8">
         <div className="flex items-center gap-2 text-white/20">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-[9px] font-black uppercase tracking-[0.3em]">End-to-End Secure</span>
         </div>
      </footer>

      <TransactionDetailModal 
        transaction={selectedTx} 
        onClose={() => setSelectedTx(null)} 
      />

      <QrInviteModal 
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        referralCode={referralCode}
      />
    </div>
  );
}
