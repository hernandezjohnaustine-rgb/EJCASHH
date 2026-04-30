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
import QrPayScreen from "./screens/QrPayScreen";
import ReferralDashboard from "./screens/ReferralDashboard";
import ProfileScreen from "./screens/ProfileScreen";
import TransactionHistoryScreen from "./screens/TransactionHistoryScreen";
import ActivationScreen from "./screens/ActivationScreen";
import WithdrawScreen from "./screens/WithdrawScreen";
import TeamNetworkScreen from "./screens/TeamNetworkScreen";
import { UserStats } from "./types";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("home");
  const [prevTab, setPrevTab] = useState("home");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isViewingNetwork, setIsViewingNetwork] = useState(false);

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
    setPrevTab(activeTab);
    setActiveTab(tab);
  };

  const handleActivation = () => {
    setUserStats(prev => ({ ...prev, isActivated: true }));
    setActiveTab("home");
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-brand-black flex flex-col items-center justify-center gap-8 overflow-hidden">
        <motion.div
           initial={{ scale: 0.8, opacity: 0 }}
           animate={{ scale: 1, opacity: 1 }}
           className="w-24 h-24 relative"
        >
           <div className="absolute inset-0 bg-brand-neon blur-[50px] opacity-20"></div>
           <div className="absolute inset-0 rounded-3xl border border-brand-neon/30 bg-brand-navy flex items-center justify-center">
             <div className="relative text-4xl font-display font-black italic tracking-tighter text-brand-neon">
                EJ
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
                className="absolute inset-0 bg-gradient-to-r from-transparent via-brand-neon to-transparent shadow-[0_0_10px_#00F0FF]"
              />
           </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen onLogin={() => setIsAuthenticated(true)} />;
  }

  if (isWithdrawing) {
    return <WithdrawScreen balance={userStats.totalEarnings} onBack={() => setIsWithdrawing(false)} />;
  }

  if (isViewingNetwork) {
    return <TeamNetworkScreen onBack={() => setIsViewingNetwork(false)} />;
  }

  return (
    <div className="flex justify-center bg-[#05070A]">
      <div className="w-full max-w-lg min-h-screen bg-brand-black text-white relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-x-hidden border-x border-white/5">
        {/* Glow Orbs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-brand-blue/10 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-brand-neon/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10">
          <AnimatePresence mode="wait">
          {activeTab === "home" && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Header />
              <HomeScreen stats={userStats} onActivate={handleActivation} />
            </motion.div>
          )}

          {activeTab === "send" && (
             <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <SendMoneyScreen onBack={() => setActiveTab("home")} />
             </motion.div>
          )}

          {activeTab === "scan" && (
             <motion.div key="scan" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <QrPayScreen onBack={() => setActiveTab("home")} />
             </motion.div>
          )}

          {activeTab === "history" && (
             <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <TransactionHistoryScreen onBack={() => setActiveTab("home")} />
             </motion.div>
          )}

          {activeTab === "rewards" && (
             <motion.div key="rewards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
               <ReferralDashboard 
                 stats={userStats} 
                 onWithdraw={() => setIsWithdrawing(true)}
                 onViewNetwork={() => setIsViewingNetwork(true)}
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
