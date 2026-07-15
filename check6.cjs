const fs = require("fs");

// Fix ReferralDashboard - Earnings Wallet = balance (passed as prop)
let content = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8");
console.log("Current earnings wallet line:");
content.split("\n").forEach((l, i) => {
    if (l.includes("Earnings Wallet")) console.log(i+1, l.trim());
});
