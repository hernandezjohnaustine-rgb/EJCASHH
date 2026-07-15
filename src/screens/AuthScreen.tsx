import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { ShieldCheck, LogIn, Mail, Lock, User, UserPlus, ArrowRight, Phone, CheckCircle2, XCircle, Loader2, Eye, EyeOff } from "lucide-react";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile 
} from "firebase/auth";
import { auth } from "../lib/firebase";

type ReferralStatus = "idle" | "checking" | "valid" | "invalid";

export default function AuthScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [identifier, setIdentifier] = useState(""); // Combined Email/Username/Phone
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState(""); // For registration
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralStatus, setReferralStatus] = useState<ReferralStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Check for referral code in URL (or a previously-saved one) and
  // send referred users straight to the Register form either way.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setReferralCode(ref);
      setMode("register");
      localStorage.setItem("referredBy", ref);
    } else {
      const saved = localStorage.getItem("referredBy");
      if (saved) {
        setReferralCode(saved);
        setMode("register");
      }
    }
  }, []);

  // Validate the referral code against the public referralCodes lookup
  // collection (NOT the protected `users` collection — that requires
  // isSignedIn(), but this check runs before the account exists, i.e.
  // while unauthenticated, so it must use a publicly-readable doc).
  const validateReferralCode = async (code: string): Promise<boolean> => {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return false;
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const snap = await getDoc(doc(db, "referralCodes", trimmed));
      return snap.exists();
    } catch (err) {
      console.error("Referral validation error:", err);
      return false;
    }
  };

  // Live-validate as the user types (debounced), so they get feedback
  // before hitting submit.
  useEffect(() => {
    if (mode !== "register") return;
    const trimmed = referralCode.trim();
    if (!trimmed) {
      setReferralStatus("idle");
      return;
    }
    setReferralStatus("checking");
    const handle = setTimeout(async () => {
      const valid = await validateReferralCode(trimmed);
      setReferralStatus(valid ? "valid" : "invalid");
    }, 500);
    return () => clearTimeout(handle);
  }, [referralCode, mode]);

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
        setError("Firebase Error: Please enable 'Google' as a sign-in provider.");
      } else if (err.code === "auth/popup-closed-by-user") {
        setError("Login cancelled.");
      } else {
        setError(err.message || "Failed to sign in.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- USERNAME / PHONE -> EMAIL LOOKUP ---
  // These read from small, purpose-built public lookup docs
  // (usernames/{username} and phoneNumbers/{phone}) instead of querying
  // the protected `users` collection, since that collection requires
  // isSignedIn() and the caller isn't authenticated yet at login time.
  const findEmailByIdentifier = async (id: string): Promise<string> => {
    if (id.includes("@")) return id;

    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("../lib/firebase");

    // Check if it's a phone number (all digits)
    const isPhone = /^\d+$/.test(id);
    const lookupCollection = isPhone ? "phoneNumbers" : "usernames";
    const lookupKey = isPhone ? id : id.toLowerCase();

    const lookupRef = doc(db, lookupCollection, lookupKey);
    const lookupSnap = await getDoc(lookupRef);

    if (!lookupSnap.exists()) {
      throw new Error(`${isPhone ? "Phone Number" : "Username"} not found.`);
    }

    const email = lookupSnap.data().email;
    if (!email) {
      throw new Error(`${isPhone ? "Phone Number" : "Username"} not found.`);
    }
    return email;
  };

  // Writes the public lookup docs used by findEmailByIdentifier above.
  // Called right after account creation so future username/phone logins
  // can resolve to this account's email.
  const createLookupDocs = async (uid: string, uname: string, phone: string, userEmail: string) => {
    const { doc, setDoc } = await import("firebase/firestore");
    const { db } = await import("../lib/firebase");

    const writes: Promise<void>[] = [];

    if (uname.trim()) {
      const usernameKey = uname.trim().toLowerCase();
      writes.push(setDoc(doc(db, "usernames", usernameKey), { uid, email: userEmail }));
    }
    if (phone.trim()) {
      writes.push(setDoc(doc(db, "phoneNumbers", phone.trim()), { uid, email: userEmail }));
    }

    if (writes.length) {
      await Promise.all(writes);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        const loginEmail = await findEmailByIdentifier(identifier);
        await signInWithEmailAndPassword(auth, loginEmail, password);
      } else {
        // Referral code is mandatory — validate before creating the account.
        const trimmedRef = referralCode.trim();
        if (!trimmedRef) {
          setError("A referral code is required to create an account.");
          setIsLoading(false);
          return;
        }
        const isValidRef = await validateReferralCode(trimmedRef);
        if (!isValidRef) {
          setReferralStatus("invalid");
          setError("That referral code doesn't match any existing account. Please double-check it and try again.");
          setIsLoading(false);
          return;
        }

        // Save extra info to localStorage for App.tsx to pick up
        localStorage.setItem("pendingUsername", username);
        localStorage.setItem("pendingPhone", phoneNumber);
        localStorage.setItem("referredBy", trimmedRef.toUpperCase());
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName });

        // Create the public username/phone -> email lookup docs so this
        // account can be found by username or phone at login time.
        try {
          await createLookupDocs(userCredential.user.uid, username, phoneNumber, email);
        } catch (lookupErr) {
          console.error("Failed to create username/phone lookup docs:", lookupErr);
        }
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
            <p className="text-[8px] text-brand-primary/60 font-bold uppercase tracking-[0.3em]">Digital Marketing Services</p>
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
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <User className="w-5 h-5 text-brand-text/20" />
                  </div>
                  <input 
                    required
                    type="text" 
                    placeholder="Full Name (Account Name)" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-14 bg-brand-text/5 border border-brand-border rounded-2xl pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all font-bold text-sm"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-primary uppercase">@</div>
                  <input 
                    required
                    type="text" 
                    placeholder="Unique Username" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ""))}
                    className="w-full h-14 bg-brand-text/5 border border-brand-border rounded-2xl pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all font-bold text-sm"
                  />
                </div>

                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 border-r border-brand-border/40 pr-2">
                    <Phone className="w-4 h-4 text-brand-text/20" />
                    <span className="text-[11px] font-black text-brand-primary">+63</span>
                  </div>
                  <input 
                    required
                    type="tel" 
                    placeholder="Phone Number (e.g. 9123456789)" 
                    maxLength={12}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                    className="w-full h-14 bg-brand-text/5 border border-brand-border rounded-2xl pl-16 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all font-bold text-sm"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            {mode === "login" ? (
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/20" />
            ) : (
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/20" />
            )}
            <input 
              required
              type={mode === "login" ? "text" : "email"} 
              placeholder={mode === "login" ? "Email / Username / Number" : "Email Address"} 
              value={mode === "login" ? identifier : email}
              onChange={(e) => mode === "login" ? setIdentifier(e.target.value) : setEmail(e.target.value)}
              className="w-full h-14 bg-brand-text/5 border border-brand-border rounded-2xl pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all font-bold text-sm"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-text/20" />
            <input 
              required
              type={showPassword ? "text" : "password"} 
              placeholder="Password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full h-14 bg-brand-text/5 border border-brand-border rounded-2xl pl-12 pr-12 focus:outline-none focus:border-brand-primary/30 transition-all font-bold text-sm"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text/30 hover:text-brand-text/60 transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {mode === "register" && (
             <div className="flex flex-col gap-2">
               <div className="relative">
                 <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-primary/40 uppercase">REF</div>
                 <input 
                   required
                   type="text" 
                   placeholder="Referral Code (Required)" 
                   value={referralCode}
                   onChange={(e) => {
                     setReferralCode(e.target.value);
                     localStorage.setItem("referredBy", e.target.value);
                   }}
                   className={`w-full h-14 bg-brand-primary/5 border rounded-2xl pl-12 pr-12 focus:outline-none transition-all font-mono text-xs font-bold text-brand-primary ${
                     referralStatus === "invalid" 
                       ? "border-red-500/50 focus:border-red-500" 
                       : referralStatus === "valid" 
                       ? "border-emerald-500/50 focus:border-emerald-500" 
                       : "border-brand-primary/20 focus:border-brand-primary/50"
                   }`}
                 />
                 <div className="absolute right-4 top-1/2 -translate-y-1/2">
                   {referralStatus === "checking" && (
                     <Loader2 className="w-4 h-4 text-brand-text/30 animate-spin" />
                   )}
                   {referralStatus === "valid" && (
                     <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                   )}
                   {referralStatus === "invalid" && (
                     <XCircle className="w-4 h-4 text-red-500" />
                   )}
                 </div>
               </div>

               {referralStatus === "valid" && (
                 <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-2">
                   <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                   <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest">Referral Applied: {referralCode}</span>
                 </div>
               )}
               {referralStatus === "invalid" && (
                 <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2">
                   <XCircle className="w-3.5 h-3.5 text-red-500" />
                   <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Invalid referral code</span>
                 </div>
               )}
             </div>
          )}

          <button 
            type="submit"
            disabled={isLoading || (mode === "register" && (referralStatus === "invalid" || referralStatus === "checking" || !referralCode.trim()))}
            className="w-full h-14 bg-brand-primary text-brand-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 shadow-[0_10px_20px_rgba(250,204,21,0.2)] hover:shadow-[0_15px_25px_rgba(250,204,21,0.3)] active:scale-95 transition-all disabled:opacity-50 mt-2"
          >
             {isLoading ? (
               <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-5 h-5 border-2 border-brand-black/20 border-t-brand-black rounded-full" />
             ) : (
               <>
                 {mode === "login" ? "Log-in" : "Create Account"}
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


