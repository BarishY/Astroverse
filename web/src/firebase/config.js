import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDshIqRMmY64Oqgh5thZ_8tjDQkQFTJfS8",
  authDomain: "astronova-fe071.firebaseapp.com",
  projectId: "astronova-fe071",
  storageBucket: "astronova-fe071.firebasestorage.app",
  messagingSenderId: "379142411665",
  appId: "1:379142411665:web:92e3475d23a48882d53630",
  measurementId: "G-EVHWCP6HK0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth }; 