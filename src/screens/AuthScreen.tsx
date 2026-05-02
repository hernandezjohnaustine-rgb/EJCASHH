import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { ShieldCheck, LogIn, Mail, Lock, User, UserPlus, ArrowRight, Github } from "lucide-react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { auth } from "../lib/firebase";

export default function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
      setMode("register");
    }
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLogin();
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/configuration-not-found") {
        setError("Firebase Error: Please enable 'Google' as a sign-in provider in your Firebase Console (Authentication > Sign-in method).");
      } else if (err.code === "auth/unauthorized-domain") {
        setError(`Firebase Error: Unauthorized domain. Please add "${window.location.hostname}" to your Firebase Console (Authentication > Settings > Authorized domains).`);
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Login cancelled. Please try again.");
      } else {
        setError(err.message || "Failed to sign in. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Check URL for ref code
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
      localStorage.setItem("referredBy", ref);
    } else {
      // Fallback to localStorage
      const saved = localStorage.getItem("referredBy");
      if (saved) setReferralCode(saved);
    }
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });
      }
      onLogin();
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Authentication failed. Check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black flex flex-col p-8 pt-10 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-100px] left-[-100px] w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
      
      <div className="flex flex-col items-center gap-8 relative z-10 w-full max-w-[340px] mx-auto">
        {/* Logo Section */}
        <div className="flex flex-col items-center gap-3">
          <motion.div
             initial={{ scale: 0.8, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-16 h-16 relative"
          >
             <div className="absolute inset-0 bg-brand-primary blur-[30px] opacity-20"></div>
             <div className="absolute inset-0 rounded-2xl border border-brand-primary/30 bg-brand-navy flex items-center justify-center overflow-hidden">
                <div className="relative text-2xl font-display font-black italic tracking-tighter text-brand-primary flex flex-col items-center">
                   <span className="text-3xl leading-none">EJ</span>
                   <span className="text-[8px] tracking-[2px] mt-1">CASHH</span>
                </div>
             </div>
          </motion.div>
          <div className="text-center">
            <h1 className="text-xl font-display font-black tracking-[4px] text-brand-primary">EJCASHH</h1>
            <p className="text-[8px] text-brand-primary/60 font-bold uppercase tracking-[0.3em]">Fintech Ecosystem</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="w-full h-14 bg-brand-card/5 p-1 rounded-2xl border border-brand-border flex">
           <button 
             onClick={() => setMode("login")}
             className={`flex-1 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === "login" ? "bg-brand-primary text-brand-black shadow-lg" : "text-brand-text/40"}`}
           >
              <LogIn className="w-4 h-4" />
              Login
           </button>
           <button 
             onClick={() => setMode("register")}
             className={`flex-1 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${mode === "register" ? "bg-brand-primary text-brand-black shadow-lg" : "text-brand-text/40"}`}
           >
              <UserPlus className="w-4 h-4" />
              Register
           </button>
        </div>

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="w-full flex flex-col gap-4">
          <AnimatePresence mode="wait">
            {mode === "register" && (
              <motion.div 
                key="name"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-4"
              >
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/20" />
                  <input 
                    required
                    type="text" 
                    placeholder="Full Name" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-14 bg-brand-text/5 border border-brand-border rounded-2xl pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all font-bold text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/20" />
            <input 
              required
              type="email" 
              placeholder="Email Address" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full h-14 bg-brand-text/5 border border-brand-border rounded-2xl pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all font-bold text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/20" />
            <input 
              required
              type="password" 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-brand-text/5 border border-brand-border rounded-2xl pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all font-bold text-sm"
            />
          </div>

          {mode === "register" && (
             <div className="relative">
               <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-primary/40 uppercase">REF</div>
               <input 
                 type="text" 
                 placeholder="Referral Code (Optional)" 
                 value={referralCode}
                 onChange={(e) => {
                   setReferralCode(e.target.value);
                   localStorage.setItem("referredBy", e.target.value);
                 }}
                 className="w-full h-14 bg-brand-primary/5 border border-brand-primary/20 rounded-2xl pl-12 pr-4 focus:outline-none focus:border-brand-primary/50 transition-all font-mono text-xs font-bold text-brand-primary"
               />
             </div>
          )}

          {mode === "register" && referralCode && (
            <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2 mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Referral Applied: {referralCode}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-brand-primary text-brand-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(250,204,21,0.2)] hover:shadow-[0_15px_25px_rgba(250,204,21,0.3)] active:scale-95 transition-all disabled:opacity-50 mt-2"
          >
             {isLoading ? (
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-brand-black/20 border-t-brand-black rounded-full" />
             ) : (
               <>
                 {mode === "login" ? "Enter Gateway" : "Create Account"}
                 <ArrowRight className="w-4 h-4" />
               </>
             )}
          </button>
        </form>

        <div className="relative w-full h-px bg-brand-border/40 my-2">
           <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-brand-black px-4 text-[10px] text-brand-text/20 font-black uppercase tracking-widest">Or Continue With</span>
        </div>

        <button 
          onClick={handleGoogleLogin}
          type="button"
          className="w-full h-14 rounded-2xl bg-brand-text/5 border border-brand-border text-brand-text flex items-center justify-center gap-3 hover:bg-brand-text/10 transition-all font-bold"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
          <span className="text-sm">Sign in with Google</span>
        </button>

        {error && (
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-400 text-[10px] font-bold uppercase tracking-widest text-center px-4"
          >
            {error}
          </motion.p>
        )}
      </div>

      <div className="mt-auto flex flex-col items-center gap-4 relative z-10">
        <p className="text-[10px] text-brand-text/30 font-medium text-center">
          By joining EJCASHH, you participate in our<br/>
          <span className="text-brand-primary">10-Level Reward Distribution Program</span>
        </p>
        <div className="flex items-center gap-2 text-brand-text/20">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-[9px] font-black uppercase tracking-[0.3em]">Institutional Grade Security</span>
        </div>
      </div>
    </div>
  );
}

