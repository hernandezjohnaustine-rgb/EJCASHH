const fs = require("fs");
const lines = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8").split("\n");
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("key={i}") && lines[i+1].includes("initial={{ opacity: 0, x: -10 }}")) {
        lines.splice(i+1, 0, '                onClick={(item as any).onClick}');
        console.log("Added onClick at line", i+2);
        break;
    }
}
fs.writeFileSync("src/screens/ProfileScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
