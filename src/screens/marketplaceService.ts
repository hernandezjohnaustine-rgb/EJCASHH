import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where, Timestamp, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";

const COMMISSION_RATES: Record<number, number> = {
  1: 0.10, 2: 0.05, 3: 0.03, 4: 0.02,
  5: 0.01, 6: 0.01, 7: 0.01, 8: 0.01, 9: 0.01, 10: 0.01,
};

export async function distributeMarketplaceCommission(buyerId: string, productPrice: number) {
  let currentUid = buyerId;
  for (let level = 1; level <= 10; level++) {
    const userDoc = await getDoc(doc(db, "users", currentUid));
    if (!userDoc.exists()) break;
    const userData = userDoc.data();
    const sponsorId = userData.sponsorId;
    if (!sponsorId) break;
    const commission = productPrice * COMMISSION_RATES[level];
    const sponsorDoc = await getDoc(doc(db, "users", sponsorId));
    if (!sponsorDoc.exists()) break;
    const sponsorData = sponsorDoc.data();
    await setDoc(doc(db, "users", sponsorId), {
      balance: (sponsorData.balance || 0) + commission,
      earningsWallet: (sponsorData.earningsWallet || 0) + commission,
      stats: {
        ...sponsorData.stats,
        totalEarnings: (sponsorData.stats?.totalEarnings || 0) + commission,
      }
    }, { merge: true });
    await addDoc(collection(db, "transactions"), {
      userId: sponsorId,
      type: "in",
      title: `Marketplace Commission (Level ${level})`,
      amount: commission,
      category: "Commission",
      status: "Completed",
      referenceNo: "EJ-MKT-" + Math.random().toString(36).substr(2, 9).toUpperCase(),
      paymentMethod: "MLM Commission",
      timestamp: Timestamp.now(),
    });
    currentUid = sponsorId;
  }
}

export async function getProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function addProduct(product: any) {
  return await addDoc(collection(db, "products"), {
    ...product,
    createdAt: Timestamp.now(),
    isActive: true,
  });
}

export async function updateProduct(id: string, data: any) {
  await updateDoc(doc(db, "products", id), data);
}

export async function createOrder(order: any) {
  return await addDoc(collection(db, "orders"), {
    ...order,
    status: "Pending",
    createdAt: Timestamp.now(),
  });
}

export async function getOrders(userId: string) {
  const q = query(collection(db, "orders"), where("buyerId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getAllOrders() {
  const snap = await getDocs(collection(db, "orders"));
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function updateOrderStatus(orderId: string, status: string) {
  await updateDoc(doc(db, "orders", orderId), { status });
}
