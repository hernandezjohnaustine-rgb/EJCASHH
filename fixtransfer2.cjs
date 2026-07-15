const fs = require("fs");
const lines = fs.readFileSync("src/services/earningsService.ts", "utf8").split("\n");

// Find processTransfer function
let startIdx = -1;
let endIdx = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("export async function processTransfer")) {
        startIdx = i;
    }
    if (startIdx > -1 && lines[i] === "}" && i > startIdx + 5) {
        endIdx = i;
        break;
    }
}

console.log("Found processTransfer from line", startIdx+1, "to", endIdx+1);

const newFunction = [
'export async function processTransfer(fromUserId: string, toUserId: string, amount: number) {',
'  try {',
'    const fromRef = doc(db, "users", fromUserId);',
'    const toRef = doc(db, "users", toUserId);',
'    const fromSnap = await getDoc(fromRef);',
'    const toSnap = await getDoc(toRef);',
'    if (!fromSnap.exists() || !toSnap.exists()) throw new Error("User not found");',
'    const fromData = fromSnap.data();',
'    const toData = toSnap.data();',
'    if ((fromData.balance || 0) < amount) throw new Error("Insufficient balance");',
'',
'    const now = Timestamp.now();',
'    const refNo = "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase();',
'    const senderName = fromData.displayName || fromData.username || "Unknown";',
'    const recipientName = toData.displayName || toData.username || "Unknown";',
'',
'    // Update balances',
'    await setDoc(fromRef, { balance: (fromData.balance || 0) - amount }, { merge: true });',
'    await setDoc(toRef, { balance: (toData.balance || 0) + amount }, { merge: true });',
'',
'    // Record sender transaction',
'    await addDoc(collection(db, "transactions"), {',
'      userId: fromUserId, type: "out",',
'      title: "Sent to " + recipientName,',
'      amount: amount, category: "Transfer", status: "Completed",',
'      referenceNo: refNo, paymentMethod: "EJCASHH Wallet", timestamp: now,',
'    });',
'',
'    // Record recipient transaction',
'    await addDoc(collection(db, "transactions"), {',
'      userId: toUserId, type: "in",',
'      title: "Received from " + senderName,',
'      amount: amount, category: "Transfer", status: "Completed",',
'      referenceNo: refNo, paymentMethod: "EJCASHH Wallet", timestamp: now,',
'    });',
'',
'    // Send notification to recipient',
'    await addDoc(collection(db, "users", toUserId, "notifications"), {',
'      title: "Money Received",',
'      message: senderName + " sent you ₱" + amount.toLocaleString("en-US", { minimumFractionDigits: 2 }) + ".",',
'      type: "transfer", read: false, createdAt: now,',
'    });',
'',
'  } catch (error) {',
'    console.error("Transfer error:", error);',
'    throw error;',
'  }',
'}'
];

lines.splice(startIdx, endIdx - startIdx + 1, ...newFunction);
fs.writeFileSync("src/services/earningsService.ts", lines.join("\n"), "utf8");
console.log("Fixed! New function from line", startIdx+1);
