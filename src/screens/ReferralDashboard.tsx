import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ChevronRight, 
  Trophy, 
  Zap, 
  Wallet,
  Network,
  Share2,
  Copy,
  Gift,
  CheckCircle2,
  Scan,
  Lock
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import { UserStats, Wallet as WalletType } from "../types";
import AnimatedNumber from "../components/AnimatedNumber";
import QrInviteModal from "../components/QrInviteModal";
import { shortenUrl } from "../lib/shortener";

const MLM_LEVELS = [
  { level: 1, reward: "₱100", income: "Direct", label: "Direct" },
  { level: 2, reward: "₱3", income: "Referral Chain", label: "Referral Chain" },
  { level: 3, reward: "₱3", income: "Referral Chain", label: "Referral Chain" },
  { level: 4, reward: "₱3", income: "Referral Chain", label: "Referral Chain" },
  { level: 5, reward: "₱3", income: "Referral Chain", label: "Referral Chain" },
  { level: "6-10", reward: "₱3", income: "Referral Chain", label: "Referral Chain" },
  { level: "11-20", reward: "₱3", income: "Team Matrix", label: "Team Matrix" },
];

const MLM_LEVELS_P2 = [
  { level: 1, reward: "₱1,000", income: "Direct", label: "Direct" },
  { level: 2, reward: "₱10", income: "Referral Chain", label: "Referral Chain" },
  { level: 3, reward: "₱10", income: "Referral Chain", label: "Referral Chain" },
  { level: 4, reward: "₱10", income: "Referral Chain", label: "Referral Chain" },
  { level: 5, reward: "₱10", income: "Referral Chain", label: "Referral Chain" },
  { level: "6-10", reward: "₱10", income: "Referral Chain", label: "Referral Chain" },
  { level: "11-20", reward: "₱10", income: "Team Matrix", label: "Team Matrix" },
];

