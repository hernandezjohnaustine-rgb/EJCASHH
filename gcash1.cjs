const fs = require("fs");

// Step 1: Update Firestore rules to allow gcashSettings
let rules = fs.readFileSync("firestore.rules", "utf8");
rules = rules.replace(
    '    match /depositRequests/{id} {',
    `    match /gcashSettings/{id} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }
    match /depositRequests/{id} {`
);
fs.writeFileSync("firestore.rules", rules, "utf8");
console.log("Rules updated!");
