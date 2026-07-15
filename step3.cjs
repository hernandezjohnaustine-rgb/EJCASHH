const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf8");

// Add creditsBalance state
content = content.replace(
  "const [balance, setBalance] = useState(0);",
  "const [balance, setBalance] = useState(0);\n  const [creditsBalance, setCreditsBalance] = useState(0);"
);

// Set creditsBalance when user data loads
content = content.replace(
  "setBalance(data.balance || 0);",
  "setBalance(data.balance || 0);\n          setCreditsBalance(data.creditsBalance || 0);"
);

// Update EMPTY_STATS
content = content.replace(
  "tradingClaimedToday: false,",
  "tradingClaimedToday: false,\n  creditsBalance: 0,"
);

// Update setUserStats to include creditsBalance
content = content.replace(
  "tradingDaysCompleted: data.tradingDaysCompleted || 0,",
  "tradingDaysCompleted: data.tradingDaysCompleted || 0,\n            creditsBalance: data.creditsBalance || 0,"
);

fs.writeFileSync("src/App.tsx", content, "utf8");
console.log("Done!");
