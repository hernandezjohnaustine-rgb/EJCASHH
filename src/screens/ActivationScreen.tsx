import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap, Crown, Package, CheckCircle, ArrowRight, Gift } from "lucide-react";
import GlassCard from "../components/GlassCard";

const PACKAGES = [
  {
    id: "package_1",
    name: "EJCASHH Subscription",
    price: 360,
    multiplier: 1,
    color: "#10B981",
    icon: Zap,
    badge: "STARTER",
    description: "Begin your EJCASHH journey",
    benefits: [
      "Earn ₱100 Direct Referral Bonus",
      "Unlock 10-Level Rewards",
      "Access Cashback & Rewards",
      "Withdraw Earnings",
      "Join VIP Ranking System",
    ],
    commissions: [
      { level: "1", amount: "₱100 fixed" },
      { level: "2", amount: "₱3 fixed" },
      { level: "3", amount: "₱3 fixed" },
      { level: "4", amount: "₱3 fixed" },
      { level: "5-10", amount: "₱3 fixed each" },
    ],
  },
  {
    id: "package_2",
    name: "Activation Livelihood Program",
    price: 3600,
    multiplier: 10,
    color: "#F59E0B",
    icon: Crown,
    badge: "10X EARNINGS",
    description: "Multiply your earnings by 10x",
    benefits: [
      "Earn ₱1,000 Direct Referral Bonus (10x)",
      "10x on ALL Level Commissions",
      "Unlock 10-Level Rewards",
      "Priority Withdrawal",
      "Elite VIP Status",
    ],
    commissions: [
      { level: "1", amount: "₱1,000 fixed (10x)" },
      { level: "2", amount: "₱30 fixed (10x)" },
      { level: "3", amount: "₱30 fixed (10x)" },
      { level: "4", amount: "₱30 fixed (10x)" },
      { level: "5-10", amount: "₱30 fixed (10x) each" },
    ],
  },
  {
    id: "combined",
    name: "Complete Activation Bundle",
    price: 3960,
    multiplier: 10,
    color: "#8B5CF6",
    icon: Package,
    badge: "BEST VALUE",
    description: "Package 1 + Package 2 combined",
    benefits: [
      "Everything in Package 1",
      "Everything in Package 2",
      "10x Earnings Multiplier",
      "Full Bundle Savings",
      "Instant Elite Status",
    ],
    commissions: [
      { level: "1", amount: "₱1,100 fixed (10x)" },
      { level: "2", amount: "₱33 fixed (10x)" },
      { level: "3", amount: "₱33 fixed (10x)" },
      { level: "4", amount: "₱33 fixed (10x)" },
      { level: "5-10", amount: "₱33 fixed (10x) each" },
    ],
  },
];

interface ActivationScreenProps {
  balance: number;
  onActivate: (packageId: string, amount: number) => void;
  onBack: () => void;
  uid?: string;
  isActivated?: boolean;
  currentPackage?: string;
}

