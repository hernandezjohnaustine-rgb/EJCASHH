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
  type: "main" | "earnings" | "withdraw" | "cashback";
  color: string;
}

export interface UserStats {
  vipLevel: number;
  directReferrals: number;
  teamSize: number;
  totalEarnings: number;
  isActivated: boolean;
}
