/**
 * check-juanita-connections.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Checks Juanita Dela Cruz's current sponsorId (who she's placed under in
 * the matrix) and her matrix children (sponsorId → her), to understand
 * how any EJCASHH01-11 backbone accounts might be showing up connected
 * to her.
 *
 * USAGE:
 *   node check-juanita-connections.mjs
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log("\n=== READ-ONLY DIAGNOSTIC — nothing will be changed ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const usersById = new Map(allUsers.map((u) => [u.id, u]));

  const juanita = allUsers.find((u) => (u.displayName || "").toLowerCase().includes("juanita dela cruz"));
  if (!juanita) { log("⚠️  Juanita Dela Cruz not found."); return; }

  log(`Juanita Dela Cruz (uid ${juanita.id})`);
  log(`  Current sponsorId (matrix): ${juanita.sponsorId || "(none)"} — "${usersById.get(juanita.sponsorId)?.displayName || ""}"`);
  log(`  Current originalReferrerId (referral chain): ${juanita.originalReferrerId || "(none)"} — "${usersById.get(juanita.originalReferrerId)?.displayName || ""}"`);

  const matrixChildren = allUsers.filter((u) => u.sponsorId === juanita.id);
  log(`\n  Matrix children (sponsorId → her): ${matrixChildren.length}`);
  matrixChildren.forEach((c) => log(`    - "${c.displayName}" (uid ${c.id})`));

  const chainChildren = allUsers.filter((u) => u.originalReferrerId === juanita.id);
  log(`\n  Referral-chain children (originalReferrerId → her): ${chainChildren.length}`);
  chainChildren.forEach((c) => log(`    - "${c.displayName}" (uid ${c.id})`));

  log("\n--- Any EJCASHH01-11 account whose sponsorId OR originalReferrerId points to Juanita ---\n");
  const backboneNames = ["EJCASHH01", "EJCASHH02", "EJCASHH03", "EJCASHH04", "EJCASHH05", "EJCASHH06", "EJCASHH07", "EJCASHH08", "EJCASHH09", "EJCASHH10", "EJCASHH11"];
  const backboneAccounts = allUsers.filter((u) => backboneNames.includes(u.displayName));
  let foundAny = false;
  backboneAccounts.forEach((b) => {
    if (b.sponsorId === juanita.id) { log(`  ⚠️  "${b.displayName}" has sponsorId pointing to Juanita`); foundAny = true; }
    if (b.originalReferrerId === juanita.id) { log(`  ⚠️  "${b.displayName}" has originalReferrerId pointing to Juanita`); foundAny = true; }
  });
  if (!foundAny) log("  None found — no backbone account is directly connected to Juanita either way.");

  log("\n--- Full backbone account status (for reference) ---\n");
  backboneAccounts.forEach((b) => {
    log(`  "${b.displayName}" — sponsorId: ${b.sponsorId || "(none)"}, originalReferrerId: ${b.originalReferrerId ? (usersById.get(b.originalReferrerId)?.displayName || "MISMATCH") : "(none)"}`);
  });

  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
