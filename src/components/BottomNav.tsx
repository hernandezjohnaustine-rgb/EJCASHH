import { motion } from "motion/react";
import { Home, Send, History, TrendingUp, ScanLine, User } from "lucide-react";

interface BottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const tabs = [
  { id: "home", icon: Home, label: "Home" },
  { id: "history", icon: History, label: "History" },
  { id: "scan", icon: ScanLine, label: "Pay", primary: true },
  { id: "rewards", icon: TrendingUp, label: "Earn" },
  { id: "profile", icon: User, label: "Profile" },
];

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-brand-navy/90 backdrop-blur-xl border-t border-white/5 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          if (tab.primary) {
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative -top-10 bg-brand-primary p-4 rounded-3xl shadow-[0_4px_20px_rgba(250,204,21,0.6)] border-[6px] border-brand-black active:scale-95 transition-transform"
              >
                <Icon className="w-8 h-8 text-brand-black" />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex flex-col items-center gap-1 group active:scale-95 transition-transform"
            >
              <div className={`relative p-2 rounded-2xl transition-all ${isActive ? "text-brand-primary" : "text-white/40 group-hover:text-white/60"}`}>
                <Icon className="w-6 h-6" />
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-primary rounded-full"
                  />
                )}
              </div>
              <span className={`text-[10px] font-medium uppercase tracking-wider ${isActive ? "text-brand-primary" : "text-white/40"}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
