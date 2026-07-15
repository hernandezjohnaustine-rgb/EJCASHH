const fs = require("fs");
let content = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8");

const notifState = `  const [showNotifications, setShowNotifications] = useState(false);
  const [notifSettings, setNotifSettings] = useState({
    pushNotifications: true,
    transactionAlerts: true,
    commissionAlerts: true,
    promotionalAlerts: false,
    systemUpdates: true,
  });
  const [savingNotif, setSavingNotif] = useState(false);

  const loadNotifSettings = async () => {
    if (!userId) return;
    try {
      const { doc, getDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const snap = await getDoc(doc(db, "users", userId));
      if (snap.exists() && snap.data().notifSettings) {
        setNotifSettings(snap.data().notifSettings);
      }
    } catch (err) { console.error(err); }
  };

  const handleSaveNotifSettings = async () => {
    if (!userId) return;
    setSavingNotif(true);
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      await updateDoc(doc(db, "users", userId), { notifSettings });
      alert("Notification settings saved!");
      setShowNotifications(false);
    } catch (err) { alert("Failed to save settings."); }
    finally { setSavingNotif(false); }
  };
`;

content = content.replace("  const menuItems = [", notifState + "  const menuItems = [");

content = content.replace(
    '{ icon: Bell, label: "Notifications", sub: "Alerts & Transaction SMS" }',
    '{ icon: Bell, label: "Notifications", sub: "Alerts & Transaction SMS", onClick: () => { loadNotifSettings(); setShowNotifications(true); } }'
);

fs.writeFileSync("src/screens/ProfileScreen.tsx", content, "utf8");
console.log("Done!");
