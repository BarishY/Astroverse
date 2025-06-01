// app/(tabs)/messages.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth';
import { getUserProfile, getLastMessage, subscribeToMessages } from '../../src/firebase/firestore';
import colors from '../../src/constants/colors';
import { useRouter } from 'expo-router';
import { getConversationId } from '../../src/firebase/firestore';

const MessagesScreen = () => {
  const { user, userData, loading: authLoading } = useAuth();
  const [followingUsers, setFollowingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchFollowing = async () => {
      if (!user || !userData) return;
      setLoading(true);
      try {
        const followingIds = userData.following || [];
        // Her bir takip edilen kullanıcının profilini ve son mesajını çek
        const users = await Promise.all(
          followingIds.map(async (uid) => {
            try {
              const profile = await getUserProfile(uid);
              const conversationId = getConversationId(user.uid, uid);
              const lastMessage = await getLastMessage(conversationId);
              return {
                ...profile,
                lastMessage: lastMessage?.text || '',
                lastMessageTime: lastMessage?.createdAt || null,
                conversationId
              };
            } catch {
              return null;
            }
          })
        );
        // Son mesaj zamanına göre sırala (en yeni en üstte)
        const sortedUsers = users
          .filter(Boolean)
          .sort((a, b) => {
            if (!a.lastMessageTime && !b.lastMessageTime) return 0;
            if (!a.lastMessageTime) return 1;
            if (!b.lastMessageTime) return -1;
            return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
          });
        setFollowingUsers(sortedUsers);
      } catch (e) {
        setFollowingUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchFollowing();
  }, [user, userData]);

  // Her bir sohbet için mesaj dinleyicileri oluştur
  useEffect(() => {
    if (!followingUsers.length) return;

    const unsubscribers = followingUsers.map(user => {
      if (!user.conversationId) return null;
      return subscribeToMessages(user.conversationId, (messages) => {
        if (messages.length > 0) {
          const lastMessage = messages[messages.length - 1];
          setFollowingUsers(prevUsers => {
            const updatedUsers = prevUsers.map(u => {
              if (u.uid === user.uid) {
                return {
                  ...u,
                  lastMessage: lastMessage.text,
                  lastMessageTime: lastMessage.createdAt
                };
              }
              return u;
            });
            // Son mesaj zamanına göre yeniden sırala
            return updatedUsers.sort((a, b) => {
              if (!a.lastMessageTime && !b.lastMessageTime) return 0;
              if (!a.lastMessageTime) return 1;
              if (!b.lastMessageTime) return -1;
              return b.lastMessageTime.toDate() - a.lastMessageTime.toDate();
            });
          });
        }
      });
    });

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [followingUsers]);

  if (authLoading || loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.centered}>
        <Ionicons name="lock-closed-outline" size={60} color={colors.textLight} style={{marginBottom: 10}}/>
        <Text style={styles.emptyText}>Mesajlaşmak için giriş yapmalısın.</Text>
      </View>
    );
  }

  if (!followingUsers.length) {
    return (
      <View style={styles.centered}>
        <Ionicons name="people-outline" size={60} color={colors.textLight} style={{marginBottom: 10}}/>
        <Text style={styles.emptyText}>Henüz kimseyi takip etmiyorsun.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Mesajlar</Text>
      <FlatList
        data={followingUsers}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.userRow}
            onPress={() => {
              const conversationId = getConversationId(user.uid, item.uid);
              router.push(`/messages/${conversationId}`);
            }}
          >
            <Ionicons name="person-circle-outline" size={36} color={colors.primary} style={{ marginRight: 12 }} />
            <View style={styles.userInfo}>
              <Text style={styles.username}>{item.username || 'Kullanıcı'}</Text>
              <Text style={styles.lastMessage} numberOfLines={1}>
                {item.lastMessage || 'Henüz mesaj yok'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ padding: 16 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.feedBackground },
  header: { fontSize: 22, fontWeight: 'bold', color: colors.text, margin: 16, marginBottom: 8 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.feedBackground },
  loadingText: { marginTop: 10, fontSize: 16, color: colors.textSecondary },
  emptyText: { fontSize: 16, color: colors.textSecondary, textAlign: 'center' },
  userRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  userInfo: { flex: 1 },
  username: { fontSize: 16, fontWeight: 'bold', color: colors.text },
  lastMessage: { fontSize: 13, color: colors.textLight, marginTop: 2 },
});

export default MessagesScreen;
