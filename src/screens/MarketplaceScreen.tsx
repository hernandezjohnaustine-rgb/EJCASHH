import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Store, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function MerchantScreen({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getDoc(doc(db, "settings", "merchant"))
      .then(snap => {
        if (snap.exists() && snap.data().url) {
          setUrl(snap.data().url);
        }
      })
      .catch(err => console.error("Failed to load merchant link:", err))
      .finally(() => setIsLoading(false));
  }, []);

  const handleOpen = () => {
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col pt-12 relative overflow-hidden">
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

      <div className="flex-1 flex flex-col items-center justify-center px-8 gap-6 relative z-10">
        {isLoading ? (
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        ) : !url ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-10 h-10 text-brand-text/20" />
            <p className="text-sm font-bold text-brand-text/40">No merchant link has been set up yet.</p>
            <p className="text-[10px] text-brand-text/20">Contact admin support for assistance.</p>
          </div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={handleOpen}
            className="flex flex-col items-center gap-4 group active:scale-95 transition-all"
          >
            <div className="w-28 h-28 rounded-[32px] bg-brand-primary/10 border-2 border-brand-primary/30 flex items-center justify-center shadow-[0_0_40px_rgba(250,204,21,0.15)] group-hover:border-brand-primary/60 group-hover:shadow-[0_0_50px_rgba(250,204,21,0.25)] transition-all">
              <Store className="w-14 h-14 text-brand-primary" />
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-sm font-black text-brand-text uppercase tracking-widest">Visit Merchant</span>
              <span className="flex items-center gap-1.5 text-[10px] text-brand-text/40 font-medium">
                <ExternalLink className="w-3 h-3" />
                Opens in a new tab
              </span>
            </div>
          </motion.button>
        )}
      </div>
    </div>
  );
}
