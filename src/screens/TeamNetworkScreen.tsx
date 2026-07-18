import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { ArrowLeft, User, Search, Filter, Mail, Phone, ChevronRight, Loader2 } from "lucide-react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "../lib/firebase";
import GlassCard from "../components/GlassCard";

// NOTE: this shows PLACEMENT team members (people whose sponsorId points to
// the currently-viewed person in the global matrix — up to 10 slots), not
// literal direct referrals. Clicking a member drills down into THEIR own
// placement team, so you can see how filled each person's 10 slots are,
// level by level, without leaving this screen.
interface StackEntry {
  id: string;
  displayName: string;
}

export default function TeamNetworkScreen({ onBack, userId, displayName }: { onBack: () => void, userId: string, displayName?: string }) {
  const [stack, setStack] = useState<StackEntry[]>([{ id: userId, displayName: displayName || "You" }]);
  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const current = stack[stack.length - 1];

  useEffect(() => {
    async function fetchTeam() {
      if (!current?.id) return;
      setIsLoading(true);
      try {
        const q = query(
          collection(db, "users"),
          where("sponsorId", "==", current.id),
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
  }, [current?.id]);

  function handleMemberClick(member: any) {
    setStack(prev => [...prev, { id: member.id, displayName: member.displayName || "Member" }]);
  }

  function handleBack() {
    if (stack.length > 1) {
      setStack(prev => prev.slice(0, -1));
    } else {
      onBack();
    }
  }

  const isViewingSelf = stack.length === 1;

  return (
    <div className="min-h-screen bg-brand-black text-brand-text flex flex-col p-6 pt-12 overflow-y-auto pb-32">
      <header className="flex items-center justify-between mb-4">
        <button onClick={handleBack} className="p-2 hover:bg-brand-card/10 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-bold tracking-tight uppercase">Placement Team</h2>
        <div className="w-10"></div>
      </header>

      {/* Breadcrumb showing how deep we've drilled down */}
      {stack.length > 1 && (
        <div className="flex items-center gap-1 flex-wrap mb-6 px-1">
          {stack.map((entry, i) => (
            <div key={entry.id} className="flex items-center gap-1">
              <button
                onClick={() => setStack(prev => prev.slice(0, i + 1))}
                className={`text-[10px] font-black uppercase tracking-widest ${
                  i === stack.length - 1 ? "text-brand-primary" : "text-brand-text/30 hover:text-brand-text/60"
                }`}
              >
                {entry.displayName}
              </button>
              {i < stack.length - 1 && <ChevronRight className="w-3 h-3 text-brand-text/20" />}
            </div>
          ))}
        </div>
      )}

      {!isViewingSelf && (
        <p className="text-[10px] text-brand-text/30 font-bold uppercase tracking-widest mb-4 px-1">
          Viewing {current.displayName}'s placement team
        </p>
      )}

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
           <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text/30">Level 1 Slots ({members.length}/10)</h3>
           <button className="p-2 bg-brand-card/5 rounded-xl">
             <Filter className="w-4 h-4 text-brand-text/40" />
           </button>
        </div>

        <div className="flex flex-col gap-3">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" className="py-20 flex flex-col items-center gap-4">
                 <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                 <p className="text-[10px] font-black uppercase tracking-widest text-brand-text/20">Scanning Network...</p>
              </motion.div>
            ) : members.length === 0 ? (
              <motion.div key="empty" className="py-20 text-center">
                 <p className="text-sm font-medium text-brand-text/40">
                   {isViewingSelf ? "No team members placed here yet." : `${current.displayName} has no placement slots filled yet.`}
                 </p>
                 {isViewingSelf && (
                   <p className="text-[10px] text-brand-primary font-bold uppercase tracking-widest mt-2 cursor-pointer" onClick={onBack}>Share your code now</p>
                 )}
              </motion.div>
            ) : (
              <motion.div key="list" className="flex flex-col gap-3">
                {members.map((member, i) => (
                  <motion.button
                    key={member.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => handleMemberClick(member)}
                    className="glass-card !p-4 flex items-center justify-between group hover:bg-brand-card/10 transition-all text-left w-full"
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
                           <p className="text-[9px] text-brand-primary/60 font-bold uppercase tracking-widest mt-0.5">
                             Team Size: {member.stats?.teamSize || 0}
                           </p>
                        </div>
                     </div>
                     <div className="text-right flex flex-col items-end gap-1">
                        <div className={`w-2 h-2 rounded-full ${member.isActivated ? 'bg-brand-primary' : 'bg-red-500/40'}`}></div>
                        <ChevronRight className="w-4 h-4 text-brand-text/20 group-hover:text-brand-primary group-hover:translate-x-0.5 transition-all" />
                     </div>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
