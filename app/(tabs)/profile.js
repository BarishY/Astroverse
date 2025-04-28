import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

// Firebase yapılandırması
const firebaseConfig = {
  apiKey: "AIzaSyDqQqQqQqQqQqQqQqQqQqQqQqQqQqQqQq",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Firebase'i başlat (tekrar başlatmayı engelle)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

const AuthContext = createContext();

const useAuth = () => {
  return useContext(AuthContext);
};

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const ProfileScreen = () => {
  const [activeDot, setActiveDot] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollViewRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const favoritesRef = collection(db, 'favorites');
        const q = query(favoritesRef, where('user', '==', user.email));
        const querySnapshot = await getDocs(q);
        
        const favoritesData = [];
        querySnapshot.forEach((doc) => {
          favoritesData.push(doc.data());
        });
        
        setFavorites(favoritesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const handleScroll = (event) => {
    const { contentOffset, layoutMeasurement } = event.nativeEvent;
    const pageIndex = Math.round(contentOffset.x / layoutMeasurement.width);
    setActiveDot(pageIndex);
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {favorites.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index === activeDot && styles.activeDot
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <AuthProvider>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
        </View>
        
        <View style={styles.profileInfo}>
          <View style={styles.avatarContainer}>
            <Ionicons name="person-circle" size={80} color="#fff" />
          </View>
          <Text style={styles.email}>{user.email}</Text>
        </View>

        <View style={styles.favoritesSection}>
          <Text style={styles.sectionTitle}>Favorilerim</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#6B4EFF" />
          ) : error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : favorites.length > 0 ? (
            <>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.favoritesScrollView}
              >
                {favorites.map((favorite, index) => (
                  <View key={index} style={styles.favoriteItem}>
                    <Image
                      source={{ uri: favorite.photoData.url }}
                      style={styles.favoriteImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.favoriteTitle}>{favorite.photoData.title}</Text>
                    <Text style={styles.favoriteDate}>
                      {new Date(favorite.photoData.date).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                ))}
              </ScrollView>
              {renderDots()}
            </>
          ) : (
            <Text style={styles.noFavoritesText}>Henüz favori fotoğraf eklenmemiş</Text>
          )}
        </View>
      </View>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileInfo: {
    alignItems: 'center',
    padding: 20,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#6B4EFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  email: {
    color: '#fff',
    fontSize: 16,
  },
  favoritesSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  errorText: {
    color: '#ff3b30',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  noFavoritesText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#6B4EFF',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  favoritesScrollView: {
    height: 300,
  },
  favoriteItem: {
    width: Dimensions.get('window').width - 40,
    marginHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    overflow: 'hidden',
    padding: 15,
  },
  favoriteImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
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
  },
});

export default ProfileScreen; 