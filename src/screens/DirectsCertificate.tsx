import { motion, AnimatePresence } from "motion/react";
import { Trophy, Star, Award, CheckCircle2, Gift } from "lucide-react";

// ── Milestone Config ──────────────────────────────────────────────
export const MILESTONES = [
  { level: 1, label: "Pioneer", directs: 10, teamSize: 10, reward: 30, color: "#10B981", claimableAt: 3 },
  { level: 2, label: "Builder", directs: 0, teamSize: 100, reward: 300, color: "#3B82F6", claimableAt: 3 },
  { level: 3, label: "Leader", directs: 0, teamSize: 1000, reward: 3000, color: "#8B5CF6", claimableAt: 3 },
  { level: 4, label: "Manager", directs: 0, teamSize: 10000, reward: 30000, color: "#F59E0B", claimableAt: 4 },
  { level: 5, label: "Director", directs: 0, teamSize: 100000, reward: 300000, color: "#EF4444", claimableAt: 5 },
  { level: 6, label: "Executive", directs: 0, teamSize: 1000000, reward: 3000000, color: "#EC4899", claimableAt: 6 },
  { level: 7, label: "Vice President", directs: 0, teamSize: 10000000, reward: 30000000, color: "#14B8A6", claimableAt: 7 },
  { level: 8, label: "President", directs: 0, teamSize: 100000000, reward: 300000000, color: "#F97316", claimableAt: 8 },
  { level: 9, label: "Ambassador", directs: 0, teamSize: 1000000000, reward: 3000000000, color: "#6366F1", claimableAt: 9 },
  { level: 10, label: "Crown Diamond", directs: 0, teamSize: 10000000000, reward: 30000000000, color: "#FACC15", claimableAt: 10 },
];

function formatReward(amount: number) {
  if (amount >= 1_000_000_000) return `₱${(amount / 1_000_000_000).toFixed(0)}B`;
  if (amount >= 1_000_000) return `₱${(amount / 1_000_000).toFixed(0)}M`;
  if (amount >= 1_000) return `₱${(amount / 1_000).toFixed(0)}K`;
  return `₱${amount.toLocaleString()}`;
}

function formatTeamSize(size: number) {
  if (size >= 1_000_000_000) return `${(size / 1_000_000_000).toFixed(0)}B`;
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(0)}M`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(0)}K`;
  return size.toLocaleString();
}

// ── Certificate Modal ─────────────────────────────────────────────
export function MilestoneCertificateModal({
  visible,
  milestone,
  onClaim,
  onClose,
  userName,
  canClaim,
  alreadyClaimed,
}: {
  visible: boolean;
  milestone: typeof MILESTONES[0] | null;
  onClaim: () => void;
  onClose: () => void;
  userName: string;
  canClaim: boolean;
  alreadyClaimed: boolean;
}) {
  if (!milestone) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] bg-brand-black/95 backdrop-blur-xl flex items-center justify-center p-6"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 40 }}
            transition={{ type: "spring", damping: 20 }}
            className="w-full max-w-sm relative"
          >
            {/* Certificate Card */}
            <div
              className="rounded-3xl p-8 text-center relative overflow-hidden border-2"
              style={{ borderColor: milestone.color, background: `linear-gradient(135deg, ${milestone.color}15, #05070A)` }}
            >
              {/* Glow */}
              <div
                className="absolute inset-0 blur-[80px] opacity-20 pointer-events-none"
                style={{ background: milestone.color }}
              />

              {/* Icon */}
              <div
                className="w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center relative z-10 border-2"
                style={{ background: `${milestone.color}20`, borderColor: `${milestone.color}50` }}
              >
                <Trophy className="w-10 h-10" style={{ color: milestone.color }} />
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 relative z-10" style={{ color: milestone.color }}>
                Certificate of Achievement
              </p>
              <h2 className="text-2xl font-display font-black tracking-tight mb-1 text-brand-text relative z-10">
                Level {milestone.level} — {milestone.label}
              </h2>
              <p className="text-sm text-brand-text/40 mb-6 relative z-10">
                Awarded to <span className="font-black text-brand-text">{userName}</span>
              </p>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mb-6 relative z-10">
                <div className="rounded-2xl p-3" style={{ background: `${milestone.color}10`, border: `1px solid ${milestone.color}30` }}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: milestone.color }}>Team Size</p>
                  <p className="text-lg font-black text-brand-text">{formatTeamSize(milestone.teamSize)}</p>
                </div>
                <div className="rounded-2xl p-3" style={{ background: `${milestone.color}10`, border: `1px solid ${milestone.color}30` }}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1" style={{ color: milestone.color }}>Reward</p>
                  <p className="text-lg font-black" style={{ color: milestone.color }}>{formatReward(milestone.reward)}</p>
                </div>
              </div>

              {/* Stars */}
              <div className="flex justify-center gap-1 mb-6 relative z-10">
                {[...Array(Math.min(milestone.level, 5))].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" style={{ color: milestone.color }} />
                ))}
              </div>

              {/* Claim / Status */}
              <div className="relative z-10">
                {alreadyClaimed ? (
                  <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Reward Claimed</span>
                  </div>
                ) : canClaim ? (
                  <button
                    onClick={onClaim}
                    className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm text-brand-black active:scale-95 transition-all"
                    style={{ background: milestone.color }}
                  >
                    <Gift className="w-4 h-4 inline mr-2" />
                    Claim {formatReward(milestone.reward)}
                  </button>
                ) : (
                  <div className="py-3 px-4 rounded-2xl bg-brand-card/20 border border-brand-border">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/40">
                      🔒 Complete Level 3 to unlock cash rewards
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={onClose}
                className="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-text/30 relative z-10"
              >
                Close
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Milestone Banner (shown on HomeScreen) ────────────────────────
export function MilestoneBanner({
  milestone,
  onTap,
  alreadyClaimed,
}: {
  milestone: typeof MILESTONES[0];
  onTap: () => void;
  alreadyClaimed: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onTap}
      className="rounded-2xl p-4 flex items-center gap-4 cursor-pointer active:scale-95 transition-all border"
      style={{ background: `${milestone.color}10`, borderColor: `${milestone.color}30` }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: `${milestone.color}20` }}
      >
        <Award className="w-6 h-6" style={{ color: milestone.color }} />
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: milestone.color }}>
          {alreadyClaimed ? "Achievement Unlocked" : "🎉 New Milestone!"}
        </p>
        <p className="text-sm font-black text-brand-text">Level {milestone.level} — {milestone.label}</p>
        <p className="text-[10px] text-brand-text/40">{alreadyClaimed ? "View Certificate" : `Claim ${formatReward(milestone.reward)}`}</p>
      </div>
      <Trophy className="w-5 h-5" style={{ color: milestone.color }} />
    </motion.div>
  );
}

// ── Keep old exports for backward compatibility ───────────────────
export function DirectsMilestoneBanner({ onTapClaim, dismissed }: { onTapClaim: () => void; dismissed: boolean }) {
  const milestone = MILESTONES[0];
  return <MilestoneBanner milestone={milestone} onTap={onTapClaim} alreadyClaimed={dismissed} />;
}

export function DirectsCertificateModal({
  visible, onClaim, onClose, userName
}: {
  visible: boolean;
  onClaim: () => void;
  onClose: () => void;
  userName: string;
}) {
  return (
    <MilestoneCertificateModal
      visible={visible}
      milestone={MILESTONES[0]}
      onClaim={onClaim}
      onClose={onClose}
      userName={userName}
      canClaim={true}
      alreadyClaimed={false}
    />
  );
}

