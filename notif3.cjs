const fs = require("fs");
let content = fs.readFileSync("src/services/earningsService.ts", "utf8");

// Add notification creation after L1 commission
content = content.replace(
    `      console.log("L1 commission credited to referrer:", referrerId, "amount:", l1Commission);`,
    `      console.log("L1 commission credited to referrer:", referrerId, "amount:", l1Commission);
      // Create notification
      await addDoc(collection(db, "users", referrerId, "notifications"), {
        title: "Direct Referral Commission",
        message: "You earned ₱" + l1Commission.toLocaleString() + " from a new direct referral!",
        type: "commission",
        read: false,
        createdAt: Timestamp.now(),
      });`
);

// Add notification for L2-L10
content = content.replace(
    `      console.log("L" + level + " commission credited to:", currentUid, "amount:", commission);`,
    `      console.log("L" + level + " commission credited to:", currentUid, "amount:", commission);
      // Create notification
      await addDoc(collection(db, "users", currentUid, "notifications"), {
        title: "Level " + level + " Matrix Commission",
        message: "₱" + commission.toLocaleString() + " added to your Credits wallet (Level " + level + ")",
        type: "credits",
        read: false,
        createdAt: Timestamp.now(),
      });`
);

fs.writeFileSync("src/services/earningsService.ts", content, "utf8");
console.log("Done!");
