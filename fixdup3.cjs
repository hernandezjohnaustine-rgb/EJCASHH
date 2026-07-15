const fs = require("fs");
const lines = fs.readFileSync("src/App.tsx", "utf8").split("\n");
let count = 0;
const result = lines.filter(line => {
    if (line.includes("creditsBalance: data.creditsBalance || 0,")) {
        count++;
        return count === 1;
    }
    return true;
});
fs.writeFileSync("src/App.tsx", result.join("\n"), "utf8");
console.log("Removed duplicates:", count - 1);
