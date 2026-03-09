// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Replace with your Firebase project config
const firebaseConfig = {
  apiKey: "AIzaSyDvJLG8LpsW2ei346ERff4uq9YdpkcdVPI",
  authDomain: "leadflow-55f54.firebaseapp.com",
  projectId: "leadflow-55f54",
  storageBucket: "leadflow-55f54.firebasestorage.app",
  messagingSenderId: "1013062774589",
  appId: "1:1013062774589:web:485071b5cf0c87920a1f54",
  measurementId: "G-X9KW160VF6"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export default app;