// src/components/collections/CollectionItem.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '../../constants/colors';

const CollectionItem = ({ collection }) => {
  const router = useRouter();

  if (!collection || !collection.id) {
    // Geçersiz koleksiyon verisi için bir fallback
    return (
      <View style={[styles.container, styles.errorContainer]}>
        <Text style={styles.errorText}>Koleksiyon verisi hatalı.</Text>
      </View>
    );
  }

  const handlePress = () => {
    router.push({
      pathname: `/collection/${collection.id}`,
      params: { collectionName: collection.name }, // Başlık için koleksiyon adını gönder
    });
  };

  const getPrivacyIcon = (privacy) => {
    switch (privacy) {
      case 'public':
        return 'earth-outline'; // Herkese açık
      case 'followers':
        return 'people-outline'; // Sadece takipçiler
      case 'private':
        return 'lock-closed-outline'; // Gizli
      default:
        return 'help-circle-outline'; // Bilinmeyen
    }
  };

  return (
    <TouchableOpacity style={styles.container} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.imageContainer}>
        {collection.coverImage ? (
          <Image source={{ uri: collection.coverImage }} style={styles.coverImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="images-outline" size={40} color={colors.textLight} />
          </View>
        )}
        <View style={styles.itemCountBadge}>
          <Text style={styles.itemCountText}>{collection.itemCount || 0}</Text>
        </View>
      </View>
      <View style={styles.infoContainer}>
        <Text style={styles.collectionName} numberOfLines={2}>
          {collection.name || 'İsimsiz Koleksiyon'}
        </Text>
        <View style={styles.privacyContainer}>
          <Ionicons
            name={getPrivacyIcon(collection.privacy)}
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.privacyText}>
            {collection.privacy === 'public' ? 'Herkese Açık' :
             collection.privacy === 'followers' ? 'Takipçilere Özel' :
             collection.privacy === 'private' ? 'Gizli' : 'Bilinmiyor'}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    margin: 8,
    width: 160, // Sabit genişlik, 2'li grid için uygun olabilir
    // iOS için gölge
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android için gölge
    elevation: 4,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 180, // Diğer itemlarla aynı yükseklikte olması için
    padding: 10,
  },
  errorText: {
    color: colors.error,
    textAlign: 'center',
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1, // Kare kapak resmi alanı
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden', // Resmin köşelerden taşmasını engelle
    backgroundColor: colors.feedBackground,
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.border,
  },
  itemCountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  itemCountText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    padding: 10,
  },
  collectionName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
    minHeight: 36, // İki satırlık yer ayır
  },
  privacyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  privacyText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
});

export default CollectionItem;
