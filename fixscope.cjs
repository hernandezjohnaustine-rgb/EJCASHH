const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("alert(\"❌ Failed to unlock all referral links\")") ) {
        // Check if next meaningful line is handleApproveDeposit
        if (lines[i+2].includes("const handleApproveDeposit")) {
            lines.splice(i+1, 0, "  };");
            console.log("Added missing }; at line", i+2);
            break;
        }
    }
}
fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
