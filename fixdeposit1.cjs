const fs = require("fs");
const lines = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8").split("\n");

// Add selectedDeposit state after deposits state
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const [deposits, setDeposits] = useState")) {
        lines.splice(i + 1, 0, 
            "  const [selectedDeposit, setSelectedDeposit] = useState<any | null>(null);",
            "  const [adminNote, setAdminNote] = useState(\"\");",
            "  const [processingDeposit, setProcessingDeposit] = useState(false);",
            "  const [zoomImage, setZoomImage] = useState(false);"
        );
        console.log("Added deposit states at line", i + 1);
        break;
    }
}

// Add handleApproveDeposit and handleRejectDeposit functions
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const handleToggleTrading")) {
        const newFunctions = [
'  const handleApproveDeposit = async (d: any) => {',
'    if (!confirm("Approve ₱" + d.amount + " deposit for " + d.userName + "?")) return;',
'    setProcessingDeposit(true);',
'    try {',
'      const fi = await import("firebase/firestore");',
'      const db2 = (await import("../lib/firebase")).db;',
'      await fi.updateDoc(fi.doc(db2, "depositRequests", d.id), { status: "approved", approvedAt: fi.Timestamp.now(), adminNote: adminNote || "" });',
'      const uRef = fi.doc(db2, "users", d.userId);',
'      const uSnap = await fi.getDoc(uRef);',
'      if (!uSnap.exists()) throw new Error("User not found");',
'      await fi.updateDoc(uRef, { balance: (uSnap.data().balance || 0) + d.amount });',
'      await fi.addDoc(fi.collection(db2, "transactions"), { userId: d.userId, type: "in", title: "GCash Deposit", amount: d.amount, category: "Cash In", status: "Completed", referenceNo: d.referenceNo, paymentMethod: "GCash", timestamp: fi.Timestamp.now() });',
'      await fi.addDoc(fi.collection(db2, "users", d.userId, "notifications"), { title: "Deposit Approved!", message: "Your GCash deposit of ₱" + d.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " has been credited to your wallet.", type: "deposit", read: false, createdAt: fi.Timestamp.now() });',
'      setSelectedDeposit(null);',
'      setAdminNote("");',
'      fetchData();',
'      alert("✅ Approved! ₱" + d.amount + " credited.");',
'    } catch(err: any) { alert("❌ Failed: " + err.message); }',
'    finally { setProcessingDeposit(false); }',
'  };',
'  const handleRejectDeposit = async (d: any) => {',
'    if (!confirm("Reject this deposit request?")) return;',
'    setProcessingDeposit(true);',
'    try {',
'      const fi = await import("firebase/firestore");',
'      const db2 = (await import("../lib/firebase")).db;',
'      await fi.updateDoc(fi.doc(db2, "depositRequests", d.id), { status: "rejected", rejectedAt: fi.Timestamp.now(), adminNote: adminNote || "" });',
'      await fi.addDoc(fi.collection(db2, "users", d.userId, "notifications"), { title: "Deposit Rejected", message: "Your GCash deposit of ₱" + d.amount.toLocaleString() + " was rejected. Reason: " + (adminNote || "No reason provided"), type: "deposit", read: false, createdAt: fi.Timestamp.now() });',
'      setSelectedDeposit(null);',
'      setAdminNote("");',
'      fetchData();',
'    } catch(err: any) { alert("❌ Failed: " + err.message); }',
'    finally { setProcessingDeposit(false); }',
'  };',
        ];
        lines.splice(i, 0, ...newFunctions);
        console.log("Added approve/reject functions at line", i + 1);
        break;
    }
}

fs.writeFileSync("src/screens/AdminScreen.tsx", lines.join("\n"), "utf8");
console.log("Done step 1!");
