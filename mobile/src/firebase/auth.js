// src/firebase/auth.js
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile, // Kullanıcı adı eklemek için
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'; // serverTimestamp eklendi
import { auth, db } from './config'; // Bu yol src/firebase/config.js'e işaret eder

/**
 * Yeni kullanıcı kaydı yapar ve Firestore'a kullanıcı belgesi ekler.
 */
export const signUp = async (email, password, username) => {
  if (!email || !password || !username) {
    throw new Error("E-posta, şifre ve kullanıcı adı boş bırakılamaz.");
  }
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firebase Auth profiline kullanıcı adını ekle
    await updateProfile(user, { displayName: username });

    // Firestore'a kullanıcı belgesi oluştur
    await setDoc(doc(db, "users", user.uid), {
      uid: user.uid,
      username: username,
      email: email,
      createdAt: serverTimestamp(),
      followers: [],
      following: [],
      collectionsOrder: [],
      profilePicUrl: null,
      bio: "",
    });

    console.log("Kullanıcı başarıyla kaydedildi:", user.uid);
    return user;
  } catch (error) {
    console.error("Kayıt olma hatası:", error.code, error.message);
    // Firebase hata kodlarına göre daha anlaşılır mesajlar ver
    if (error.code === 'auth/email-already-in-use') {
      throw new Error("Bu e-posta adresi zaten kullanımda.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Geçersiz e-posta formatı.");
    } else if (error.code === 'auth/weak-password') {
      throw new Error("Şifre çok zayıf. Lütfen en az 6 karakterli bir şifre girin.");
    }
    throw new Error("Kayıt sırasında bir hata oluştu: " + error.message);
  }
};

/**
 * Kullanıcı girişi yapar.
 */
export const signIn = async (email, password) => {
  if (!email || !password) {
    throw new Error("E-posta ve şifre boş bırakılamaz.");
  }
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Kullanıcı başarıyla giriş yaptı:", userCredential.user.uid);
    return userCredential.user;
  } catch (error) {
    console.error("Giriş yapma hatası:", error.code, error.message);
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      throw new Error("E-posta veya şifre hatalı.");
    } else if (error.code === 'auth/invalid-email') {
      throw new Error("Geçersiz e-posta formatı.");
    }
    throw new Error("Giriş sırasında bir hata oluştu: " + error.message);
  }
};

/**
 * Kullanıcı çıkışı yapar.
 */
export const logOut = async () => {
  try {
    await signOut(auth);
    console.log("Kullanıcı başarıyla çıkış yaptı.");
  } catch (error) {
    console.error("Çıkış yapma hatası:", error.message);
    throw new Error("Çıkış sırasında bir hata oluştu: " + error.message);
  }
};
