import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { CheckCircle2, X, Star, Award } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────
interface DirectsCertificateProps {
  visible: boolean;
  onClaim: () => void;
  onClose: () => void;
  userName?: string;
}

// ─── Confetti Particle ────────────────────────────────────────────────────────
function Particle({ delay, color }: { delay: number; color: string }) {
  const startX = Math.random() * 100;
  const drift = (Math.random() - 0.5) * 60;
  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${startX}%`,
        top: "-10px",
        width: 8,
        height: 8,
        borderRadius: Math.random() > 0.5 ? "50%" : 2,
        background: color,
        pointerEvents: "none",
      }}
      animate={{
        y: ["0vh", "110vh"],
        x: [0, drift],
        rotate: [0, 360 * (Math.random() > 0.5 ? 1 : -1)],
        opacity: [1, 1, 0],
      }}
      transition={{
        duration: 2.5 + Math.random() * 1.5,
        delay,
        ease: "easeIn",
      }}
    />
  );
}

const CONFETTI_COLORS = ["#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8B5CF6", "#EF4444"];

// ─── Certificate Modal ────────────────────────────────────────────────────────
export function DirectsCertificateModal({ visible, onClaim, onClose, userName = "Member" }: DirectsCertificateProps) {
  const [claimed, setClaimed] = useState(false);
  const [particles] = useState(() =>
    Array.from({ length: 30 }, (_, i) => ({
      id: i,
      delay: Math.random() * 1.5,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    }))
  );

  useEffect(() => {
    if (!visible) setClaimed(false);
  }, [visible]);

  const handleClaim = () => {
    setClaimed(true);
    setTimeout(() => {
      onClaim();
      onClose();
    }, 1800);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.75)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
            overflow: "hidden",
          }}
        >
          {/* Confetti */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            {particles.map((p) => (
              <Particle key={p.id} delay={p.delay} color={p.color} />
            ))}
          </div>

          {/* Certificate Card */}
          <motion.div
            initial={{ scale: 0.6, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 18, stiffness: 220 }}
            style={{
              background: "#fff",
              borderRadius: 24,
              width: "100%",
              maxWidth: 360,
              overflow: "hidden",
              position: "relative",
              boxShadow: "0 32px 80px rgba(0,0,0,0.4)",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(0,0,0,0.08)",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              <X size={16} color="#555" />
            </button>

            {/* Gold header band */}
            <div
              style={{
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)",
                padding: "28px 24px 20px",
                textAlign: "center",
                position: "relative",
              }}
            >
              {/* Decorative stars */}
              <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 12 }}>
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300 }}
                  >
                    <Star size={14} fill="#FEF3C7" color="#FEF3C7" />
                  </motion.div>
                ))}
              </div>

              {/* Shield icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 250 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 12px",
                  border: "2px solid rgba(255,255,255,0.4)",
                }}
              >
                <Award size={32} color="#FEF3C7" />
              </motion.div>

              <p style={{ color: "#FEF3C7", fontSize: 11, letterSpacing: 3, margin: "0 0 4px", textTransform: "uppercase", fontWeight: 600 }}>
                Certificate of Achievement
              </p>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: 0 }}>
                10 Directs Complete!
              </h2>
            </div>

            {/* Certificate body */}
            <div
              style={{
                padding: "24px",
                textAlign: "center",
                background: "#FFFBEB",
                borderBottom: "1px solid #FDE68A",
                position: "relative",
              }}
            >
              {/* Decorative corner accents */}
              <div style={{ position: "absolute", top: 8, left: 8, width: 20, height: 20, borderTop: "2px solid #D97706", borderLeft: "2px solid #D97706" }} />
              <div style={{ position: "absolute", top: 8, right: 8, width: 20, height: 20, borderTop: "2px solid #D97706", borderRight: "2px solid #D97706" }} />
              <div style={{ position: "absolute", bottom: 8, left: 8, width: 20, height: 20, borderBottom: "2px solid #D97706", borderLeft: "2px solid #D97706" }} />
              <div style={{ position: "absolute", bottom: 8, right: 8, width: 20, height: 20, borderBottom: "2px solid #D97706", borderRight: "2px solid #D97706" }} />

              <p style={{ color: "#92400E", fontSize: 13, margin: "0 0 8px" }}>This certifies that</p>
              <p style={{ color: "#1C1C1E", fontSize: 18, fontWeight: 700, margin: "0 0 8px" }}>{userName}</p>
              <p style={{ color: "#78350F", fontSize: 13, margin: "0 0 16px", lineHeight: 1.5 }}>
                has successfully completed{" "}
                <span style={{ fontWeight: 700, color: "#B45309" }}>10 Direct Referrals</span>
                {" "}and has earned a reward of
              </p>

              {/* Reward amount */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                style={{
                  background: "linear-gradient(135deg, #F59E0B, #D97706)",
                  borderRadius: 16,
                  padding: "14px 24px",
                  display: "inline-block",
                  margin: "0 0 12px",
                }}
              >
                <p style={{ color: "#fff", fontSize: 11, margin: "0 0 2px", letterSpacing: 2, textTransform: "uppercase", fontWeight: 600 }}>
                  Reward
                </p>
                <p style={{ color: "#fff", fontSize: 36, fontWeight: 800, margin: 0, lineHeight: 1 }}>
                  ₱300
                </p>
              </motion.div>

              <p style={{ color: "#A16207", fontSize: 11, margin: 0 }}>
                Credited to your Earnings Wallet
              </p>
            </div>

            {/* CTA */}
            <div style={{ padding: "20px 24px", background: "#fff" }}>
              {!claimed ? (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  onClick={handleClaim}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: 14,
                    border: "none",
                    background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                    color: "#fff",
                    fontSize: 16,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <span>Claim ₱300</span>
                  <motion.span
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                  >
                    →
                  </motion.span>
                </motion.button>
              ) : (
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "16px",
                    background: "#ECFDF5",
                    borderRadius: 14,
                    color: "#065F46",
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  <CheckCircle2 size={20} color="#10B981" />
                  ₱300 Added to Earnings!
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Banner Notification (shown in HomeScreen network progress section) ────────
interface DirectsBannerProps {
  onTapClaim: () => void;
  dismissed: boolean;
}

export function DirectsMilestoneBanner({ onTapClaim, dismissed }: DirectsBannerProps) {
  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.button
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          onClick={onTapClaim}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 16,
            background: "linear-gradient(135deg, #F59E0B 0%, #D97706 50%, #B45309 100%)",
            padding: "14px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 12,
            boxShadow: "0 4px 20px rgba(217,119,6,0.35)",
          }}
        >
          {/* Pulsing icon */}
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Award size={22} color="#FEF3C7" />
          </motion.div>

          {/* Text */}
          <div style={{ flex: 1, textAlign: "left" }}>
            <p style={{ color: "#FEF3C7", fontSize: 11, margin: "0 0 2px", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
              🎉 Milestone Reached!
            </p>
            <p style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.3 }}>
              Congrats! You completed 10 directs!
            </p>
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, margin: "2px 0 0" }}>
              You earned ₱300 — tap to claim
            </p>
          </div>

          {/* Arrow */}
          <motion.div
            animate={{ x: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.2 }}
            style={{ color: "#FEF3C7", fontSize: 18, flexShrink: 0 }}
          >
            →
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
