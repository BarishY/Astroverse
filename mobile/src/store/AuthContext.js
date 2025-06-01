// src/store/AuthContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config'; // Firebase config dosyamız

// 1. AuthContext'i oluştur
const AuthContext = createContext();

// 2. Bu context'i kolayca kullanmak için bir custom hook oluştur
export const useAuthContext = () => {
  return useContext(AuthContext);
};

// 3. AuthProvider component'ini oluştur
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase Auth kullanıcısı
  const [currentUserData, setCurrentUserData] = useState(null); // Firestore'dan gelen ek kullanıcı verileri
  const [loadingAuth, setLoadingAuth] = useState(true); // Kimlik doğrulama durumu yükleniyor mu?

  useEffect(() => {
    console.log("AuthProvider: useEffect çalıştı, onAuthStateChanged dinleyicisi kuruluyor.");
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("AuthProvider: onAuthStateChanged tetiklendi. User:", user ? user.uid : null);
      setLoadingAuth(true); // Her auth state değişiminde yüklemeyi başlat
      if (user) {
        setCurrentUser(user);
        // Firestore'dan kullanıcı verisini çek
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            setCurrentUserData(userDocSnap.data());
            console.log("AuthProvider: Firestore'dan kullanıcı verisi başarıyla çekildi:", userDocSnap.data());
          } else {
            console.warn("AuthProvider: Kullanıcı Firestore'da bulunamadı:", user.uid);
            setCurrentUserData(null);
          }
        } catch (error) {
          console.error("AuthProvider: Firestore'dan kullanıcı verisi çekilirken hata:", error);
          setCurrentUserData(null);
        }
      } else {
        setCurrentUser(null);
        setCurrentUserData(null);
        console.log("AuthProvider: Kullanıcı çıkış yaptı veya hiç giriş yapmadı.");
      }
      setLoadingAuth(false); // Yükleme tamamlandı
    });

    // Component unmount olduğunda dinleyiciyi kaldır
    return () => {
      console.log("AuthProvider: useEffect temizleniyor, onAuthStateChanged dinleyicisi kaldırılıyor.");
      unsubscribe();
    };
  }, []); // Sadece component mount olduğunda çalışsın

  // Context aracılığıyla paylaşılacak değerler
  const value = {
    currentUser,
    currentUserData,
    loadingAuth,
    // İleride login, logout, signup gibi fonksiyonlar da buraya eklenebilir
    // veya src/firebase/auth.js'den import edilip burada sarmalanabilir.
  };

  return (
    <AuthContext.Provider value={value}>
      {/* Yükleme bitene kadar children'ı render etme (isteğe bağlı, app/_layout.js de bunu yapabilir) */}
      {/* {!loadingAuth && children} */}
      {children}
    </AuthContext.Provider>
  );
};
