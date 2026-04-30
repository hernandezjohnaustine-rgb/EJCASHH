import { motion, AnimatePresence } from "motion/react";
import { X, Download, Share2, Copy } from "lucide-react";
import GlassCard from "./GlassCard";

interface QrInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  referralCode: string;
}

export default function QrInviteModal({ isOpen, onClose, referralCode }: QrInviteModalProps) {
  const inviteUrl = `https://ejcashh.app/join?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-black/80 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-x-6 top-1/2 -translate-y-1/2 z-[101] max-w-sm mx-auto"
          >
            <GlassCard className="!p-8 overflow-hidden relative border-brand-neon/20 bg-brand-navy shadow-[0_0_50px_rgba(0,242,255,0.2)]">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>

              <div className="flex flex-col items-center gap-6">
                <div className="text-center">
                  <h3 className="text-xl font-display font-bold tracking-tight">Invite to EJCASHH</h3>
                  <p className="text-xs text-white/40 mt-1 uppercase tracking-widest font-black">Your Unique QR Code</p>
                </div>

                <div className="relative p-6 bg-white rounded-[32px] overflow-hidden shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                   <img 
                     src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(inviteUrl)}&bgcolor=ffffff&color=05070A`}
                     alt="Invite QR Code"
                     className="w-48 h-48"
                   />
                   <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-brand-navy border-2 border-white rounded-xl flex items-center justify-center shadow-xl">
                         <span className="text-[10px] font-black italic text-brand-neon">EJ</span>
                      </div>
                   </div>
                </div>

                <div className="w-full space-y-4">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">Referral ID</span>
                    <p className="text-sm font-mono font-bold text-brand-neon tracking-wider">{referralCode}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button 
                      onClick={handleCopy}
                      className="flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                      <Copy className="w-4 h-4 text-brand-neon" />
                      Copy Link
                    </button>
                    <button className="flex items-center justify-center gap-2 py-3 bg-brand-neon text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-[0_0_15px_#00F2FF] hover:brightness-110 active:scale-95 transition-all">
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white transition-all">
                    <Download className="w-4 h-4" />
                    Save QR Image
                  </button>
                </div>
              </div>
            </GlassCard>
            
            <p className="text-center text-[10px] text-white/20 mt-6 uppercase tracking-[0.3em] font-bold">
               Fast • Secure • Smart Payments
            </p>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
