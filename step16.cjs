const fs = require("fs");
const lines = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8").split("\n");
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("wallet.type === 'credits'")) {
        lines[i] = lines[i].replace("wallet.type === 'credits'", "wallet.type === 'earnings'");
        console.log("Fixed at line", i+1);
        break;
    }
}
fs.writeFileSync("src/screens/ReferralDashboard.tsx", lines.join("\n"), "utf8");
console.log("Done!");
