const fs = require("fs");
let content = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8");
content = content.replace(
    `  const wallets: WalletType[] = [
    { label: "Credits \uD83D\uDD12", balance: stats.creditsBalance || 0, type: "credits", color: "text-yellow-400" },
    { label: "Withdrawal Wallet", balance: 0, type: "withdraw", color: "text-brand-primary" },
    { label: "Cashback Wallet", balance: 0, type: "cashback", color: "text-brand-accent" },
  ];`,
    `  const wallets: WalletType[] = [
    { label: "Earnings Wallet", balance: stats.totalEarnings || 0, type: "earnings", color: "text-brand-primary" },
    { label: "Credits \uD83D\uDD12", balance: stats.creditsBalance || 0, type: "credits", color: "text-yellow-400" },
  ];`
);
fs.writeFileSync("src/screens/ReferralDashboard.tsx", content, "utf8");
console.log("Done!");
