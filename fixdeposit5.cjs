const fs = require("fs");
let content = fs.readFileSync("src/screens/AdminScreen.tsx", "utf8");

// Replace dynamic imports with direct Firestore calls in handleApproveDeposit
const oldApprove = `  const handleApproveDeposit = async (d: any) => {
    setProcessingDeposit(true);
    try {
      const fi = await import("firebase/firestore");
      const db2 = (await import("../lib/firebase")).db;
      await fi.updateDoc(fi.doc(db2, "depositRequests", d.id), { status: "approved", approvedAt: fi.Timestamp.now(), adminNote: adminNote || "" });
      const uRef = fi.doc(db2, "users", d.userId);
      const uSnap = await fi.getDoc(uRef);
      if (!uSnap.exists()) throw new Error("User not found");
      await fi.updateDoc(uRef, { balance: (uSnap.data().balance || 0) + d.amount });
      await fi.addDoc(fi.collection(db2, "transactions"), { userId: d.userId, type: "in", title: "GCash Deposit", amount: d.amount, category: "Cash In", status: "Completed", referenceNo: d.referenceNo, paymentMethod: "GCash", timestamp: fi.Timestamp.now() });
      await fi.addDoc(fi.collection(db2, "users", d.userId, "notifications"), { title: "Deposit Approved!", message: "Your GCash deposit of ₱" + d.amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) + " has been credited to your wallet.", type: "deposit", read: false, createdAt: fi.Timestamp.now() });
      setSelectedDeposit(null);
      setAdminNote("");
      fetchData();
      alert("✅ Approved! ₱" + d.amount + " credited.");
    } catch(err: any) { alert("❌ Failed: " + err.message); }
    finally { setProcessingDeposit(false); }
  };`;

const newApprove = `  const handleApproveDeposit = async (d: any) => {
    setProcessingDeposit(true);
    try {
      console.log("Approving deposit:", d.id, "amount:", d.amount, "userId:", d.userId);
      // 1. Update deposit status
      await updateDoc(doc(db, "depositRequests", d.id), { 
        status: "approved", 
        approvedAt: Timestamp.now(), 
        adminNote: adminNote || "" 
      });
      console.log("Deposit status updated");
      // 2. Credit user balance
      const uRef = doc(db, "users", d.userId);
      const uSnap = await getDoc(uRef);
      if (!uSnap.exists()) throw new Error("User not found: " + d.userId);
      const currentBal = uSnap.data().balance || 0;
      await updateDoc(uRef, { balance: currentBal + d.amount });
      console.log("Balance updated from", currentBal, "to", currentBal + d.amount);
      // 3. Record transaction
      await addDoc(collection(db, "transactions"), { 
        userId: d.userId, 
        type: "in", 
        title: "GCash Deposit", 
        amount: d.amount, 
        category: "Cash In", 
        status: "Completed", 
        referenceNo: d.referenceNo || "", 
        paymentMethod: "GCash", 
        timestamp: Timestamp.now() 
      });
      console.log("Transaction recorded");
      // 4. Send notification
      await addDoc(collection(db, "users", d.userId, "notifications"), { 
        title: "Deposit Approved!", 
        message: "Your GCash deposit of ₱" + (d.amount || 0).toLocaleString("en-US", { minimumFractionDigits: 2 }) + " has been credited to your wallet.", 
        type: "deposit", 
        read: false, 
        createdAt: Timestamp.now() 
      });
      console.log("Notification sent");
      setSelectedDeposit(null);
      setAdminNote("");
      await fetchData();
      alert("Approved! ₱" + d.amount + " credited to " + d.userName);
    } catch(err: any) { 
      console.error("Approve error:", err);
      alert("Failed: " + (err.message || String(err))); 
    }
    finally { setProcessingDeposit(false); }
  };`;

const oldReject = `  const handleRejectDeposit = async (d: any) => {
    setProcessingDeposit(true);
    try {
      const fi = await import("firebase/firestore");
      const db2 = (await import("../lib/firebase")).db;
      await fi.updateDoc(fi.doc(db2, "depositRequests", d.id), { status: "rejected", rejectedAt: fi.Timestamp.now(), adminNote: adminNote || "" });
      await fi.addDoc(fi.collection(db2, "users", d.userId, "notifications"), { title: "Deposit Rejected", message: "Your GCash deposit of ₱" + d.amount.toLocaleString() + " was rejected. Reason: " + (adminNote || "No reason provided"), type: "deposit", read: false, createdAt: fi.Timestamp.now() });
      setSelectedDeposit(null);
      setAdminNote("");`;

const newReject = `  const handleRejectDeposit = async (d: any) => {
    setProcessingDeposit(true);
    try {
      await updateDoc(doc(db, "depositRequests", d.id), { status: "rejected", rejectedAt: Timestamp.now(), adminNote: adminNote || "" });
      await addDoc(collection(db, "users", d.userId, "notifications"), { title: "Deposit Rejected", message: "Your GCash deposit of ₱" + (d.amount || 0).toLocaleString() + " was rejected. Reason: " + (adminNote || "No reason provided"), type: "deposit", read: false, createdAt: Timestamp.now() });
      setSelectedDeposit(null);
      setAdminNote("");`;

content = content.replace(oldApprove, newApprove);
content = content.replace(oldReject, newReject);

// Make sure updateDoc, addDoc, getDoc, Timestamp are imported at top
if (!content.includes("updateDoc") || content.includes("updateDoc") && !content.match(/^import.*updateDoc/m)) {
    content = content.replace(
        'import { collection, getDocs, doc, updateDoc, setDoc, getDoc, onSnapshot, query, orderBy, Timestamp, addDoc, deleteDoc } from "firebase/firestore";',
        'import { collection, getDocs, doc, updateDoc, setDoc, getDoc, onSnapshot, query, orderBy, Timestamp, addDoc, deleteDoc } from "firebase/firestore";'
    );
}

fs.writeFileSync("src/screens/AdminScreen.tsx", content, "utf8");
console.log("Done!");
