const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf8");

// Map totalEarnings to balance so Earnings Wallet shows Main Balance
content = content.replace(
    /totalEarnings: data\.earningsWallet \?\? data\.stats\?\.totalEarnings \?\? 0,/g,
    "totalEarnings: data.balance || 0,"
);

fs.writeFileSync("src/App.tsx", content, "utf8");
console.log("Done!");
