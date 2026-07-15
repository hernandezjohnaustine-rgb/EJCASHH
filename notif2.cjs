const fs = require("fs");
let content = fs.readFileSync("src/App.tsx", "utf8");

// Add userId to Header component
content = content.replace(
    `<Header 
  userName={user?.displayName || "User"}
  userSeed={userProfile?.username || user?.displayName || "John"}
  theme={theme}
  onToggleTheme={toggleTheme}
  onProfileClick={() => setActiveTab('profile')}
/>`,
    `<Header 
  userName={user?.displayName || "User"}
  userSeed={userProfile?.username || user?.displayName || "John"}
  theme={theme}
  onToggleTheme={toggleTheme}
  onProfileClick={() => setActiveTab('profile')}
  userId={user?.uid}
/>`
);

fs.writeFileSync("src/App.tsx", content, "utf8");
console.log("Done!");
