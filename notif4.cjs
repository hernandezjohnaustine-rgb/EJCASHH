const fs = require("fs");
let content = fs.readFileSync("firestore.rules", "utf8");
content = content.replace(
    `    match /orders/{id} {`,
    `    match /users/{userId}/notifications/{notifId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    match /users/{userId}/paymentMethods/{pmId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    match /users/{userId}/devices/{deviceId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    match /orders/{id} {`
);
fs.writeFileSync("firestore.rules", content, "utf8");
console.log("Done!");
