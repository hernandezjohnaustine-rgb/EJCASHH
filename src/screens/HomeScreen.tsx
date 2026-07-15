import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp, Clock, CheckCircle2, PlusCircle, ArrowUpRight,
  History, QrCode, Zap, ShoppingBag, Car, Smartphone, Building2,
  FileText, Crown, ChevronRight, Copy, Share2, Users, Award
} from "lucide-react";
import GlassCard from "../components/GlassCard";
import TransactionDetailModal from "../components/TransactionDetailModal";
import QrInviteModal from "../components/QrInviteModal";
import AnimatedNumber from "../components/AnimatedNumber";
import { DirectsCertificateModal, DirectsMilestoneBanner, MILESTONES, MilestoneBanner } from "./DirectsCertificate";
import { shortenUrl } from "../lib/shortener";
import { UserStats, Transaction } from "../types";

interface HomeScreenProps {
  stats: UserStats;
  onActivate: () => void;
  balance: number;
  transactions: Transaction[];
  onServiceClick: (id: string) => void;
  onViewHistory: () => void;
  onClaimTrading?: () => void;
  referralCode: string;
  referralLinkEnabled: boolean;
  onClaimDirectsReward: () => void;
  directsRewardClaimed: boolean;
  showCertificate: boolean;
  onOpenCertificate: () => void;
  onCloseCertificate: () => void;
  userName: string;
  onOpenMilestone: (level: number) => void;
  claimedMilestones: Record<string, boolean>;
  achievedMilestones: Record<string, boolean>;
  userProfile?: any;
  onRequestActivation?: () => void;
}

const mainServices = [
  { id: "cashin", name: "Cash In", icon: PlusCircle, color: "#10B981" },
  { id: "send", name: "Send", icon: ArrowUpRight, color: "#3B82F6" },
  { id: "history", name: "History", icon: History, color: "#8B5CF6" },
  { id: "scan", name: "QR Pay", icon: QrCode, color: "#F59E0B" },
];

const moreServices = [
  { id: "load", name: "Buy Load", icon: Smartphone, color: "#10B981" },
  { id: "bills", name: "Pay Bills", icon: FileText, color: "#EF4444" },
  { id: "bank", name: "Bank Transfer", icon: Building2, color: "#3B82F6" },
  { id: "trading", name: "Trading Bot", icon: TrendingUp, color: "#F59E0B" },
  { id: "market", name: "Marketplace", icon: ShoppingBag, color: "#8B5CF6" },
  { id: "rider", name: "Rider", icon: Car, color: "#EC4899" },
];

