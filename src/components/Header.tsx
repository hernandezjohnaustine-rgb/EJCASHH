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
    <header className="flex items-center justify-between px-6 py-4 sticky top-0 z-40 bg-brand-black/80 backdrop-blur-xl border-b border-brand-border/10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-primary to-brand-accent p-[2px] shadow-lg shadow-brand-primary/10">
          <div className="w-full h-full rounded-[14px] bg-brand-navy flex items-center justify-center overflow-hidden">
            <User className="w-6 h-6 text-brand-primary" />
          </div>
        </div>
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
        <button className="relative w-10 h-10 rounded-2xl bg-brand-card/20 border border-brand-border/30 flex items-center justify-center hover:bg-brand-primary/10 hover:border-brand-primary/30 transition-all active:scale-90">
          <Bell className="w-4 h-4 text-brand-text/80" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-brand-primary rounded-full border-2 border-brand-black shadow-[0_0_8px_#FACC15]"></span>
        </button>
      </div>
    </header>
  );
}
