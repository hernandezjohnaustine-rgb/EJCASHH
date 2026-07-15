const fs = require("fs");
let content = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8");
const lines = content.split("\n");
console.log("Line 551:", lines[550]);
// Fix the broken className
lines[550] = '                      className="px-4 py-2 rounded-xl text-xs font-black uppercase border border-brand-border"';
fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Fixed!");
