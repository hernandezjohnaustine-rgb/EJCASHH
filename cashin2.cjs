const fs = require("fs");
let rules = fs.readFileSync("firestore.rules", "utf8");
rules = rules.replace(
    '    match /orders/{id} {',
    `    match /depositRequests/{id} {
      allow create: if isSignedIn();
      allow read: if isSignedIn() && (resource.data.userId == request.auth.uid || isAdmin());
      allow update: if isAdmin();
    }
    match /orders/{id} {`
);
fs.writeFileSync("firestore.rules", rules, "utf8");
console.log("Rules updated!");
