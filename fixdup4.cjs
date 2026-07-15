const fs = require("fs");
const lines = fs.readFileSync("src/services/earningsService.ts", "utf8").split("\n");

// Find and remove first processTransfer (old one at line 173, index 172)
let firstStart = -1;
let firstEnd = -1;
let braceCount = 0;
let inFunction = false;

for (let i = 172; i < 221; i++) {
    if (lines[i].includes("export async function processTransfer") && !inFunction) {
        firstStart = i;
        inFunction = true;
    }
    if (inFunction) {
        for (const ch of lines[i]) {
            if (ch === "{") braceCount++;
            if (ch === "}") braceCount--;
        }
        if (braceCount === 0 && firstStart > -1) {
            firstEnd = i;
            break;
        }
    }
}

console.log("Removing old processTransfer from line", firstStart+1, "to", firstEnd+1);
lines.splice(firstStart, firstEnd - firstStart + 1);
fs.writeFileSync("src/services/earningsService.ts", lines.join("\n"), "utf8");
console.log("Done!");
