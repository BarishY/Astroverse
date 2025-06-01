// app/(tabs)/profile.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  FlatList, 
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { logOut } from '../src/firebase/auth';
import { getUserCollections } from '../src/firebase/firestore';
import colors from '../src/constants/colors';
import CollectionItem from '../src/components/collections/CollectionItem';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../src/firebase/config';

const ProfileScreen = () => { 
  const { user, userData, loading: authLoading } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchUserCollections = useCallback(async () => {
    if (user && user.uid) {
      setLoadingCollections(true);
      try {
        const fetchedCollections = await getUserCollections(user.uid, user.uid);
        setCollections(fetchedCollections || []);
      } catch (error) {
        console.error("Profil: Koleksiyonlar çekilirken hata:", error);
        Alert.alert("Hata", "Koleksiyonlarınız yüklenirken bir sorun oluştu.");
      } finally {
        setLoadingCollections(false);
        setRefreshing(false);
      }
    } else {
      setCollections([]);
      setLoadingCollections(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchUserCollections();
    if (user && userData) {
      const userRef = doc(db, 'users', user.uid);
      let updateNeeded = false;
      const updateObj = {};
      if (!Array.isArray(userData.followers)) {
        updateObj.followers = [];
        updateNeeded = true;
      }
      if (!Array.isArray(userData.following)) {
        updateObj.following = [];
        updateNeeded = true;
      }
      if (updateNeeded) {
        updateDoc(userRef, updateObj).catch(e => console.error('Profil: followers/following eklenemedi', e));
      }
    }
  }, [fetchUserCollections, user, userData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchUserCollections();
  }, [fetchUserCollections]);

  const handleLogout = async () => {
    try {
      await logOut();
    } catch (error) {
      Alert.alert("Çıkış Hatası", "Çıkış yapılırken bir sorun oluştu: " + error.message);
    }
  };

  if (authLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || !userData) {
    return (
      <View style={styles.centered}>
        <Text style={styles.infoText}>Profil bilgilerini görüntülemek için lütfen giriş yapın.</Text>
        <TouchableOpacity onPress={() => router.push('/auth/login')} style={styles.loginButton}>
          <Text style={styles.loginButtonText}>Giriş Yap / Kayıt Ol</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderCollectionItem = ({ item }) => (
    <CollectionItem collection={item} />
  );

  const ProfileHeaderComponent = () => (
    <View style={styles.profileHeader}>
      <View style={styles.avatarPlaceholder}>
        <Ionicons name={userData.profilePicUrl ? 'person-circle' : "person-circle-outline"} size={80} color={colors.primary} />
      </View>
      <Text style={styles.username}>{userData.username || 'Kullanıcı Adı'}</Text>
      <Text style={styles.email}>{user.email}</Text>
      
      {/* İSTATİSTİK BÖLÜMÜ - SAĞLADIĞINIZ YAPI VE STİL ADLARIYLA GÜNCELLENDİ */}
      <View style={styles.statsRow}>
        {/* Koleksiyonlar */}
        <View style={styles.statBox}> 
          <Text style={styles.statNumber}>{collections.length}</Text>
          <Text style={styles.statLabel}>Koleksiyon</Text>
        </View>

        {/* Takipçi */}
        <TouchableOpacity 
          style={styles.statBox}
          onPress={() => {
            if (user && user.uid) { 
              router.push(`/user/${user.uid}/followers`); 
            }
          }}
        >
          <Text style={styles.statNumber}>{userData.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Takipçi</Text>
        </TouchableOpacity>

        {/* Takip Edilenler */}
        <TouchableOpacity 
          style={styles.statBox}
          onPress={() => {
            if (user && user.uid) { 
              router.push(`/user/${user.uid}/following`);
            }
          }}
        >
          <Text style={styles.statNumber}>{userData.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Takip</Text>
        </TouchableOpacity>
      </View>
      {/* <TouchableOpacity style={styles.editProfileButton}>
           <Text style={styles.editProfileButtonText}>Profili Düzenle</Text>
         </TouchableOpacity> */}
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ListHeaderComponent={ProfileHeaderComponent}
        data={collections}
        renderItem={renderCollectionItem}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2} 
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.listContentContainer}
        ListEmptyComponent={
          !loadingCollections ? (
            <View style={styles.emptyCollectionsContainer}>
              <Ionicons name="albums-outline" size={50} color={colors.textLight} />
              <Text style={styles.emptyCollectionsText}>
                Henüz hiç koleksiyon oluşturmadınız.
              </Text>
            </View>
          ) : null 
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListFooterComponent={ 
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
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
    padding: 20,
    backgroundColor: colors.background,
  },
  infoText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 1, 
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
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
    marginBottom: 15,
  },
  // SAĞLADIĞINIZ SNIPPET'TEN GELEN STİL ADLARIYLA GÜNCELLENDİ/EKLENDİ
  statsRow: { 
    flexDirection: 'row',
    justifyContent: 'space-around', 
    width: '100%',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    marginBottom:15,
  },
  statBox: { 
    alignItems: 'center',
    paddingHorizontal: 10, // statItem'dan farklı olarak flex:1 yok, isterseniz ekleyebilirsiniz.
    paddingVertical: 5,
  },
  statNumber: { // Bu stil zaten vardı ve kullanılıyor.
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: { // Bu stil zaten vardı ve kullanılıyor.
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editProfileButton: {
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 25,
    marginTop: 10,
  },
  editProfileButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  listContentContainer: {
    paddingBottom: 20, 
  },
  row: {
  },
  emptyCollectionsContainer: {
    marginTop: 50,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyCollectionsText: {
    marginTop: 10,
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: colors.error,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 20,
    marginTop: 30, 
    marginBottom: 20,
  },
  logoutButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default ProfileScreen;