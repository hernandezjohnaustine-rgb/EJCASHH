const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");
// Remove trailing empty lines
while (lines.length > 0 && lines[lines.length-1].trim() === "") {
    lines.pop();
}
fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n") + "\n", "utf8");
console.log("Cleaned! Total lines:", lines.length);
