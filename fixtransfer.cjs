const fs = require("fs");
let content = fs.readFileSync("src/services/earningsService.ts", "utf8");
content = content.replace(
`export async function processTransfer(fromUserId: string, toUserId: string, amount: number) {
  try {
    const fromRef = doc(db, "users", fromUserId);
    const toRef = doc(db, "users", toUserId);
    const fromSnap = await getDoc(fromRef);
    const toSnap = await getDoc(toRef);
    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("User not found");
    const fromData = fromSnap.data();
    const toData = toSnap.data();
    if ((fromData.balance || 0) < amount) throw new Error("Insufficient balance");
    await setDoc(fromRef, { balance: (fromData.balance || 0) - amount }, { merge: true });
    await setDoc(toRef, { balance: (toData.balance || 0) + amount }, { merge: true });
  } catch (error) {
    console.error("Transfer error:", error);
    throw error;
  }
}`,
`export async function processTransfer(fromUserId: string, toUserId: string, amount: number) {
  try {
    const fromRef = doc(db, "users", fromUserId);
    const toRef = doc(db, "users", toUserId);
    const fromSnap = await getDoc(fromRef);
    const toSnap = await getDoc(toRef);
    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("User not found");
    const fromData = fromSnap.data();
    const toData = toSnap.data();
    if ((fromData.balance || 0) < amount) throw new Error("Insufficient balance");

    const now = Timestamp.now();
    const refNo = "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const senderName = fromData.displayName || fromData.username || "Unknown";
    const recipientName = toData.displayName || toData.username || "Unknown";

    // Update balances
    await setDoc(fromRef, { balance: (fromData.balance || 0) - amount }, { merge: true });
    await setDoc(toRef, { balance: (toData.balance || 0) + amount }, { merge: true });

    // Record sender transaction
    await addDoc(collection(db, "transactions"), {
      userId: fromUserId,
      type: "out",
      title: "Sent to " + recipientName,
      amount: amount,
      category: "Transfer",
      status: "Completed",
      referenceNo: refNo,
      paymentMethod: "EJCASHH Wallet",
      timestamp: now,
    });

    // Record recipient transaction
    await addDoc(collection(db, "transactions"), {
      userId: toUserId,
      type: "in",
      title: "Received from " + senderName,
      amount: amount,
      category: "Transfer",
      status: "Completed",
      referenceNo: refNo,
      paymentMethod: "EJCASHH Wallet",
      timestamp: now,
    });

    // Send notification to recipient
    await addDoc(collection(db, "users", toUserId, "notifications"), {
      title: "Money Received",
      message: senderName + " sent you ₱" + amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) + ".",
      type: "transfer",
      read: false,
      createdAt: now,
    });

  } catch (error) {
    console.error("Transfer error:", error);
    throw error;
  }
}`
);
fs.writeFileSync("src/services/earningsService.ts", content, "utf8");
console.log("Done!");
