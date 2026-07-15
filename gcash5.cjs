const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{ id: "gcash", label: "GCash"')) {
        lines.splice(i, 0, '          { id: "deposits", label: "Deposits", icon: Wallet },');
        console.log("Added Deposits tab at line", i + 1);
        break;
    }
}

fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
