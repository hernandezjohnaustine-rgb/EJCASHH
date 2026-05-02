import { motion } from "motion/react";
import { User, Shield, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Moon, Settings, Camera, Smartphone, TrendingUp } from "lucide-react";

interface ProfileScreenProps {
  onLogout: () => void;
  theme: string;
  onToggleTheme: () => void;
  user: any | null; // Use any to allow UserProfile or FirebaseUser
}

export default function ProfileScreen({ onLogout, theme, onToggleTheme, user }: ProfileScreenProps) {
  const isDark = theme === "dark";
  
  const menuItems = [
    { icon: TrendingUp, label: "Earnings Wallet", sub: "Withdraw commissions" },
    { icon: User, label: "Personal Information", sub: `Update details ${user?.phoneNumber ? `(+63 ${user.phoneNumber})` : ''}` },
    { icon: Shield, label: "Security & Privacy", sub: "Face ID, PIN, Biometrics" },
    { icon: CreditCard, label: "Payment Methods", sub: "Stored cards & banks" },
    { icon: Bell, label: "Notifications", sub: "Alerts & Transaction SMS" },
    { icon: Smartphone, label: "Linked Devices", sub: "iPhone 15 Pro, 2 sessions" },
    { icon: HelpCircle, label: "Help Center", sub: "FAQs & Live Chat" },
  ];

  return (
    <div className="flex flex-col h-full bg-brand-black text-brand-text overflow-y-auto pb-32">
      <header className="p-8 pb-12 flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary rounded-full blur-[100px]"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-accent rounded-full blur-[120px]"></div>
        </div>

        <div className="relative group">
           <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-brand-primary to-brand-accent p-1 animate-gradient-slow shadow-2xl">
              <div className="w-full h-full rounded-[38px] bg-brand-card flex items-center justify-center overflow-hidden border border-brand-border">
                 <img 
                   src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || user?.displayName || "John"}`} 
                   alt="Profile" 
                   className="w-full h-full object-cover"
                   referrerPolicy="no-referrer"
                 />
              </div>
           </div>
           <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-primary rounded-2xl flex items-center justify-center border-4 border-brand-black shadow-lg hover:scale-110 active:scale-95 transition-all text-brand-black">
              <Camera className="w-5 h-5" />
           </button>
        </div>

        <div className="text-center relative z-10">
           <div className="flex items-center justify-center gap-2 mb-1">
             <h2 className="text-xl font-display font-bold tracking-tight">{user?.displayName || "Member"}</h2>
             {user?.username && <span className="text-[10px] bg-brand-primary text-brand-black px-2 py-0.5 rounded-full font-black uppercase tracking-tighter">@{user.username}</span>}
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
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDark ? 'bg-brand-primary/10' : 'bg-brand-card/20'}`}>
                    <Moon className={`w-5 h-5 ${isDark ? 'text-brand-primary' : 'text-brand-text/60'}`} />
                </div>
                <div className="text-left">
                    <h4 className="text-sm font-bold tracking-tight">Dark Mode</h4>
                    <p className="text-[10px] text-brand-text/40 tracking-wider font-medium">Currently {isDark ? 'enabled' : 'disabled'}</p>
                </div>
            </div>
            <div className={`w-12 h-6 rounded-full relative flex items-center px-1 transition-colors ${isDark ? 'bg-brand-primary' : 'bg-brand-text/20'}`}>
               <motion.div 
                 animate={{ x: isDark ? 24 : 0 }}
                 className="w-4 h-4 bg-white rounded-full shadow-sm"
               ></motion.div>
            </div>
         </div>

         <button 
           onClick={onLogout}
           className="flex items-center justify-center gap-3 py-5 px-6 rounded-3xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold uppercase tracking-[0.2em] text-xs transition-all mb-8 border border-red-500/10 active:scale-95"
         >
            <LogOut className="w-5 h-5" />
            Sign Out
         </button>
      </section>
    </div>
  );
}
