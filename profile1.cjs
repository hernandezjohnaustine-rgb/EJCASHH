const fs = require("fs");
let content = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8");

// Add state for personal info modal
const stateInsert = `  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || "");
  const [editPhone, setEditPhone] = useState(user?.phoneNumber || "");
  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSuccess, setInfoSuccess] = useState(false);

  const handleSavePersonalInfo = async () => {
    if (!userId) return;
    setSavingInfo(true);
    try {
      const { doc, updateDoc } = await import("firebase/firestore");
      const { db } = await import("../lib/firebase");
      const { updateProfile } = await import("firebase/auth");
      const { auth } = await import("../lib/firebase");
      await updateDoc(doc(db, "users", userId), {
        displayName: editName,
        phoneNumber: editPhone,
      });
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: editName });
      }
      setInfoSuccess(true);
      setTimeout(() => { setInfoSuccess(false); setShowPersonalInfo(false); }, 1500);
    } catch (err) {
      console.error(err);
      alert("Failed to save. Please try again.");
    } finally {
      setSavingInfo(false);
    }
  };
`;

// Insert state after existing useState declarations
content = content.replace(
    "  const menuItems = [",
    stateInsert + "  const menuItems = ["
);

// Add onClick to menu items
content = content.replace(
    `  const menuItems = [
    { icon: TrendingUp, label: "Earnings Wallet", sub: "Withdraw commissions" },
    { icon: User, label: "Personal Information", sub: \`Update details \${user?.phoneNumber ? \`(+63 \${user.phoneNumber})\` : ""}\` },`,
    `  const menuItems = [
    { icon: TrendingUp, label: "Earnings Wallet", sub: "Withdraw commissions", onClick: () => onNavigate?.("earn") },
    { icon: User, label: "Personal Information", sub: \`Update details \${user?.phoneNumber ? \`(+63 \${user.phoneNumber})\` : ""}\`, onClick: () => { setEditName(user?.displayName || ""); setEditPhone(user?.phoneNumber || ""); setShowPersonalInfo(true); } },`
);

// Add onClick to menu item buttons
content = content.replace(
    `              <motion.button
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card !p-5 flex items-center justify-between group hover:bg-white/10 transition-all border-none"
              >`,
    `              <motion.button
                key={i}
                onClick={(item as any).onClick}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card !p-5 flex items-center justify-between group hover:bg-white/10 transition-all border-none"
              >`
);

fs.writeFileSync("src/screens/ProfileScreen.tsx", content, "utf8");
console.log("Done!");
