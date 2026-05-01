import { motion, AnimatePresence, useSpring, useTransform, animate } from "motion/react";
import { useState, useEffect } from "react";
import { 
  Eye, 
  EyeOff, 
  Smartphone, 
  Landmark, 
  Receipt, 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Zap, 
  CheckCircle2, 
  Users, 
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Copy,
  Scan,
  Trophy,
  Clock,
  Bike,
  ShoppingBag,
  Sparkles,
  Wallet as WalletIcon,
  Network
} from "lucide-react";
import { Wallet, UserStats, Transaction } from "../types";
import GlassCard from "../components/GlassCard";
import TransactionDetailModal from "../components/TransactionDetailModal";
import QrInviteModal from "../components/QrInviteModal";
import AnimatedNumber from "../components/AnimatedNumber";

interface HomeScreenProps {
  stats: UserStats;
  onActivate: () => void;
  balance: number;
  transactions: Transaction[];
  onServiceClick: (id: string) => void;
  onViewHistory: () => void;
  onClaimTrading?: () => void;
}

const mainServices = [
  { id: "cashin", name: "Cash In", icon: PlusCircle, color: "#10B981" },
  { id: "send", name: "Send", icon: ArrowUpRight, color: "#10B981" },
  { id: "load", name: "Load", icon: Smartphone, color: "#10B981" },
  { id: "bank", name: "Bank", icon: Landmark, color: "#10B981" },
  { id: "bills", name: "Bills", icon: Receipt, color: "#10B981" },
];

const earnServices = [
  { id: "trading", name: "Bot", icon: TrendingUp, color: "#FACC15" },
  { id: "rider", name: "Rider", icon: Bike, color: "#FACC15" },
  { id: "market", name: "Shop", icon: ShoppingBag, color: "#FACC15" },
  { id: "assistant", name: "AI AI", icon: Sparkles, color: "#FACC15" },
];

const WALLETS = (balance: number, earnings: number): Wallet[] => [
  { label: "Main Balance", balance: balance, type: "main", color: "text-brand-text" },
  { label: "Earnings", balance: earnings, type: "earnings", color: "text-brand-primary" },
];

