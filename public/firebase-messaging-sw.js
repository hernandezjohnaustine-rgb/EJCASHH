importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

// Public Firebase config — safe to expose (same values already visible in
// the app's own client bundle). Real protection is Firestore Security Rules.
firebase.initializeApp({
  apiKey: "AIzaSyCbnAeic0KbrCxzreFio1K8m0_fMJkjx4w",
  authDomain: "my-ejcashh-app.firebaseapp.com",
  projectId: "my-ejcashh-app",
  storageBucket: "my-ejcashh-app.firebasestorage.app",
  messagingSenderId: "897657518960",
  appId: "1:897657518960:web:85b9c4386c57f222b72db5",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "EJCASHH";
  const options = {
    body: payload.notification?.body || "",
    icon: "/logo192.png",
    badge: "/logo192.png",
  };
  self.registration.showNotification(title, options);
});
