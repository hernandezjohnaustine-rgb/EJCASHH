/**
 * check-jerry-pendoro-status.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Checks Jerry G Pendoro's current sponsorId (matrix) and referral-chain
 * relationships, and lists everyone whose originalReferrerId or sponsorId
 * points to him — his full "genealogy" — before deciding how to move
 * him (and them) into the Team Matrix under JPOWER03.
 *
 * USAGE:
 *   node check-jerry-pendoro-status.mjs
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

  const jerry = allUsers.find((u) => u.displayName === "Jerry G Pendoro");
  if (!jerry) { log("⚠️  Jerry G Pendoro not found."); return; }

  log(`Jerry G Pendoro (uid ${jerry.id})`);
  log(`  Current sponsorId (matrix): ${jerry.sponsorId || "(none — not in the matrix)"}`);
  log(`  Current originalReferrerId (referral chain): ${jerry.originalReferrerId || "(none)"} — "${usersById.get(jerry.originalReferrerId)?.displayName || ""}"`);
  log(`  isActivated: ${jerry.isActivated === true}`);

  const referralChainChildren = allUsers.filter((u) => u.originalReferrerId === jerry.id);
  const matrixChildren = allUsers.filter((u) => u.sponsorId === jerry.id);

  log(`\n  Referral-chain children (originalReferrerId → him): ${referralChainChildren.length}`);
  referralChainChildren.forEach((c) => log(`    - ${c.displayName} (uid ${c.id})`));

  log(`\n  Matrix children (sponsorId → him): ${matrixChildren.length}`);
  matrixChildren.forEach((c) => log(`    - ${c.displayName} (uid ${c.id})`));

  // Full referral-chain genealogy under him (recursive)
  function collectDescendants(uid, depth = 0) {
    if (depth > 20) return [];
    const kids = allUsers.filter((u) => u.originalReferrerId === uid);
    let all = [...kids];
    for (const k of kids) all = all.concat(collectDescendants(k.id, depth + 1));
    return all;
  }
  const fullGenealogy = collectDescendants(jerry.id);
  log(`\n  Full referral-chain genealogy under him (all depths): ${fullGenealogy.length} total`);
  fullGenealogy.forEach((c) => log(`    - ${c.displayName} (uid ${c.id})`));

  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
