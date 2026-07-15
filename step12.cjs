const fs = require("fs");
let content = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8");

// Earnings Wallet shows Main Balance (stats.totalEarnings was the old earnings, now use balance)
content = content.replace(
    '{ label: "Earnings Wallet", balance: stats.totalEarnings, type: "earnings", color: "text-brand-primary" }',
    '{ label: "Earnings Wallet", balance: stats.totalEarnings || 0, type: "earnings", color: "text-brand-primary" }'
);

fs.writeFileSync("src/screens/ReferralDashboard.tsx", content, "utf8");
console.log("Done!");
