const fs = require("fs");
const lines = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8").split("\n");
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("From ₱360 Activation")) {
        // Remove the income line below reward
        lines[i] = "                       <p className=\"text-[9px] text-brand-text/20 uppercase tracking-widest\">From ₱360 • Package 1</p>";
        console.log("Fixed at line", i+1);
    }
    if (lines[i].includes("{lvl.income}")) {
        lines[i] = "";  // Remove income display
        console.log("Removed income at line", i+1);
    }
}
fs.writeFileSync("src/screens/ReferralDashboard.tsx", lines.join("\n"), "utf8");
console.log("Done!");
