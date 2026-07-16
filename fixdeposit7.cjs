const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const handleRejectDeposit = async")) {
        startIdx = i;
    }
    if (startIdx > -1 && lines[i].trim() === "};") {
        endIdx = i;
        break;
    }
}
console.log("Found handleRejectDeposit from line", startIdx+1, "to", endIdx+1);

const newFunc = [
'  const handleRejectDeposit = async (d: any) => {',
'    setProcessingDeposit(true);',
'    try {',
'      await updateDoc(doc(db, "depositRequests", d.id), {',
'        status: "rejected",',
'        rejectedAt: Timestamp.now(),',
'        adminNote: adminNote || ""',
'      });',
'      await addDoc(collection(db, "users", d.userId, "notifications"), {',
'        title: "Deposit Rejected",',
'        message: "Your GCash deposit of \\u20B1" + (d.amount || 0).toLocaleString() + " was rejected. " + (adminNote ? "Reason: " + adminNote : "Please contact support."),',
'        type: "deposit", read: false, createdAt: Timestamp.now()',
'      });',
'      setSelectedDeposit(null);',
'      setAdminNote("");',
'      await fetchData();',
'    } catch(err) {',
'      console.error("Reject error:", err);',
'      alert("Failed: " + String(err));',
'    } finally {',
'      setProcessingDeposit(false);',
'    }',
'  };'
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newFunc);
fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Fixed handleRejectDeposit!");
