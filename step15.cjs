const fs = require("fs");
const lines = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8").split("\n");
// Find and replace wallets array
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const wallets: WalletType[] = [")) {
        lines[i] = "  const wallets: WalletType[] = [";
        lines[i+1] = '    { label: "Earnings Wallet", balance: stats.totalEarnings || 0, type: "earnings", color: "text-brand-primary" },';
        lines[i+2] = '    { label: "Credits (Locked)", balance: stats.creditsBalance || 0, type: "credits", color: "text-yellow-400" },';
        lines[i+3] = "  ];";
        lines.splice(i+4, 1); // remove extra line
        console.log("Fixed at line", i+1);
        break;
    }
}
fs.writeFileSync("src/screens/ReferralDashboard.tsx", lines.join("\n"), "utf8");
console.log("Done!");
