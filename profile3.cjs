const fs = require("fs");
let content = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8");

// Add security state
const securityState = `  const [showSecurity, setShowSecurity] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  const handleChangePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }
    setChangingPassword(true);
    setPasswordError("");
    try {
      const { EmailAuthProvider, reauthenticateWithCredential, updatePassword } = await import("firebase/auth");
      const { auth } = await import("../lib/firebase");
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error("Not logged in");
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => { setPasswordSuccess(false); setShowSecurity(false); }, 2000);
    } catch (err: any) {
      setPasswordError(err.message?.includes("wrong-password") ? "Current password is incorrect." : "Failed to change password. Try again.");
    } finally {
      setChangingPassword(false);
    }
  };
`;

content = content.replace(
    "  const menuItems = [",
    securityState + "  const menuItems = ["
);

// Add onClick to Security menu item
content = content.replace(
    '{ icon: Shield, label: "Security & Privacy", sub: "Face ID, PIN, Biometrics" }',
    '{ icon: Shield, label: "Security & Privacy", sub: "Change Password & PIN", onClick: () => setShowSecurity(true) }'
);

fs.writeFileSync("src/screens/ProfileScreen.tsx", content, "utf8");
console.log("Done!");
