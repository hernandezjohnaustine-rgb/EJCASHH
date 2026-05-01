/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, limit, getDocFromServer } from "firebase/firestore";
import { auth, db } from "./lib/firebase";
import { handleFirestoreError, OperationType } from "./lib/firestoreUtils";
import BottomNav from "./components/BottomNav";
import Header from "./components/Header";
import AuthScreen from "./screens/AuthScreen";
import HomeScreen from "./screens/HomeScreen";
import SendMoneyScreen from "./screens/SendMoneyScreen";
import BuyLoadScreen from "./screens/BuyLoadScreen";
import BankTransferScreen from "./screens/BankTransferScreen";
import PayBillsScreen from "./screens/PayBillsScreen";
import QrPayScreen from "./screens/QrPayScreen";
import ReferralDashboard from "./screens/ReferralDashboard";
import ProfileScreen from "./screens/ProfileScreen";
import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";
import ActivationScreen from "./screens/ActivationScreen";
import CashInScreen from "./screens/CashInScreen";
import WithdrawScreen from "./screens/WithdrawScreen";
import TeamNetworkScreen from "./screens/TeamNetworkScreen";
import { UserStats, Transaction } from "./types";
import { CheckCircle2, ShieldCheck } from "lucide-react";

import TradingBotScreen from "./screens/TradingBotScreen";
import RiderScreen from "./screens/RiderScreen";
import MarketplaceScreen from "./screens/MarketplaceScreen";
import AssistantScreen from "./screens/AssistantScreen";

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [activeTab, setActiveTab] = useState("home");
  const [activeView, setActiveView] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userStats, setUserStats] = useState<UserStats>({
    vipLevel: 1,
    directReferrals: 0,
    teamSize: 0,
    totalEarnings: 0,
    isActivated: false,
    tradingInvested: 0,
    tradingEarnings: 0,
    tradingDaysCompleted: 0,
    tradingActive: false,
    tradingClaimedToday: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  useEffect(() => {
    // Connection test
    const testConnection = async () => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if(error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration. The client is offline.");
        }
      }
    };
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Ensure user exists in Firestore
        const userDocRef = doc(db, "users", firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef);
          
          if (!userDoc.exists()) {
            const newUser: any = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName,
              photoURL: firebaseUser.photoURL,
              isActivated: false,
              balance: 0,
              earningsWallet: 0,
              referralCode: "EJ-" + firebaseUser.uid.substring(0, 6).toUpperCase(),
              createdAt: new Date().toISOString(),
            };
            await setDoc(userDocRef, newUser);
            setUserStats(prev => ({ ...prev, isActivated: false }));
          } else {
            const data = userDoc.data();
            setBalance(data.balance || 0);
            setUserStats(prev => ({
              ...prev,
              isActivated: data.isActivated || false,
              totalEarnings: data.earningsWallet || 0,
            }));
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, "users/" + firebaseUser.uid);
        }

        // Real-time user data
        const subUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setBalance(data.balance || 0);
            setUserStats(prev => ({
              ...prev,
              isActivated: data.isActivated || false,
              totalEarnings: data.earningsWallet || 0,
            }));
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, "users/" + firebaseUser.uid);
        });

        // Real-time transactions
        const q = query(
          collection(db, "transactions"), 
          where("userId", "==", firebaseUser.uid),
          orderBy("timestamp", "desc"),
          limit(20)
        );
        const subTx = onSnapshot(q, (snapshot) => {
          const txs: any[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            amount: `${doc.data().type === 'in' ? '+' : '-'}₱${doc.data().amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
            date: new Date(doc.data().timestamp).toLocaleString(),
          }));
          setTransactions(txs);
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, "transactions");
        });

        setIsLoading(false);
        return () => {
          subUser();
          subTx();
        };
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleClaimTrading = async () => {
    if (!user || userStats.tradingClaimedToday) return;
    
    const profit = userStats.tradingInvested * 0.05;
    const userDocRef = doc(db, "users", user.uid);
    
    await setDoc(userDocRef, {
      balance: balance + profit,
      tradingEarnings: userStats.tradingEarnings + profit,
      tradingClaimedToday: true,
      tradingDaysCompleted: userStats.tradingDaysCompleted + 1
    }, { merge: true });

    await addTransaction({
      title: "Trading ROI Distribution",
      rawAmount: profit,
      category: "Trading",
      type: "in",
      status: "Completed"
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleActivation = async () => {
    if (!user) return;
    
    const userDocRef = doc(db, "users", user.uid);
    
    // Create transaction for activation
    await addTransaction({ 
      title: "Account Activation Fee", 
      rawAmount: 360, 
      category: "Activation", 
      type: "out",
      status: "Completed"
    });

    await setDoc(userDocRef, { 
      isActivated: true, 
      activationTimestamp: new Date().toISOString() 
    }, { merge: true });

    setActiveView(null);
    setActiveTab("home");
  };

  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const addTransaction = async (tx: any) => {
    if (!user) return;
    
    // In a real app, this would be a secure function/transaction
    // For now, we simulate it by adding to the transactions collection
    const txData = {
      userId: user.uid,
      type: tx.type || "out",
      title: tx.title || "Transaction",
      amount: tx.rawAmount,
      category: tx.category || "General",
      status: "Completed",
      referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      paymentMethod: tx.paymentMethod || "EJCASHH Wallet",
      timestamp: new Date().toISOString(),
    };

    try {
      await setDoc(doc(collection(db, "transactions")), txData);
      
      // Update balance locally/server-side
      const userDocRef = doc(db, "users", user.uid);
      const newBalance = tx.type === "in" ? balance + tx.rawAmount : balance - tx.rawAmount;
      await setDoc(userDocRef, { balance: newBalance }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "transactions or users");
    }
    
    setShowSuccess(tx.title || "Transaction Successful");
    setActiveView(null);
    
    setTimeout(() => {
      setShowSuccess(null);
      setActiveTab("history");
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-brand-black flex flex-col items-center justify-center gap-8 overflow-hidden">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-24 h-24 relative"
        >
           <div className="absolute inset-0 bg-brand-primary blur-[50px] opacity-20"></div>
           <div className="absolute inset-0 rounded-3xl border border-brand-primary/30 bg-brand-navy flex items-center justify-center overflow-hidden">
             <div className="relative text-2xl font-display font-black italic tracking-tighter text-brand-primary flex flex-col items-center">
                <span className="text-4xl leading-none">EJ</span>
                <span className="text-[10px] tracking-[2px] mt-1">CASHH</span>
             </div>
           </div>
        </motion.div>
        
        <div className="flex flex-col items-center gap-2">
           <h1 className="text-2xl font-display font-black tracking-widest text-brand-primary italic">EJCASHH</h1>
           <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div 
                initial={{ left: '-100%' }}
                animate={{ left: '100%' }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-primary to-transparent shadow-[0_0_10px_#FACC15]"
              />
           </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onLogin={() => {}} />;
  }

  const renderActiveView = () => {
    // Check for activation for core features
    const coreFeatures = ["send", "bank", "bills", "load", "trading", "rider", "market"];
    if (coreFeatures.includes(activeView || "") && !userStats.isActivated) {
       return <ActivationScreen onActivate={handleActivation} />;
    }

    switch (activeView) {
      case "cashin": return <CashInScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, method: string) => addTransaction({ title: `Cash In via ${method}`, rawAmount: amt, category: "Cash In", type: "in" })} />;
      case "send": return <SendMoneyScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, name: string) => addTransaction({ title: `Sent to ${name}`, rawAmount: amt, category: "Transfer", type: "out" })} balance={balance} />;
      case "load": return <BuyLoadScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, provider: string) => addTransaction({ title: `${provider} Load`, rawAmount: amt, category: "Mobile Load", type: "out" })} balance={balance} />;
      case "bank": return <BankTransferScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, bank: string) => addTransaction({ title: `Transfer to ${bank}`, rawAmount: amt, category: "Bank Transfer", type: "out" })} balance={balance} />;
      case "bills": return <PayBillsScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, biller: string) => addTransaction({ title: `Paid ${biller}`, rawAmount: amt, category: "Bills", type: "out" })} balance={balance} />;
      case "trading": return <TradingBotScreen onBack={() => setActiveView(null)} balance={balance} onInvest={(amt: number, pkg: any) => addTransaction({ title: `${pkg.title} Deploy`, rawAmount: amt, category: "Trading", type: "out" })} />;
      case "rider": return <RiderScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, service: string) => addTransaction({ title: `Rider: ${service}`, rawAmount: amt, category: "Services", type: "out" })} />;
      case "market": return <MarketplaceScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, title: string) => addTransaction({ title: `Market: ${title}`, rawAmount: amt, category: "Shopping", type: "out" })} />;
      case "assistant": return <AssistantScreen onBack={() => setActiveView(null)} />;
      case "withdraw": return <WithdrawScreen balance={userStats.totalEarnings} onBack={() => setActiveView(null)} onConfirm={(amt: number) => {
        addTransaction({ title: "Withdrawal", rawAmount: amt, category: "Withdrawal", type: "out", paymentMethod: "Earnings Wallet" });
        // setUserStats update is handled by onSnapshot
      }} />;
      case "network": return <TeamNetworkScreen onBack={() => setActiveView(null)} />;
      default: return null;
    }
  };

  if (activeView) {
    return (
      <div className="flex justify-center bg-brand-black">
        <div className="w-full max-w-lg min-h-screen bg-brand-black text-brand-text relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-x-hidden border-x border-brand-border">
           <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
             <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[80px]"></div>
           </div>
           <div className="relative z-10">
             {renderActiveView()}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-brand-black">
      <div className="w-full max-w-lg min-h-screen bg-brand-black text-brand-text relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-x-hidden border-x border-brand-border">
        {/* Glow Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10">
          <AnimatePresence>
            {showSuccess && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-brand-black flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="absolute inset-0 bg-brand-primary/5 blur-[100px]"></div>
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="w-24 h-24 rounded-[40px] bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(250,204,21,0.2)]"
                >
                  <CheckCircle2 className="w-12 h-12 text-brand-primary" />
                </motion.div>
                <h2 className="text-2xl font-display font-black tracking-tight mb-2">Success!</h2>
                <p className="text-brand-text/60 font-medium mb-8">{showSuccess}</p>
                <div className="flex items-center gap-2 px-4 py-2 bg-brand-card/5 rounded-full border border-brand-border">
                   <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                   <span className="text-[10px] font-black uppercase tracking-widest text-brand-primary">Securely Processed</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Header 
                userName={user?.displayName || "User"} 
                theme={theme} 
                onToggleTheme={toggleTheme} 
              />
              <HomeScreen 
                stats={userStats} 
                onActivate={handleActivation} 
                balance={balance}
                transactions={transactions}
                onServiceClick={(serviceId) => setActiveView(serviceId)}
                onViewHistory={() => setActiveTab("history")}
                onClaimTrading={handleClaimTrading}
              />
            </motion.div>
          )}

          {activeTab === "send" && (
             <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <SendMoneyScreen 
                 onBack={() => setActiveTab("home")} 
                 balance={balance}
                 onConfirm={(amt, name) => addTransaction({ title: `Sent to ${name}`, rawAmount: amt, category: "Transfer", type: "out" })}
               />
             </motion.div>
          )}

          {activeTab === "scan" && (
             <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <QrPayScreen onBack={() => setActiveTab("home")} />
             </motion.div>
          )}

          {activeTab === "history" && (
             <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <TransactionHistoryScreen onBack={() => setActiveTab("home")} transactions={transactions} />
             </motion.div>
          )}

          {activeTab === "rewards" && (
             <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <ReferralDashboard 
                 stats={userStats} 
                 onWithdraw={() => setActiveView("withdraw")}
                 onViewNetwork={() => setActiveView("network")}
               />
             </motion.div>
          )}

          {activeTab === "profile" && (
             <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <ProfileScreen 
                 onLogout={() => auth.signOut()} 
                 theme={theme}
                 onToggleTheme={toggleTheme}
               />
             </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Profile Button for quick access if not on home */}
        {activeTab !== 'profile' && activeTab !== 'scan' && activeTab !== 'send' && (
           <motion.button 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             onClick={() => setActiveTab('profile')}
             className="fixed top-4 right-20 z-50 w-11 h-11 rounded-2xl bg-brand-card/5 border border-brand-border flex items-center justify-center hover:bg-brand-card/10 transition-colors"
           >
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" 
                alt="Me" 
                className="w-full h-full object-cover rounded-2xl p-1"
                referrerPolicy="no-referrer"
              />
           </motion.button>
        )}

        {/* Global Bottom Nav Hidden on some screens */}
        {!['scan', 'send'].includes(activeTab) && (
          <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
        )}
      </div>
    </div>
  </div>
  );
}
