// src/components/feed/LikeButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth'; 
import {
    toggleLikeOnNasaApodPost,
    listenToNasaApodPostInteractions
} from '../../firebase/firestore'; 
import colors from '../../constants/colors'; 

const LikeButton = ({ postId, postTitle }) => {
  const { user } = useAuth();
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loadingInteraction, setLoadingInteraction] = useState(true); 

  useEffect(() => {
    if (!postId) {
        setLoadingInteraction(false);
        return;
    }

    setLoadingInteraction(true); 
    const unsubscribe = listenToNasaApodPostInteractions(postId, (data) => {
      const currentLikes = data?.likes || [];
      setLikesCount(currentLikes.length);
      if (user) {
        setIsLiked(currentLikes.includes(user.uid));
      } else {
        setIsLiked(false);
      }
      setLoadingInteraction(false);
    });

    return () => {
      unsubscribe();
    };
  }, [postId, user]); 

  const handleLikeToggle = async () => {
    if (!user) {
      Alert.alert("Giriş Gerekli", "Beğeni yapmak için lütfen giriş yapın.");
      return;
    }
    if (!postId || !postTitle) {
        Alert.alert("Hata", "Gönderi bilgileri eksik, beğeni işlemi yapılamıyor.");
        return;
    }

    const originalIsLiked = isLiked;
    const originalLikesCount = likesCount;
    setIsLiked(!originalIsLiked);
    setLikesCount(prev => originalIsLiked ? prev - 1 : prev + 1);

    try {
      await toggleLikeOnNasaApodPost(postId, user.uid, postTitle);
    } catch (error) {
      console.error(`LikeButton (${postId}): Beğeni hatası:`, error);
      Alert.alert("Hata", "Beğeni işlemi sırasında bir sorun oluştu.");
      setIsLiked(originalIsLiked);
      setLikesCount(originalLikesCount);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleLikeToggle}
      disabled={!postId || loadingInteraction} 
    >
      <Ionicons
        name={isLiked ? "heart" : "heart-outline"}
        size={26}
        color={isLiked ? colors.like : colors.text} 
      />
      {loadingInteraction ? (
        <ActivityIndicator size="small" color={colors.primary} style={styles.countText} />
      ) : (
        <Text style={[styles.countText, isLiked && styles.likedText]}>{likesCount}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    // Dış container padding sağlayacak, buraya padding eklemiyoruz.
  },
  countText: {
    marginLeft: 6,
    fontSize: 14,
    color: colors.textSecondary,
    minWidth: 15, // Sayı değişirken oynamayı engellemek için
    textAlign: 'left',
  },
  likedText: {
      color: colors.like, // Beğenildiğinde sayacın rengi de değişsin (isteğe bağlı)
      // fontWeight: 'bold', // İsteğe bağlı
  }
});

export default LikeButton;