export default function HomeScreen({
  stats,
  onActivate,
  balance,
  transactions,
  onServiceClick,
  onViewHistory,
  onClaimTrading,
  referralCode,
  referralLinkEnabled,
  onClaimDirectsReward,
  directsRewardClaimed,
  showCertificate,
  onOpenCertificate,
  onCloseCertificate,
  userName,
  onOpenMilestone,
  claimedMilestones,
  achievedMilestones,
  userProfile,
  onRequestActivation,
}: HomeScreenProps) {
  const [showClaimSuccess, setShowClaimSuccess] = useState(false);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [showQrInvite, setShowQrInvite] = useState(false);
  const [copied, setCopied] = useState(false);

  const inviteLink = `${window.location.origin}?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      const short = await shortenUrl(inviteLink);
      await navigator.clipboard.writeText(short || inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 pb-32 overflow-y-auto">

      {/* Balance Card */}
      <section className="px-6 pt-6">
        <GlassCard className="!p-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/5 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/40 mb-1">
              Main Balance
            </p>
            <div className="flex items-end gap-2 mb-4">
              <span className="text-4xl font-display font-black text-brand-text">
                ₱<AnimatedNumber value={balance} />
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] uppercase tracking-widest text-brand-text/30 font-black">
                  Total Earnings
                </p>
                <p className="text-sm font-black text-brand-primary">
                  ₱{stats.totalEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest text-brand-text/30 font-black">
                  Referrals
                </p>
                <p className="text-sm font-black text-brand-text">
                  {stats.directReferrals} Users
                </p>
              </div>
              <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${stats.isActivated ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${stats.isActivated ? 'bg-brand-primary animate-pulse' : 'bg-red-500'}`} />
                {stats.isActivated ? 'Verified' : 'Not Activated'}
              </div>
            </div>
          </div>
        </GlassCard>
      </section>

      {/* Main Services */}
      <section className="px-6">
        <div className="grid grid-cols-4 gap-3">
          {mainServices.map(service => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => onServiceClick(service.id)}
                className="flex flex-col items-center gap-2 active:scale-95 transition-all"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ background: `${service.color}15`, border: `1px solid ${service.color}30` }}
                >
                  <Icon className="w-6 h-6" style={{ color: service.color }} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-text/60">
                  {service.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* More Services */}
      <section className="px-6">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/30 mb-3">
          More Services
        </p>
        <div className="grid grid-cols-3 gap-3">
          {moreServices.map(service => {
            const Icon = service.icon;
            return (
              <button
                key={service.id}
                onClick={() => onServiceClick(service.id)}
                className="glass-card !p-3 flex flex-col items-center gap-2 active:scale-95 transition-all"
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{ background: `${service.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: service.color }} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-brand-text/60 text-center leading-tight">
                  {service.name}
                </span>
              </button>
            );
          })}
        </div>
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
                  <span className="text-brand-primary">{stats.tradingDaysCompleted} / 10 Days</span>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex justify-between px-1 items-center z-10 pointer-events-none">
                    {[...Array(11)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-0.5 h-1 rounded-full transition-colors duration-500 ${i <= stats.tradingDaysCompleted ? 'bg-brand-text/40' : 'bg-brand-text/10'}`}
                      />
                    ))}
                  </div>
                  <div className="h-3 bg-brand-border/40 rounded-full overflow-hidden border border-brand-border/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(stats.tradingDaysCompleted / 10) * 100}%` }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-brand-primary to-[#EAB308] rounded-full shadow-[0_0_15px_rgba(250,204,21,0.4)] relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    </motion.div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest px-1">
                  <div className="flex items-center gap-1 text-brand-text/30">
                    <Clock className="w-3 h-3" />
                    <span>Status: {stats.tradingActive ? 'Active Cycle' : 'Inactive'}</span>
                  </div>
                  <span className="text-brand-text/30">
                    Day {stats.tradingDaysCompleted} Distribution {stats.tradingDaysCompleted > 0 ? 'Processed' : 'Pending'}
                  </span>
                </div>
              </div>

              {stats.tradingActive && stats.tradingInvested > 0 && (
                <>
                  {(() => {
                    const now = new Date();
                    const startDate = (stats as any).tradingStartDate ? new Date((stats as any).tradingStartDate) : null;
                    const lastClaimISO = (stats as any).lastClaimISO ? new Date((stats as any).lastClaimISO) : null;
                    const referenceTime = lastClaimISO || startDate;
                    const hoursPassed = referenceTime ? (now.getTime() - referenceTime.getTime()) / (1000 * 60 * 60) : 0;
                    const canClaim = hoursPassed >= 24;
                    const hoursLeft = Math.ceil(24 - hoursPassed);

                    return canClaim ? (
                      <button
                        onClick={() => {
                          onClaimTrading?.();
                          setShowClaimSuccess(true);
                          setTimeout(() => setShowClaimSuccess(false), 3000);
                        }}
                        className="w-full py-3 bg-brand-primary text-brand-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-[0_5px_15px_rgba(250,204,21,0.2)] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4"
                      >
                        <TrendingUp className="w-4 h-4" />
                        Claim Daily Profit (₱{(stats.tradingInvested * 0.05).toLocaleString()})
                      </button>
                    ) : (
                      <div className="flex items-center justify-between bg-brand-card/20 border border-brand-border py-3 px-4 rounded-xl mt-4">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-brand-text/40" />
                          <span className="text-[10px] text-brand-text/40 font-black uppercase tracking-widest">Next Claim Available</span>
                        </div>
                        <span className="text-[10px] text-brand-primary font-black">in {hoursLeft}h</span>
                      </div>
                    );
                  })()}
                </>
              )}

              <AnimatePresence>
                {showClaimSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 10 }}
                    className="absolute inset-0 bg-brand-black/90 backdrop-blur-md flex flex-col items-center justify-center z-20 text-center px-6"
                  >
                    <motion.div
                      animate={{ scale: 1.2 }}
                      transition={{ repeat: 1, duration: 0.3 }}
                    >
                      <CheckCircle2 className="w-10 h-10 text-brand-primary mb-4" />
                    </motion.div>
                    <h4 className="text-xl font-display font-black text-brand-primary uppercase italic mb-1">Profit Claimed!</h4>
                    <p className="text-xs text-brand-text/60 font-bold uppercase tracking-widest">+₱{(stats.tradingInvested * 0.05).toLocaleString()} added to balance</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </GlassCard>
        </section>
      )}

      {/* Upgrade to Package 2 Banner */}
      {stats.isActivated && !userProfile?.hasPackage2 && (
        <section className="px-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl p-5 border-2 cursor-pointer active:scale-95 transition-all"
            style={{ background: '#F59E0B10', borderColor: '#F59E0B40' }}
            onClick={() => onRequestActivation?.()}
          >
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: '#F59E0B20' }}
              >
                <Crown className="w-6 h-6" style={{ color: '#F59E0B' }} />
              </div>
              <div className="flex-1">
                <span
                  className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full inline-block mb-1"
                  style={{ background: '#F59E0B20', color: '#F59E0B' }}
                >
                  UPGRADE AVAILABLE
                </span>
                <h3 className="text-sm font-black text-brand-text">
                  Activation Livelihood Program
                </h3>
                <p className="text-[10px] text-brand-text/40">
                  Upgrade to 10x earnings — ₱3,600
                </p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" style={{ color: '#F59E0B' }} />
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              {[
                { label: "L1 Bonus", value: "₱1,000" },
                { label: "Multiplier", value: "10x" },
                { label: "Price", value: "₱3,600" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl p-2 text-center"
                  style={{ background: '#F59E0B10' }}
                >
                  <p className="text-[9px] text-brand-text/40 uppercase tracking-widest">{item.label}</p>
                  <p className="text-xs font-black" style={{ color: '#F59E0B' }}>{item.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Activation Package Card */}
      <section className="px-6">
        <GlassCard className="!p-0 overflow-hidden relative border-brand-primary/20 bg-brand-navy/60 backdrop-blur-3xl shadow-[0_0_40px_rgba(16,185,129,0.1)]">
          <div className="absolute top-0 right-0 p-4">
            <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${stats.isActivated ? 'bg-brand-primary text-brand-black shadow-[0_0_10px_#FACC15]' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              <span className={`w-1 h-1 rounded-full ${stats.isActivated ? 'bg-brand-black' : 'bg-red-500 animate-pulse'}`} />
              {stats.isActivated ? 'Activated' : 'Not Activated'}
            </div>
          </div>

          <div className="p-6 pt-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-3xl bg-brand-primary/10 flex items-center justify-center border border-brand-primary/20">
                <Zap className="w-7 h-7 text-brand-primary" />
              </div>
              <div>
                <p className="text-[9px] text-brand-text/30 uppercase tracking-widest font-black">Current Status</p>
                <h3 className="text-lg font-display font-black tracking-tight text-brand-text">
                  EJCASHH {userProfile?.hasPackage2 ? 'Livelihood Program' : 'Starter Activation'}
                </h3>
              </div>
            </div>

            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-card/20 border border-brand-border">
                <span className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black">Registration Fee</span>
                <span className="text-lg font-display font-black text-brand-primary italic">
                  ₱{userProfile?.hasPackage2 ? '3,600.00' : '360.00'}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-brand-card/20 border border-brand-border">
                <span className="text-[10px] text-brand-text/40 uppercase tracking-widest font-black">Included Product</span>
                <span className="text-sm font-black text-brand-text">Premium Beauty Soap</span>
              </div>
            </div>

            {stats.isActivated ? (
              <div className="space-y-2">
                <p className="text-[9px] text-brand-text/30 uppercase tracking-widest font-black mb-3">Exclusive Benefits</p>
                {[
                  "Earn Direct Referral Bonus",
                  "Unlock 10-Level Rewards",
                  "Access Cashback & Rewards",
                  "Withdraw Earnings",
                  "Join VIP Ranking System",
                ].map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-brand-primary shrink-0" />
                    <span className="text-xs text-brand-text/70">{benefit}</span>
                  </div>
                ))}

                <div className="mt-4 pt-4 border-t border-brand-border/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] text-brand-primary uppercase tracking-widest font-black">Account Status</span>
                    <span className="text-[9px] text-brand-primary uppercase tracking-widest font-black">100% Verified</span>
                  </div>
                  <div className="h-2 bg-brand-border/20 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                      className="h-full bg-brand-primary rounded-full"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={onActivate}
                className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all"
              >
                Activate Now — ₱360
              </button>
            )}
          </div>
        </GlassCard>
      </section>

      {/* Directs Milestone Banner */}
      {stats.directReferrals >= 10 && (
        <section className="px-6">
          <DirectsMilestoneBanner
            onTapClaim={onOpenCertificate}
            dismissed={directsRewardClaimed}
          />
        </section>
      )}

      {/* Milestone Banners L2-L10 */}
      {MILESTONES.slice(1).map(m => {
        const achievedKey = `milestoneAchieved_L${m.level}`;
        const claimedKey = `milestoneRewardClaimed_L${m.level}`;
        if (!achievedMilestones[achievedKey]) return null;
        return (
          <section key={m.level} className="px-6">
            <MilestoneBanner
              milestone={m}
              onTap={() => onOpenMilestone(m.level)}
              alreadyClaimed={claimedMilestones[claimedKey] || false}
            />
          </section>
        );
      })}

      {/* Invite Link Section */}
      {stats.isActivated && (
        <section className="px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/30 mb-3">
            Invite Link
          </p>
          <GlassCard className="!p-4">
            {referralLinkEnabled ? (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                    <Share2 className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-brand-text/40 uppercase tracking-widest">Invite Link</p>
                    <p className="text-xs font-bold text-brand-text truncate">{inviteLink}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex-1 py-2.5 rounded-xl bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                  <button
                    onClick={() => setShowQrInvite(true)}
                    className="flex-1 py-2.5 rounded-xl bg-brand-card/20 border border-brand-border text-brand-text/60 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    QR Code
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
                  <span className="text-lg">🔒</span>
                </div>
                <div>
                  <p className="text-xs font-black text-brand-text">Referral Link Locked</p>
                  <p className="text-[10px] text-brand-text/40">Contact admin to unlock your invite link</p>
                </div>
              </div>
            )}
          </GlassCard>
        </section>
      )}

      {/* Network Stats */}
      {stats.isActivated && (
        <section className="px-6">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/30 mb-3">
            Network Overview
          </p>
          <div className="grid grid-cols-2 gap-3">
            <GlassCard className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-brand-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-text/40">Directs</span>
              </div>
              <p className="text-2xl font-display font-black text-brand-text">{stats.directReferrals}</p>
              <p className="text-[10px] text-brand-primary font-black">{stats.directReferrals} Activated</p>
            </GlassCard>
            <GlassCard className="!p-4">
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-4 h-4 text-brand-primary" />
                <span className="text-[9px] font-black uppercase tracking-widest text-brand-text/40">Team Size</span>
              </div>
              <p className="text-2xl font-display font-black text-brand-text">{stats.teamSize}</p>
              <p className="text-[10px] text-brand-text/40 font-black">L1 - L10 depth</p>
            </GlassCard>
          </div>
        </section>
      )}

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <section className="px-6">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/30">
              Recent Activity
            </p>
            <button
              onClick={onViewHistory}
              className="text-[10px] font-black text-brand-primary uppercase tracking-widest"
            >
              View All
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {transactions.slice(0, 5).map(tx => (
              <GlassCard
                key={tx.id}
                className="!p-4 cursor-pointer active:scale-[0.99] transition-all"
                onClick={() => setSelectedTx(tx)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.type === 'in' ? 'bg-brand-primary/10' : 'bg-red-500/10'}`}>
                      <TrendingUp className={`w-5 h-5 ${tx.type === 'in' ? 'text-brand-primary' : 'text-red-500'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-text">{tx.title}</p>
                      <p className="text-[10px] text-brand-text/40">
                        {tx.timestamp?.toDate?.()?.toLocaleDateString() || 'Recent'} • {tx.category}
                      </p>
                    </div>
                  </div>
                  <p className={`font-black ${tx.type === 'in' ? 'text-brand-primary' : 'text-red-500'}`}>
                    {tx.type === 'in' ? '+' : '-'}₱{tx.amount?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      )}

      {/* Modals */}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}

      {showQrInvite && (
        <QrInviteModal
          referralCode={referralCode}
          inviteLink={inviteLink}
          onClose={() => setShowQrInvite(false)}
        />
      )}

      <DirectsCertificateModal
        visible={showCertificate}
        onClaim={onClaimDirectsReward}
        onClose={onCloseCertificate}
        userName={userName}
      />
    </div>
  );
}
