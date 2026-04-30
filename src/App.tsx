/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
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
import WithdrawScreen from "./screens/WithdrawScreen";
import TeamNetworkScreen from "./screens/TeamNetworkScreen";
import { UserStats, Transaction } from "./types";
import { CheckCircle2, ShieldCheck } from "lucide-react";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [activeView, setActiveView] = useState<string | null>(null);
  const [balance, setBalance] = useState(85240.50);
  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: 1, type: "out", title: "Starbucks Coffee", date: "Today, 10:45 AM", amount: "-₱185.00", category: "Food & Drinks", status: "Completed", referenceNo: "UW-SBUX-123456" },
    { id: 2, type: "in", title: "Monthly Salary", date: "Yesterday, 06:00 PM", amount: "+₱42,500.00", category: "Work", status: "Completed", referenceNo: "UW-SAL-789012" },
    { id: 3, type: "out", title: "Meralco Bill", date: "April 25, 02:30 PM", amount: "-₱3,420.50", category: "Bills", status: "Completed", referenceNo: "UW-MER-345678" },
    { id: 4, type: "out", title: "Netflix Subscription", date: "April 24, 09:00 AM", amount: "-₱549.00", category: "Entertainment", status: "Completed", referenceNo: "UW-NFLX-901234" },
  ]);

  // User Stats Mock
  const [userStats, setUserStats] = useState<UserStats>({
    vipLevel: 1,
    directReferrals: 8,
    teamSize: 142,
    totalEarnings: 12450.00,
    isActivated: false, // Default to false for demo
  });

  // Mock Loading
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => setIsLoading(false), 1500);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleActivation = () => {
    setUserStats(prev => ({ ...prev, isActivated: true }));
    setActiveTab("home");
  };

  const [showSuccess, setShowSuccess] = useState<string | null>(null);

  const addTransaction = (tx: Partial<Transaction> & { rawAmount: number }) => {
    const newTx: Transaction = {
      id: Date.now(),
      type: tx.type || "out",
      title: tx.title || "Transaction",
      date: "Just Now",
      amount: (tx.type === "in" ? "+" : "-") + "₱" + tx.rawAmount.toLocaleString('en-US', { minimumFractionDigits: 2 }),
      category: tx.category || "General",
      status: "Completed",
      referenceNo: "UW-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      paymentMethod: tx.paymentMethod || "UWINS Wallet",
    };
    
    setTransactions(prev => [newTx, ...prev]);
    setBalance(prev => tx.type === "in" ? prev + tx.rawAmount : prev - tx.rawAmount);
    
    // Show success for 2 seconds
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
           <div className="absolute inset-0 rounded-3xl border border-brand-primary/30 bg-brand-navy flex items-center justify-center">
             <div className="relative text-4xl font-display font-black italic tracking-tighter text-brand-primary">
                UW
             </div>
           </div>
        </motion.div>
        
        <div className="flex flex-col items-center gap-2">
           <h1 className="text-2xl font-display font-bold tracking-tight">UWINS</h1>
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

  if (!isAuthenticated) {
    return <AuthScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  const renderActiveView = () => {
    switch (activeView) {
      case "send": return <SendMoneyScreen onBack={() => setActiveView(null)} onConfirm={(amt, name) => addTransaction({ title: `Sent to ${name}`, rawAmount: amt, category: "Transfer", type: "out" })} balance={balance} />;
      case "load": return <BuyLoadScreen onBack={() => setActiveView(null)} onConfirm={(amt, provider) => addTransaction({ title: `${provider} Load`, rawAmount: amt, category: "Mobile Load", type: "out" })} balance={balance} />;
      case "bank": return <BankTransferScreen onBack={() => setActiveView(null)} onConfirm={(amt, bank) => addTransaction({ title: `Transfer to ${bank}`, rawAmount: amt, category: "Bank Transfer", type: "out" })} balance={balance} />;
      case "bills": return <PayBillsScreen onBack={() => setActiveView(null)} onConfirm={(amt, biller) => addTransaction({ title: `Paid ${biller}`, rawAmount: amt, category: "Bills", type: "out" })} balance={balance} />;
      case "withdraw": return <WithdrawScreen balance={userStats.totalEarnings} onBack={() => setActiveView(null)} onConfirm={(amt) => {
        addTransaction({ title: "Withdrawal", rawAmount: amt, category: "Withdrawal", type: "out", paymentMethod: "Earnings Wallet" });
        setUserStats(prev => ({ ...prev, totalEarnings: prev.totalEarnings - amt }));
      }} />;
      case "network": return <TeamNetworkScreen onBack={() => setActiveView(null)} />;
      default: return null;
    }
  };

  if (activeView) {
    return (
      <div className="flex justify-center bg-[#05070A]">
        <div className="w-full max-w-lg min-h-screen bg-brand-black text-white relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-x-hidden border-x border-white/5">
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
    <div className="flex justify-center bg-[#05070A]">
      <div className="w-full max-w-lg min-h-screen bg-brand-black text-white relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-x-hidden border-x border-white/5">
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
                <p className="text-white/60 font-medium mb-8">{showSuccess}</p>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/5">
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
              <Header />
              <HomeScreen 
                stats={userStats} 
                onActivate={handleActivation} 
                balance={balance}
                transactions={transactions}
                onServiceClick={(serviceId) => setActiveView(serviceId)}
                onViewHistory={() => setActiveTab("history")}
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
               <ProfileScreen onLogout={() => setIsAuthenticated(false)} />
             </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Profile Button for quick access if not on home */}
        {activeTab !== 'profile' && activeTab !== 'scan' && activeTab !== 'send' && (
           <motion.button 
             initial={{ scale: 0 }}
             animate={{ scale: 1 }}
             onClick={() => setActiveTab('profile')}
             className="fixed top-4 right-20 z-50 w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
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
