const fs = require("fs");
const content = `export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  referralCode: string;
  referredBy?: string;
  username?: string;
  phoneNumber?: string;
  createdAt: string;
  stats: UserStats;
}
export interface Transaction {
  id: number;
  type: "in" | "out";
  title: string;
  date: string;
  amount: string;
  category: string;
  status: string;
  referenceNo?: string;
  paymentMethod?: string;
}
export interface Wallet {
  balance: number;
  label: string;
  type: "main" | "credits" | "withdraw";
  color: string;
}
export interface UserStats {
  vipLevel: number;
  directReferrals: number;
  totalReferrals: number;
  teamSize: number;
  totalEarnings: number;
  isActivated: boolean;
  tradingInvested: number;
  tradingEarnings: number;
  tradingDaysCompleted: number;
  tradingActive: boolean;
  tradingClaimedToday: boolean;
  creditsBalance: number;
}
`;
fs.writeFileSync("src/types.ts", content, "utf8");
console.log("Done!");
