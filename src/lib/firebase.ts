import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentSingleTabManager
} from "firebase/firestore";

// Hardcoded config — safe to use since these are client-side public keys
const firebaseConfig = {
  apiKey: "AIzaSyCbnAeic0KbrCxzreFio1K8m0_fMJkjx4w",
  authDomain: "my-ejcashh-app.firebaseapp.com",
  projectId: "my-ejcashh-app",
  storageBucket: "my-ejcashh-app.firebasestorage.app",
  messagingSenderId: "897657518960",
  appId: "1:897657518960:web:85b9c4386c57f222b72db5"
};

// Prevent duplicate initialization
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Fixed offline error — use single tab manager
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentSingleTabManager()
  })
});

export const auth = getAuth(app);