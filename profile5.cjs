const fs = require("fs");
let content = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8");

// Add payment methods state
const paymentState = `  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [paymentType, setPaymentType] = useState("gcash");
  const [paymentName, setPaymentName] = useState("");
  const [paymentNumber, setPaymentNumber] = useState("");
  const [paymentBank, setPaymentBank] = useState("");
  const [savingPayment, setSavingPayment] = useState(false);

  const loadPaymentMethods = async () => {
    if (!userId) return;
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const snap = await getDocs(collection(db, "users", userId, "paymentMethods"));
      setPaymentMethods(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  };

  const handleAddPayment = async () => {
    if (!userId) return;
    if (!paymentNumber) { alert("Please enter account number."); return; }
    setSavingPayment(true);
    try {
      const { collection, addDoc, Timestamp } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await addDoc(collection(db, "users", userId, "paymentMethods"), {
        type: paymentType,
        name: paymentName || paymentType.toUpperCase(),
        number: paymentNumber,
        bank: paymentBank,
        isDefault: paymentMethods.length === 0,
        createdAt: Timestamp.now(),
      });
      setPaymentNumber("");
      setPaymentName("");
      setPaymentBank("");
      setShowAddPayment(false);
      await loadPaymentMethods();
    } catch (err) { alert("Failed to save payment method."); }
    finally { setSavingPayment(false); }
  };

  const handleDeletePayment = async (id: string) => {
    if (!userId) return;
    if (!confirm("Remove this payment method?")) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await deleteDoc(doc(db, "users", userId, "paymentMethods", id));
      await loadPaymentMethods();
    } catch (err) { alert("Failed to remove."); }
  };

  const handleSetDefault = async (id: string) => {
    if (!userId) return;
    try {
      const { doc, updateDoc, collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const snap = await getDocs(collection(db, "users", userId, "paymentMethods"));
      for (const d of snap.docs) {
        await updateDoc(doc(db, "users", userId, "paymentMethods", d.id), { isDefault: d.id === id });
      }
      await loadPaymentMethods();
    } catch (err) { alert("Failed to set default."); }
  };
`;

content = content.replace("  const menuItems = [", paymentState + "  const menuItems = [");

// Add onClick to Payment Methods menu item
content = content.replace(
    '{ icon: CreditCard, label: "Payment Methods", sub: "Stored cards & banks" }',
    '{ icon: CreditCard, label: "Payment Methods", sub: "Stored cards & banks", onClick: () => { loadPaymentMethods(); setShowPaymentMethods(true); } }'
);

fs.writeFileSync("src/screens/ProfileScreen.tsx", content, "utf8");
console.log("Done!");
