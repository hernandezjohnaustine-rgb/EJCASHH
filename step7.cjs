const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf8");
content = content.replace(
  'case "withdraw": return <WithdrawScreen balance={userStats.totalEarnings}',
  'case "withdraw": return <WithdrawScreen balance={balance}'
);
fs.writeFileSync("src/App.tsx", content, "utf8");
console.log("Done!");
