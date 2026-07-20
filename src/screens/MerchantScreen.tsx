import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { ChevronLeft, Store, Loader2, ExternalLink, AlertCircle } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

export default function MerchantScreen({ onBack }: { onBack: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [iframeLoaded, setIframeLoaded] = useState(false);

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

  return (
    <div className="min-h-screen bg-brand-black flex flex-col">
      <header className="px-6 pt-8 pb-4 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-brand-primary" />
          <h1 className="text-lg font-display font-black tracking-tight text-brand-text">Merchant</h1>
        </div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10 text-brand-text/60 hover:text-brand-primary transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : (
          <div className="w-10" />
        )}
      </header>

      <div className="flex-1 relative bg-white">
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-brand-black">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
          </div>
        ) : !url ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-brand-black px-8 text-center">
            <AlertCircle className="w-10 h-10 text-brand-text/20" />
            <p className="text-sm font-bold text-brand-text/40">No merchant link has been set up yet.</p>
            <p className="text-[10px] text-brand-text/20">Contact admin support for assistance.</p>
          </div>
        ) : (
          <>
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-brand-black">
                <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
              </div>
            )}
            <motion.iframe
              initial={{ opacity: 0 }}
              animate={{ opacity: iframeLoaded ? 1 : 0 }}
              src={url}
              title="Merchant"
              className="w-full h-full border-0"
              onLoad={() => setIframeLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </>
        )}
      </div>
    </div>
  );
}
