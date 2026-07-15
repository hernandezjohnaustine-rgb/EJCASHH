const fs = require("fs");
const lines = fs.readFileSync("src/services/earningsService.ts", "utf8").split("\n");

// Find ALL processTransfer occurrences
let occurrences = [];
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("export async function processTransfer")) {
        occurrences.push(i);
    }
}
console.log("Found processTransfer at lines:", occurrences.map(i => i+1));
