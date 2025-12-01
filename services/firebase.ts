
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB0BSDI-T2UWNJt0_shdB3GA3PncZt3d40",
  authDomain: "neve-or.firebaseapp.com",
  projectId: "neve-or",
  storageBucket: "neve-or.firebasestorage.app",
  messagingSenderId: "49659169778",
  appId: "1:49659169778:web:c7e1089fcef9f529e9b96b",
  measurementId: "G-TGC0CQR7N1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, analytics, storage, auth };
