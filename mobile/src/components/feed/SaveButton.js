// src/components/feed/SaveButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, StyleSheet, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CollectionModal from '../collections/CollectionModal'; // Bir üst klasördeki collections klasöründen
import colors from '../../constants/colors'; // Renklerimiz
import { useAuth } from '../../hooks/useAuth'; // Auth hook'umuz
// import { checkIsPostSavedInAnyCollection } from '../../firebase/firestore'; // İleride eklenecek fonksiyon

const SaveButton = ({ post }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const { user } = useAuth();
  // TODO: Kullanıcının bu gönderiyi zaten herhangi bir koleksiyona kaydedip kaydetmediğini
  // Firestore'dan kontrol et ve ikonu ona göre dolu/boş göster.
  const [isSaved, setIsSaved] = useState(false); // Şimdilik hep boş

  // Örnek: Gönderinin herhangi bir koleksiyonda kayıtlı olup olmadığını kontrol etme
  // useEffect(() => {
  //   if (user && post && post.date) {
  //     const checkSavedStatus = async () => {
  //       try {
  //         // Bu fonksiyonun Firestore'da kullanıcının tüm koleksiyonlarını kontrol edip
  //         // postId (post.date) içerip içermediğine bakması gerekir.
  //         // const saved = await checkIsPostSavedInAnyCollection(user.uid, post.date);
  //         // setIsSaved(saved);
  //       } catch (error) {
  //         console.error("Kaydetme durumu kontrol edilirken hata:", error);
  //       }
  //     };
  //     checkSavedStatus();
  //   } else {
  //     setIsSaved(false);
  //   }
  //   // modalVisible kapandığında da bu useEffect tetiklenebilir (koleksiyona ekleme/çıkarma sonrası)
  // }, [user, post, modalVisible]);

  const handlePress = () => {
    if (!user) {
        Alert.alert("Giriş Gerekli", "Gönderiyi bir koleksiyona kaydetmek için lütfen giriş yapın.");
        return;
    }
    // Post verisinin modal'a düzgün gideceğinden emin olalım
    if (!post || !post.date || !post.title || !post.media_type || !post.url) {
        Alert.alert("Hata", "Kaydedilecek gönderi bilgileri eksik veya geçersiz.");
        return;
    }
    setModalVisible(true);
  };

  return (
    <>
      <TouchableOpacity style={styles.container} onPress={handlePress} disabled={!post}>
        <Ionicons
          name={isSaved ? "bookmark" : "bookmark-outline"}
          size={26}
          color={colors.text} // Ana metin rengi
        />
      </TouchableOpacity>
      {/* CollectionModal'ı sadece post verisi varsa ve modal görünürse render et */}
      {post && modalVisible && (
        <CollectionModal
          isVisible={modalVisible}
          onClose={() => setModalVisible(false)}
          post={post} // post prop'unu CollectionModal'a iletiyoruz
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 5,
    paddingHorizontal: 8, // Buton etrafında biraz daha boşluk
  },
});

export default SaveButton;
