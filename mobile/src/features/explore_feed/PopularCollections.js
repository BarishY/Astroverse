// src/features/explore_feed/PopularCollections.js
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPopularCollections, getUserProfile } from '../../firebase/firestore';
import colors from '../../constants/colors';
import { useRouter } from 'expo-router';

const PopularCollections = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [collectionsWithUsernames, setCollectionsWithUsernames] = useState([]);
  const router = useRouter();

  const fetchPopular = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await getPopularCollections(20);
      setCollections(fetched);
    } catch (e) {
      setError('Popüler koleksiyonlar yüklenirken bir hata oluştu.');
      setCollections([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPopular();
  }, [fetchPopular]);

  useEffect(() => {
    const fetchUsernames = async () => {
      // Her koleksiyon için kullanıcı bilgilerini çek
      const withUsernames = await Promise.all(collections.map(async (col) => {
        if (!col.ownerId) return { ...col, ownerUsername: 'Bilinmeyen Kullanıcı' };
        try {
          const userProfile = await getUserProfile(col.ownerId);
          return { 
            ...col, 
            ownerUsername: userProfile?.username || 'Bilinmeyen Kullanıcı'
          };
        } catch {
          return { ...col, ownerUsername: 'Bilinmeyen Kullanıcı' };
        }
      }));

      setCollectionsWithUsernames(withUsernames);
    };

    if (collections.length > 0) {
      fetchUsernames();
    }
  }, [collections]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchPopular();
  }, [fetchPopular]);

  if (loading && !refreshing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  if (!collectionsWithUsernames || collectionsWithUsernames.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="star-outline" size={60} color={colors.textLight} style={{marginBottom: 10}}/>
        <Text style={styles.emptyText}>Henüz popüler koleksiyon yok.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={collectionsWithUsernames}
        renderItem={({ item }) => {
          const mediaCount = Array.isArray(item.items) ? item.items.length : (item.itemCount || 0);
          return (
            <TouchableOpacity style={styles.card} onPress={() => router.push(`/collection/${item.id}`)}>
              <View style={styles.coverContainer}>
                {item.coverImage ? (
                  <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
                ) : (
                  <View style={[styles.coverContainer, styles.placeholderCover]}>
                    <Ionicons name="images-outline" size={40} color={colors.textLight} />
                  </View>
                )}
              </View>
              <View style={styles.textContainer}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.ownerUsername} - {item.name}
                </Text>
                <Text style={styles.count}>{mediaCount} medya</Text>
                <View style={styles.interactionInfo}>
                  <View style={styles.likeButton}>
                    <Ionicons name="heart-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.interactionCount}>{item.likeCount || 0}</Text>
                  </View>
                  <View style={styles.commentCount}>
                    <Ionicons name="chatbubble-outline" size={18} color={colors.textSecondary} />
                    <Text style={styles.interactionCount}>{item.commentCount || 0}</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.feedBackground,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.feedBackground,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  listContentContainer: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 18,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  coverContainer: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.feedBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderCover: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  textContainer: {
    padding: 12,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  count: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  interactionInfo: {
    flexDirection: 'row',
    marginTop: 8,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionCount: {
    marginLeft: 4,
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default PopularCollections;
