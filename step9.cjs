const fs = require("fs");
let content = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8");

// Change Earnings Wallet to Credits
content = content.replace(
    '{ label: "Earnings Wallet", balance: stats.totalEarnings, type: "earnings", color: "text-brand-primary" }',
    '{ label: "Credits \uD83D\uDD12", balance: stats.creditsBalance || 0, type: "credits", color: "text-yellow-400" }'
);

// Change the withdraw button condition
content = content.replace(
    "{wallet.type === 'earnings' && (",
    "{wallet.type === 'credits' && ("
);

fs.writeFileSync("src/screens/ReferralDashboard.tsx", content, "utf8");
console.log("Done!");