export default function HomeScreen({ 
  stats, 
  onActivate, 
  balance, 
  transactions, 
  onServiceClick, 
  onViewHistory,
  onClaimTrading
}: HomeScreenProps) {
  const [showBalance, setShowBalance] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [activeWalletIdx, setActiveWalletIdx] = useState(0);
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);

  const wallets = WALLETS(balance, stats.totalEarnings);
  const activeWallet = wallets[activeWalletIdx];
  const referralCode = "EJ-USER-2026";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
  };

  return (
    <div className="flex flex-col gap-8 pb-32">
      {/* Branding Header */}
      <header className="px-6 pt-10 flex flex-col items-center">
        <div className="flex flex-col items-center gap-2 mb-2">
          <div className="w-20 h-20 rounded-3xl bg-brand-navy border border-brand-primary/30 flex items-center justify-center overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.1)]">
             <div className="relative text-3xl font-display font-black italic tracking-tighter text-brand-primary flex flex-col items-center">
                <span className="text-5xl leading-none">EJ</span>
                <span className="text-[12px] tracking-[4px] mt-1">CASHH</span>
             </div>
          </div>
          <h1 className="text-2xl font-display font-black tracking-[4px] text-brand-primary">EJCASHH</h1>
        </div>
        <p className="text-[10px] text-brand-primary/60 font-bold uppercase tracking-[0.3em] font-sans">Digital Marketing Services</p>
      </header>

      {/* Wallet Card */}
      <section className="px-6">
        <motion.div
           layout
           className="relative h-60 rounded-[40px] overflow-hidden group border border-brand-border shadow-2xl glass-card !p-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/20 via-brand-primary/5 to-brand-accent/5">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px] animate-pulse"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-brand-primary/10 rounded-full blur-[80px]"></div>
          </div>
          
          <div className="relative h-full p-8 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-brand-text/40 uppercase tracking-[0.2em] font-bold">{activeWallet.label}</span>
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
                    className="p-1.5 bg-brand-text/5 hover:bg-brand-text/10 rounded-xl transition-colors border border-brand-border"
                  >
                    {showBalance ? <Eye className="w-4 h-4 text-brand-text/80" /> : <EyeOff className="w-4 h-4 text-brand-text/80" />}
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <div className="w-11 h-11 bg-brand-primary/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-brand-primary/30 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                  <div className="relative text-[10px] font-black italic tracking-tighter text-brand-primary">EJ</div>
                </div>
                <div className="flex gap-1 justify-center mt-2">
                   {wallets.map((_ , i) => (
                     <button 
                       key={i} 
                       onClick={() => setActiveWalletIdx(i)}
                       className={`w-1.5 h-1.5 rounded-full transition-all ${i === activeWalletIdx ? 'bg-brand-primary w-4' : 'bg-brand-text/20'}`}
                     />
                   ))}
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div className="flex gap-6">
                <div className="flex flex-col">
                  <span className="text-[10px] text-brand-text/40 uppercase tracking-[0.1em] font-bold mb-1">Total Earnings</span>
                  <div className="text-sm font-semibold text-brand-primary drop-shadow-[0_0_8px_rgba(250,204,21,0.4)]">
                    <AnimatedNumber value={stats.totalEarnings} className="text-brand-primary font-semibold" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-brand-text/40 uppercase tracking-[0.1em] font-bold mb-1">Referrals</span>
                  <span className="text-sm font-semibold">{stats.directReferrals} Users</span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-brand-primary/10 backdrop-blur-md py-1.5 px-4 rounded-full border border-brand-primary/30">
                <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_#FACC15]"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-primary">Verified</span>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trading ROI Dashboard */}
      {stats.isActivated && (
        <section className="px-6">
          <GlassCard className="!p-0 overflow-hidden relative border-brand-primary/20 bg-brand-navy/40 backdrop-blur-2xl shadow-[0_0_50px_rgba(250,204,21,0.05)]">
             <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                         <TrendingUp className="w-5 h-5 text-brand-primary" />
                      </div>
                      <div>
                         <h3 className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Automated Trading</h3>
                         <p className="text-[8px] text-brand-text/40 font-bold uppercase tracking-tighter">5% Daily Yield (10 Days Cycle)</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-1.5 px-3 py-1 bg-brand-primary/10 rounded-full border border-brand-primary/20">
                      <div className="w-1.5 h-1.5 bg-brand-primary rounded-full animate-pulse shadow-[0_0_8px_#FACC15]" />
                      <span className="text-[8px] text-brand-primary font-black uppercase tracking-widest">Live ROI</span>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                   <div className="flex flex-col gap-1">
                      <span className="text-[9px] text-brand-text/30 uppercase font-black tracking-widest">Active Stake</span>
                      <p className="text-xl font-display font-bold italic tracking-tight text-brand-text/90">₱{stats.tradingInvested.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                   </div>
                   <div className="flex flex-col gap-1 text-right">
                      <span className="text-[9px] text-brand-text/30 uppercase font-black tracking-widest">Accumulated ROI</span>
                      <p className="text-xl font-display font-bold italic tracking-tight text-brand-primary drop-shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                        +₱{stats.tradingEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                   </div>
                </div>

                <div className="flex flex-col gap-3">
                   <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest px-1">
                      <span className="text-brand-text/40">Cycle Progress</span>
                      <span className="text-brand-primary">{stats.tradingDaysCompleted} / 10 days</span>
                   </div>
                   
                   <div className="relative">
                      {/* Day Markers */}
                      <div className="absolute inset-0 flex justify-between px-1 items-center z-10 pointer-events-none">
                        {[...Array(11)].map((_, i) => (
                          <div 
                            key={i} 
                            className={`w-0.5 h-1 rounded-full transition-colors duration-500 ${i <= stats.tradingDaysCompleted ? 'bg-brand-text/40' : 'bg-brand-text/10'}`} 
                          />
                        ))}
                      </div>

                      <div className="h-3 bg-brand-border/40 rounded-full overflow-hidden border border-brand-border/20 p-0.5 relative">
                         <motion.div 
                           initial={{ width: 0 }}
                           animate={{ width: `${(stats.tradingDaysCompleted / 10) * 100}%` }}
                           transition={{ duration: 1.5, type: "spring", bounce: 0.3 }}
                           className="h-full bg-gradient-to-r from-brand-primary to-[#EAB308] rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)]"
                         />
                      </div>
                   </div>

                   <div className="flex justify-between mt-1 px-1">
                      <p className="text-[8px] text-brand-text/20 font-bold uppercase italic flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Status: Active Cycle
                      </p>
                      <p className="text-[8px] text-brand-text/40 font-bold uppercase tracking-tighter">Day {stats.tradingDaysCompleted} Distribution Processed</p>
                   </div>
                </div>

                <div className="mt-6 pt-4 border-t border-brand-border">
                   {stats.tradingClaimedToday ? (
                     <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 py-3 px-4 rounded-xl">
                        <div className="flex items-center gap-2">
                           <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                           <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest">Profit Claimed</span>
                        </div>
                        <span className="text-[10px] text-emerald-500/60 font-bold">+₱18.00 today</span>
                     </div>
                   ) : (
                     <button 
                       onClick={() => {
                         onClaimTrading?.();
                         setShowClaimSuccess(true);
                         setTimeout(() => setShowClaimSuccess(false), 3000);
                       }}
                       className="w-full py-3 bg-brand-primary text-brand-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_5px_15px_rgba(250,204,21,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2"
                     >
                       <TrendingUp className="w-4 h-4" />
                       Claim Daily Profit (5%)
                     </button>
                   )}
                </div>
             </div>

             <AnimatePresence>
               {showClaimSuccess && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9, y: 10 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   exit={{ opacity: 0, scale: 0.9, y: 10 }}
                   className="absolute inset-0 bg-brand-black/90 backdrop-blur-md flex flex-col items-center justify-center z-20 text-center px-6"
                 >
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1.2 }}
                      className="w-16 h-16 bg-brand-primary rounded-full flex items-center justify-center mb-4"
                    >
                       <CheckCircle2 className="w-10 h-10 text-brand-black" />
                    </motion.div>
                    <h4 className="text-xl font-display font-black text-brand-primary uppercase italic mb-1">Profit Claimed!</h4>
                    <p className="text-xs text-brand-text/60 font-bold uppercase tracking-widest">+₱18.00 added to balance</p>
                 </motion.div>
               )}
             </AnimatePresence>
          </GlassCard>
        </section>
      )}

      {/* Activation Package Card */}
      <section className="px-6">
        <GlassCard className={`!p-0 overflow-hidden relative border-brand-primary/20 bg-brand-navy/60 backdrop-blur-3xl shadow-[0_0_40px_rgba(250,204,21,0.1)]`}>
          <div className="absolute top-0 right-0 p-4">
             <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${stats.isActivated ? 'bg-brand-primary text-brand-black shadow-[0_0_10px_#FACC15]' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
               <span className={`w-1.5 h-1.5 rounded-full ${stats.isActivated ? 'bg-brand-black' : 'bg-red-500 animate-pulse'}`}></span>
               {stats.isActivated ? 'Activated' : 'Not Activated'}
             </div>
          </div>

          <div className="p-8">
            <div className="flex items-center gap-4 mb-8">
               <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.1)]">
                  <Zap className="w-7 h-7 text-brand-primary" />
               </div>
               <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/30 mb-1">Current Status</p>
                  <h4 className="text-lg font-display font-bold tracking-tight">EJCASHH Starter Activation</h4>
               </div>
            </div>

            <div className="space-y-3 mb-8">
               <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-card/2 border border-brand-border">
                  <span className="text-[10px] text-brand-text/40 uppercase tracking-widest font-bold">Registration Fee</span>
                  <span className="text-2xl font-display font-black text-brand-primary italic">₱360.00</span>
               </div>
               <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-card/2 border border-brand-border">
                  <span className="text-[10px] text-brand-text/40 uppercase tracking-widest font-bold">Included Product</span>
                  <span className="text-sm font-bold text-brand-text/80">Premium Beauty Soap</span>
               </div>
            </div>

            {!stats.isActivated && (
              <div className="mb-8">
                <button 
                 onClick={onActivate}
                 className="w-full py-4 bg-brand-primary text-brand-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_10px_20px_rgba(250,204,21,0.4)] active:scale-95 transition-all"
                >
                  Activate Now
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 py-6 border-t border-brand-border">
               <p className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-text/20 mb-2">Exclusive Benefits</p>
               {[
                 "Earn 30% Direct Referral Bonus",
                 "Unlock 10-Level Rewards",
                 "Access Cashback & Rewards",
                 "Withdraw Earnings",
                 "Join VIP Ranking System"
               ].map((benefit, i) => (
                 <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-3.5 h-3.5 text-brand-primary" />
                    <span className="text-[11px] font-medium text-brand-text/60">{benefit}</span>
                 </div>
               ))}
            </div>

            <div className="mt-4 flex flex-col gap-2">
               <div className="flex items-center justify-between">
                  <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">Account Status</span>
                  <span className="text-[9px] font-black text-brand-primary uppercase tracking-widest">100% Verified</span>
               </div>
               <div className="h-1.5 bg-brand-border/40 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: stats.isActivated ? '100%' : '0%' }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-brand-primary shadow-[0_0_15px_#FACC15]"
                  />
               </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Services Grid */}
      <section className="px-6 grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/20 px-2">Main Services</h3>
           <div className="grid grid-cols-2 gap-3">
              {mainServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onServiceClick(service.id)}
                  className="flex flex-col items-center gap-3 glass-card !p-4 hover:scale-105 active:scale-95 transition-all border-brand-border"
                >
                   <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                     <service.icon className="w-5 h-5 text-brand-primary" />
                   </div>
                   <span className="text-[9px] font-black text-brand-text/40 tracking-widest uppercase">{service.name}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="flex flex-col gap-4">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/20 px-2">Earning Tools</h3>
           <div className="grid grid-cols-2 gap-3">
              {earnServices.map((service) => (
                <button
                  key={service.id}
                  onClick={() => onServiceClick(service.id)}
                  className="flex flex-col items-center gap-3 glass-card !p-4 hover:scale-105 active:scale-95 transition-all border-brand-primary/10 bg-brand-primary/5"
                >
                   <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                     <service.icon className="w-5 h-5 text-brand-primary" />
                   </div>
                   <span className="text-[9px] font-black text-brand-text/80 tracking-widest uppercase">{service.name}</span>
                </button>
              ))}
           </div>
        </div>
      </section>

      {/* Rewards & Cashback Hub */}
      <section className="px-6">
        <div className="flex items-center justify-between mb-4">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/30 px-2">Rewards & Cashback</h3>
           <button className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Hot Deals</button>
        </div>
        <GlassCard className="!p-0 overflow-hidden bg-gradient-to-r from-brand-primary/10 to-brand-primary/5 border-brand-border group cursor-pointer active:scale-[0.98] transition-all">
          <div className="p-6 flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-brand-text/5 border border-brand-border flex items-center justify-center group-hover:bg-brand-primary/20 transition-all">
               <Trophy className="w-8 h-8 text-brand-primary" />
            </div>
            <div className="flex-1">
               <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Active Promo</span>
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
               </div>
               <h4 className="text-base font-bold">10% Shopping Cashback</h4>
               <p className="text-[10px] text-brand-text/40 mt-1 font-medium">Earn rebates on every utility payment.</p>
            </div>
            <ChevronRight className="w-5 h-5 text-brand-text/20 group-hover:text-brand-text transition-all transform group-hover:translate-x-1" />
          </div>
        </GlassCard>
      </section>

      {/* Referral Link & Dashboard Metrics */}
      <section className="px-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/30 px-2">Network Progress</h3>
           <button className="text-[10px] font-black uppercase tracking-widest text-brand-primary flex items-center gap-1">
             Team Stats <ChevronRight className="w-3 h-3" />
           </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
           <GlassCard className="!p-5 border-brand-border bg-brand-card/2">
              <div className="flex items-center gap-3 mb-4">
                 <Users className="w-5 h-5 text-brand-primary" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">Directs</span>
              </div>
              <p className="text-2xl font-display font-bold mb-1">{stats.directReferrals}</p>
              <div className="flex items-center gap-1 text-[10px] text-brand-primary font-black italic">
                 <TrendingUp className="w-3 h-3" />
                 <span>+12%</span>
              </div>
           </GlassCard>

           <GlassCard className="!p-5 border-brand-border bg-brand-card/2">
              <div className="flex items-center gap-3 mb-4">
                 <Network className="w-5 h-5 text-brand-accent" />
                 <span className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">Team Size</span>
              </div>
              <p className="text-2xl font-display font-bold mb-1">{stats.teamSize}</p>
              <p className="text-[9px] font-black uppercase tracking-tighter text-brand-text/20">Active Network</p>
           </GlassCard>
        </div>

        {/* Invite Area */}
        <div className="flex flex-col gap-4">
          <GlassCard className="!p-4 flex items-center justify-between border-brand-primary/20 bg-brand-primary/5">
              <div className="flex items-center gap-4 flex-1 mr-4 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0">
                    <PlusCircle className="w-5 h-5 text-brand-primary" />
                </div>
                <div className="overflow-hidden">
                    <p className="text-[10px] text-brand-text/40 font-bold uppercase tracking-widest">Share Code</p>
                    <p className="text-xs font-mono font-bold truncate">{referralCode}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleCopy}
                  className="p-3 bg-brand-card/5 hover:bg-brand-primary/20 rounded-xl transition-all active:scale-90"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsQrModalOpen(true)}
                  className="p-3 bg-brand-card/5 hover:bg-brand-primary/20 rounded-xl transition-all active:scale-90"
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
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/30 px-2">Recent Activity</h3>
          <button 
            onClick={onViewHistory}
            className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:opacity-80 transition-opacity"
          >
            View History
          </button>
        </div>
        
        <div className="flex flex-col gap-3">
          {transactions.map((tx, i) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={() => setSelectedTx(tx)}
              className="glass-card !p-4 flex items-center justify-between group hover:bg-brand-card/10 transition-colors cursor-pointer border-brand-border"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${tx.type === 'in' ? 'bg-brand-primary/10' : 'bg-brand-card/5 opacity-80'}`}>
                  {tx.type === 'in' ? <ArrowDownLeft className="w-5 h-5 text-brand-primary" /> : <ArrowUpRight className="w-5 h-5 text-brand-text/60" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold">{tx.title}</h4>
                  <p className="text-[10px] text-brand-text/40 tracking-wider font-medium">{tx.date} • {tx.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-display font-bold ${tx.type === 'in' ? 'text-brand-primary' : 'text-brand-text'}`}>
                  {tx.amount}
                </p>
                <p className="text-[8px] text-brand-text/20 uppercase tracking-[0.3em] font-black">Success</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Security Footer */}
      <footer className="flex flex-col items-center gap-2 mt-4 px-6 mb-8">
         <div className="flex items-center gap-2 text-brand-text/20">
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
