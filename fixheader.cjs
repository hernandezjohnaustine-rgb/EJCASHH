const fs = require("fs");
const lines = fs.readFileSync("src/App.tsx", "utf8").split("\n");
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("onProfileClick={() => setActiveTab('profile')}") && 
        lines[i+1].includes("/>") && lines[i-1].includes("onToggleTheme")) {
        lines.splice(i+1, 0, "                  userId={user?.uid}");
        console.log("Added userId at line", i+2);
        break;
    }
}
fs.writeFileSync("src/App.tsx", lines.join("\n"), "utf8");
console.log("Done!");
