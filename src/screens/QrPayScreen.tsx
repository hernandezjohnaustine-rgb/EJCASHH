import { motion, AnimatePresence } from "motion/react";
import { useState } from "react";
import { QrCode, Scan, Smartphone, Copy, X, Share2 } from "lucide-react";
import GlassCard from "../components/GlassCard";

export default function QrPayScreen({ onBack }: { onBack: () => void }) {
  const [activeMode, setActiveMode] = useState<'scan' | 'myqr'>('scan');
  const userCode = "8842-1204-UW77";

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-6 pt-12 overflow-y-auto pb-24 relative">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px]"></div>
      </div>

      <header className="flex items-center justify-between mb-8 relative z-10">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
          <X className="w-6 h-6" />
        </button>
        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
          <button 
            onClick={() => setActiveMode('scan')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'scan' ? 'bg-brand-primary text-brand-black shadow-lg' : 'text-white/40'}`}
          >
            Scan
          </button>
          <button 
            onClick={() => setActiveMode('myqr')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeMode === 'myqr' ? 'bg-brand-primary text-brand-black shadow-lg' : 'text-white/40'}`}
          >
            My QR
          </button>
        </div>
        <button className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
          <Share2 className="w-5 h-5 text-white/60" />
        </button>
      </header>

      <AnimatePresence mode="wait">
        {activeMode === 'scan' ? (
          <motion.div 
            key="scan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center gap-12 relative z-10"
          >
            {/* Scanner View Mockup */}
            <div className="relative w-full aspect-square max-w-[320px]">
               {/* Scanner Corners */}
               <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-brand-primary rounded-tl-3xl z-20"></div>
               <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-brand-primary rounded-tr-3xl z-20"></div>
               <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-brand-primary rounded-bl-3xl z-20"></div>
               <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-brand-primary rounded-br-3xl z-20"></div>
               
               {/* Scanner Content */}
               <div className="absolute inset-4 rounded-[40px] overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center shadow-inner">
                  <div className="absolute inset-0 bg-brand-navy/40 backdrop-blur-sm"></div>
                  {/* Scan Beam */}
                  <motion.div 
                    animate={{ top: ['10%', '90%', '10%'] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                    className="absolute left-4 right-4 h-[2px] bg-brand-primary shadow-[0_0_15px_#FACC15] z-10"
                  />
                  <QrCode className="w-32 h-32 text-white/5" />
               </div>
               
               <p className="absolute -bottom-12 left-0 right-0 text-center text-sm font-medium text-white/40">Align QR code within the frame</p>
            </div>

            <div className="flex gap-6">
               <button className="flex flex-col items-center gap-3 group">
                  <div className="w-16 h-16 glass-card flex items-center justify-center group-active:scale-95 transition-transform border-white/10">
                     <Smartphone className="w-6 h-6 text-brand-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Galleries</span>
               </button>
               <button className="flex flex-col items-center gap-3 group">
                  <div className="w-16 h-16 glass-card flex items-center justify-center group-active:scale-95 transition-transform border-white/10">
                     <Scan className="w-6 h-6 text-brand-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Flashlight</span>
               </button>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="myqr"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center gap-8 relative z-10"
          >
            <div className="text-center mb-4">
              <h3 className="text-xl font-display font-bold mb-1">User</h3>
              <p className="text-xs text-white/40 font-medium italic tracking-wide">Elite Member</p>
            </div>

            <div className="relative group p-8 rounded-[48px] bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-xl">
               <div className="absolute inset-0 bg-brand-primary/5 rounded-[48px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
               
               <div className="relative bg-white p-6 rounded-[32px] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                  {/* Real QR Code API usage for visualization */}
                  <div className="w-48 h-48 bg-white flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${userCode}&bgcolor=ffffff&color=05070a`} 
                      alt="My QR Code"
                      className="w-full h-full mix-blend-multiply"
                    />
                  </div>
                  
                  {/* Subtle Brand Logo in center of QR */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-brand-black border-4 border-white rounded-xl flex items-center justify-center">
                    <span className="text-[10px] font-black italic text-brand-primary">UW</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-[320px]">
              <div className="text-center px-8">
                 <p className="text-sm text-white/60 font-medium">Any BRAND NAME user can scan this QR code to send you money instantly.</p>
              </div>

              <GlassCard className="w-full flex items-center justify-between py-4 px-6 border-white/10">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                      <Scan className="w-5 h-5 text-brand-primary" />
                   </div>
                   <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">BRAND NAME-ID</p>
                      <p className="text-sm font-mono font-bold">{userCode}</p>
                   </div>
                </div>
                <button 
                  onClick={() => navigator.clipboard.writeText(userCode)}
                  className="p-3 bg-white/5 hover:bg-brand-primary/20 rounded-xl transition-all active:scale-90"
                >
                   <Copy className="w-4 h-4" />
                </button>
              </GlassCard>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mt-auto relative z-10 px-2 opacity-50 text-[10px] text-center text-white/20 font-black uppercase tracking-[0.3em]">
         Encrypted by UW-Sec Protocol
      </section>
    </div>
  );
}
