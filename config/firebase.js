import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB3tpoNkacojuX6zI-yI2qMryrQ9PbE82o",
  authDomain: "astroverse-9a700.firebaseapp.com",
  projectId: "astroverse-9a700",
  storageBucket: "astroverse-9a700.firebasestorage.app",
  messagingSenderId: "886201608853",
  appId: "1:886201608853:web:dec2ccbc43337da5fac99c",
  measurementId: "G-PV5TKSB230"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); 