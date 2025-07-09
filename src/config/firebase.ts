// Firebase configuration
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAj4UqaL-w7sR_-vQ4MT6hgLXPVPoAfSFA",
  authDomain: "stocksts-2e943.firebaseapp.com",
  projectId: "stocksts-2e943",
  storageBucket: "stocksts-2e943.firebasestorage.app",
  messagingSenderId: "1005986107882",
  appId: "1:1005986107882:web:68a4c31374dca30cac2293",
  measurementId: "G-JYV77S874Y"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const analytics = getAnalytics(app);