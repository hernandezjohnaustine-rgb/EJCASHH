const fs = require("fs");
const lines = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8").split("\n");
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const MLM_LEVELS = [")) {
        lines[i] = "const MLM_LEVELS = [";
        lines[i+1] = '  { level: 1, reward: "₱100", income: "Direct", label: "Direct" },';
        lines[i+2] = '  { level: 2, reward: "₱3", income: "Indirect", label: "Indirect" },';
        lines[i+3] = '  { level: 3, reward: "₱3", income: "Indirect", label: "Indirect" },';
        lines[i+4] = '  { level: 4, reward: "₱3", income: "Indirect", label: "Indirect" },';
        lines[i+5] = '  { level: 5, reward: "₱3", income: "Indirect", label: "Indirect" },';
        lines[i+6] = '  { level: "6-10", reward: "₱3", income: "Indirect", label: "Indirect" },';
        console.log("Fixed MLM_LEVELS at line", i+1);
        break;
    }
}
fs.writeFileSync("src/screens/ReferralDashboard.tsx", lines.join("\n"), "utf8");
console.log("Done!");
