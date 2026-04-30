import { motion } from "motion/react";
import { User, Shield, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, Moon, Settings, Camera, Smartphone, TrendingUp } from "lucide-react";

export default function ProfileScreen({ onLogout }: { onLogout: () => void }) {
  const menuItems = [
    { icon: TrendingUp, label: "Earnings Wallet", sub: "Withdraw commissions" },
    { icon: User, label: "Personal Information", sub: "Update your details" },
    { icon: Shield, label: "Security & Privacy", sub: "Face ID, PIN, Biometrics" },
    { icon: CreditCard, label: "Payment Methods", sub: "Stored cards & banks" },
    { icon: Bell, label: "Notifications", sub: "Alerts & Transaction SMS" },
    { icon: Smartphone, label: "Linked Devices", sub: "iPhone 15 Pro, 2 sessions" },
    { icon: HelpCircle, label: "Help Center", sub: "FAQs & Live Chat" },
  ];

  return (
    <div className="flex flex-col h-full bg-brand-black overflow-y-auto pb-32">
      <header className="p-8 pb-12 flex flex-col items-center gap-6 relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
           <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue rounded-full blur-[100px]"></div>
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-neon rounded-full blur-[120px]"></div>
        </div>

        <div className="relative group">
           <div className="w-24 h-24 rounded-[40px] bg-gradient-to-br from-brand-blue to-brand-neon p-1 animate-gradient-slow shadow-2xl">
              <div className="w-full h-full rounded-[38px] bg-brand-navy flex items-center justify-center overflow-hidden border border-white/10">
                 <img 
                   src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" 
                   alt="Profile" 
                   className="w-full h-full object-cover"
                   referrerPolicy="no-referrer"
                 />
              </div>
           </div>
           <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-brand-neon rounded-2xl flex items-center justify-center border-4 border-brand-black shadow-lg hover:scale-110 active:scale-95 transition-all text-brand-black">
              <Camera className="w-5 h-5" />
           </button>
        </div>

        <div className="text-center relative z-10">
           <h2 className="text-xl font-display font-bold tracking-tight">John Austine</h2>
           <p className="text-sm text-white/40 mb-3 tracking-wide">@hernandezja_prime</p>
           <div className="flex items-center gap-2 bg-brand-neon/10 py-1.5 px-4 rounded-full border border-brand-neon/20">
              <Shield className="w-3 h-3 text-brand-neon" />
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-neon">Elite Member</span>
           </div>
        </div>
      </header>

      <section className="px-6 flex flex-col gap-6">
         <div className="flex items-center justify-between px-2 mb-2">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/30">Account Settings</h3>
            <Settings className="w-4 h-4 text-white/20" />
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
                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-brand-blue/20 transition-colors">
                       <item.icon className="w-5 h-5 text-white/60 group-hover:text-brand-blue transition-colors" />
                    </div>
                    <div className="text-left">
                       <h4 className="text-sm font-bold tracking-tight">{item.label}</h4>
                       <p className="text-[10px] text-white/40 tracking-wider font-medium">{item.sub}</p>
                    </div>
                 </div>
                 <ChevronRight className="w-5 h-5 text-white/20 group-hover:text-white transition-colors" />
              </motion.button>
            ))}
         </div>

         <div className="flex items-center justify-between glass-card !p-5 mb-4 group cursor-pointer hover:bg-white/10 transition-all border-none">
            <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-brand-neon/10 flex items-center justify-center group-hover:bg-brand-neon/20 transition-colors">
                    <Moon className="w-5 h-5 text-brand-neon" />
                </div>
                <div className="text-left">
                    <h4 className="text-sm font-bold tracking-tight">Dark Mode</h4>
                    <p className="text-[10px] text-white/40 tracking-wider font-medium">Currently enabled</p>
                </div>
            </div>
            <div className="w-12 h-6 bg-brand-neon rounded-full relative flex items-center px-1">
               <div className="w-4 h-4 bg-white rounded-full ml-auto shadow-sm"></div>
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
