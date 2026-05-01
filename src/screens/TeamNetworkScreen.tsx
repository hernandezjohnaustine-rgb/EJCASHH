import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { ArrowLeft, User, Search, Filter, Mail, Phone, ChevronRight, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import GlassCard from "../components/GlassCard";

export default function TeamNetworkScreen({ onBack, referralCode }: { onBack: () => void, referralCode: string }) {
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchTeam() {
      if (!referralCode) return;
      try {
        const q = query(
          collection(db, "users"),
          where("referredBy", "==", referralCode),
          limit(50)
        );
        const snap = await getDocs(q);
        const fetched = snap.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMembers(fetched);
      } catch (err) {
        console.error("Failed to fetch team:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchTeam();
  }, [referralCode]);

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-8">
        <button onClick={onBack} className="p-2 hover:bg-brand-card/10 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold tracking-tight uppercase">Direct Referrals</h2>
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
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/30">L1 Directs ({members.length})</h3>
           <button className="p-2 bg-brand-card/5 rounded-xl">
             <Filter className="w-4 h-4 text-brand-text/40" />
           </button>
        </div>

        <div className="flex flex-col gap-3">
           {isLoading ? (
             <div className="py-20 flex flex-col items-center gap-4">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/20">Scanning Network...</p>
             </div>
           ) : (
             <>
               {members.length === 0 ? (
                 <div className="py-20 text-center">
                    <p className="text-sm font-medium text-brand-text/40">No referrals found yet.</p>
                    <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest mt-2 cursor-pointer" onClick={onBack}>Share your code now</p>
                 </div>
               ) : (
                 members.map((member, i) => (
                   <motion.div
                     key={member.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.05 }}
                     className="glass-card !p-4 flex items-center justify-between group hover:bg-brand-card/10 transition-all"
                   >
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl overflow-hidden border border-brand-border p-1 bg-brand-navy/30">
                            <img 
                              src={member.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.displayName}`} 
                              alt="Member" 
                              className="w-full h-full object-cover rounded-xl"
                            />
                         </div>
                         <div>
                            <div className="flex items-center gap-2">
                               <h4 className="text-sm font-bold">{member.displayName}</h4>
                               <span className={`text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter ${member.isActivated ? 'bg-brand-primary/20 text-brand-primary' : 'bg-brand-text/10 text-brand-text/40'}`}>
                                 {member.isActivated ? "Activated" : "Pending"}
                               </span>
                            </div>
                            <p className="text-[10px] text-brand-text/40 font-medium">{member.email}</p>
                         </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-1">
                         <div className={`w-2 h-2 rounded-full ${member.isActivated ? 'bg-brand-primary' : 'bg-red-500/40'}`}></div>
                         <span className="text-[10px] font-bold text-brand-text/20">{member.referralCode}</span>
                      </div>
                   </motion.div>
                 ))
               )}
             </>
           )}
        </div>
      </section>
    </div>
  );
}
