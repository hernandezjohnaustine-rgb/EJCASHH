const fs = require("fs");
const lines = fs.readFileSync("src/screens/ReferralDashboard.tsx", "utf8").split("\n");

// Find MLM_LEVELS and add Package 2
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const MLM_LEVELS = [")) {
        // Add Package 2 levels after MLM_LEVELS
        const insertAfter = i + 8; // after closing ];
        lines.splice(insertAfter, 0,
            '',
            'const MLM_LEVELS_P2 = [',
            '  { level: 1, reward: "₱1,000", income: "Direct", label: "Direct" },',
            '  { level: 2, reward: "₱30", income: "Indirect", label: "Indirect" },',
            '  { level: 3, reward: "₱30", income: "Indirect", label: "Indirect" },',
            '  { level: 4, reward: "₱30", income: "Indirect", label: "Indirect" },',
            '  { level: 5, reward: "₱30", income: "Indirect", label: "Indirect" },',
            '  { level: "6-10", reward: "₱30", income: "Indirect", label: "Indirect" },',
            '];'
        );
        console.log("Added MLM_LEVELS_P2");
        break;
    }
}

fs.writeFileSync("src/screens/ReferralDashboard.tsx", lines.join("\n"), "utf8");
console.log("Done!");
