const fs = require("fs");
let content = fs.readFileSync("src/screens/HomeScreen.tsx", "utf8");

// Fix WALLETS function definition
content = content.replace(
  "const WALLETS = (balance: number, earnings: number): Wallet[] => [",
  "const WALLETS = (balance: number, credits: number): Wallet[] => ["
);

// Fix WALLETS items
content = content.replace(
  '  { label: "Earnings", balance: earnings, type: "earnings", color: "text-brand-primary" },',
  '  { label: "Credits \uD83D\uDD12", balance: credits, type: "credits", color: "text-yellow-400" },'
);

// Fix wallets call
content = content.replace(
  "const wallets = WALLETS(balance, stats.totalEarnings);",
  "const wallets = WALLETS(balance, stats.creditsBalance || 0);"
);

fs.writeFileSync("src/screens/HomeScreen.tsx", content, "utf8");
console.log("Done!");
