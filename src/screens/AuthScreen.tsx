import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { Eye, EyeOff, Lock, ChevronRight, Fingerprint, ShieldCheck } from "lucide-react";

export default function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [pin, setPin] = useState("");
  const [isFaceId, setIsFaceId] = useState(false);

  useEffect(() => {
    if (pin.length === 6) {
      setTimeout(onLogin, 500);
    }
  }, [pin, onLogin]);

  const handleKeypad = (val: string) => {
    if (pin.length < 6) {
      setPin(prev => prev + val);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-8 pt-20 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-brand-blue/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="flex flex-col items-start gap-12 mb-12 relative z-10 w-full max-w-[300px] mx-auto">
        <div className="flex items-center gap-4">
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-12 h-12 relative"
          >
             <div className="absolute inset-0 bg-brand-neon blur-[20px] opacity-20"></div>
             <div className="absolute inset-0 rounded-xl border border-brand-neon/30 bg-brand-navy flex items-center justify-center overflow-hidden">
               <div className="relative text-xl font-display font-black italic tracking-tighter text-brand-neon">EJ</div>
             </div>
          </motion.div>
          <h1 className="text-xl font-display font-bold tracking-[2px]">EJCASHH</h1>
        </div>

        <div className="text-left">
          <h2 className="text-4xl font-bold tracking-tight leading-tight">
            Welcome<br/>
            <span className="text-brand-neon drop-shadow-[0_0_10px_rgba(0,242,255,0.4)]">Back.</span>
          </h2>
          <p className="text-sm text-white/40 mt-4 font-medium">Please enter your 6-digit security PIN to access your account.</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 mb-auto relative z-10">
        <div className="flex gap-4">
          {[...Array(6)].map((_, i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                pin.length > i 
                ? "bg-brand-neon border-brand-neon shadow-[0_0_10px_#00F0FF]" 
                : "border-white/20 bg-transparent"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-y-6 gap-x-12 mt-auto mb-8 max-w-[300px] mx-auto">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
          <button 
            key={num}
            onClick={() => handleKeypad(num.toString())}
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold hover:bg-white/5 active:scale-95 transition-all"
          >
            {num}
          </button>
        ))}
        <button 
           className="w-16 h-16 rounded-full flex items-center justify-center hover:bg-white/5 active:scale-95 transition-all text-brand-neon"
           onClick={() => setIsFaceId(!isFaceId)}
        >
          <Fingerprint className="w-8 h-8" />
        </button>
        <button 
          onClick={() => handleKeypad("0")}
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-semibold hover:bg-white/5 active:scale-95 transition-all"
        >
          0
        </button>
        <button 
          onClick={handleBackspace}
          className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold hover:bg-white/5 active:scale-95 transition-all text-white/40"
        >
          ⌫
        </button>
      </div>

      <div className="flex flex-col items-center gap-4">
        <button className="text-xs font-bold text-white/40 hover:text-white uppercase tracking-widest transition-colors">Forgot PIN?</button>
        <div className="flex items-center gap-2 text-white/20">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
}
