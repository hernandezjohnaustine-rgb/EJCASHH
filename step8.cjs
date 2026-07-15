const fs = require("fs");
let content = fs.readFileSync("src/screens/HomeScreen.tsx", "utf8");
content = content.replace(
    'Total Earnings',
    'Credits \uD83D\uDD12'
);
content = content.replace(
    '<AnimatedNumber value={stats.totalEarnings} className="text-brand-primary font-black italic" />',
    '<AnimatedNumber value={stats.creditsBalance || 0} className="text-yellow-400 font-black italic" />'
);
fs.writeFileSync("src/screens/HomeScreen.tsx", content, "utf8");
console.log("Done!");
