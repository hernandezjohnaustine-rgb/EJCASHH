import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useEffect } from "react";
import {
  User, Shield, CreditCard, Bell, HelpCircle, LogOut,
  ChevronRight, Moon, Settings, Camera, Smartphone,
  TrendingUp, X, Check, Upload, ImageIcon, Trash2, Loader2
} from "lucide-react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase"; // adjust path if needed

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

type AvatarData =
  | { type: "dicebear"; style: string }
  | { type: "base64"; data: string };

type PendingAvatar =
  | { type: "dicebear"; style: string }
  | { type: "base64"; data: string }
  | { type: "local"; preview: string; file: File };

const DEFAULT_AVATAR: AvatarData = { type: "dicebear", style: "avataaars" };
const CACHE_KEY = "user_avatar_v2";

// Compress to max 200x200 JPEG at quality 0.6 — safe well under Firestore's 1MB doc limit
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 200;
      let { width, height } = img;
      if (width > height) {
        if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      } else {
        if (height > MAX) { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      const result = canvas.toDataURL("image/jpeg", 0.6);
      resolve(result);
    };
    img.onerror = (e) => {
      URL.revokeObjectURL(url);
      reject(e);
    };
    img.src = url;
  });
}

function getCached(): AvatarData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCache(data: AvatarData) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(data)); } catch {}
}

function clearCache() {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
}

function getDisplaySrc(avatar: AvatarData | PendingAvatar, seed: string): string {
  if (avatar.type === "dicebear") return getAvatarUrl(avatar.style, seed);
  if (avatar.type === "base64") return avatar.data;
  if (avatar.type === "local") return avatar.preview;
  return "";
}

