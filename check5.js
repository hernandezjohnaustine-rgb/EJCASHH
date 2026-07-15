const fs = require("fs");
let content = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8");
console.log("Line 551:", content.split("\n")[550]);
