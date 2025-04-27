import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView, ImageBackground, Switch, Modal, Image, RefreshControl, ActivityIndicator, FlatList, Dimensions } from 'react-native';
import { router } from 'expo-router';
import { auth, db } from '../config/firebase';
import { signOut, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, query, where, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

export default function Profile() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const systemColorScheme = useColorScheme();
  const [favorites, setFavorites] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const MAX_DOTS = 5; // Sabit nokta sayısı

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const getDotIndex = (photoIndex) => {
    if (favorites.length <= MAX_DOTS) {
      return photoIndex;
    }
    const groupSize = Math.ceil(favorites.length / MAX_DOTS);
    return Math.floor(photoIndex / groupSize);
  };

  const scrollToIndex = (dotIndex) => {
    if (favorites.length <= MAX_DOTS) {
      flatListRef.current?.scrollToIndex({ index: dotIndex, animated: true });
    } else {
      const groupSize = Math.ceil(favorites.length / MAX_DOTS);
      const targetIndex = dotIndex * groupSize;
      flatListRef.current?.scrollToIndex({ index: targetIndex, animated: true });
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        router.replace('/login');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadFavorites = () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const q = query(collection(db, 'favorites'), where('user', '==', currentUser.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs = [];
      snapshot.forEach(doc => {
        favs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      setFavorites(favs);
      setLoading(false);
      setRefreshing(false);
    });

    return unsubscribe;
  };

  useEffect(() => {
    const unsubscribe = loadFavorites();
    return () => unsubscribe();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadFavorites();
  }, []);

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      setLoading(true);
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, oldPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      
      Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi.');
      setShowPasswordForm(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      let errorMessage = 'Şifre güncellenirken bir hata oluştu.';
      if (error.code === 'auth/wrong-password') {
        errorMessage = 'Mevcut şifre yanlış.';
      }
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      Alert.alert('Hata', 'Çıkış yapılırken bir hata oluştu.');
    }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const handleRemoveFavorite = async (favoriteId) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
    } catch (error) {
      console.error('Favori silinirken hata:', error);
    }
  };

  const renderFavoriteItem = ({ item }) => (
    <View style={styles.favoriteItem}>
      <Image
        source={{ uri: item.photoData.url }}
        style={styles.favoriteImage}
        resizeMode="cover"
      />
      <View style={styles.favoriteInfo}>
        <Text style={styles.favoriteTitle}>{item.photoData.title}</Text>
        <Text style={styles.favoriteDate}>
          {new Date(item.photoData.date).toLocaleDateString('tr-TR')}
        </Text>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleRemoveFavorite(item.id)}
        >
          <Ionicons name="trash-outline" size={24} color="#fff" />
          <Text style={styles.removeButtonText}>Favorilerden Kaldır</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6B4EFF" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={darkMode 
        ? require('assets/images/karanlık_mod.png')
        : require('assets/images/astroverse_giris.png')
      }
      style={styles.background}
    >
      <View style={[styles.overlay, darkMode && styles.darkOverlay]}>
        <ScrollView style={styles.scrollView}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.title}>Profil</Text>
            <TouchableOpacity 
              style={styles.darkModeButton}
              onPress={toggleDarkMode}
            >
              <Ionicons 
                name={darkMode ? "moon" : "sunny"} 
                size={24} 
                color="#fff" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.container}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={100} color="#fff" />
              </View>
              <Text style={styles.email}>{auth.currentUser?.email}</Text>
            </View>

            {/* Favorilerim Butonu */}
            <TouchableOpacity 
              style={styles.favoritesButton}
              onPress={() => setShowFavorites(!showFavorites)}
            >
              <Ionicons name="star" size={24} color="#fff" style={styles.menuIcon} />
              <Text style={styles.favoritesButtonText}>Favorilerim</Text>
              <Ionicons 
                name={showFavorites ? "chevron-up" : "chevron-down"} 
                size={24} 
                color="#fff" 
                style={styles.chevronIcon}
              />
            </TouchableOpacity>

            {/* Favoriler Listesi */}
            {showFavorites && (
              <View style={styles.favoritesContainer}>
                {favorites.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="star-outline" size={48} color="#fff" />
                    <Text style={styles.emptyText}>Henüz favori fotoğrafınız yok</Text>
                  </View>
                ) : (
                  <>
                    <FlatList
                      ref={flatListRef}
                      data={favorites}
                      renderItem={renderFavoriteItem}
                      keyExtractor={item => item.id}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      pagingEnabled
                      snapToInterval={Dimensions.get('window').width - 20}
                      decelerationRate="fast"
                      contentContainerStyle={styles.favoritesList}
                      onViewableItemsChanged={onViewableItemsChanged}
                      viewabilityConfig={viewabilityConfig}
                    />
                    <View style={styles.paginationContainer}>
                      {Array.from({ length: Math.min(MAX_DOTS, favorites.length) }).map((_, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => scrollToIndex(index)}
                        >
                          <View
                            style={[
                              styles.paginationDot,
                              getDotIndex(activeIndex) === index && styles.paginationDotActive
                            ]}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}
              </View>
            )}

            {/* Hesap Bilgileri Bölümü */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={24} color="#fff" style={styles.menuIcon} />
                <Text style={styles.menuItemText}>Profili Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => setShowPasswordForm(!showPasswordForm)}
              >
                <Ionicons name="lock-closed-outline" size={24} color="#fff" style={styles.menuIcon} />
                <Text style={styles.menuItemText}>Şifre Değiştir</Text>
              </TouchableOpacity>
            </View>

            {showPasswordForm && (
              <View style={styles.passwordSection}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Eski Şifre"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry
                    value={oldPassword}
                    onChangeText={setOldPassword}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Yeni Şifre"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Yeni Şifre (Tekrar)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>

                <TouchableOpacity 
                  style={[styles.updateButton, loading && styles.buttonDisabled]}
                  onPress={handlePasswordChange}
                  disabled={loading}
                >
                  <Text style={styles.updateButtonText}>
                    {loading ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tercihler Bölümü */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tercihler</Text>
              <View style={styles.menuItem}>
                <Ionicons name="notifications-outline" size={24} color="#fff" style={styles.menuIcon} />
                <Text style={styles.menuItemText}>Bildirimler</Text>
                <Switch
                  value={notifications}
                  onValueChange={setNotifications}
                  style={styles.switch}
                />
              </View>
              <View style={styles.menuItem}>
                <Ionicons name="moon-outline" size={24} color="#fff" style={styles.menuIcon} />
                <Text style={styles.menuItemText}>Karanlık Mod</Text>
                <Switch
                  value={darkMode}
                  onValueChange={setDarkMode}
                  style={styles.switch}
                />
              </View>
            </View>

            {/* Çıkış Yap Butonu */}
            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.menuIcon} />
              <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    position: 'absolute',
    top: 40,
    left: 10,
    zIndex: 100,
    padding: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    paddingTop: 0,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  email: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 15,
    opacity: 0.8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 10,
  },
  menuIcon: {
    marginRight: 15,
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  switch: {
    marginLeft: 'auto',
  },
  passwordSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  updateButton: {
    backgroundColor: '#6B4EFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  buttonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  darkModeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 15,
  },
  favoritesButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  chevronIcon: {
    marginLeft: 'auto',
  },
  favoritesContainer: {
    height: 450,
    marginBottom: 20,
  },
  favoritesList: {
    paddingHorizontal: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
  favoriteItem: {
    width: Dimensions.get('window').width - 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  favoriteImage: {
    width: '100%',
    height: 250,
  },
  favoriteInfo: {
    padding: 15,
  },
  favoriteTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  favoriteDate: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginBottom: 10,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
    padding: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  removeButtonText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  paginationDotActive: {
    backgroundColor: '#6B4EFF',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
}); 