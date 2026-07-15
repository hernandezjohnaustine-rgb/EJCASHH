const fs = require("fs");
const lines = fs.readFileSync("src/App.tsx", "utf8").split("\n");
let count = 0;
const result = lines.filter(line => {
    if (line.includes("const [creditsBalance, setCreditsBalance] = useState(0);")) {
        count++;
        return count === 1; // Keep only first occurrence
    }
    return true;
});
fs.writeFileSync("src/App.tsx", result.join("\n"), "utf8");
console.log("Removed duplicates, kept 1. Total removed:", count - 1);
