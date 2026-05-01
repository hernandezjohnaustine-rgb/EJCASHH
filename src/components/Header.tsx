import { Bell, User, Sun, Moon } from "lucide-react";
import { motion } from "motion/react";

export default function Header({ 
  userName = "User", 
  theme = "dark", 
  onToggleTheme 
}: { 
  userName?: string;
  theme?: string;
  onToggleTheme?: () => void;
}) {
  return (
    <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-40 bg-brand-black/50 backdrop-blur-lg">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent p-[2px]">
          <div className="w-full h-full rounded-[14px] bg-brand-navy flex items-center justify-center overflow-hidden">
            <User className="w-6 h-6 text-brand-primary" />
          </div>
        </div>
        <div>
          <p className="text-[10px] text-brand-text/40 uppercase tracking-[0.2em] font-medium">Welcome back</p>
          <h2 className="text-sm font-semibold tracking-tight">{userName}</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleTheme}
          className="w-11 h-11 rounded-2xl bg-brand-card/5 border border-brand-border flex items-center justify-center hover:bg-brand-card/10 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-5 h-5 text-brand-primary" /> : <Moon className="w-5 h-5 text-brand-primary" />}
        </button>
        <button className="relative w-11 h-11 rounded-2xl bg-brand-card/5 border border-brand-border flex items-center justify-center hover:bg-brand-card/10 transition-colors">
          <Bell className="w-5 h-5 text-brand-text/80" />
          <span className="absolute top-3 right-3 w-2 h-2 bg-brand-primary rounded-full border-2 border-brand-black shadow-[0_0_8px_#FACC15]"></span>
        </button>
      </div>
    </header>
  );
}
