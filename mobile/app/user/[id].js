import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, FlatList, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { getUserProfile, getUserCollections, followUser, unfollowUser } from '../../src/firebase/firestore';
import { useAuth } from '../../src/hooks/useAuth';

const UserProfileScreen = () => {
  const { id: userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const userData = await getUserProfile(userId);
        setProfile(userData);
        
        // Koleksiyonları getir
        const collectionsData = await getUserCollections(userId, user?.uid);
        setCollections(collectionsData);
        
        // Takip durumunu kontrol et
        if (user) {
          const isFollowing = userData.followers?.includes(user.uid);
          setFollowing(isFollowing);
        }
      } catch (error) {
        console.error('Profil yükleme hatası:', error);
        Alert.alert('Hata', 'Profil yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId, user]);

  const handleFollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      await followUser(user.uid, userId);
      setFollowing(true);
    } catch (e) {
      Alert.alert('Hata', 'Takip işlemi başarısız.');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!user) return;
    setFollowLoading(true);
    try {
      await unfollowUser(user.uid, userId);
      setFollowing(false);
    } catch (e) {
      Alert.alert('Hata', 'Takibi bırakma işlemi başarısız.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Kullanıcı bulunamadı.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Ionicons name="person-circle-outline" size={70} color={colors.primary} style={{ marginBottom: 10 }} />
        <Text style={styles.username}>{profile.username}</Text>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => router.push(`/user/${userId}/followers`)}
          >
            <Text style={styles.statNumber}>{profile.followers ? profile.followers.length : 0}</Text>
            <Text style={styles.statLabel}>Takipçi</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.statBox}
            onPress={() => router.push(`/user/${userId}/following`)}
          >
            <Text style={styles.statNumber}>{profile.following ? profile.following.length : 0}</Text>
            <Text style={styles.statLabel}>Takip</Text>
          </TouchableOpacity>
        </View>
        {user && user.uid !== userId && (
          <TouchableOpacity
            style={[styles.followButton, following ? styles.unfollowButton : styles.followButtonActive]}
            onPress={following ? handleUnfollow : handleFollow}
            disabled={followLoading}
          >
            <Text style={styles.followButtonText}>{following ? 'Takibi Bırak' : 'Takip Et'}</Text>
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Koleksiyonlar</Text>
        {collections.length === 0 ? (
          <Text style={styles.emptyText}>Görüntülenebilecek koleksiyon yok.</Text>
        ) : (
          <FlatList
            data={collections}
            keyExtractor={item => item.id}
            numColumns={2}
            columnWrapperStyle={styles.collectionRow}
            renderItem={({ item }) => {
              const mediaCount = Array.isArray(item.items) ? item.items.length : (item.itemCount || 0);
              return (
                <TouchableOpacity 
                  style={styles.collectionCard}
                  onPress={() => router.push(`/collection/${item.id}`)}
                >
                  <View style={styles.coverContainer}>
                    {item.coverImage ? (
                      <Image source={{ uri: item.coverImage }} style={styles.coverImage} />
                    ) : (
                      <View style={[styles.coverContainer, styles.placeholderCover]}>
                        <Ionicons name="images-outline" size={40} color={colors.textLight} />
                      </View>
                    )}
                  </View>
                  <View style={styles.collectionInfo}>
                    <Text style={styles.collectionName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.mediaCount}>{mediaCount} medya</Text>
                    <View style={styles.interactionInfo}>
                      <View style={styles.likeButton}>
                        <Ionicons name="heart-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.interactionCount}>{item.likeCount || 0}</Text>
                      </View>
                      <View style={styles.commentCount}>
                        <Ionicons name="chatbubble-outline" size={16} color={colors.textSecondary} />
                        <Text style={styles.interactionCount}>{item.commentCount || 0}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>
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
  header: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  followButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  followButtonActive: {
    backgroundColor: colors.primary,
  },
  unfollowButton: {
    backgroundColor: colors.surface,
  },
  followButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 10,
  },
  emptyText: {
    color: colors.textLight,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 20,
  },
  collectionRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  collectionCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverContainer: {
    width: '100%',
    height: 120,
    backgroundColor: colors.background,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderCover: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  collectionInfo: {
    padding: 10,
  },
  collectionName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  mediaCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  interactionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionCount: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 5,
  },
  statBox: {
    alignItems: 'center',
    marginHorizontal: 18,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backButton: {
    position: 'absolute',
    left: 10,
    top: 30,
    zIndex: 10,
    padding: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
  },
});

export default UserProfileScreen; 