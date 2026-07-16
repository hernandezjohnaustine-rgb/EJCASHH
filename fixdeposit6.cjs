const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

// Find handleApproveDeposit start
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const handleApproveDeposit = async")) {
        startIdx = i;
    }
    if (startIdx > -1 && lines[i].trim() === "};") {
        endIdx = i;
        break;
    }
}
console.log("Found handleApproveDeposit from line", startIdx+1, "to", endIdx+1);

const newFunc = [
'  const handleApproveDeposit = async (d: any) => {',
'    setProcessingDeposit(true);',
'    try {',
'      await updateDoc(doc(db, "depositRequests", d.id), {',
'        status: "approved",',
'        approvedAt: Timestamp.now(),',
'        adminNote: adminNote || ""',
'      });',
'      const uRef = doc(db, "users", d.userId);',
'      const uSnap = await getDoc(uRef);',
'      if (!uSnap.exists()) throw new Error("User not found: " + d.userId);',
'      await updateDoc(uRef, { balance: (uSnap.data().balance || 0) + d.amount });',
'      await addDoc(collection(db, "transactions"), {',
'        userId: d.userId, type: "in", title: "GCash Deposit",',
'        amount: d.amount, category: "Cash In", status: "Completed",',
'        referenceNo: d.referenceNo || "", paymentMethod: "GCash",',
'        timestamp: Timestamp.now()',
'      });',
'      await addDoc(collection(db, "users", d.userId, "notifications"), {',
'        title: "Deposit Approved!",',
'        message: "Your GCash deposit of \\u20B1" + (d.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " has been credited to your wallet.",',
'        type: "deposit", read: false, createdAt: Timestamp.now()',
'      });',
'      setSelectedDeposit(null);',
'      setAdminNote("");',
'      await fetchData();',
'      alert("Approved! \\u20B1" + d.amount + " credited to " + d.userName);',
'    } catch(err) {',
'      console.error("Approve error:", err);',
'      alert("Failed: " + String(err));',
'    } finally {',
'      setProcessingDeposit(false);',
'    }',
'  };'
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newFunc);
fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Fixed handleApproveDeposit!");
