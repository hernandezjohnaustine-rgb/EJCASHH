const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf8");

// Update handleClaimMilestoneReward to transfer from creditsBalance to balance
content = content.replace(
  `    await setDoc(userDocRef, {
      earningsWallet: currentEarnings + reward,
      [claimedKey]: true,`,
  `    await setDoc(userDocRef, {
      balance: (freshData.balance || 0) + reward,
      creditsBalance: Math.max(0, (freshData.creditsBalance || 0) - reward),
      [claimedKey]: true,`
);

fs.writeFileSync("src/App.tsx", content, "utf8");
console.log("Done!");
