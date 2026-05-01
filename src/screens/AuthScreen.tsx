import { motion } from "motion/react";
import { useState } from "react";
import { ShieldCheck, LogIn } from "lucide-react";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth } from "../lib/firebase";

export default function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLoggingIn(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to sign in. Please try again.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-8 pt-20 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="flex flex-col items-center text-center gap-12 mb-12 relative z-10 w-full max-w-[320px] mx-auto">
        <div className="flex flex-col items-center gap-4">
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-20 h-20 relative"
          >
             <div className="absolute inset-0 bg-brand-primary blur-[30px] opacity-20"></div>
             <div className="absolute inset-0 rounded-2xl border border-brand-primary/30 bg-brand-navy flex items-center justify-center overflow-hidden">
               <div className="relative text-3xl font-display font-black italic tracking-tighter text-brand-primary flex flex-col items-center">
                  <span className="text-4xl leading-none">EJ</span>
                  <span className="text-[10px] tracking-[2px] mt-1">CASHH</span>
               </div>
             </div>
          </motion.div>
          <h1 className="text-2xl font-display font-black tracking-[4px] text-brand-primary">EJCASHH</h1>
          <p className="text-[10px] text-brand-primary/60 font-bold uppercase tracking-[0.3em] font-sans">Digital Marketing Services</p>
        </div>

        <div className="text-center w-full">
          <h2 className="text-4xl font-bold tracking-tight leading-tight mb-4">
            Financial<br/>
            <span className="text-brand-primary drop-shadow-[0_0_10px_rgba(16,185,129,0.4)]">Evolution.</span>
          </h2>
          <p className="text-sm text-brand-text/40 font-medium px-4">The ultimate fintech ecosystem with built-in earning opportunities.</p>
        </div>

        <div className="w-full flex flex-col gap-4 mt-8">
          <button 
            disabled={isLoggingIn}
            onClick={handleGoogleLogin}
            className="w-full h-14 rounded-2xl bg-white text-black font-black flex items-center justify-center gap-3 hover:bg-white/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            {isLoggingIn ? (
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full"
              />
            ) : (
              <>
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span>Continue with Google</span>
              </>
            )}
          </button>
          
          {error && (
            <p className="text-red-400 text-[10px] font-bold uppercase tracking-widest">{error}</p>
          )}
        </div>
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 relative z-10">
        <p className="text-[10px] text-brand-text/30 font-medium">By continuing, you agree to our Terms of Service</p>
        <div className="flex items-center gap-2 text-brand-text/20">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">End-to-End Encrypted</span>
        </div>
      </div>
    </div>
  );
}
