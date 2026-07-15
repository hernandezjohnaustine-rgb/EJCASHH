const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("if (!confirm(\"Approve") && lines[i].includes("deposit?")) {
        // Replace the entire approve onClick with better error handling
        lines[i] = `                        <button onClick={async () => {
                          if (!confirm("Approve ₱" + d.amount + " deposit for " + d.userName + "?")) return;
                          try {
                            const fi = await import("firebase/firestore");
                            const db2 = (await import("../lib/firebase")).db;
                            // 1. Update deposit status
                            await fi.updateDoc(fi.doc(db2, "depositRequests", d.id), { 
                              status: "approved", 
                              approvedAt: fi.Timestamp.now() 
                            });
                            // 2. Credit user balance
                            const uRef = fi.doc(db2, "users", d.userId);
                            const uSnap = await fi.getDoc(uRef);
                            if (!uSnap.exists()) throw new Error("User not found");
                            const currentBalance = uSnap.data().balance || 0;
                            await fi.updateDoc(uRef, { balance: currentBalance + d.amount });
                            // 3. Record transaction
                            await fi.addDoc(fi.collection(db2, "transactions"), {
                              userId: d.userId,
                              type: "in",
                              title: "GCash Deposit",
                              amount: d.amount,
                              category: "Cash In",
                              status: "Completed",
                              referenceNo: d.referenceNo,
                              paymentMethod: "GCash",
                              timestamp: fi.Timestamp.now(),
                            });
                            // 4. Send notification
                            await fi.addDoc(fi.collection(db2, "users", d.userId, "notifications"), {
                              title: "Deposit Approved!",
                              message: "Your GCash deposit of ₱" + d.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " has been credited to your wallet.",
                              type: "deposit",
                              read: false,
                              createdAt: fi.Timestamp.now(),
                            });
                            alert("✅ Deposit approved! ₱" + d.amount + " credited to " + d.userName);
                            fetchData();
                          } catch(err: any) {
                            console.error("Approve error:", err);
                            alert("❌ Failed to approve: " + err.message);
                          }
                        }} className="flex-1 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black uppercase rounded-xl">Approve</button>`;
        
        // Find and remove old lines until the closing </button>
        let j = i + 1;
        while (j < lines.length && !lines[j].includes('className="flex-1 py-2 bg-red-500')) {
            lines[j] = '';
            j++;
        }
        console.log("Fixed approve button at line", i + 1);
        break;
    }
}

fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
