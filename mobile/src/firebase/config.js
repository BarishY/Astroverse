// src/firebase/config.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

console.log("Firebase config.js: Modül yükleniyor...");

// Firebase proje ayarlarından alınan bilgiler:
const firebaseConfig = {
  apiKey: "AIzaSyDshIqRMmY64Oqgh5thZ_8tjDQkQFTJfS8", // Senin Web API Key'in
  authDomain: "astronova-fe071.firebaseapp.com",    // Senin Project ID'n + .firebaseapp.com
  projectId: "astronova-fe071",                    // Senin Project ID'n
  storageBucket: "astronova-fe071.appspot.com",    // Senin Project ID'n + .appspot.com
  messagingSenderId: "379142411665",               // Senin Project number'ın
  appId: "1:379142411665:web:92e3475d23a48882d53630" // Senin Web App ID'n
};

console.log("Firebase config.js: FirebaseConfig nesnesi:", firebaseConfig);

// appId'nin bir placeholder olup olmadığını kontrol et
const placeholderAppId = "YOUR_WEB_APP_ID_FROM_FIREBASE_CONSOLE"; // Bu bizim kullandığımız genel placeholder
if (!firebaseConfig.appId || firebaseConfig.appId === placeholderAppId || firebaseConfig.appId.includes("xxxx")) {
    console.warn(
      "Firebase config.js: UYARI! `appId` değeri Firebase konsolundan alınarak güncellenmeli gibi görünüyor. " +
      "Mevcut appId: ", firebaseConfig.appId
    );
}

// Firebase uygulamasını başlat
const app = initializeApp(firebaseConfig);
console.log("Firebase config.js: Firebase uygulaması başarıyla başlatıldı.");

// Firestore örneğini oluştur
const db = getFirestore(app);
console.log("Firebase config.js: Firestore örneği oluşturuldu.");

// Auth örneğini oluştur
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
  console.log("Firebase config.js: Firebase Auth başarıyla başlatıldı (initializeAuth ile).");
} catch (error) {
  console.warn("Firebase config.js: initializeAuth başarısız oldu, getAuth kullanılıyor:", error);
  auth = getAuth(app);
  console.log("Firebase config.js: Firebase Auth başarıyla başlatıldı (getAuth ile).");
}

console.log("Firebase config.js: Modül exportları hazırlanıyor.");
export { app, auth, db };
