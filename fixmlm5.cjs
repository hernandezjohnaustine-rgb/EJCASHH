const fs = require("fs");

// Fix in ReferralDashboard.tsx
let content = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8");
content = content.replace(/MLM Reward Structure/g, "Reward Structure");
fs.writeFileSync("src/screens/ReferralDashboard.tsx", content, "utf8");

// Fix in any other files
const files = ["src/screens/HomeScreen.tsx", "src/screens/EarnScreen.tsx", "src/App.tsx"];
files.forEach(f => {
    try {
        let c = fs.readFileSync(f, "utf8");
        if (c.includes("MLM Reward Structure")) {
            c = c.replace(/MLM Reward Structure/g, "Reward Structure");
            fs.writeFileSync(f, c, "utf8");
            console.log("Fixed in", f);
        }
    } catch (e) {}
});
console.log("Done!");
