const fs = require("fs");
let content = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8");

const devicesState = `  const [showLinkedDevices, setShowLinkedDevices] = useState(false);
  const [linkedDevices, setLinkedDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);

  const loadLinkedDevices = async () => {
    if (!userId) return;
    setLoadingDevices(true);
    try {
      const { collection, getDocs } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const snap = await getDocs(collection(db, "users", userId, "devices"));
      setLinkedDevices(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
    finally { setLoadingDevices(false); }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    if (!userId) return;
    if (!confirm("Remove this device?")) return;
    try {
      const { doc, deleteDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await deleteDoc(doc(db, "users", userId, "devices", deviceId));
      await loadLinkedDevices();
    } catch (err) { alert("Failed to remove device."); }
  };

  const registerCurrentDevice = async () => {
    if (!userId) return;
    try {
      const { collection, addDoc, Timestamp } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const deviceInfo = {
        name: navigator.platform || "Unknown Device",
        browser: navigator.userAgent.includes("Chrome") ? "Chrome" : navigator.userAgent.includes("Firefox") ? "Firefox" : "Browser",
        lastActive: Timestamp.now(),
        createdAt: Timestamp.now(),
        isCurrent: true,
      };
      await addDoc(collection(db, "users", userId, "devices"), deviceInfo);
      await loadLinkedDevices();
    } catch (err) { console.error(err); }
  };
`;

content = content.replace("  const menuItems = [", devicesState + "  const menuItems = [");

content = content.replace(
    '{ icon: Smartphone, label: "Linked Devices", sub: "iPhone 15 Pro, 2 sessions" }',
    '{ icon: Smartphone, label: "Linked Devices", sub: "Manage active sessions", onClick: () => { loadLinkedDevices(); setShowLinkedDevices(true); } }'
);

fs.writeFileSync("src/screens/ProfileScreen.tsx", content, "utf8");
console.log("Done!");
