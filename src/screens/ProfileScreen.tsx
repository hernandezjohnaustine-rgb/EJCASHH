import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import {
  User, Shield, CreditCard, Bell, HelpCircle, LogOut,
  ChevronRight, Moon, Settings, Camera, Smartphone, TrendingUp, X, Check
} from "lucide-react";

interface ProfileScreenProps {
  onLogout: () => void;
  theme: string;
  onToggleTheme: () => void;
  user: any | null;
  onNavigate?: (view: string) => void;
}

// Avatar styles from DiceBear
const AVATAR_STYLES = [
  { id: "avataaars", label: "Cartoon" },
  { id: "micah", label: "Illustrated" },
  { id: "adventurer", label: "Adventure" },
  { id: "adventurer-neutral", label: "Neutral" },
  { id: "big-smile", label: "Big Smile" },
  { id: "bottts", label: "Robot" },
  { id: "croodles", label: "Doodle" },
  { id: "fun-emoji", label: "Emoji" },
  { id: "icons", label: "Icon" },
  { id: "lorelei", label: "Elegant" },
  { id: "notionists", label: "Notion" },
  { id: "open-peeps", label: "Peeps" },
];

function getAvatarUrl(style: string, seed: string) {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
}

export default function ProfileScreen({ onLogout, theme, onToggleTheme, user, onNavigate }: ProfileScreenProps) {
  const isDark = theme === "dark";
  const seed = user?.username || user?.displayName || "Member";

  const [avatarStyle, setAvatarStyle] = useState("avataaars");
  const [pendingStyle, setPendingStyle] = useState(avatarStyle);
  const [showPicker, setShowPicker] = useState(false);

  const menuItems = [
    { icon: TrendingUp, label: "Earnings Wallet", sub: "Withdraw commissions" },
    { icon: User, label: "Personal Information", sub: `Update details ${user?.phoneNumber ? `(+63 ${user.phoneNumber})` : ""}` },
    { icon: Shield, label: "Security & Privacy", sub: "Face ID, PIN, Biometrics" },
    { icon: CreditCard, label: "Payment Methods", sub: "Stored cards & banks" },
    { icon: Bell, label: "Notifications", sub: "Alerts & Transaction SMS" },
    { icon: Smartphone, label: "Linked Devices", sub: "iPhone 15 Pro, 2 sessions" },
    { icon: HelpCircle, label: "Help Center", sub: "FAQs & Live Chat" },
  ];

  function openPicker() {
    setPendingStyle(avatarStyle);
    setShowPicker(true);
  }

  function confirmPick() {
    setAvatarStyle(pendingStyle);
    setShowPicker(false);
  }

  return (
    <>
      <div className="flex flex-col h-full bg-brand-black text-brand-text overflow-y-auto pb-32">
        {/* Header */}
        <header className="p-8 pb-12 flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent rounded-full blur-[120px]" />
          </div>

          {/* Avatar with camera button */}
          <div className="relative group">
            <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-brand-primary to-brand-accent p-1 animate-gradient-slow shadow-2xl">
              <div className="w-full h-full rounded-[38px] bg-brand-card flex items-center justify-center overflow-hidden border border-brand-border">
                <img
                  src={getAvatarUrl(avatarStyle, seed)}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            <button
              onClick={openPicker}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-primary rounded-2xl flex items-center justify-center border-4 border-brand-black shadow-lg hover:scale-110 active:scale-95 transition-all text-brand-black"
            >
              <Camera className="w-5 h-5" />
            </button>
          </div>

          <div className="text-center relative z-10">
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="text-xl font-display font-bold tracking-tight">{user?.displayName || "Member"}</h2>
              {user?.username && (
                <span className="text-[10px] bg-brand-primary text-brand-black px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">
                  @{user.username}
                </span>
              )}
            </div>
            <p className="text-sm text-brand-text/40 mb-3 tracking-wide">{user?.email}</p>
            <div className="flex items-center gap-2 bg-brand-primary/10 py-1.5 px-4 rounded-full border border-brand-primary/20">
              <Shield className="w-3 h-3 text-brand-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Elite Member</span>
            </div>
          </div>
        </header>

        {/* Menu */}
        <section className="px-6 flex flex-col gap-6">
          <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-text/30">Account Settings</h3>
            <Settings className="w-4 h-4 text-brand-text/20" />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {menuItems.map((item, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card !p-5 flex items-center justify-between group hover:bg-white/10 transition-all border-none"
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-brand-card/5 flex items-center justify-center group-hover:bg-brand-primary/20 transition-colors">
                    <item.icon className="w-5 h-5 text-brand-text/60 group-hover:text-brand-primary transition-colors" />
                  </div>
                  <div className="text-left">
                    <h4 className="text-sm font-bold tracking-tight">{item.label}</h4>
                    <p className="text-[10px] text-brand-text/40 tracking-wider font-medium">{item.sub}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-brand-text/20 group-hover:text-brand-text transition-colors" />
              </motion.button>
            ))}
          </div>

          {/* Dark mode toggle */}
          <div
            onClick={onToggleTheme}
            className="flex items-center justify-between glass-card !p-5 mb-4 group cursor-pointer hover:bg-brand-card/10 transition-all border-none"
          >
            <div className="flex items-center gap-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDark ? "bg-brand-primary/10" : "bg-brand-card/20"}`}>
                <Moon className={`w-5 h-5 ${isDark ? "text-brand-primary" : "text-brand-text/60"}`} />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-bold tracking-tight">Dark Mode</h4>
                <p className="text-[10px] text-brand-text/40 tracking-wider font-medium">Currently {isDark ? "enabled" : "disabled"}</p>
              </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${isDark ? "bg-brand-primary" : "bg-brand-text/20"}`}>
              <motion.div animate={{ x: isDark ? 24 : 0 }} className="w-4 h-4 bg-white rounded-full shadow-sm" />
            </div>
          </div>

          {user?.isAdmin && (
            <button
              onClick={() => onNavigate?.("admin")}
              className="w-full py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Admin Panel
            </button>
          )}

          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-3 py-5 px-6 rounded-3xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold uppercase tracking-[0.2em] text-xs transition-all mb-8 border border-red-500/10 active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </section>
      </div>

      {/* Avatar Picker Modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowPicker(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-md bg-brand-black border border-brand-border rounded-t-[2rem] p-6 pb-10"
            >
              {/* Handle bar */}
              <div className="w-10 h-1 bg-brand-text/20 rounded-full mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold tracking-tight">Choose Your Avatar</h3>
                  <p className="text-[10px] text-brand-text/40 tracking-wider mt-0.5">Pick a style that suits you</p>
                </div>
                <button
                  onClick={() => setShowPicker(false)}
                  className="w-9 h-9 rounded-2xl bg-brand-card/20 flex items-center justify-center text-brand-text/50 hover:text-brand-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview of selected */}
              <div className="flex justify-center mb-5">
                <motion.div
                  key={pendingStyle}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-brand-primary to-brand-accent p-1 shadow-xl"
                >
                  <div className="w-full h-full rounded-[30px] bg-brand-card overflow-hidden flex items-center justify-center">
                    <img
                      src={getAvatarUrl(pendingStyle, seed)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Grid of avatar options */}
              <div className="grid grid-cols-4 gap-3 max-h-52 overflow-y-auto pr-1">
                {AVATAR_STYLES.map((style) => {
                  const isSelected = pendingStyle === style.id;
                  return (
                    <button
                      key={style.id}
                      onClick={() => setPendingStyle(style.id)}
                      className="flex flex-col items-center gap-1.5 group"
                    >
                      <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all ${isSelected ? "border-brand-primary scale-105 shadow-lg shadow-brand-primary/20" : "border-brand-border hover:border-brand-primary/40"}`}>
                        <img
                          src={getAvatarUrl(style.id, seed)}
                          alt={style.label}
                          className="w-full h-full object-cover bg-brand-card"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-brand-primary/20 flex items-center justify-center">
                            <div className="w-5 h-5 bg-brand-primary rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-brand-black" />
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`text-[9px] font-bold tracking-wider uppercase transition-colors ${isSelected ? "text-brand-primary" : "text-brand-text/40"}`}>
                        {style.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Confirm button */}
              <button
                onClick={confirmPick}
                className="mt-5 w-full py-4 rounded-2xl bg-brand-primary text-brand-black font-black uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all"
              >
                Apply Avatar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
