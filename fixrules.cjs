const fs = require("fs");
let content = fs.readFileSync("firestore.rules", "utf8");

// Remove all duplicate subcollection rules and replace with clean version
const oldRules1 = `    match /users/{userId}/notifications/{notifId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    match /users/{userId}/paymentMethods/{pmId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    match /users/{userId}/devices/{deviceId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    match /users/{userId}/notifications/{notifId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    match /users/{userId}/paymentMethods/{pmId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    match /users/{userId}/devices/{deviceId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }`;

const newRules = `    match /users/{userId}/notifications/{notifId} {
      allow read, update, delete: if isSignedIn() && request.auth.uid == userId;
      allow create: if isSignedIn(); // Allow any signed-in user to send notifications
    }
    match /users/{userId}/paymentMethods/{pmId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }
    match /users/{userId}/devices/{deviceId} {
      allow read, write: if isSignedIn() && request.auth.uid == userId;
    }`;

content = content.replace(oldRules1, newRules);
fs.writeFileSync("firestore.rules", content, "utf8");
console.log("Done!");