export default function ReferralDashboard({ stats, onWithdraw, onViewNetwork, referralCode, referralLinkEnabled, onClaimDaily, isDailyClaimed }: { 
  stats: UserStats, 
  onWithdraw: () => void,
  onViewNetwork: () => void,
  referralCode: string,
  referralLinkEnabled: boolean,
  onClaimDaily?: () => void,
  isDailyClaimed?: boolean
}) {
  const [shortenedLink, setShortenedLink] = useState<string | null>(null);
  const [activePackageTab, setActivePackageTab] = useState<"p1" | "p2">("p1");
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  
  const shareLink = `${window.location.origin}${window.location.pathname}?ref=${referralCode}`;

  useEffect(() => {
    const getShort = async () => {
      const short = await shortenUrl(shareLink);
      setShortenedLink(short);
    };
    if (referralCode) getShort();
  }, [shareLink, referralCode]);
  const wallets: WalletType[] = [
    { label: "Earnings Wallet", balance: stats.totalEarnings || 0, type: "earnings", color: "text-brand-primary" },
    { label: "Credits (Locked)", balance: stats.creditsBalance || 0, type: "credits", color: "text-yellow-400" },
  ];

  return (
    <div className="flex flex-col gap-8 pb-32 bg-brand-black text-brand-text">
      {/* Header Summary */}
      <section className="px-6 pt-4">
        <div className="flex items-center justify-between mb-4">
           <div>
              <h2 className="text-2xl font-display font-bold tracking-tight">Earning Hub</h2>
              <p className="text-xs text-brand-text/40 font-medium">Multi-Level Reward System</p>
           </div>
           <div className={`px-4 py-1.5 rounded-full border border-brand-primary/30 bg-brand-primary/10 flex items-center gap-2`}>
              <Trophy className="w-3 h-3 text-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">VIP {stats.vipLevel}</span>
           </div>
        </div>

        <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6 no-scrollbar">
           {wallets.map((wallet, i) => (
             <motion.div
               key={wallet.label}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.1 }}
               className="glass-card min-w-[220px] flex flex-col gap-4 !bg-brand-card/5 border-brand-border"
             >
                <div className="flex items-center justify-between">
                   <div className={`w-10 h-10 rounded-xl bg-brand-card/10 flex items-center justify-center`}>
                      <Wallet className="w-5 h-5 text-brand-text/40" />
                   </div>
                   <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/20">{wallet.type}</div>
                </div>
                <div>
                   <p className="text-[10px] text-brand-text/40 uppercase tracking-widest font-bold mb-1">{wallet.label}</p>
                   <AnimatedNumber value={wallet.balance} className={`text-xl font-display font-bold ${wallet.color}`} />
                </div>
                {wallet.type === 'earnings' && (
                  <button 
                    onClick={onWithdraw}
                    className="w-full py-2 bg-brand-primary/10 border border-brand-primary/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary/20 transition-all"
                  >
                    Withdraw Now
                  </button>
                )}
             </motion.div>
           ))}
        </div>
      </section>

      {/* Referral Stats Grid */}
      <section className="px-6 grid grid-cols-2 gap-4">
        <GlassCard 
          onClick={onViewNetwork}
          className="!p-6 flex flex-col gap-3 group active:scale-95 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-brand-primary" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">Directs</span>
          </div>
          {/* Shows the TRUE direct referral count (people who actually used
              your referral code), not totalReferrals — which now tracks
              placement-based team growth and duplicated Team Size. */}
          <p className="text-2xl font-display font-bold group-hover:text-brand-primary transition-colors">{stats.directReferrals || 0}</p>
          <div className="flex items-center gap-1 text-[10px] text-brand-primary font-bold">
            <CheckCircle2 className="w-3 h-3" />
            <span>Real referrals</span>
          </div>
        </GlassCard>

        <GlassCard 
          onClick={onViewNetwork}
          className="!p-6 flex flex-col gap-3 group active:scale-95 transition-all cursor-pointer border-brand-border"
        >
          <div className="flex items-center gap-3">
            <Network className="w-5 h-5 text-brand-accent" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">Team Size</span>
          </div>
          <p className="text-2xl font-display font-bold group-hover:text-brand-accent transition-colors">{stats.teamSize}</p>
          <p className="text-[10px] text-brand-text/20 font-bold">L1 - L10 depth</p>
        </GlassCard>
      </section>

      {/* Referral Link */}
      <section className="px-6">
         <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/30 mb-4 px-2">Invite Link</h3>
          {referralLinkEnabled ? (
            <GlassCard className="flex items-center justify-between py-4 px-6 border-brand-primary/20 bg-brand-primary/5">
              <div className="flex items-center gap-4 flex-1 mr-4 overflow-hidden">
                 <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5 text-brand-primary" />
                 </div>
                 <div className="overflow-hidden">
                    <p className="text-[10px] text-brand-text/40 font-bold uppercase tracking-widest">Invite Link</p>
                    <p className="text-sm font-mono font-bold truncate opacity-80">
                       {(shortenedLink || shareLink).replace(/^https?:\/\//, '')}
                    </p>
                 </div>
              </div>
                 <div className="flex gap-2">
                    <button 
                      onClick={() => navigator.clipboard.writeText(shortenedLink || shareLink)}
                      className="p-3 bg-brand-card/5 border border-brand-border hover:bg-brand-primary/20 rounded-xl transition-all"
                    >
                       <Copy className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setIsQrModalOpen(true)}
                      className="p-3 bg-brand-card/5 border border-brand-border hover:bg-brand-primary/20 rounded-xl transition-all"
                    >
                       <Scan className="w-4 h-4" />
                    </button>
                 </div>
            </GlassCard>
          ) : (
            <GlassCard className="!p-4 flex items-center gap-4 border-brand-border bg-brand-card/2 opacity-70">
              <div className="w-10 h-10 rounded-xl bg-brand-text/5 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-brand-text/30" />
              </div>
              <div>
                <p className="text-[10px] text-brand-text/40 font-bold uppercase tracking-widest">Invite Link Locked</p>
                <p className="text-[10px] text-brand-text/30 font-medium mt-0.5">Contact support to enable referral sharing.</p>
              </div>
            </GlassCard>
          )}
      </section>

      {/* Reward Structure */}
      <section className="px-6 flex flex-col gap-4">
         <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/30">Reward Structure</h3>
            <span className="text-[10px] text-brand-primary font-bold underline cursor-pointer">Learn More</span>
         <div className="flex gap-2 mb-3">
           <button onClick={() => setActivePackageTab("p1")} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePackageTab === "p1" ? "bg-brand-primary text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60"}`}>Package 1</button>
           <button onClick={() => setActivePackageTab("p2")} className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activePackageTab === "p2" ? "bg-yellow-400 text-brand-black" : "bg-brand-card/20 border border-brand-border text-brand-text/60"}`}>Package 2</button>
         </div>
         </div>
         
         <div className="flex flex-col gap-2">
            {(activePackageTab === "p1" ? MLM_LEVELS : MLM_LEVELS_P2).map((lvl) => (
               <div key={lvl.level} className="glass-card !p-4 flex items-center justify-between !rounded-2xl bg-brand-card/5 border-brand-border">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-brand-card/10 flex items-center justify-center font-bold text-[10px] text-brand-text/40 border border-brand-border/20">
                       L{lvl.level}
                    </div>
                    <div>
                       <h4 className="text-xs font-bold">{lvl.label} Level</h4>
                       <p className="text-[9px] text-brand-text/20 uppercase tracking-widest">{activePackageTab === "p1" ? "From ₱360 • Package 1" : "From ₱3,600 • Package 2"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                     <p className="text-sm font-display font-bold text-brand-primary">{lvl.reward}</p>

                  </div>
               </div>
            ))}
            <div className="p-4 text-center">
               <p className="text-[10px] text-brand-text/20 font-bold uppercase tracking-widest italic">Rewards continue up to Level 10</p>
            </div>
         </div>
      </section>

      {/* Daily Claim */}
      <section className="px-6">
         <GlassCard className={`!p-0 border-none transition-all duration-500 ${isDailyClaimed ? 'bg-brand-primary/20' : 'bg-gradient-to-r from-brand-primary to-brand-navy shadow-[0_0_40px_rgba(250,204,21,0.3)]'}`}>
            <div className="p-6 flex items-center justify-between">
               <div className="flex flex-col gap-2">
                 <div className="flex items-center gap-2">
                    {isDailyClaimed ? <CheckCircle2 className="w-4 h-4 text-brand-primary" /> : <Zap className="w-4 h-4 text-brand-primary" />}
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{isDailyClaimed ? 'Bonus Claimed' : 'Daily Mission'}</span>
                 </div>
                 <h4 className="text-lg font-display font-bold">{isDailyClaimed ? 'Success!' : 'Daily Activity Bonus'}</h4>
                 <p className="text-xs text-brand-text/60">{isDailyClaimed ? 'Come back tomorrow for more rewards.' : 'Claim your ₱2.00 daily login and activity reward.'}</p>
                 {!isDailyClaimed && (
                    <button 
                      onClick={() => onClaimDaily?.()}
                      className="mt-2 px-6 py-2 bg-brand-primary text-brand-black text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-[0_0_15px_#FACC15] w-fit active:scale-95 transition-all"
                    >
                      Claim Now
                    </button>
                 )}
               </div>
               <div className="w-20 h-20 opacity-40">
                  <Gift className={`w-full h-full text-brand-text ${isDailyClaimed ? 'animate-bounce' : ''}`} />
               </div>
            </div>
         </GlassCard>
      </section>

      <QrInviteModal 
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        referralCode={referralCode}
      />
    </div>
  );
}
