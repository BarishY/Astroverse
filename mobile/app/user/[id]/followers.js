import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../src/constants/colors';
import { getUserProfile, getUserFollowers } from '../../../src/firebase/firestore';

export default function FollowersScreen() {
  const { id: userId } = useLocalSearchParams();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFollowers = async () => {
      try {
        const followersData = await getUserFollowers(userId);
        setFollowers(followersData);
      } catch (error) {
        console.error('Takipçiler yüklenirken hata:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowers();
  }, [userId]);

  const renderFollower = ({ item }) => (
    <TouchableOpacity 
      style={styles.userCard}
      onPress={() => router.push(`/user/${item.uid}`)}
    >
      <View style={styles.userInfo}>
        {item.profilePicUrl ? (
          <Image source={{ uri: item.profilePicUrl }} style={styles.profilePic} />
        ) : (
          <View style={[styles.profilePic, styles.placeholderPic]}>
            <Ionicons name="person" size={24} color={colors.textLight} />
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.username}>{item.username}</Text>
          {item.bio && <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Takipçiler</Text>
      </View>

      <FlatList
        data={followers}
        renderItem={renderFollower}
        keyExtractor={item => item.uid}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Henüz takipçi yok</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.feedBackground,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  list: {
    padding: 15,
  },
  userCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  placeholderPic: {
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 16,
    marginTop: 20,
  },
}); 