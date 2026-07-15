const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('{ id: "orders", label: "Orders"')) {
        lines.splice(i + 1, 0, '    { id: "settings", label: "Settings", icon: Shield },');
        console.log("Added at line", i + 2);
        break;
    }
}
fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
