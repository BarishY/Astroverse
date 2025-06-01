// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config'; // Firebase config dosyamız

export const useAuth = () => {
  const [user, setUser] = useState(null); // Firebase auth user nesnesi
  const [userData, setUserData] = useState(null); // Firestore'dan gelen kullanıcı verisi
  const [loading, setLoading] = useState(true); // Auth durumu yükleniyor mu?

  useEffect(() => {
    console.log("useAuth: useEffect çalıştı, onAuthStateChanged dinleyicisi kuruluyor.");
    
    let unsubscribeUser = null;
    let unsubscribeMessages = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      console.log("useAuth: onAuthStateChanged tetiklendi. currentUser:", currentUser ? currentUser.uid : null);
      
      if (currentUser) {
        setUser(currentUser);
        
        // Kullanıcı verilerini gerçek zamanlı olarak dinle
        const userRef = doc(db, 'users', currentUser.uid);
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            console.log("useAuth: Kullanıcı verisi güncellendi:", docSnap.data());
            setUserData(docSnap.data());
          } else {
            console.warn("useAuth: Kullanıcı Firestore'da bulunamadı:", currentUser.uid);
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("useAuth: Kullanıcı verisi dinlenirken hata:", error);
          setLoading(false);
        });

        // Kullanıcının mesajlarını gerçek zamanlı olarak dinle
        const messagesRef = doc(db, 'messages', currentUser.uid);
        unsubscribeMessages = onSnapshot(messagesRef, (docSnap) => {
          if (docSnap.exists()) {
            console.log("useAuth: Mesajlar güncellendi:", docSnap.data());
            setUserData(prev => ({
              ...prev,
              messages: docSnap.data()
            }));
        }
        });
      } else {
        console.log("useAuth: Kullanıcı çıkış yaptı veya hiç giriş yapmadı.");
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
    });

    // Cleanup function
    return () => {
      console.log("useAuth: useEffect temizleniyor, dinleyiciler kaldırılıyor.");
      unsubscribeAuth();
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribeMessages) unsubscribeMessages();
    };
  }, []);

  const signOut = async () => {
    try {
      await auth.signOut();
    } catch (error) {
      console.error("Çıkış yapılırken hata oluştu:", error);
    }
  };

  return {
    user,
    userData,
    loading,
    signOut
  };
};
