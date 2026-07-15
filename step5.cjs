const fs = require("fs");
let content = fs.readFileSync("src/screens/HomeScreen.tsx", "utf8");

// Update WALLETS to add Credits and remove earnings
content = content.replace(
`const WALLETS = (balance: number, earnings: number): Wallet[] => [
  { label: "Main Balance", balance: balance, type: "main", color: "text-brand-text" },
  { label: "Earnings", balance: earnings, type: "earnings", color: "text-brand-primary" },
];`,
`const WALLETS = (balance: number, credits: number): Wallet[] => [
  { label: "Main Balance", balance: balance, type: "main", color: "text-brand-text" },
  { label: "Credits", balance: credits, type: "credits", color: "text-yellow-400" },
];`
);

fs.writeFileSync("src/screens/HomeScreen.tsx", content, "utf8");
console.log("Done!");
