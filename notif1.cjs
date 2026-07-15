const fs = require("fs");
let content = fs.readFileSync("src/components/Header.tsx", "utf8");

// Add notifications panel to Header
const newContent = `import { Bell, Sun, Moon, X, CheckCheck } from "lucide-react";
import { useState, useEffect } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, getDocs, writeBatch } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function Header({ 
  userName = "User",
  userSeed = "John",
  theme = "dark", 
  onToggleTheme,
  onProfileClick,
  userId,
}: { 
  userName?: string;
  userSeed?: string;
  theme?: string;
  onToggleTheme?: () => void;
  onProfileClick?: () => void;
  userId?: string;
}) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, "users", userId, "notifications"),
      orderBy("createdAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, snap => {
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setNotifications(notifs);
      setUnreadCount(notifs.filter((n: any) => !n.read).length);
    });
    return () => unsub();
  }, [userId]);

  const markAllRead = async () => {
    if (!userId) return;
    const batch = writeBatch(db);
    notifications.filter((n: any) => !n.read).forEach(n => {
      batch.update(doc(db, "users", userId, "notifications", n.id), { read: true });
    });
    await batch.commit();
  };

  const markRead = async (id: string) => {
    if (!userId) return;
    await updateDoc(doc(db, "users", userId, "notifications", id), { read: true });
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-40 bg-brand-black/80 backdrop-blur-xl border-b border-brand-border/10">
      <div className="flex items-center gap-3">
        <button
          onClick={onProfileClick}
          className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent p-[2px] shadow-lg shadow-brand-primary/10 active:scale-90 transition-all"
        >
          <div className="w-full h-full rounded-[14px] bg-brand-navy flex items-center justify-center overflow-hidden">
            <img
              src={\`https://api.dicebear.com/7.x/\${userSeed?.includes("http") ? "avataaars" : "avataaars"}/svg?seed=\${userSeed}\`}
              alt="Profile"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </button>
        <div>
          <p className="text-[10px] text-brand-text/40 uppercase tracking-[0.2em] font-black">Welcome back</p>
          <h2 className="text-sm font-display font-black tracking-tight italic transition-colors leading-none mt-0.5">{userName}</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <button 
          onClick={onToggleTheme}
          className="w-10 h-10 rounded-2xl bg-brand-card/20 border border-brand-border/30 flex items-center justify-center hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all active:scale-90"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-brand-primary" /> : <Moon className="w-4 h-4 text-brand-primary" />}
        </button>
        <button
          onClick={() => { setShowNotifs(!showNotifs); if (!showNotifs) markAllRead(); }}
          className="relative w-10 h-10 rounded-2xl bg-brand-card/20 border border-brand-border/30 flex items-center justify-center hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all active:scale-90"
        >
          <Bell className="w-4 h-4 text-brand-text/80" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black flex items-center justify-center rounded-full">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Notifications Panel */}
      {showNotifs && (
        <div className="absolute top-16 right-4 w-80 bg-brand-navy border border-brand-border rounded-3xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border">
            <h3 className="text-sm font-black text-brand-text">Notifications</h3>
            <div className="flex items-center gap-2">
              <button onClick={markAllRead} className="text-[9px] text-brand-primary font-black uppercase">
                Mark all read
              </button>
              <button onClick={() => setShowNotifs(false)}>
                <X className="w-4 h-4 text-brand-text/40" />
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell className="w-8 h-8 text-brand-text/20 mx-auto mb-2" />
                <p className="text-brand-text/40 text-xs font-bold">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notif: any) => (
                <div
                  key={notif.id}
                  onClick={() => markRead(notif.id)}
                  className={"px-4 py-3 border-b border-brand-border/50 cursor-pointer hover:bg-brand-card/10 transition-colors " + (!notif.read ? "bg-brand-primary/5" : "")}
                >
                  <div className="flex items-start gap-3">
                    <div className={"w-2 h-2 rounded-full mt-2 shrink-0 " + (!notif.read ? "bg-brand-primary" : "bg-transparent")} />
                    <div>
                      <p className="text-xs font-black text-brand-text">{notif.title}</p>
                      <p className="text-[10px] text-brand-text/40 mt-0.5">{notif.message}</p>
                      <p className="text-[9px] text-brand-text/20 mt-1">
                        {notif.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </header>
  );
}
`;

fs.writeFileSync("src/components/Header.tsx", newContent, "utf8");
console.log("Done!");
