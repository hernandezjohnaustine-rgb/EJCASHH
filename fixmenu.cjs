const fs = require("fs");
const lines = fs.readFileSync("src/screens/ProfileScreen.tsx", "utf8").split("\n");
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("const menuItems = [")) {
        // Fix Personal Information onClick
        lines[i+2] = '    { icon: User, label: "Personal Information", sub: `Update details ${user?.phoneNumber ? `(+63 ${user.phoneNumber})` : ""}`, onClick: () => { setEditName(user?.displayName || ""); setEditPhone(user?.phoneNumber || ""); setShowPersonalInfo(true); } },';
        // Fix Security onClick
        lines[i+3] = '    { icon: Shield, label: "Security & Privacy", sub: "Change Password & PIN", onClick: () => setShowSecurity(true) },';
        console.log("Fixed menuItems at line", i+1);
        break;
    }
}
fs.writeFileSync("src/screens/ProfileScreen.tsx", lines.join("\n"), "utf8");
console.log("Done!");
