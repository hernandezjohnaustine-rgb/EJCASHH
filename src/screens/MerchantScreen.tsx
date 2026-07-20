import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Store, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";

interface Merchant {
  id: string;
  name: string;
  iconUrl?: string;
  link: string;
  order?: number;
}

export default function MerchantScreen({ onBack }: { onBack: () => void }) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDocs(collection(db, "merchants"))
      .then(snap => {
        const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Merchant));
        list.sort((a, b) => (a.order || 0) - (b.order || 0));
        setMerchants(list);
      })
      .catch(err => console.error("Failed to load merchants:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleOpen = (link: string) => {
    window.open(link, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col pt-12 relative overflow-hidden pb-32">
      <div className="absolute top-0 left-0 w-full h-64 bg-brand-primary/10 blur-[100px] pointer-events-none"></div>

      <header className="px-6 flex items-center justify-between mb-8 relative z-10">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-brand-primary" />
          <h1 className="text-xl font-display font-black tracking-tight">Merchant</h1>
        </div>
        <div className="w-10" />
      </header>

      <div className="flex-1 px-6 relative z-10">
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : merchants.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-center py-24">
            <AlertCircle className="w-10 h-10 text-brand-text/20" />
            <p className="text-sm font-bold text-brand-text/40">No merchants have been added yet.</p>
            <p className="text-[10px] text-brand-text/20">Contact admin support for assistance.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {merchants.map((m, i) => (
              <motion.button
                key={m.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handleOpen(m.link)}
                className="flex flex-col items-center gap-2 glass-card !p-4 hover:scale-105 active:scale-95 transition-all border-brand-primary/10 bg-brand-primary/5"
              >
                <div className="w-12 h-12 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center overflow-hidden">
                  {m.iconUrl ? (
                    <img src={m.iconUrl} alt={m.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <Store className="w-5 h-5 text-brand-primary" />
                  )}
                </div>
                <span className="text-[9px] font-black text-brand-text/80 tracking-widest uppercase text-center leading-tight">{m.name}</span>
                <ExternalLink className="w-3 h-3 text-brand-text/20" />
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
