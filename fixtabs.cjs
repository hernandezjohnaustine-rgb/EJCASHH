const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

// Find the tabs container
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("flex gap-2") && lines[i+2]?.includes("tab.id")) {
        // Make it scrollable
        lines[i] = lines[i].replace("flex gap-2", "flex gap-2 overflow-x-auto pb-2 scrollbar-hide");
        console.log("Fixed tabs container at line", i + 1);
        break;
    }
}

fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
