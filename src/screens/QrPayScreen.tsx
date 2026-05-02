import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect, useRef } from "react";
import { QrCode, Scan, Smartphone, Copy, X, Share2, Loader2, Zap, ZapOff, RefreshCcw } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { Html5Qrcode } from "html5-qrcode";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

export default function QrPayScreen({ onBack, onResult }: { 
  onBack: () => void,
  onResult?: (recipient: { id: string, name: string, email: string, initial: string }) => void
}) {
  const [activeMode, setActiveMode] = useState<'scan' | 'myqr'>('scan');
  const [scanning, setScanning] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const userCode = auth.currentUser ? "EJ-" + auth.currentUser.uid.substring(0, 6).toUpperCase() : "8842-1204-EJ77";
  const userName = auth.currentUser?.displayName || "User";

  // Cleanup scanner on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  // Initialize camera scanner
  const startCamera = async () => {
    setError(null);
    try {
      const scanner = new Html5Qrcode("scanner-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        () => {} // scan failure is ignored
      );
      setScanning(true);
    } catch (err: any) {
      console.error("Camera error:", err);
      setError("Unable to access camera. Please check permissions.");
    }
  };

  const stopCamera = async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      await scannerRef.current.stop();
      setScanning(false);
      setIsFlashOn(false);
    }
  };

  useEffect(() => {
    if (activeMode === 'scan') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [activeMode]);

  const onScanSuccess = async (decodedText: string) => {
    if (isLoading) return;
    
    // Check if it's an EJCASHH ID (EJ-XXXXXX) or a full UID
    const id = decodedText.trim();
    setIsLoading(true);
    
    try {
      let recipientDoc: any = null;
      
      // Try by referral code (the shorter ID)
      const qRef = query(collection(db, "users"), where("referralCode", "==", id), limit(1));
      const snapRef = await getDocs(qRef);
      
      if (!snapRef.empty) {
        recipientDoc = snapRef.docs[0];
      } else {
        // Try by UID directly
        const qUid = query(collection(db, "users"), where("uid", "==", id), limit(1));
        const snapUid = await getDocs(qUid);
        if (!snapUid.empty) {
          recipientDoc = snapUid.docs[0];
        }
      }

      if (recipientDoc) {
        const data = recipientDoc.data();
        if (onResult) {
          onResult({
            id: recipientDoc.id,
            name: data.displayName || data.email?.split('@')[0] || "User",
            email: data.email || "",
            initial: (data.displayName?.[0] || data.email?.[0] || "U").toUpperCase()
          });
        }
      } else {
        setError("Invalid QR Code. User not found.");
        setTimeout(() => setError(null), 3000);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsLoading(true);
    
    try {
      const html5QrCode = new Html5Qrcode("file-processor");
      const decodedText = await html5QrCode.scanFile(file, true);
      onScanSuccess(decodedText);
    } catch (err: any) {
      setError("Could not read QR code from image.");
      console.error("File scan error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleFlash = async () => {
    if (scannerRef.current && (scannerRef.current as any).isScanning) {
      try {
        const track = (scannerRef.current as any).getRunningTrack();
        const capabilities = track.getCapabilities() as any;
        
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: !isFlashOn }]
          } as any);
          setIsFlashOn(!isFlashOn);
        } else {
          setError("Flashlight not supported on this device.");
        }
      } catch (err) {
        console.error("Flash toggle error:", err);
      }
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-6 pt-12 overflow-y-auto pb-24 relative">
      {/* Background Glow */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-64 h-64 bg-brand-primary/10 rounded-full blur-[100px]"></div>
      </div>

      <header className="flex items-center justify-between mb-8 relative z-20">
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

      <div id="file-processor" className="hidden"></div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        accept="image/*" 
        className="hidden" 
      />

      <AnimatePresence mode="wait">
        {activeMode === 'scan' ? (
          <motion.div 
            key="scan"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex-1 flex flex-col items-center justify-center gap-12 relative z-10"
          >
            {/* Scanner Container */}
            <div className="relative w-full aspect-square max-w-[320px]">
               {/* Scanner Corners */}
               <div className="absolute top-0 left-0 w-12 h-12 border-t-4 border-l-4 border-brand-primary rounded-tl-3xl z-20"></div>
               <div className="absolute top-0 right-0 w-12 h-12 border-t-4 border-r-4 border-brand-primary rounded-tr-3xl z-20"></div>
               <div className="absolute bottom-0 left-0 w-12 h-12 border-b-4 border-l-4 border-brand-primary rounded-bl-3xl z-20"></div>
               <div className="absolute bottom-0 right-0 w-12 h-12 border-b-4 border-r-4 border-brand-primary rounded-br-3xl z-20"></div>
               
               {/* The Scanner Viewport */}
               <div className="absolute inset-4 rounded-[40px] overflow-hidden bg-brand-navy/40 border border-white/10 flex items-center justify-center shadow-inner relative group">
                  <div id="scanner-container" className="w-full h-full object-cover [&>video]:w-full [&>video]:h-full [&>video]:object-cover overflow-hidden"></div>
                  
                  {isLoading && (
                    <div className="absolute inset-0 z-30 bg-brand-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
                       <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                       <p className="text-xs font-black uppercase tracking-widest text-brand-primary">Processing...</p>
                    </div>
                  )}

                  {/* Manual Scan Beam */}
                  {scanning && (
                    <motion.div 
                      animate={{ top: ['10%', '90%', '10%'] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                      className="absolute left-4 right-4 h-[2px] bg-brand-primary shadow-[0_0_15px_#FACC15] z-20 pointer-events-none"
                    />
                  )}

                  {!scanning && !isLoading && (
                    <div className="flex flex-col items-center gap-4 px-8 text-center text-white/20">
                       <QrCode className="w-16 h-16" />
                       <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">Initializing camera...</p>
                    </div>
                  )}
               </div>
               
               {error ? (
                 <p className="absolute -bottom-12 left-0 right-0 text-center text-xs font-bold text-red-500 uppercase tracking-wider">{error}</p>
               ) : (
                 <p className="absolute -bottom-12 left-0 right-0 text-center text-[10px] font-black uppercase tracking-widest text-white/40">Align QR code within the frame</p>
               )}
            </div>

            <div className="flex gap-6 mt-4">
               <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-3 group"
               >
                  <div className="w-16 h-16 glass-card flex items-center justify-center group-active:scale-95 transition-transform border-white/10 active:border-brand-primary/50">
                     <Smartphone className="w-6 h-6 text-brand-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Galleries</span>
               </button>
               <button 
                onClick={toggleFlash}
                className="flex flex-col items-center gap-3 group"
               >
                  <div className={`w-16 h-16 glass-card flex items-center justify-center group-active:scale-95 transition-transform border-white/10 ${isFlashOn ? 'bg-brand-primary/20 border-brand-primary/50' : ''}`}>
                     {isFlashOn ? <Zap className="w-6 h-6 text-brand-primary" /> : <ZapOff className="w-6 h-6 text-brand-primary" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Flashlight</span>
               </button>
               <button 
                onClick={() => {
                   stopCamera().then(startCamera);
                }}
                className="flex flex-col items-center gap-3 group"
               >
                  <div className="w-16 h-16 glass-card flex items-center justify-center group-active:scale-95 transition-transform border-white/10 active:border-brand-primary/50">
                     <RefreshCcw className="w-6 h-6 text-brand-primary" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">Restart</span>
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
              <h3 className="text-xl font-display font-black tracking-tight italic uppercase">{userName}</h3>
              <p className="text-[10px] text-brand-primary/60 font-black uppercase tracking-[0.2em] animate-pulse italic">Verified Member</p>
            </div>

            <div className="relative group p-8 rounded-[48px] bg-white/[0.03] border border-white/10 shadow-2xl backdrop-blur-xl">
               <div className="absolute inset-0 bg-brand-primary/5 rounded-[48px] blur-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
               
               <div className="relative bg-white p-6 rounded-[32px] shadow-[0_0_40px_rgba(255,255,255,0.1)]">
                  <div className="w-48 h-48 bg-white flex items-center justify-center overflow-hidden">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${userCode}&bgcolor=ffffff&color=05070a`} 
                      alt="My QR Code"
                      className="w-full h-full mix-blend-multiply"
                    />
                  </div>
                  
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-brand-black border-4 border-white rounded-xl flex items-center justify-center">
                    <span className="text-[10px] font-black italic text-brand-primary">EJ</span>
                  </div>
               </div>
            </div>

            <div className="flex flex-col items-center gap-6 w-full max-w-[320px]">
              <div className="text-center px-8">
                 <p className="text-xs text-brand-text/60 font-medium">Any EJCASHH user can scan this QR code to send you money instantly.</p>
              </div>

              <GlassCard className="w-full flex items-center justify-between py-4 px-6 border-white/10">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center">
                      <Scan className="w-5 h-5 text-brand-primary" />
                   </div>
                   <div>
                      <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">EJCASHH-ID</p>
                      <p className="text-sm font-mono font-bold tracking-tighter text-brand-primary">{userCode}</p>
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
         Encrypted by EJ-Sec Protocol
      </section>
    </div>
  );
}

