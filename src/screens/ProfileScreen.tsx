import { motion, AnimatePresence } from "motion/react";
import { useState, useRef } from "react";
import {
  User, Shield, CreditCard, Bell, HelpCircle, LogOut,
  ChevronRight, Moon, Settings, Camera, Smartphone,
  TrendingUp, X, Check, Upload, ImageIcon, Trash2
} from "lucide-react";

interface ProfileScreenProps {
  onLogout: () => void;
  theme: string;
  onToggleTheme: () => void;
  user: any | null;
  onNavigate?: (view: string) => void;
}

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

type Tab = "upload" | "gallery";
type AvatarSource =
  | { type: "dicebear"; style: string }
  | { type: "upload"; dataUrl: string };

export default function ProfileScreen({ onLogout, theme, onToggleTheme, user, onNavigate }: ProfileScreenProps) {
  const isDark = theme === "dark";
  const seed = user?.username || user?.displayName || "Member";

  const [avatar, setAvatar] = useState<AvatarSource>({ type: "dicebear", style: "avataaars" });
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [pendingAvatar, setPendingAvatar] = useState<AvatarSource>(avatar);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  function openPicker() {
    setPendingAvatar(avatar);
    setShowPicker(true);
  }

  function confirmPick() {
    setAvatar(pendingAvatar);
    setShowPicker(false);
  }

  function getDisplaySrc(src: AvatarSource) {
    return src.type === "dicebear" ? getAvatarUrl(src.style, seed) : src.dataUrl;
  }

  function handleFileChange(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setPendingAvatar({ type: "upload", dataUrl });
    };
    reader.readAsDataURL(file);
  }

  const menuItems = [
    { icon: TrendingUp, label: "Earnings Wallet", sub: "Withdraw commissions" },
    { icon: User, label: "Personal Information", sub: `Update details ${user?.phoneNumber ? `(+63 ${user.phoneNumber})` : ""}` },
    { icon: Shield, label: "Security & Privacy", sub: "Face ID, PIN, Biometrics" },
    { icon: CreditCard, label: "Payment Methods", sub: "Stored cards & banks" },
    { icon: Bell, label: "Notifications", sub: "Alerts & Transaction SMS" },
    { icon: Smartphone, label: "Linked Devices", sub: "iPhone 15 Pro, 2 sessions" },
    { icon: HelpCircle, label: "Help Center", sub: "FAQs & Live Chat" },
  ];

  return (
    <>
      <div className="flex flex-col h-full bg-brand-black text-brand-text overflow-y-auto pb-32">
        <header className="p-8 pb-12 flex flex-col items-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary rounded-full blur-[100px]" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent rounded-full blur-[120px]" />
          </div>

          <div className="relative group">
            <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-brand-primary to-brand-accent p-1 animate-gradient-slow shadow-2xl">
              <div className="w-full h-full rounded-[38px] bg-brand-card flex items-center justify-center overflow-hidden border border-brand-border">
                <img
                  src={getDisplaySrc(avatar)}
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
      />

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
            onClick={(e) => e.target === e.currentTarget && setShowPicker(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-md bg-brand-black border border-brand-border rounded-t-[2rem] flex flex-col overflow-hidden"
              style={{ maxHeight: "85vh" }}
            >
              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-6 pb-2">

              {/* Handle */}
              <div className="w-10 h-1 bg-brand-text/20 rounded-full mx-auto mb-5" />

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold tracking-tight">Change Photo</h3>
                  <p className="text-[10px] text-brand-text/40 tracking-wider mt-0.5">Upload or pick an avatar</p>
                </div>
                <button
                  onClick={() => setShowPicker(false)}
                  className="w-9 h-9 rounded-2xl bg-brand-card/20 flex items-center justify-center text-brand-text/50 hover:text-brand-text transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Preview */}
              <div className="flex justify-center mb-5">
                <motion.div
                  key={JSON.stringify(pendingAvatar)}
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="w-20 h-20 rounded-[32px] bg-gradient-to-br from-brand-primary to-brand-accent p-1 shadow-xl"
                >
                  <div className="w-full h-full rounded-[30px] bg-brand-card overflow-hidden flex items-center justify-center">
                    <img
                      src={getDisplaySrc(pendingAvatar)}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </div>

              {/* Tabs */}
              <div className="flex bg-brand-card/20 rounded-2xl p-1 mb-5 gap-1">
                {([
                  { id: "upload" as Tab, label: "Upload Photo", icon: Upload },
                  { id: "gallery" as Tab, label: "Avatar Gallery", icon: ImageIcon },
                ]).map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all ${
                      activeTab === id
                        ? "bg-brand-primary text-brand-black shadow"
                        : "text-brand-text/40 hover:text-brand-text/70"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Tab panels */}
              <AnimatePresence mode="wait">
                {activeTab === "upload" ? (
                  <motion.div
                    key="upload"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.15 }}
                  >
                    {/* Drop zone */}
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => {
                        e.preventDefault();
                        setDragOver(false);
                        handleFileChange(e.dataTransfer.files?.[0] ?? null);
                      }}
                      onClick={() => fileInputRef.current?.click()}
                      className={`relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-8 px-4 ${
                        dragOver
                          ? "border-brand-primary bg-brand-primary/10 scale-[1.01]"
                          : pendingAvatar.type === "upload"
                          ? "border-brand-primary/50 bg-brand-primary/5"
                          : "border-brand-border hover:border-brand-primary/40 hover:bg-brand-card/10"
                      }`}
                    >
                      {pendingAvatar.type === "upload" ? (
                        <>
                          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-brand-primary shadow-lg shadow-brand-primary/20">
                            <img src={pendingAvatar.dataUrl} alt="Uploaded" className="w-full h-full object-cover" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-brand-primary">Photo ready!</p>
                            <p className="text-[10px] text-brand-text/40 mt-0.5">Tap to choose a different one</p>
                            <p className="text-[10px] text-brand-primary/70 mt-2 font-bold animate-pulse">↓ Tap "Save This Photo" below</p>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPendingAvatar({ type: "dicebear", style: "avataaars" });
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider"
                          >
                            <Trash2 className="w-3 h-3" />
                            Remove
                          </button>
                        </>
                      ) : (
                        <>
                          <div className="w-14 h-14 rounded-2xl bg-brand-card/20 flex items-center justify-center">
                            <Upload className="w-6 h-6 text-brand-text/30" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-bold text-brand-text/70">Tap to upload a photo</p>
                            <p className="text-[10px] text-brand-text/30 mt-1">or drag & drop here</p>
                            <p className="text-[9px] text-brand-text/20 mt-1.5 uppercase tracking-widest font-bold">JPG · PNG · WEBP · Max 10MB</p>
                          </div>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 w-full py-3 rounded-2xl border border-brand-border text-brand-text/50 text-[11px] font-bold uppercase tracking-widest hover:border-brand-primary/40 hover:text-brand-text transition-all flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Browse Files
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="gallery"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.15 }}
                  >
                    <div className="grid grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
                      {AVATAR_STYLES.map((style) => {
                        const isSelected =
                          pendingAvatar.type === "dicebear" && pendingAvatar.style === style.id;
                        return (
                          <button
                            key={style.id}
                            onClick={() => setPendingAvatar({ type: "dicebear", style: style.id })}
                            className="flex flex-col items-center gap-1.5"
                          >
                            <div
                              className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? "border-brand-primary scale-105 shadow-lg shadow-brand-primary/20"
                                  : "border-brand-border hover:border-brand-primary/40"
                              }`}
                            >
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
                            <span
                              className={`text-[9px] font-bold tracking-wider uppercase transition-colors ${
                                isSelected ? "text-brand-primary" : "text-brand-text/40"
                              }`}
                            >
                              {style.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              </div>{/* end scrollable body */}

              {/* Sticky Save button */}
              <div className="p-4 pt-2 pb-8 border-t border-brand-border/30 bg-brand-black">
              <AnimatePresence mode="wait">
                {pendingAvatar.type === "upload" ? (
                  <motion.button
                    key="apply-upload"
                    onClick={confirmPick}
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="w-full py-4 rounded-2xl bg-brand-primary text-brand-black font-black uppercase tracking-widest text-xs active:scale-95 transition-transform flex items-center justify-center gap-2 relative overflow-hidden shadow-lg shadow-brand-primary/30"
                  >
                    <span className="absolute inset-0 rounded-2xl animate-ping bg-brand-primary opacity-20 pointer-events-none" />
                    <Check className="w-4 h-4 relative z-10" />
                    <span className="relative z-10">Save This Photo</span>
                  </motion.button>
                ) : (
                  <motion.button
                    key="apply-default"
                    onClick={confirmPick}
                    initial={{ opacity: 0, scale: 0.95, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 8 }}
                    transition={{ type: "spring", damping: 20, stiffness: 300 }}
                    className="w-full py-4 rounded-2xl bg-brand-primary text-brand-black font-black uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Apply Avatar
                  </motion.button>
                )}
              </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
