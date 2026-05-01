import { motion } from "motion/react";
import { ArrowLeft, User, Search, Filter, Mail, Phone, ChevronRight } from "lucide-react";
import GlassCard from "../components/GlassCard";

const teamMembers = [
  { name: "Mark Wilson", email: "mark@example.com", level: 1, date: "2 mins ago", status: "Active", img: "1" },
  { name: "Sarah Chen", email: "sarah@example.com", level: 1, date: "1 hour ago", status: "Active", img: "2" },
  { name: "David Kim", email: "david@example.com", level: 2, date: "yesterday", status: "Active", img: "3" },
  { name: "Lisa Brown", email: "lisa@example.com", level: 1, date: "2 days ago", status: "Inactive", img: "4" },
  { name: "James Bond", email: "james@example.com", level: 3, date: "3 days ago", status: "Active", img: "5" },
];

export default function TeamNetworkScreen({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 hover:bg-brand-card/10 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold tracking-tight uppercase">My Team Network</h2>
        <div className="w-10"></div>
      </header>

      <section className="mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/20" />
          <input
            type="text"
            placeholder="Search team member..."
            className="w-full bg-brand-card/5 border border-brand-border rounded-2xl py-4 pl-12 pr-4 text-sm focus:outline-none focus:border-brand-primary/30 transition-all font-medium"
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/30">Total Members (142)</h3>
           <button className="p-2 bg-brand-card/5 rounded-xl">
             <Filter className="w-4 h-4 text-brand-text/40" />
           </button>
        </div>

        <div className="flex flex-col gap-3">
           {teamMembers.map((member, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: i * 0.05 }}
               className="glass-card !p-4 flex items-center justify-between group hover:bg-brand-card/10 transition-all"
             >
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl overflow-hidden border border-brand-border p-1">
                      <img 
                        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.img}`} 
                        alt="Member" 
                        className="w-full h-full object-cover rounded-xl"
                      />
                   </div>
                   <div>
                      <div className="flex items-center gap-2">
                         <h4 className="text-sm font-bold">{member.name}</h4>
                         <span className="text-[8px] px-1.5 py-0.5 bg-brand-primary/20 text-brand-primary rounded-md font-black uppercase tracking-tighter">L{member.level}</span>
                      </div>
                      <p className="text-[10px] text-brand-text/40 font-medium">{member.email}</p>
                   </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                   <div className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-brand-primary animate-pulse' : 'bg-brand-text/10'}`}></div>
                   <span className="text-[10px] font-bold text-brand-text/20">{member.date}</span>
                </div>
             </motion.div>
           ))}
        </div>
      </section>
    </div>
  );
}