export default function ProfileScreen({ onLogout, theme, onToggleTheme, user, onNavigate }: ProfileScreenProps) {
  const isDark = theme === "dark";
  const seed = user?.username || user?.displayName || "Member";
  const userId = user?.uid;

  const [avatar, setAvatar] = useState<AvatarData>(getCached() ?? DEFAULT_AVATAR);
  const [loadingAvatar, setLoadingAvatar] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [pendingAvatar, setPendingAvatar] = useState<PendingAvatar>(DEFAULT_AVATAR);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from Firestore on mount — always prefer DB over cache
  useEffect(() => {
    if (!userId) {
      setLoadingAvatar(false);
      return;
    }
    setLoadingAvatar(true);
    getDoc(doc(db, "users", userId))
      .then((snap) => {
        if (snap.exists()) {
          const data = snap.data();
          if (data?.avatar) {
            const saved = data.avatar as AvatarData;
            // Validate the shape before trusting it
            if (saved.type === "dicebear" || saved.type === "base64") {
              setAvatar(saved);
              setCache(saved); // keep cache in sync with DB
            }
          }
        }
      })
      .catch((err) => {
        console.error("[ProfileScreen] Failed to load avatar from Firestore:", err);
        // Fall back to whatever is in cache/state already — no crash
      })
      .finally(() => setLoadingAvatar(false));
  }, [userId]);

  function openPicker() {
    if (!userId) return; // don't open if not logged in
    setPendingAvatar(
      avatar.type === "dicebear"
        ? { type: "dicebear", style: avatar.style }
        : { type: "base64", data: avatar.data }
    );
    setSaveError(null);
    setShowPicker(true);
  }

  async function confirmPick() {
    if (!userId) return;
    setSaving(true);
    setSaveError(null);

    try {
      let newAvatar: AvatarData;

      if (pendingAvatar.type === "local") {
        const compressed = await compressImage(pendingAvatar.file);
        // Sanity-check size — Firestore doc limit is 1MB, base64 inflates ~33%
        const estimatedBytes = (compressed.length * 3) / 4;
        if (estimatedBytes > 700_000) {
          throw new Error("Image is too large even after compression. Please use a smaller photo.");
        }
        newAvatar = { type: "base64", data: compressed };
      } else if (pendingAvatar.type === "base64") {
        newAvatar = { type: "base64", data: pendingAvatar.data };
      } else {
        newAvatar = { type: "dicebear", style: pendingAvatar.style };
      }

      // Write to Firestore first — if this throws, we don't update local state
      await setDoc(doc(db, "users", userId), { avatar: newAvatar }, { merge: true });

      // Only update UI + cache after confirmed DB write
      setAvatar(newAvatar);
      setCache(newAvatar);
      setShowPicker(false);
    } catch (err: any) {
      console.error("[ProfileScreen] Failed to save avatar:", err);
      setSaveError(
        err?.message?.includes("too large")
          ? err.message
          : "Failed to save. Try a smaller image or check your connection."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(file: File | null) {
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = e.target?.result as string;
      setPendingAvatar({ type: "local", preview, file });
      setActiveTab("upload"); // ensure user sees the upload tab with their preview
    };
    reader.onerror = () => setSaveError("Could not read file. Try a different image.");
    reader.readAsDataURL(file);
  }

  // Clear cache on logout so next user on same device gets a clean state
  function handleLogout() {
    clearCache();
    onLogout();
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

          <div className="relative">
            <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-brand-primary to-brand-accent p-1 animate-gradient-slow shadow-2xl">
              <div className="w-full h-full rounded-[38px] bg-brand-card flex items-center justify-center overflow-hidden border border-brand-border">
                {loadingAvatar ? (
                  <Loader2 className="w-6 h-6 text-brand-primary animate-spin" />
                ) : (
                  <img
                    src={getDisplaySrc(avatar, seed)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </div>
            {/* Camera button disabled when not logged in */}
            <button
              onClick={openPicker}
              disabled={!userId}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-primary rounded-2xl flex items-center justify-center border-4 border-brand-black shadow-lg hover:scale-110 active:scale-95 transition-all text-brand-black disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
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
            onClick={handleLogout}
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
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm pb-20"
            onClick={(e) => e.target === e.currentTarget && !saving && setShowPicker(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-w-md bg-brand-black border border-brand-border rounded-t-[2rem] rounded-b-[2rem] flex flex-col overflow-hidden"
              style={{ maxHeight: "70vh" }}
            >
              {/* Scrollable body */}
              <div className="overflow-y-auto flex-1 p-6 pb-2">
                <div className="w-10 h-1 bg-brand-text/20 rounded-full mx-auto mb-5" />

                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold tracking-tight">Change Photo</h3>
                    <p className="text-[10px] text-brand-text/40 tracking-wider mt-0.5">Upload or pick an avatar</p>
                  </div>
                  <button
                    onClick={() => !saving && setShowPicker(false)}
                    className="w-9 h-9 rounded-2xl bg-brand-card/20 flex items-center justify-center text-brand-text/50 hover:text-brand-text transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Preview */}
                <div className="flex justify-center mb-4">
                  <motion.div
                    key={pendingAvatar.type === "local" ? pendingAvatar.preview.slice(-20) : JSON.stringify(pendingAvatar)}
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-14 h-14 rounded-[22px] bg-gradient-to-br from-brand-primary to-brand-accent p-1 shadow-xl"
                  >
                    <div className="w-full h-full rounded-[20px] bg-brand-card overflow-hidden">
                      <img
                        src={getDisplaySrc(pendingAvatar, seed)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </motion.div>
                </div>

                {/* Tabs */}
                <div className="flex bg-brand-card/20 rounded-2xl p-1 mb-3 gap-1">
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
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setDragOver(false);
                          handleFileChange(e.dataTransfer.files?.[0] ?? null);
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed cursor-pointer transition-all py-5 px-4 ${
                          dragOver
                            ? "border-brand-primary bg-brand-primary/10 scale-[1.01]"
                            : pendingAvatar.type === "local"
                            ? "border-brand-primary/50 bg-brand-primary/5"
                            : "border-brand-border hover:border-brand-primary/40 hover:bg-brand-card/10"
                        }`}
                      >
                        {pendingAvatar.type === "local" ? (
                          <>
                            <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-brand-primary shadow-lg shadow-brand-primary/20">
                              <img src={pendingAvatar.preview} alt="Selected" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-brand-primary">Photo ready!</p>
                              <p className="text-[10px] text-brand-text/40 mt-0.5">Tap to choose a different one</p>
                              <p className="text-[10px] text-brand-primary/70 mt-1 font-bold animate-pulse">↓ Tap "Save This Photo" below</p>
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
                            <div className="w-10 h-10 rounded-2xl bg-brand-card/20 flex items-center justify-center">
                              <Upload className="w-5 h-5 text-brand-text/30" />
                            </div>
                            <div className="text-center">
                              <p className="text-xs font-bold text-brand-text/70">Tap to upload a photo</p>
                              <p className="text-[10px] text-brand-text/30 mt-0.5">or drag & drop here</p>
                              <p className="text-[9px] text-brand-text/20 mt-1 uppercase tracking-widest font-bold">JPG · PNG · WEBP</p>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="mt-2 w-full py-3 rounded-2xl border border-brand-border text-brand-text/50 text-[11px] font-bold uppercase tracking-widest hover:border-brand-primary/40 hover:text-brand-text transition-all flex items-center justify-center gap-2"
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
                          const isSelected = pendingAvatar.type === "dicebear" && pendingAvatar.style === style.id;
                          return (
                            <button
                              key={style.id}
                              onClick={() => setPendingAvatar({ type: "dicebear", style: style.id })}
                              className="flex flex-col items-center gap-1.5"
                            >
                              <div className={`relative w-full aspect-square rounded-2xl overflow-hidden border-2 transition-all ${
                                isSelected
                                  ? "border-brand-primary scale-105 shadow-lg shadow-brand-primary/20"
                                  : "border-brand-border hover:border-brand-primary/40"
                              }`}>
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
                              <span className={`text-[9px] font-bold tracking-wider uppercase transition-colors ${
                                isSelected ? "text-brand-primary" : "text-brand-text/40"
                              }`}>
                                {style.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sticky Save footer */}
              <div className="p-4 pt-2 pb-6 border-t border-brand-border/30 bg-brand-black">
                {saveError && (
                  <p className="text-[10px] text-red-400 text-center mb-2 font-bold">{saveError}</p>
                )}
                <AnimatePresence mode="wait">
                  {pendingAvatar.type === "local" ? (
                    <motion.button
                      key="save-photo"
                      onClick={confirmPick}
                      disabled={saving}
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="w-full py-4 rounded-2xl bg-brand-primary text-brand-black font-black uppercase tracking-widest text-xs active:scale-95 transition-transform flex items-center justify-center gap-2 relative overflow-hidden shadow-lg shadow-brand-primary/30 disabled:opacity-70"
                    >
                      {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                      ) : (
                        <>
                          <span className="absolute inset-0 rounded-2xl animate-ping bg-brand-primary opacity-20 pointer-events-none" />
                          <Check className="w-4 h-4 relative z-10" />
                          <span className="relative z-10">Save This Photo</span>
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      key="apply-avatar"
                      onClick={confirmPick}
                      disabled={saving}
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ type: "spring", damping: 20, stiffness: 300 }}
                      className="w-full py-4 rounded-2xl bg-brand-primary text-brand-black font-black uppercase tracking-widest text-xs hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {saving ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /><span>Saving...</span></>
                      ) : (
                        <><Check className="w-4 h-4" /><span>Apply Avatar</span></>
                      )}
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

