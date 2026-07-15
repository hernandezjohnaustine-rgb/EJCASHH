content = open('src/services/earningsService.ts', 'r', encoding='utf-8').read()
old = '''export async function processActivation(
  userId: string,
  sponsorId: string | null,
  packageId: string = "package_1"
): Promise<void> {
  if (!sponsorId) {
    console.log("No sponsor ID - skipping commission distribution");
    return;
  }

  console.log("Starting commission distribution for sponsor:", sponsorId, "package:", packageId);

  let currentUid = sponsorId;

  for (let level = 1; level <= 10; level++) {
    try {
      const sponsorDoc = await getDoc(doc(db, "users", currentUid));
      if (!sponsorDoc.exists()) {
        console.log("Sponsor not found at level", level, "- stopping");
        break;
      }

      const sponsorData = sponsorDoc.data();
      const commission = getCommission(level, packageId);

      console.log("Level", level, "sponsor:", currentUid, "commission:", commission);

      // Single update - no overwrite issue
      await setDoc(doc(db, "users", currentUid), {
        balance: (sponsorData.balance || 0) + commission,
        earningsWallet: (sponsorData.earningsWallet || 0) + commission,
        stats: {
          ...sponsorData.stats,
          totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission,
          teamSize: (sponsorData.stats?.teamSize || 0) + 1,
          totalReferrals: (sponsorData.stats?.totalReferrals || 0) + 1,
          ...(level === 1 ? {
            directReferrals: (sponsorData.stats?.directReferrals || 0) + 1,
          } : {}),
        }
      }, { merge: true });

      // Record transaction
      await addDoc(collection(db, "transactions"), {
        userId: currentUid,
        type: "in",
        title: level === 1
          ? "Direct Referral Commission"
          : "Indirect Referral Commission (Level " + level + ")",
        amount: commission,
        category: "Commission",
        status: "Completed",
        referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: "MLM Commission",
        timestamp: Timestamp.now(),
        packageId,
        fromUserId: userId,
        commissionLevel: level,
      });

      console.log("Level", level, "commission credited successfully");

      // Move to next upline
      const nextUid = sponsorData.sponsorId || sponsorData.referredBy;
      if (!nextUid) {
        console.log("No more uplines at level", level);
        break;
      }
      currentUid = nextUid;

    } catch (error) {
      console.error("Commission error at level " + level + ":", error);
      break;
    }
  }

  console.log("Commission distribution complete");
}'''
new = '''export async function processActivation(
  userId: string,
  placementSponsorId: string | null,
  packageId: string = "package_1",
  originalReferrerId?: string | null
): Promise<void> {
  if (!placementSponsorId && !originalReferrerId) {
    console.log("No sponsor ID - skipping commission distribution");
    return;
  }

  console.log("Starting commission distribution. Referrer:", originalReferrerId, "Placement:", placementSponsorId, "Package:", packageId);

  // ✅ Step 1: Credit Level 1 commission to ORIGINAL REFERRER (who shared the link)
  const referrerId = originalReferrerId || placementSponsorId;
  if (referrerId) {
    try {
      const referrerDoc = await getDoc(doc(db, "users", referrerId));
      if (referrerDoc.exists()) {
        const referrerData = referrerDoc.data();
        const l1Commission = getCommission(1, packageId);
        await setDoc(doc(db, "users", referrerId), {
          balance: (referrerData.balance || 0) + l1Commission,
          earningsWallet: (referrerData.earningsWallet || 0) + l1Commission,
          stats: {
            ...referrerData.stats,
            totalEarnings: (referrerData.stats?.totalEarnings || 0) + l1Commission,
            directReferrals: (referrerData.stats?.directReferrals || 0) + 1,
            teamSize: (referrerData.stats?.teamSize || 0) + 1,
            totalReferrals: (referrerData.stats?.totalReferrals || 0) + 1,
          }
        }, { merge: true });
        await addDoc(collection(db, "transactions"), {
          userId: referrerId,
          type: "in",
          title: "Direct Referral Commission",
          amount: l1Commission,
          category: "Commission",
          status: "Completed",
          referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
          paymentMethod: "MLM Commission",
          timestamp: Timestamp.now(),
          packageId,
          fromUserId: userId,
          commissionLevel: 1,
        });
        console.log("Level 1 commission credited to original referrer:", referrerId);
      }
    } catch (error) {
      console.error("Level 1 referrer commission error:", error);
    }
  }

  // ✅ Step 2: Credit Levels 2-10 to PLACEMENT UPLINES (matrix chain)
  if (!placementSponsorId) return;

  // Start from placement sponsor upline (skip level 1 since already credited)
  let currentUid = placementSponsorId;
  // If placement is same as referrer, skip to their upline for level 2
  if (currentUid === referrerId) {
    const placementDoc = await getDoc(doc(db, "users", currentUid));
    if (placementDoc.exists()) {
      const placementData = placementDoc.data();
      currentUid = placementData.sponsorId || placementData.referredBy || "";
    }
  }

  for (let level = 2; level <= 10; level++) {
    if (!currentUid) break;
    try {
      const sponsorDoc = await getDoc(doc(db, "users", currentUid));
      if (!sponsorDoc.exists()) {
        console.log("Upline not found at level", level, "- stopping");
        break;
      }
      const sponsorData = sponsorDoc.data();
      const commission = getCommission(level, packageId);
      console.log("Level", level, "upline:", currentUid, "commission:", commission);
      await setDoc(doc(db, "users", currentUid), {
        balance: (sponsorData.balance || 0) + commission,
        earningsWallet: (sponsorData.earningsWallet || 0) + commission,
        stats: {
          ...sponsorData.stats,
          totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission,
          teamSize: (sponsorData.stats?.teamSize || 0) + 1,
          totalReferrals: (sponsorData.stats?.totalReferrals || 0) + 1,
        }
      }, { merge: true });
      await addDoc(collection(db, "transactions"), {
        userId: currentUid,
        type: "in",
        title: "Indirect Referral Commission (Level " + level + ")",
        amount: commission,
        category: "Commission",
        status: "Completed",
        referenceNo: "EJ-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
        paymentMethod: "MLM Commission",
        timestamp: Timestamp.now(),
        packageId,
        fromUserId: userId,
        commissionLevel: level,
      });
      console.log("Level", level, "commission credited successfully");
      const nextUid = sponsorData.sponsorId || sponsorData.referredBy;
      if (!nextUid) break;
      currentUid = nextUid;
    } catch (error) {
      console.error("Commission error at level " + level + ":", error);
      break;
    }
  }
  console.log("Commission distribution complete");
}'''
content = content.replace(old, new)
open('src/services/earningsService.ts', 'w', encoding='utf-8').write(content)
print('Done!')
