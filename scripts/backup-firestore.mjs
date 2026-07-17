/**
 * backup-firestore.mjs
 * ---------------------------------------------------------------------------
 * Lightweight backup for the collections the migration script touches
 * (users, transactions). This does NOT require the Blaze billing plan —
 * unlike Firestore's built-in Export feature, this just reads documents
 * through the normal Firestore API and writes them to local JSON files,
 * which the GitHub Action then uploads as a downloadable artifact.
 *
 * This is a safety net specifically for the commission-data migration,
 * not a full database backup solution.
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync, writeFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function serialize(docSnap) {
  const data = docSnap.data();
  // Convert Firestore Timestamps to ISO strings so they survive JSON.stringify
  const out = { id: docSnap.id };
  for (const [key, value] of Object.entries(data)) {
    out[key] = value && typeof value.toDate === "function" ? value.toDate().toISOString() : value;
  }
  return out;
}

async function main() {
  console.log("Backing up 'users' collection...");
  const usersSnap = await db.collection("users").get();
  const users = usersSnap.docs.map(serialize);
  writeFileSync("backup-users.json", JSON.stringify(users, null, 2));
  console.log(`  Saved ${users.length} user docs to backup-users.json`);

  console.log("Backing up 'transactions' collection...");
  const txSnap = await db.collection("transactions").get();
  const transactions = txSnap.docs.map(serialize);
  writeFileSync("backup-transactions.json", JSON.stringify(transactions, null, 2));
  console.log(`  Saved ${transactions.length} transaction docs to backup-transactions.json`);

  console.log("\nBackup complete.");
}

main().catch((err) => {
  console.error("Backup failed:", err);
  process.exit(1);
});
