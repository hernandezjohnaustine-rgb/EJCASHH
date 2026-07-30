/**
 * check-jerry-gomez-slots.mjs
 * ---------------------------------------------------------------------------
 * READ-ONLY diagnostic. Does not write or change anything.
 *
 * Checks Jerry Gomez's (JPOWER03) current direct children count in the
 * matrix, lists them all with creation dates, and confirms whether Maroja
 * de Asis Pascua's placement under him is legitimate (within the 10-slot
 * limit) or a violation.
 *
 * USAGE:
 *   node check-jerry-gomez-slots.mjs
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const JPOWER_CODE = "JPOWER03";

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log("\n=== READ-ONLY DIAGNOSTIC — nothing will be changed ===\n");

  const usersSnap = await db.collection("users").get();
  const allUsers = usersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const jpower = allUsers.find((u) => u.referralCode === JPOWER_CODE);
  if (!jpower) { log("⚠️  JPOWER03 not found."); return; }

  log(`Jerry Gomez / JPOWER03 (uid ${jpower.id})\n`);

  const children = allUsers.filter((u) => u.sponsorId === jpower.id);
  const sortedChildren = children.sort((a, b) => {
    const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return aTime - bTime;
  });

  log(`Direct children (sponsorId → him): ${children.length} / 10 max\n`);
  sortedChildren.forEach((c, i) => {
    log(`  ${i + 1}. "${c.displayName}" — created ${c.createdAt || "unknown"}, isActivated: ${c.isActivated === true}`);
  });

  if (children.length > 10) {
    log(`\n⚠️  VIOLATION: ${children.length - 10} account(s) over the 10-slot limit!`);
  } else if (children.length === 10) {
    log(`\n✅ Exactly full — 10/10. Any NEW referral of his should be auto-placed elsewhere (not directly under him).`);
  } else {
    log(`\n✅ ${10 - children.length} slot(s) still open under him.`);
  }

  const maroja = allUsers.find((u) => (u.displayName || "").toLowerCase().includes("maroja"));
  if (maroja) {
    log(`\n--- Maroja de Asis Pascua ---`);
    log(`  uid: ${maroja.id}`);
    log(`  sponsorId: ${maroja.sponsorId} — is this Jerry Gomez? ${maroja.sponsorId === jpower.id}`);
    log(`  createdAt: ${maroja.createdAt || "unknown"}`);
    log(`  isActivated: ${maroja.isActivated === true}`);

    // Where was she in the sorted-by-date order relative to the 10-slot cutoff?
    const position = sortedChildren.findIndex((c) => c.id === maroja.id);
    if (position >= 0) {
      log(`  Her position among Jerry's children (sorted by join date): #${position + 1}`);
      log(`  ${position < 10 ? "This is WITHIN the legitimate first 10 — placement looks correct." : "This is BEYOND the first 10 — placement looks like a violation."}`);
    }
  } else {
    log("\n⚠️  Maroja de Asis Pascua not found.");
  }

  log("\n=== DONE (read-only, nothing was changed) ===");
}

main().catch((err) => {
  console.error("Diagnostic script failed:", err);
  process.exit(1);
});
