/**
 * backfill-referral-codes.mjs
 * ---------------------------------------------------------------------------
 * Fixes broken referral links caused by missing `referralCodes/{CODE}`
 * lookup documents.
 *
 * WHY THIS HAPPENS: AuthScreen.tsx validates a referral code by first
 * checking referralCodes/{code} (a public doc, readable while logged out).
 * If that's missing, it falls back to querying the `users` collection —
 * but that query requires isSignedIn() per firestore.rules, which a
 * brand-new registrant doesn't have yet. So if a user's account was ever
 * created without its referralCodes/{code} doc being written (a failed
 * write, a race condition, or an account created before that logic
 * existed), their referral link is permanently broken for everyone trying
 * to register with it — even though the code itself is legitimate.
 *
 * WHAT THIS SCRIPT DOES:
 *   For every user with a `referralCode` field, checks whether
 *   referralCodes/{their code} exists and points to their own uid. If it's
 *   missing or points to the wrong uid, creates/corrects it.
 *
 * WHAT THIS SCRIPT DOES NOT TOUCH:
 *   No user data, balances, credits, or stats — purely additive fixes to
 *   the public referralCodes lookup collection.
 *
 * USAGE:
 *   node backfill-referral-codes.mjs            (dry run, default)
 *   node backfill-referral-codes.mjs --apply     (writes for real)
 * ---------------------------------------------------------------------------
 */

import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { readFileSync } from "fs";

const APPLY = process.argv.includes("--apply");

const serviceAccount = JSON.parse(readFileSync(new URL("./serviceAccountKey.json", import.meta.url)));
initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function log(...args) { console.log(...args); }

async function main() {
  log(APPLY ? "\n=== APPLY MODE — CHANGES WILL BE WRITTEN ===\n" : "\n=== DRY RUN — no data will be changed. Pass --apply to write. ===\n");

  const usersSnap = await db.collection("users").get();
  log(`Loaded ${usersSnap.size} users.`);

  const referralCodesSnap = await db.collection("referralCodes").get();
  const existingLookups = new Map(); // code -> uid
  referralCodesSnap.forEach((d) => existingLookups.set(d.id, d.data()?.uid));
  log(`Loaded ${existingLookups.size} existing referralCodes lookup docs.\n`);

  let missingCount = 0;
  let wrongUidCount = 0;
  let skippedNoCode = 0;

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const data = userDoc.data();
    const code = data.referralCode;
    const name = data.displayName || data.email || uid;

    if (!code) { skippedNoCode++; continue; }

    const existingUid = existingLookups.get(code);

    if (existingUid === undefined) {
      missingCount++;
      log(`  [MISSING] "${name}" — referralCode "${code}" has no referralCodes/${code} doc.`);
      if (APPLY) {
        await db.collection("referralCodes").doc(code).set({ uid });
      }
    } else if (existingUid !== uid) {
      wrongUidCount++;
      log(`  [MISMATCH] referralCodes/${code} points to ${existingUid}, but "${name}" (${uid}) owns this code — fixing to point to the correct owner.`);
      if (APPLY) {
        await db.collection("referralCodes").doc(code).set({ uid });
      }
    }
  }

  log(`\n${skippedNoCode} user(s) have no referralCode set (skipped, nothing to do).`);
  log(`${missingCount} missing lookup doc(s) found.`);
  log(`${wrongUidCount} mismatched lookup doc(s) found.`);
  log(`${missingCount + wrongUidCount} total fix(es) ${APPLY ? "applied." : "needed (dry run, not written)."}`);

  log("\n=== DONE ===");
  if (!APPLY) {
    log("This was a dry run. Review the output above, then re-run with --apply to write these fixes.");
  }
}

main().catch((err) => {
  console.error("Backfill script failed:", err);
  process.exit(1);
});
