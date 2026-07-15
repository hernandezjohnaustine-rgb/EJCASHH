const fs = require("fs");
let content = fs.readFileSync("src/services/earningsService.ts", "utf8");
// Change L2-10 to credit creditsBalance instead of balance+earningsWallet
content = content.replace(
`      await setDoc(doc(db, "users", currentUid), {
        balance: (sponsorData.balance || 0) + commission,
        earningsWallet: (sponsorData.earningsWallet || 0) + commission,
        stats: {
          ...sponsorData.stats,
          totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission,
          teamSize: (sponsorData.stats?.teamSize || 0) + 1,
          totalReferrals: (sponsorData.stats?.totalReferrals || 0) + 1,
        }
      }, { merge: true });`,
`      await setDoc(doc(db, "users", currentUid), {
        creditsBalance: (sponsorData.creditsBalance || 0) + commission,
        stats: {
          ...sponsorData.stats,
          totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission,
          teamSize: (sponsorData.stats?.teamSize || 0) + 1,
          totalReferrals: (sponsorData.stats?.totalReferrals || 0) + 1,
        }
      }, { merge: true });`
);
fs.writeFileSync("src/services/earningsService.ts", content, "utf8");
console.log("Done!");
