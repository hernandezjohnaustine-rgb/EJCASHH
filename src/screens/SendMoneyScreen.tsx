import { motion } from "motion/react";
import { useState, useEffect } from "react";
import { ArrowLeft, Search, User as UserIcon, ChevronRight, Phone, Star, Landmark, ScanLine, PlusCircle, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import GlassCard from "../components/GlassCard";
import { collection, query, where, getDocs, limit, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../lib/firebase";
import { processTransfer } from "../services/earningsService";

interface UserContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  initial: string;
}

export default function SendMoneyScreen({ onBack, onConfirm, balance, initialRecipient, onScanClick }: { 
  onBack: () => void, 
  onConfirm: (amount: number, recipient: string) => void,
  balance: number,
  initialRecipient?: UserContact | null,
  onScanClick?: () => void
}) {
  const [recipient, setRecipient] = useState<UserContact | null>(initialRecipient || null);
  const [amount, setAmount] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserContact[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Search users in Firestore
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.length < 3) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      try {
        const usersCol = collection(db, "users");
        
        // Split into 3 queries to avoid range filter on multiple fields index requirement
        const qEmail = query(
          usersCol,
          where("email", ">=", searchQuery),
          where("email", "<=", searchQuery + '\uf8ff'),
          limit(5)
        );
        
        const qName = query(
          usersCol,
          where("displayName", ">=", searchQuery),
          where("displayName", "<=", searchQuery + '\uf8ff'),
          limit(5)
        );

        const qPhone = query(
          usersCol,
          where("phoneNumber", ">=", searchQuery),
          where("phoneNumber", "<=", searchQuery + '\uf8ff'),
          limit(5)
        );

        const qReferral = query(
          usersCol,
          where("referralCode", ">=", searchQuery.toUpperCase()),
          where("referralCode", "<=", searchQuery.toUpperCase() + '\uf8ff'),
          limit(5)
        );

        const [snapEmail, snapName, snapPhone, snapReferral] = await Promise.all([
          getDocs(qEmail),
          getDocs(qName),
          getDocs(qPhone),
          getDocs(qReferral)
        ]);

        const allDocs = [...snapEmail.docs, ...snapName.docs, ...snapPhone.docs, ...snapReferral.docs];
        
        // Deduplicate and process results
        const seenIds = new Set();
        const results: UserContact[] = [];

        for (const doc of allDocs) {
          if (seenIds.has(doc.id) || doc.id === auth.currentUser?.uid) continue;
          
          seenIds.add(doc.id);
          const data = doc.data();
          results.push({
            id: doc.id,
            name: data.displayName || data.email?.split('@')[0] || "User",
            email: data.email || "",
            phone: data.phoneNumber || "",
            initial: (data.displayName?.[0] || data.email?.[0] || "U").toUpperCase()
          });
        }
        
        setSearchResults(results.slice(0, 10));
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(searchUsers, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSend = async () => {
    if (!recipient || !auth.currentUser) return;
    const amt = parseFloat(amount);
    if (amt <= 0 || isNaN(amt)) {
      setError("Please enter a valid amount");
      return;
    }
    if (amt > balance) {
      setError("Insufficient balance");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      await processTransfer(auth.currentUser.uid, recipient.id, amt);
      setSuccess(true);
      setTimeout(() => {
        onConfirm(amt, recipient.name);
      }, 2000);
    } catch (err: any) {
      let message = "Transfer failed. Please try again.";
      try {
        const parsed = JSON.parse(err.message);
        message = parsed.error || message;
      } catch (e) {
        message = err.message || message;
      }
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-brand-black p-6 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center mb-8"
        >
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </motion.div>
        <h2 className="text-2xl font-display font-black mb-2 italic">Transfer Success!</h2>
        <p className="text-brand-text/60 mb-8 font-medium">
          ₱{parseFloat(amount).toLocaleString()} sent to {recipient?.name}
        </p>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2 }}
            className="h-full bg-green-500"
          />
        </div>
      </div>
    );
  }

  if (recipient) {
    return (
      <div className="flex flex-col gap-8 h-full bg-brand-black p-6 pt-12 overflow-y-auto">
        <header className="flex items-center justify-between">
          <button onClick={() => setRecipient(null)} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-lg font-display font-bold italic tracking-tighter">TRANSFER</h2>
          <div className="w-10"></div>
        </header>

        <section className="flex flex-col items-center gap-4 py-8">
          <div className="w-20 h-20 rounded-[28px] bg-brand-primary flex items-center justify-center text-2xl font-black border-4 border-white/5 shadow-2xl text-brand-black italic">
            {recipient.initial}
          </div>
          <div className="text-center">
            <h3 className="text-xl font-black tracking-tight">{recipient.name}</h3>
            <p className="text-sm text-white/40 font-medium">{recipient.email}</p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="relative">
             <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-display font-black text-brand-primary italic">₱</span>
             <input
               autoFocus
               type="number"
               value={amount}
               onChange={(e) => setAmount(e.target.value)}
               placeholder="0.00"
               className="w-full bg-white/5 border border-white/10 rounded-[32px] py-10 px-12 text-5xl font-display font-black text-center focus:outline-none focus:border-brand-primary/50 transition-all placeholder:text-white/5 italic"
             />
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {["100", "500", "1000", "5000"].map(val => (
                <button 
                  key={val}
                  onClick={() => setAmount(val)}
                  className="bg-white/5 hover:bg-brand-primary hover:text-brand-black px-4 py-2 rounded-xl text-xs font-bold transition-all border border-white/5 active:scale-95"
                >
                  ₱{parseInt(val).toLocaleString()}
                </button>
            ))}
          </div>
        </section>

        <section className="mt-4">
           <GlassCard className="!p-4 bg-brand-navy/40 border-brand-primary/10">
              <div className="flex justify-between items-center">
                 <span className="text-xs text-brand-text/40 font-bold uppercase tracking-widest">Available Balance</span>
                 <span className="text-xs font-black text-brand-primary">₱{balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
              </div>
           </GlassCard>
        </section>

        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-widest">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <div className="mt-auto pb-4">
          <button 
            onClick={handleSend}
            disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || isProcessing}
            className={`w-full h-16 rounded-2xl text-lg font-black tracking-tight transition-all shadow-[0_10px_30px_rgba(250,204,21,0.2)] flex items-center justify-center gap-2 ${
              (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > balance || isProcessing) 
                ? 'bg-white/5 text-white/20' 
                : 'bg-brand-primary text-brand-black'
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing...
              </>
            ) : parseFloat(amount) > balance ? "Insufficient Balance" : "Send Instantly"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="flex flex-col gap-8 h-full bg-brand-black p-6 pt-12 overflow-y-auto"
    >
      <header className="flex items-center justify-between">
        <button onClick={onBack} className="p-2 hover:bg-white/5 rounded-2xl transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="text-lg font-display font-black italic tracking-widest uppercase">Send Money</h2>
        <div className="w-10"></div>
      </header>

      {/* Search */}
      <section className="flex flex-col gap-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-primary/40" />
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Name, number or email..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 focus:outline-none focus:border-brand-primary/30 transition-all text-sm font-medium italic"
          />
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4 h-4 text-brand-primary animate-spin" />
            </div>
          )}
        </div>
      </section>

      {/* Results */}
      {searchQuery.length >= 3 && (
        <section className="flex flex-col gap-3">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 ml-2">Search Results</h3>
          {searchResults.length > 0 ? (
            searchResults.map(user => (
              <button 
                key={user.id} 
                onClick={() => setRecipient(user)}
                className="glass-card !p-4 flex items-center justify-between group hover:border-brand-primary/30 transition-all"
              >
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center font-black text-brand-primary italic">
                    {user.initial}
                   </div>
                   <div className="text-left">
                      <h4 className="text-sm font-black">{user.name}</h4>
                      <p className="text-[10px] text-white/40 tracking-wider font-medium">{user.email}</p>
                   </div>
                </div>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white transition-colors" />
              </button>
            ))
          ) : !isSearching && (
            <p className="text-xs text-white/20 text-center py-4 italic">No matching users found</p>
          )}
        </section>
      )}

      {/* Quick Services */}
      <section className="grid grid-cols-2 gap-3">
        <button 
          onClick={onScanClick}
          className="btn-ghost !py-4 border-brand-primary/5 active:scale-95 transition-all"
        >
          <ScanLine className="w-5 h-5 text-brand-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest">Scan QR</span>
        </button>
        <button className="btn-ghost !py-4 border-brand-primary/5">
          <Landmark className="w-5 h-5 text-brand-primary" />
          <span className="text-[10px] font-black uppercase tracking-widest">Bank Transfer</span>
        </button>
      </section>

      <div className="mt-auto py-8 text-center px-8">
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] leading-relaxed">
          Search for another user's email to transfer funds instantly within the EJCASHH network.
        </p>
      </div>
    </motion.div>
  );
}