export default function ActivationScreen({
  balance,
  onActivate,
  onBack,
  uid,
  isActivated,
  currentPackage,
}: ActivationScreenProps) {
  const [selectedPackage, setSelectedPackage] = useState<string>(isActivated && !currentPackage?.includes("package_2") && currentPackage !== "combined" ? "package_2" : "package_1");
  const [showConfirm, setShowConfirm] = useState(false);
  const [expandedPackage, setExpandedPackage] = useState<string | null>(null);

  // Filter out already purchased packages
  const availablePackages = PACKAGES.filter(p => {
    if (currentPackage === "combined") return false;
    if ((currentPackage === "package_1" || currentPackage === "combined") && p.id === "package_1") return false;
    if ((currentPackage === "package_2" || currentPackage === "combined") && p.id === "package_2") return false;
    if (isActivated && !currentPackage && p.id === "package_1") return false; // Old accounts
    return true;
  });
  const selected = PACKAGES.find(p => p.id === selectedPackage)!;
  const hasEnoughBalance = balance >= selected.price;

  const handleConfirm = () => {
    onActivate(selectedPackage, selected.price);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col overflow-y-auto pb-40">
      {/* Header */}
      <div className="px-6 pt-8 pb-6">
        <button
          onClick={onBack}
          className="text-brand-text/40 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-display font-black tracking-tight text-brand-text mb-1">
          Choose Your Package
        </h1>
        <p className="text-sm text-brand-text/40">
          Select the activation package that fits your goals
        </p>
      </div>

      {/* Balance */}
      <div className="px-6 mb-6">
        <GlassCard className="!p-4 flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-widest text-brand-text/40">
            Available Balance
          </span>
          <span className={`text-lg font-black ${balance > 0 ? 'text-brand-primary' : 'text-red-500'}`}>
            ₱{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </GlassCard>
      </div>

      {/* Package Cards */}
      <div className="px-6 flex flex-col gap-4 mb-8">
        {availablePackages.map(pkg => {
          const Icon = pkg.icon;
          const isSelected = selectedPackage === pkg.id;
          const isExpanded = expandedPackage === pkg.id;
          const canAfford = balance >= pkg.price;

          return (
            <motion.div
              key={pkg.id}
              animate={{ scale: isSelected ? 1.01 : 1 }}
              className="rounded-3xl border-2 overflow-hidden transition-all cursor-pointer"
              style={{
                borderColor: isSelected ? pkg.color : 'var(--card-border)',
                background: isSelected ? `${pkg.color}10` : 'var(--card-bg)',
              }}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              <div className="p-5">
                {/* Package Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{ background: `${pkg.color}20` }}
                    >
                      <Icon className="w-6 h-6" style={{ color: pkg.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full"
                          style={{ background: `${pkg.color}20`, color: pkg.color }}
                        >
                          {pkg.badge}
                        </span>
                      </div>
                      <h3 className="text-sm font-black text-brand-text leading-tight">
                        {pkg.name}
                      </h3>
                      <p className="text-[10px] text-brand-text/40">{pkg.description}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-2">
                    <p className="text-xl font-display font-black" style={{ color: pkg.color }}>
                      ₱{pkg.price.toLocaleString()}
                    </p>
                    {pkg.multiplier > 1 && (
                      <span className="text-[9px] font-black text-brand-text/40">
                        {pkg.multiplier}x multiplier
                      </span>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <div className="flex flex-col gap-2 mb-4">
                  {pkg.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle
                        className="w-3.5 h-3.5 shrink-0"
                        style={{ color: pkg.color }}
                      />
                      <span className="text-[11px] text-brand-text/70">{b}</span>
                    </div>
                  ))}
                </div>

                {/* Commission Toggle */}
                <button
                  onClick={e => {
                    e.stopPropagation();
                    setExpandedPackage(isExpanded ? null : pkg.id);
                  }}
                  className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1"
                  style={{ color: pkg.color }}
                >
                  {isExpanded ? "Hide" : "View"} Commission Structure
                  <ArrowRight
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  />
                </button>

                {/* Commission Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div
                        className="mt-3 rounded-2xl p-3"
                        style={{ background: `${pkg.color}10` }}
                      >
                        <p
                          className="text-[9px] font-black uppercase tracking-widest mb-2"
                          style={{ color: pkg.color }}
                        >
                          Commission Per Level
                        </p>
                        {pkg.commissions.map((c, i) => (
                          <div
                            key={i}
                            className="flex justify-between py-1 border-b border-brand-border/20 last:border-0"
                          >
                            <span className="text-[10px] text-brand-text/40">
                              Level {c.level}
                            </span>
                            <span
                              className="text-[10px] font-black"
                              style={{ color: pkg.color }}
                            >
                              {c.amount}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Cannot afford warning */}
                {!canAfford && (
                  <p className="text-[10px] text-red-500 font-black mt-3">
                    ⚠️ Need ₱{(pkg.price - balance).toLocaleString()} more
                  </p>
                )}

                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="mt-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"
                    style={{ color: pkg.color }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Selected
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-brand-black/90 backdrop-blur-xl border-t border-brand-border/10">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] text-brand-text/40 uppercase tracking-widest">
              Selected Package
            </p>
            <p className="text-sm font-black text-brand-text">{selected.name}</p>
          </div>
          <p className="text-2xl font-display font-black" style={{ color: selected.color }}>
            ₱{selected.price.toLocaleString()}
          </p>
        </div>
        {!hasEnoughBalance && (
          <p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-2 text-center">
            ⚠️ Insufficient balance — Please cash in first
          </p>
        )}
        <button
          onClick={() => hasEnoughBalance && setShowConfirm(true)}
          disabled={!hasEnoughBalance}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-white active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          style={{ background: hasEnoughBalance ? selected.color : '#666' }}
        >
          <Gift className="w-4 h-4" />
          Activate — ₱{selected.price.toLocaleString()}
        </button>
      </div>

      {/* Confirm Modal */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-brand-black/90 backdrop-blur-md flex items-end"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full bg-brand-navy rounded-t-3xl p-6"
            >
              <h3 className="text-lg font-black text-brand-text mb-2">
                Confirm Activation
              </h3>
              <p className="text-sm text-brand-text/40 mb-6">
                You are about to activate{" "}
                <span className="font-black text-brand-text">{selected.name}</span> for{" "}
                <span className="font-black" style={{ color: selected.color }}>
                  ₱{selected.price.toLocaleString()}
                </span>
                . This will be deducted from your wallet balance.
              </p>

              <GlassCard className="!p-4 mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-brand-text/60">Package</span>
                  <span className="font-black text-brand-text text-sm">{selected.name}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-brand-text/60">Amount</span>
                  <span className="font-black text-sm" style={{ color: selected.color }}>
                    ₱{selected.price.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-brand-text/60">Earnings Multiplier</span>
                  <span className="font-black text-sm" style={{ color: selected.color }}>
                    {selected.multiplier}x
                  </span>
                </div>
                <div className="border-t border-brand-border my-3" />
                <div className="flex justify-between">
                  <span className="text-sm text-brand-text/60">Remaining Balance</span>
                  <span className="font-black text-brand-primary">
                    ₱{(balance - selected.price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </GlassCard>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowConfirm(false)}
                  className="flex-1 py-4 rounded-2xl border border-brand-border text-brand-text font-black uppercase tracking-widest text-xs"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs text-white"
                  style={{ background: selected.color }}
                >
                  Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

