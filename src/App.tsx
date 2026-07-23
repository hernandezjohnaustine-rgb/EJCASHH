/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import AdminScreen from "./screens/AdminScreen";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, limit, getDocFromServer, getDocs, Timestamp } from "firebase/firestore";
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
import PromoBannerModal from "./components/PromoBannerModal";
import ejcashhPoster from "./assets/ejcashh-promo-poster.png";
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";
import { processActivation } from "./services/earningsService";

import TradingBotScreen from "./screens/TradingBotScreen";
import RiderScreen from "./screens/RiderScreen";
import MarketplaceScreen from "./screens/MarketplaceScreen";
import AssistantScreen from "./screens/AssistantScreen";
import MerchantScreen from "./screens/MerchantScreen";
import { setupPushNotifications, detectAndSaveInstallStatus } from "./services/notificationService";
import MerchantAdminScreen from "./screens/MerchantAdminScreen";
import DepositAdminScreen from "./screens/DepositAdminScreen";
import { MilestoneCertificateModal } from "./screens/DirectsCertificate";

const EMPTY_STATS: UserStats = {
  vipLevel: 1,
  directReferrals: 0,
  totalReferrals: 0,
  teamSize: 0,
  totalEarnings: 0,
  isActivated: false,
  tradingInvested: 0,
  tradingEarnings: 0,
  tradingDaysCompleted: 0,
  tradingActive: false,
  tradingClaimedToday: false,
  creditsBalance: 0,
};

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "light");
  const [activeTab, setActiveTab] = useState("home");
  const [activeView, setActiveView] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [creditsBalance, setCreditsBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [userStats, setUserStats] = useState<UserStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [firebaseError, setFirebaseError] = useState<{ title: string; message: string; code: string } | null>(null);
  const [showSuccess, setShowSuccess] = useState<string | null>(null);
  const [scannedRecipient, setScannedRecipient] = useState<any | null>(null);
  const [directsRewardClaimed, setDirectsRewardClaimed] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [activeMilestone, setActiveMilestone] = useState<any>(null);
  const [showMilestoneCertificate, setShowMilestoneCertificate] = useState(false);
  const [showPromo, setShowPromo] = useState(false);
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);

  // ✅ Auto-recover from stale-build errors. When a new deploy replaces the
  // hashed JS chunk filenames, a browser tab that's still running the OLD
  // bundle will fail on its next dynamic import (e.g. "Failed to fetch
  // dynamically imported module"). Instead of leaving the user stuck with a
  // broken action (like we hit earlier with autoPlacementService), detect
  // that specific failure anywhere in the app and force a clean reload.
  useEffect(() => {
    const isChunkLoadError = (message: string) =>
      /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed/i.test(message);

    const handleRejection = (event: PromiseRejectionEvent) => {
      const message = event.reason?.message || String(event.reason || "");
      if (isChunkLoadError(message)) {
        console.warn("Stale build detected — reloading to fetch the latest version.");
        window.location.reload();
      }
    };
    const handleError = (event: ErrorEvent) => {
      if (isChunkLoadError(event.message || "")) {
        console.warn("Stale build detected — reloading to fetch the latest version.");
        window.location.reload();
      }
    };

    window.addEventListener("unhandledrejection", handleRejection);
    window.addEventListener("error", handleError);
    return () => {
      window.removeEventListener("unhandledrejection", handleRejection);
      window.removeEventListener("error", handleError);
    };
  }, []);

  // ✅ Periodically check whether a new deploy is live (compares against
  // public/version.json, written fresh on every build by the GitHub Actions
  // workflow). Shows a small "Update available" banner instead of forcing a
  // reload mid-session — the user chooses when to refresh, so nothing gets
  // interrupted mid-transaction.
  useEffect(() => {
    let knownVersion: string | null = null;

    const checkVersion = async () => {
      try {
        const res = await fetch("/version.json", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (knownVersion === null) {
          knownVersion = data.version;
        } else if (data.version && data.version !== knownVersion) {
          setNewVersionAvailable(true);
        }
      } catch {
        // Network hiccup or version.json not deployed yet — ignore, try again next interval.
      }
    };

    checkVersion();
    const interval = setInterval(checkVersion, 60000); // check every 60s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  // Capture referral code from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    let ref = params.get("ref") || params.get("r");
    const path = window.location.pathname.substring(1).toUpperCase();
    if (!ref && path && (path.startsWith('EJ-') || (path.length >= 3 && path.length <= 15))) {
      const internalPaths = ['DASHBOARD', 'HOME', 'TRANSACTIONS', 'SETTINGS', 'PROFILE', 'MERCHANT-ADMIN', 'DEPOSIT-ADMIN'];
      if (!internalPaths.includes(path)) ref = path;
    }
    if (ref) {
      localStorage.setItem("referredBy", ref);
      if (window.location.search || window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

 // Show login promo banner every time the user is authenticated
  useEffect(() => {
    if (!user) return;
    setShowPromo(true);
  }, [user]);

  // Main auth + Firestore effect
  useEffect(() => {
    const testConnection = async (retries = 3) => {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
        console.log("Firestore connection verified.");
      } catch (error: any) {
        if (error.code === 'not-found' || error.message?.includes('not-found') || error.message?.includes('No document')) {
          console.log("Firestore connection verified (test doc not found, OK).");
          return;
        }
        if (error.message?.includes('the client is offline') || error.code === 'unavailable') {
          if (retries > 0) {
            setTimeout(() => testConnection(retries - 1), 2000);
          } else {
            setFirebaseError({
              title: "Firestore Offline",
              message: "Firestore is unreachable. Please ensure you have created a Firestore Database in 'Native Mode'.",
              code: "offline"
            });
          }
        }
      }
    };

    testConnection();

    let currentUserId: string | null = null;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {

        // ✅ Different user logged in — clear old state first
        if (currentUserId && currentUserId !== firebaseUser.uid) {
          setUserProfile(null);
          setBalance(0);
          setCreditsBalance(0);
          setTransactions([]);
          setUserStats(EMPTY_STATS);
          setActiveTab("home");
          setActiveView(null);
          setShowSuccess(null);
          await new Promise(resolve => setTimeout(resolve, 200));
        }

        currentUserId = firebaseUser.uid;
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);

        const fetchUserProfile = async (retryCount = 0): Promise<void> => {
          try {
            const userDoc = await getDoc(userDocRef);
            if (!userDoc.exists()) {
              const referredByRaw = localStorage.getItem("referredBy");
              const referredBy = referredByRaw ? referredByRaw.toUpperCase() : null;
              const username = localStorage.getItem("pendingUsername");
              const phoneNumber = localStorage.getItem("pendingPhone");

              // Resolve the sponsor's uid. This is a plain read-only
              // lookup, so it doesn't need to be part of the atomic
              // transaction below.
              let sponsorId: string | null = null;
              if (referredBy) {
                const q = query(collection(db, "users"), where("referralCode", "==", referredBy), limit(1));
                const snap = await getDocs(q);
                if (!snap.empty) {
                  sponsorId = snap.docs[0].id;
                }
              }

              const generatedReferralCode = username
                ? username.toUpperCase()
                : ("EJ-" + firebaseUser.uid.substring(0, 6).toUpperCase());
              const newUser: any = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName || "New Member",
                photoURL: firebaseUser.photoURL,
                username: username || null,
                phoneNumber: phoneNumber || null,
                isActivated: false,
                referralLinkEnabled: true, // New registrations get their referral link enabled by default — no manual admin unlock needed
                balance: 0,
                earningsWallet: 0,
                creditsBalance: 0,
                tradingInvested: 0,
                tradingEarnings: 0,
                tradingActive: false,
                tradingClaimedToday: false,
                tradingDaysCompleted: 0,
                referralCode: generatedReferralCode,
                referredBy,
                sponsorId,
                createdAt: new Date().toISOString(),
                stats: { vipLevel: 1, directReferrals: 0, totalReferrals: 0, teamSize: 0, totalEarnings: 0 }
              };

              // Create the user doc AND increment the sponsor's stats
              // atomically, in one transaction. This is what makes the
              // whole operation safe to retry: if fetchUserProfile gets
              // retried (e.g. after a permission error elsewhere) and this
              // account was already created by an earlier attempt, the
              // transaction sees the doc already exists and skips both the
              // creation AND the sponsor increment — instead of
              // incrementing the sponsor's totalReferrals/teamSize again
              // for an account that already counted.
              const { runTransaction, increment } = await import("firebase/firestore");
              try {
                await runTransaction(db, async (transaction) => {
                  const freshSnap = await transaction.get(userDocRef);
                  if (freshSnap.exists()) {
                    // Already created by a previous attempt — do nothing,
                    // to avoid double-counting the sponsor's stats.
                    return;
                  }

                  transaction.set(userDocRef, newUser);

                  if (sponsorId) {
                    transaction.update(doc(db, "users", sponsorId), {
                      "stats.totalReferrals": increment(1),
                      "stats.teamSize": increment(1),
                    });
                  }
                });
              } catch (e) {
                console.error("Failed to create user / update sponsor stats:", e);
                throw e; // let the outer retry logic handle it
              }

              // Publish a public referralCodes/{code} -> {uid} lookup doc
              // so this account's referral code can be validated by new
              // registrants BEFORE they're authenticated (see firestore.rules
              // and AuthScreen.tsx's validateReferralCode). Safe to redo on
              // retry since it's just an overwrite with the same values.
              try {
                await setDoc(doc(db, "referralCodes", generatedReferralCode), {
                  uid: firebaseUser.uid,
                });
              } catch (e) {
                console.error("Failed to create referralCodes lookup doc:", e);
              }

              setUserProfile(newUser);
              localStorage.removeItem("pendingUsername");
              localStorage.removeItem("pendingPhone");
              localStorage.removeItem("referredBy");
              setUserStats(EMPTY_STATS);
            } else {
              const data = userDoc.data();
              const today = new Date().toISOString().split('T')[0];
              const tradingClaimedToday = data.lastClaimDate !== today ? false : (data.tradingClaimedToday || false);
              const dailyClaimedToday = data.lastDailyClaimDate !== today ? false : (data.dailyClaimedToday || false);
              setUserProfile({ ...data, dailyClaimedToday });
              setBalance(data.balance || 0);
              setCreditsBalance(data.creditsBalance || 0);
              setUserStats({
                vipLevel: data.stats?.vipLevel || 1,
                directReferrals: data.stats?.directReferrals || 0,
                totalReferrals: data.stats?.totalReferrals || 0,
                teamSize: data.stats?.teamSize || 0,
                totalEarnings: data.balance || 0,
                isActivated: data.isActivated || false,
                tradingInvested: data.tradingInvested || 0,
                tradingEarnings: data.tradingEarnings || 0,
                tradingActive: data.tradingActive || false,
                tradingClaimedToday,
                tradingDaysCompleted: data.tradingDaysCompleted || 0,
                creditsBalance: data.creditsBalance || 0,
              });
              // ✅ Check milestones
              import("./screens/DirectsCertificate").then(({ MILESTONES }) => {
                const teamSize = data.stats?.teamSize || 0;
                const directs = data.stats?.directReferrals || 0;
                for (const m of MILESTONES) {
                  const achievedKey = `milestoneAchieved_L${m.level}`;
                  const size = m.level === 1 ? directs : teamSize;
                  if (size >= m.teamSize && !data[achievedKey]) {
                    setDoc(doc(db, "users", firebaseUser.uid), {
                      [achievedKey]: true,
                    }, { merge: true });
                    setActiveMilestone(m);
                    setShowMilestoneCertificate(true);
                  }
                }
              });
            }
          } catch (error: any) {
            if ((retryCount < 2 && (error.code === 'permission-denied' || error.message?.includes('permissions'))) ||
              (retryCount < 3 && error.message?.includes('offline'))) {
              await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
              return fetchUserProfile(retryCount + 1);
            }
            handleFirestoreError(error, OperationType.GET, "users/" + firebaseUser.uid);
          }
        };

        await fetchUserProfile();

        // Real-time user data listener
        const subUser = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            const today = new Date().toISOString().split('T')[0];
            const tradingClaimedToday = data.lastClaimDate !== today ? false : (data.tradingClaimedToday || false);
            const dailyClaimedToday = data.lastDailyClaimDate !== today ? false : (data.dailyClaimedToday || false);
            setUserProfile({ ...data, dailyClaimedToday });
            setBalance(data.balance || 0);
            setCreditsBalance(data.creditsBalance || 0);
            setUserStats({
              vipLevel: data.stats?.vipLevel || 1,
              directReferrals: data.stats?.directReferrals || 0,
              totalReferrals: data.stats?.totalReferrals || 0,
              teamSize: data.stats?.teamSize || 0,
              totalEarnings: data.balance || 0,
              isActivated: data.isActivated || false,
              tradingInvested: data.tradingInvested || 0,
              tradingEarnings: data.tradingEarnings || 0,
              tradingActive: data.tradingActive || false,
              tradingClaimedToday,
              tradingDaysCompleted: data.tradingDaysCompleted || 0,
              creditsBalance: data.creditsBalance || 0,
            });
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, "users/" + firebaseUser.uid);
        });

        // Real-time transactions listener
        const q = query(collection(db, "transactions"), where("userId", "==", firebaseUser.uid), limit(50));
        const subTx = onSnapshot(q, (snapshot) => {
          const txs: any[] = snapshot.docs.map(d => {
            const data = d.data();
            const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
            const sign = data.type === 'in' ? '+' : '-';
            // Credits-denominated transactions (commissions) are shown as
            // "Credits" rather than cash (₱) so they're never confused with
            // spendable/withdrawable pesos.
            const formattedAmount = data.isCredits
              ? `${sign}${(data.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} Credits`
              : `${sign}₱${(data.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
            return {
              id: d.id,
              ...data,
              timestampValue: ts.getTime(),
              amount: formattedAmount,
              date: ts.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            };
          });
          setTransactions(txs.sort((a, b) => b.timestampValue - a.timestampValue));
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, "transactions");
        });

        setIsLoading(false);

        // ✅ Set up push notifications + PWA install detection (fire-and-forget,
        // never blocks the app if it fails or the browser doesn't support it)
        setupPushNotifications(firebaseUser.uid).catch(() => {});
        detectAndSaveInstallStatus(firebaseUser.uid).catch(() => {});

        // ✅ Auto logout when app goes to background for more than 1 minute
        let inactivityTimer: ReturnType<typeof setTimeout>;
        const handleVisibilityChange = () => {
          if (document.visibilityState === 'hidden') {
            inactivityTimer = setTimeout(async () => {
              await auth.signOut();
            }, 1 * 60 * 1000);
          } else {
            clearTimeout(inactivityTimer);
          }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
          subUser();
          subTx();
          clearTimeout(inactivityTimer);
          document.removeEventListener('visibilitychange', handleVisibilityChange);
        };

      } else {
        // ✅ Clear ALL state on logout
        currentUserId = null;
        setUser(null);
        setUserProfile(null);
        setBalance(0);
        setCreditsBalance(0);
        setTransactions([]);
        setUserStats(EMPTY_STATS);
        setActiveTab("home");
        setActiveView(null);
        setShowSuccess(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ✅ addTransaction — checks balance before proceeding, does NOT update balance for "record_only"
  const addTransaction = async (tx: any) => {
    if (!user) return;
    try {
      const userDocRef = doc(db, "users", user.uid);
      const freshDoc = await getDoc(userDocRef);
      const freshBalance = freshDoc.exists() ? (freshDoc.data().balance || 0) : 0;
      const freshEarnings = freshDoc.exists() ? (freshDoc.data().earningsWallet || 0) : 0;

      if (tx.type === "out") {
        if (tx.category === "Withdrawal") {
          if (tx.rawAmount > freshEarnings) {
            alert(`❌ Insufficient earnings wallet.\nAvailable: ₱${freshEarnings.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
            return;
          }
        } else {
          if (tx.rawAmount > freshBalance) {
            alert(`❌ Insufficient balance.\nAvailable: ₱${freshBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
            return;
          }
        }
      }

      const txData = {
        userId: user.uid,
        type: tx.type || "out",
        title: tx.title || "Transaction",
        amount: tx.rawAmount,
        isCredits: tx.isCredits || false,
        category: tx.category || "General",
        status: "Completed",
        referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: tx.paymentMethod || "EJCASHH Wallet",
        timestamp: Timestamp.now(),
      };

      const { addDoc } = await import("firebase/firestore");
      await addDoc(collection(db, "transactions"), txData);

      if (tx.recordOnly) return;

      const updateData: any = {};
      if (tx.category === "Trading" && tx.type === "out") {
        updateData.balance = Math.max(0, freshBalance - tx.rawAmount);
        updateData.tradingInvested = (userStats.tradingInvested || 0) + tx.rawAmount;
        updateData.tradingActive = true;
        updateData.tradingClaimedToday = false;
        updateData.tradingDaysCompleted = 0;
        updateData.tradingStartDate = new Date().toISOString();
        updateData.lastClaimISO = null;
      } else if (tx.category === "Withdrawal") {
        updateData.balance = Math.max(0, freshBalance - tx.rawAmount);
        updateData.earningsWallet = Math.max(0, freshEarnings - tx.rawAmount);
      } else {
        updateData.balance = tx.type === "in"
          ? freshBalance + tx.rawAmount
          : Math.max(0, freshBalance - tx.rawAmount);
      }

      await setDoc(userDocRef, updateData, { merge: true });

      setShowSuccess(tx.title || "Transaction Successful");
      setActiveView(null);
      setTimeout(() => { setShowSuccess(null); setActiveTab("history"); }, 2000);

    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, "transactions or users");
    }
  };

  // ✅ FIXED — no double balance update
  const handleClaimTrading = async () => {
    if (!user || userStats.tradingInvested <= 0) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      const freshDoc = await getDoc(userDocRef);
      if (!freshDoc.exists()) return;
      const freshData = freshDoc.data();
      const now = new Date();
      const invested = freshData.tradingInvested || 0;
      if (invested <= 0) return;

      const tradingStartDate = freshData.tradingStartDate;
      if (tradingStartDate) {
        const startTime = new Date(tradingStartDate);
        const hoursSinceStart = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceStart < 24) {
          const hoursLeft = Math.ceil(24 - hoursSinceStart);
          alert(`⏳ Profit claimable in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''} after investment.`);
          return;
        }
      }

      const lastClaimISO = freshData.lastClaimISO;
      if (lastClaimISO) {
        const lastClaimTime = new Date(lastClaimISO);
        const hoursSinceLastClaim = (now.getTime() - lastClaimTime.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastClaim < 24) {
          const hoursLeft = Math.ceil(24 - hoursSinceLastClaim);
          alert(`⏳ Next claim available in ${hoursLeft} hour${hoursLeft > 1 ? 's' : ''}.`);
          return;
        }
      }

      const profit = invested * 0.05;
      const currentBalance = freshData.balance || 0;
      const currentEarnings = freshData.earningsWallet || 0;
      const currentTradingEarnings = freshData.tradingEarnings || 0;
      const daysCompleted = freshData.tradingDaysCompleted || 0;

      await setDoc(userDocRef, {
        balance: currentBalance + profit,
        earningsWallet: currentEarnings + profit,
        tradingEarnings: currentTradingEarnings + profit,
        tradingClaimedToday: true,
        lastClaimDate: now.toISOString().split('T')[0],
        lastClaimISO: now.toISOString(),
        tradingDaysCompleted: daysCompleted + 1,
        stats: {
          ...freshData.stats,
          totalEarnings: (freshData.stats?.totalEarnings || 0) + profit
        }
      }, { merge: true });

      await addTransaction({
        title: "Trading ROI Distribution",
        rawAmount: profit,
        category: "Trading",
        type: "in",
        recordOnly: true,
      });

      setShowSuccess(`Trading profit of ₱${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })} claimed!`);
      setTimeout(() => setShowSuccess(null), 2000);

    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users/" + user.uid);
    }
  };


  const handleClaimDirectsReward = async () => {
    if (!user || directsRewardClaimed) return;
    const reward = 300;
    const userDocRef = doc(db, "users", user.uid);
    try {
      const freshDoc = await getDoc(userDocRef);
      const currentEarnings = freshDoc.exists() ? (freshDoc.data().earningsWallet || 0) : 0;
      await setDoc(userDocRef, {
        earningsWallet: currentEarnings + reward,
        directsRewardClaimed: true,
        stats: {
          ...userProfile.stats,
          totalEarnings: (userProfile.stats?.totalEarnings || 0) + reward
        }
      }, { merge: true });
      await addTransaction({
        title: "10 Directs Milestone Reward",
        rawAmount: reward,
        category: "Bonus",
        type: "in",
        recordOnly: true,
      });
      setDirectsRewardClaimed(true);
      setShowCertificate(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users/" + user.uid);
    }
  };

  // ✅ NEW — Certificate Rewards are paid for by spending Credits (earned from
  // commissions), not cash. Requires the milestone to be achieved, requires
  // Level 3 to be reached to unlock claiming at all (matches the "🔒 Complete
  // Level 3 to unlock cash rewards" gate in the certificate UI), and requires
  // enough Credits to cover the milestone's reward cost.
  const handleClaimMilestoneReward = async (level: number) => {
    if (!user || !userProfile) return;

    const claimedKey = `milestoneRewardClaimed_L${level}`;
    const achievedKey = `milestoneAchieved_L${level}`;
    if (userProfile[claimedKey]) return;
    if (!userProfile[achievedKey]) {
      alert("❌ You haven't reached this milestone yet.");
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    try {
      const { MILESTONES } = await import("./screens/DirectsCertificate");
      const milestone = MILESTONES.find((m: any) => m.level === level);
      if (!milestone) return;

      // Certificate Rewards unlock once the user has reached Level 3.
      const canClaim = userProfile.milestoneAchieved_L3 === true || level >= 3;
      if (!canClaim) {
        alert("🔒 Complete Level 3 to unlock Certificate Rewards.");
        return;
      }

      const freshDoc = await getDoc(userDocRef);
      if (!freshDoc.exists()) return;
      const freshData = freshDoc.data();
      const currentCredits = freshData.creditsBalance || 0;
      const cost = milestone.reward;

      if (currentCredits < cost) {
        alert(`❌ Not enough Credits.\nNeeded: ${cost.toLocaleString()} Credits\nAvailable: ${currentCredits.toLocaleString()} Credits`);
        return;
      }

      await setDoc(userDocRef, {
        creditsBalance: currentCredits - cost,
        [claimedKey]: true,
      }, { merge: true });

      await addTransaction({
        title: `Level ${level} Certificate Reward — ${milestone.label}`,
        rawAmount: cost,
        isCredits: true,
        category: "Certificate Reward",
        type: "out",
        recordOnly: true,
      });

      setShowMilestoneCertificate(false);
      setShowSuccess(`Certificate claimed — ${cost.toLocaleString()} Credits redeemed!`);
      setTimeout(() => setShowSuccess(null), 2500);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users/" + user.uid);
    }
  };

  const handleClaimDaily = async () => {
    if (!user || userProfile.dailyClaimedToday) return;
    const userDocRef = doc(db, "users", user.uid);
    const reward = 2.00;
    try {
      const freshDoc = await getDoc(userDocRef);
      const currentBalance = freshDoc.exists() ? (freshDoc.data().balance || 0) : balance;
      const today = new Date().toISOString().split('T')[0];
      await setDoc(userDocRef, {
        balance: currentBalance + reward,
        dailyClaimedToday: true,
        lastDailyClaimDate: today,
        stats: {
          ...userProfile.stats,
          totalEarnings: (userProfile.stats?.totalEarnings || 0) + reward
        }
      }, { merge: true });
      await addTransaction({
        title: "Daily Login Reward",
        rawAmount: reward,
        category: "Bonus",
        type: "in",
        recordOnly: true,
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, "users/" + user.uid);
    }
  };

  const handleTabChange = (tab: string) => setActiveTab(tab);

  // ✅ Always reloads CURRENT user's fresh data after activation
  const handleActivationComplete = async (packageId: string = "package_1", amount: number = 360) => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const userDocRef = doc(db, "users", currentUser.uid);
      try {
        const freshDoc = await getDoc(userDocRef);
        if (!freshDoc.exists()) return;
        const freshData = freshDoc.data();
        const freshBalance = freshData.balance || 0;
        const wasAlreadyActivated = freshData.isActivated === true;

        if (freshBalance < amount) {
          alert(`❌ Insufficient balance.\nYou need ₱${amount.toLocaleString()} but have ₱${freshBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
          return;
        }

        // ✅ Resolve the TRUE direct referrer ONCE and persist it. On any
        // later activation (e.g. a Package 2 upgrade) we reuse this stored
        // value instead of recomputing — recomputing was the source of the
        // "L1 credited to wrong upline" bug, because the fallback path used
        // sponsorId, which autoPlaceUser can rewrite between activations.
        let originalReferrerId: string | null = freshData.originalReferrerId || null;
        if (!originalReferrerId) {
          originalReferrerId = freshData.sponsorId || null; // default
          if (freshData.referredBy) {
            const refQuery = query(collection(db, "users"), where("referralCode", "==", freshData.referredBy), limit(1));
            const refSnap = await getDocs(refQuery);
            if (!refSnap.empty) originalReferrerId = refSnap.docs[0].id;
          }
          // Save original referrer BEFORE auto-placement can overwrite anything,
          // and so every future activation on this account reuses this exact value.
          await setDoc(userDocRef, { originalReferrerId: originalReferrerId }, { merge: true });
        }

        // ✅ Auto-placement decides unilevel TREE POSITION. This is a
        // one-time decision made when the account first activates — running
        // it again on a Package 2 upgrade could silently move the user to a
        // different slot (since the referrer's downline may have filled up
        // in the meantime), which would also shift who L2-10 credits.
        const sponsorId = originalReferrerId;
        if (!wasAlreadyActivated && sponsorId) {
          const { autoPlaceUser } = await import("./services/autoPlacementService");
          await autoPlaceUser(currentUser.uid, sponsorId);
        }

        // ✅ Get updated sponsorId after auto-placement (unchanged on upgrades).
        // IMPORTANT: never fall back to `referredBy` here — that field holds a
        // referral CODE (e.g. "JPOWER03"), not a user ID. Passing a code where
        // processActivation expects a UID makes the L2-10 lookup fail
        // immediately, silently skipping all Credits distribution while L1
        // (which doesn't use this variable) keeps working fine. Fall back to
        // originalReferrerId instead, which is always a real, resolved UID.
        const freshDoc2 = await getDoc(userDocRef);
        const updatedSponsorId = freshDoc2.data()?.sponsorId || originalReferrerId;
        const actualReferrerId = originalReferrerId; // Always the true, stable direct referrer — same person on every package purchase

        // ✅ Package details
        const packageMultiplier = packageId === "package_1" ? 1 : 10;
        const packageName = packageId === "package_1"
          ? "EJCASHH Subscription"
          : packageId === "package_2"
          ? "Activation Livelihood Program"
          : "Complete Activation Bundle";

        // ✅ Deduct balance and activate
        await setDoc(userDocRef, {
          balance: freshBalance - amount,
          isActivated: true,
          activatedAt: new Date().toISOString(),
          activePackage: packageId,
          packageMultiplier,
          hasPackage1: packageId === "package_1" || packageId === "combined",
          hasPackage2: packageId === "package_2" || packageId === "combined",
        }, { merge: true });

        // ✅ Distribute commissions — credited to Credits balance, not cash
        // L1 commission goes to originalReferrerId, L2-10 go to updatedSponsorId (placement)
        // isFirstActivation (!wasAlreadyActivated) ensures directReferrals/teamSize
        // only increment once per person, not once per package they buy.
        await processActivation(currentUser.uid, updatedSponsorId, packageId, actualReferrerId, !wasAlreadyActivated);

        // ✅ Record transaction
        await addTransaction({
          title: `${packageName} Activation`,
          rawAmount: amount,
          category: "Activation",
          type: "out",
          recordOnly: true,
        });

        // ✅ Reload user data
        const freshDoc3 = await getDoc(userDocRef);
        if (freshDoc3.exists()) {
          const data = freshDoc3.data();
          const today = new Date().toISOString().split('T')[0];
          const tradingClaimedToday = data.lastClaimDate !== today ? false : (data.tradingClaimedToday || false);
          const dailyClaimedToday = data.lastDailyClaimDate !== today ? false : (data.dailyClaimedToday || false);
          setUserProfile({ ...data, dailyClaimedToday });
          setBalance(data.balance || 0);
          setCreditsBalance(data.creditsBalance || 0);
          setUserStats({
            vipLevel: data.stats?.vipLevel || 1,
            directReferrals: data.stats?.directReferrals || 0,
            totalReferrals: data.stats?.totalReferrals || 0,
            teamSize: data.stats?.teamSize || 0,
            totalEarnings: data.balance || 0,
            isActivated: data.isActivated || false,
            tradingInvested: data.tradingInvested || 0,
            tradingEarnings: data.tradingEarnings || 0,
            tradingActive: data.tradingActive || false,
            tradingClaimedToday,
            tradingDaysCompleted: data.tradingDaysCompleted || 0,
            creditsBalance: data.creditsBalance || 0,
          });
        }
      } catch (error: any) {
        console.error("ACTIVATION ERROR:", error);
        alert("Activation failed: " + (error?.message || String(error)));
        handleFirestoreError(error, OperationType.UPDATE, "users/" + currentUser.uid);
      }
    }
    setShowSuccess("Account Activated Successfully! 🎉");
    setActiveView(null);
    setActiveTab("home");
    setTimeout(() => setShowSuccess(null), 3000);
  };

  const handleRequestActivation = () => setActiveView("activation");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get("payment_status");
    const userIdInUrl = params.get("user_id");
    if (paymentStatus === "success" && userIdInUrl) {
      processActivation(userIdInUrl).then(() => {
        window.history.replaceState({}, "", window.location.pathname);
        handleActivationComplete();
      }).catch(err => console.error("PayMongo Activation Error:", err));
    }
  }, []);

  if (firebaseError) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-6">
        <div className="glass-card text-center max-w-sm">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold mb-2 text-white">{firebaseError.title}</h2>
          <p className="text-sm text-brand-text/60 mb-6">{firebaseError.message}</p>
          <div className="p-4 bg-brand-card/20 rounded-xl text-left font-mono text-[10px] mb-6 border border-brand-border">
            <p className="text-brand-primary mb-2">// Setup Guide:</p>
            {firebaseError.code === 'offline' ? (
              <ul className="space-y-1 list-disc pl-4 text-brand-text/80">
                <li>Open Firebase Console</li>
                <li>Go to Firestore Database</li>
                <li>Click "Create Database"</li>
                <li>Select "Native Mode"</li>
              </ul>
            ) : (
              <ul className="space-y-1 list-disc pl-4 text-brand-text/80">
                <li>Go to Auth &gt; Settings</li>
                <li>Add {window.location.hostname}</li>
                <li>to "Authorized domains"</li>
              </ul>
            )}
          </div>
          <button onClick={() => window.location.reload()}
            className="w-full py-4 bg-brand-primary text-brand-black font-black uppercase tracking-widest rounded-2xl hover:bg-brand-primary/90 transition-all active:scale-95">
            I've Updated My Console
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-screen w-full bg-brand-black flex flex-col items-center justify-center gap-8 overflow-hidden">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-24 h-24 relative">
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

  // ✅ Standalone Merchant Dashboard — a separate, website-styled admin page
  // at its own URL, with its OWN login form (independent of the main app's
  // AuthScreen/session). Checked before the main `if (!user)` gate below,
  // since this route must be reachable even if nobody is logged into the
  // main app in this browser session yet.
  if (window.location.pathname.substring(1).toUpperCase() === "MERCHANT-ADMIN") {
    return <MerchantAdminScreen />;
  }

  // ✅ Standalone Deposit Dashboard — same self-contained pattern as the
  // Merchant Dashboard above, for reviewing/approving GCash deposits.
  if (window.location.pathname.substring(1).toUpperCase() === "DEPOSIT-ADMIN") {
    return <DepositAdminScreen />;
  }

  if (!user) return <AuthScreen onLogin={() => {}} />;

  const renderActiveView = () => {
    const currentUid = auth.currentUser?.uid || user.uid;
    const coreFeatures = ["send", "bank", "bills", "load", "trading", "rider", "market"];
    if (coreFeatures.includes(activeView || "") && !userStats.isActivated) {
      return <ActivationScreen onActivate={(packageId: string, amount: number) => handleActivationComplete(packageId, amount)} balance={balance} onBack={() => setActiveView(null)} isActivated={userStats.isActivated} currentPackage={userProfile?.activePackage} />;
    }
    switch (activeView) {
      case "activation": return <ActivationScreen onActivate={(packageId: string, amount: number) => handleActivationComplete(packageId, amount)} balance={balance} onBack={() => setActiveView(null)} isActivated={userStats.isActivated} currentPackage={userProfile?.activePackage} />;
      case "cashin": return <CashInScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, method: string) => addTransaction({ title: `Cash In via ${method}`, rawAmount: amt, category: "Cash In", type: "in" })} />;
      case "send": return <SendMoneyScreen onBack={() => { setActiveView(null); setScannedRecipient(null); }} onConfirm={(amt: number, name: string) => { setShowSuccess(`Sent ₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${name}`); setScannedRecipient(null); setActiveView(null); setTimeout(() => { setShowSuccess(null); setActiveTab("history"); }, 2000); }} balance={balance} initialRecipient={scannedRecipient} onScanClick={() => { setActiveView(null); setActiveTab("scan"); }} />;
      case "load": return <BuyLoadScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, provider: string) => addTransaction({ title: `${provider} Load`, rawAmount: amt, category: "Mobile Load", type: "out" })} balance={balance} />;
      case "bank": return <BankTransferScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, bank: string) => addTransaction({ title: `Transfer to ${bank}`, rawAmount: amt, category: "Bank Transfer", type: "out" })} balance={balance} />;
      case "bills": return <PayBillsScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, biller: string) => addTransaction({ title: `Paid ${biller}`, rawAmount: amt, category: "Bills", type: "out" })} balance={balance} />;
      case "trading": return <TradingBotScreen onBack={() => setActiveView(null)} balance={balance} onInvest={(amt: number, pkg: any) => addTransaction({ title: `${pkg.title} Deploy`, rawAmount: amt, category: "Trading", type: "out" })} />;
      case "rider": return <RiderScreen onBack={() => setActiveView(null)} onConfirm={(amt: number, service: string) => addTransaction({ title: `Rider: ${service}`, rawAmount: amt, category: "Services", type: "out" })} />;
      case "market": return <MarketplaceScreen onBack={() => setActiveView(null)} balance={balance} userProfile={userProfile} onConfirm={(amt: number, title: string) => addTransaction({ title: `Market: ${title}`, rawAmount: amt, category: "Shopping", type: "out" })} />;
      case "assistant": return <AssistantScreen onBack={() => setActiveView(null)} />;
      case "merchant": return <MerchantScreen onBack={() => setActiveView(null)} userId={user?.uid || ""} balance={balance} />;
      case "withdraw": return <WithdrawScreen balance={balance} onBack={() => setActiveView(null)} onConfirm={(amt: number) => addTransaction({ title: "Withdrawal", rawAmount: amt, category: "Withdrawal", type: "out", paymentMethod: "Earnings Wallet" })} />;
      case "network": return <TeamNetworkScreen onBack={() => setActiveView(null)} userId={user?.uid || ""} displayName={userProfile?.displayName || user?.displayName || "You"} />;
      case "admin": return userProfile?.isAdmin ? <AdminScreen onBack={() => setActiveView(null)} /> : null;
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
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="relative z-10"
            >
              {renderActiveView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center bg-brand-black">
      <div className="w-full max-w-lg min-h-screen bg-brand-black text-brand-text relative shadow-[0_0_100px_rgba(0,0,0,0.8)] overflow-x-hidden border-x border-brand-border">
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute top-[-100px] left-[-100px] w-[500px] h-[500px] bg-brand-primary/10 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[-50px] right-[-50px] w-[400px] h-[400px] bg-brand-primary/10 rounded-full blur-[100px]"></div>
        </div>

        <div className="relative z-10">
          <AnimatePresence>
            {newVersionAvailable && (
              <motion.div
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -60, opacity: 0 }}
                className="fixed top-0 left-0 right-0 z-[200] flex justify-center px-4 pt-4"
              >
                <div className="w-full max-w-md bg-brand-primary text-brand-black rounded-2xl shadow-lg px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-xs font-black uppercase tracking-widest">New update available</span>
                  <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-brand-black text-brand-primary rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Refresh
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {showSuccess && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] bg-brand-black flex flex-col items-center justify-center p-8 text-center">
                <div className="absolute inset-0 bg-brand-primary/5 blur-[100px]"></div>
                <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 15 }}
                  className="w-32 h-32 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  </div>
                </motion.div>
                <h2 className="text-3xl font-display font-black tracking-tight mb-3">Success!</h2>
                <p className="text-brand-text/60 font-medium mb-10 max-w-[250px]">{showSuccess}</p>
                <button onClick={() => setShowSuccess(null)}
                  className="w-full max-w-[200px] h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-3 mb-8 active:scale-95 transition-all">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Securely Processed</span>
                </button>
                <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.2em] animate-pulse">Automatically continuing...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {activeTab === "home" && (
              <motion.div key="home" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <Header
                  userName={user?.displayName || "User"}
                  userSeed={userProfile?.username || user?.displayName || "John"}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  onProfileClick={() => setActiveTab('profile')}
                  userId={user?.uid}
                />
                <HomeScreen
                  stats={userStats}
                  onActivate={handleRequestActivation}
                  balance={balance}
                  transactions={transactions}
                  onServiceClick={(serviceId) => setActiveView(serviceId)}
                  onViewHistory={() => setActiveTab("history")}
                  onClaimTrading={handleClaimTrading}
                  referralCode={userProfile?.referralCode || ""}
                  referralLinkEnabled={userProfile?.referralLinkEnabled === true}
                  onClaimDirectsReward={handleClaimDirectsReward}
                  directsRewardClaimed={directsRewardClaimed || userProfile?.directsRewardClaimed || false}
                  showCertificate={showCertificate}
                  onOpenCertificate={() => setShowCertificate(true)}
                  onCloseCertificate={() => setShowCertificate(false)}
                  userName={userProfile?.displayName || user?.displayName || "Member"}
              userProfile={userProfile}
              onRequestActivation={() => setActiveView("activation")}
                  onOpenMilestone={(level) => {
  import("./screens/DirectsCertificate").then(({ MILESTONES }) => {
    setActiveMilestone(MILESTONES.find((m: any) => m.level === level));
    setShowMilestoneCertificate(true);
  });
}}
claimedMilestones={Object.fromEntries(
  Array.from({length: 10}, (_, i) => [
    `milestoneRewardClaimed_L${i+1}`,
    userProfile?.[`milestoneRewardClaimed_L${i+1}`] || false
  ])
)}
achievedMilestones={Object.fromEntries(
  Array.from({length: 10}, (_, i) => [
    `milestoneAchieved_L${i+1}`,
    userProfile?.[`milestoneAchieved_L${i+1}`] || false
  ])
)}
                />
              </motion.div>
            )}
            {activeTab === "send" && (
              <motion.div key="send" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <SendMoneyScreen onBack={() => { setActiveTab("home"); setScannedRecipient(null); }} balance={balance}
                  onConfirm={(amt, name) => { setShowSuccess(`Sent ₱${amt.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${name}`); setScannedRecipient(null); setTimeout(() => { setShowSuccess(null); setActiveTab("history"); }, 2000); }}
                  initialRecipient={scannedRecipient} onScanClick={() => setActiveTab("scan")} />
              </motion.div>
            )}
            {activeTab === "scan" && (
              <motion.div key="scan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <QrPayScreen onBack={() => setActiveTab("home")}
                  onResult={(recipient) => { setScannedRecipient(recipient); setActiveTab("send"); }}
                  referralCode={userProfile?.referralCode || ""} />
              </motion.div>
            )}
            {activeTab === "history" && (
              <motion.div key="history" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <TransactionHistoryScreen onBack={() => setActiveTab("home")} transactions={transactions} />
              </motion.div>
            )}
            {activeTab === "rewards" && (
              <motion.div key="rewards" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <ReferralDashboard stats={userStats} onWithdraw={() => setActiveView("withdraw")}
                  onViewNetwork={() => setActiveView("network")} referralCode={userProfile?.referralCode || ""}
                  referralLinkEnabled={userProfile?.referralLinkEnabled === true}
                  onClaimDaily={handleClaimDaily} isDailyClaimed={userProfile.dailyClaimedToday} />
              </motion.div>
            )}
            {activeTab === "profile" && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25, ease: "easeOut" }}>
                <ProfileScreen
                  onLogout={() => {
                    localStorage.removeItem("referredBy");
                    localStorage.removeItem("pendingUsername");
                    localStorage.removeItem("pendingPhone");
                    auth.signOut();
                  }}
                  theme={theme} onToggleTheme={toggleTheme}
                  user={userProfile} onNavigate={(view) => setActiveView(view)} />
              </motion.div>
            )}
          </AnimatePresence>

          <PromoBannerModal
            isOpen={showPromo}
            onClose={() => setShowPromo(false)}
            imageUrl={ejcashhPoster}
          />

          {/* Milestone Certificate Modal */}
          {showMilestoneCertificate && activeMilestone && (
            <MilestoneCertificateModal
              visible={showMilestoneCertificate}
              milestone={activeMilestone}
              onClaim={() => handleClaimMilestoneReward(activeMilestone.level)}
              onClose={() => setShowMilestoneCertificate(false)}
              userName={userProfile?.displayName || user?.displayName || "Member"}
              userProfile={userProfile}
              onRequestActivation={() => setActiveView("activation")}
              canClaim={
                userProfile?.milestoneAchieved_L3 === true ||
                activeMilestone.level >= 3
              }
              alreadyClaimed={
                userProfile?.[`milestoneRewardClaimed_L${activeMilestone.level}`] || false
              }
            />
          )}
          {!['scan', 'send'].includes(activeTab) && (
            <BottomNav activeTab={activeTab} setActiveTab={handleTabChange} />
          )}
        </div>
      </div>
    </div>
  );
}
