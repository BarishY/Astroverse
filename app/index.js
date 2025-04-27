import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Animated, Dimensions, TextInput, Platform, Image, Modal, RefreshControl, useColorScheme, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { auth, db } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDoc, doc, setDoc, updateDoc, arrayUnion, onSnapshot, collection, query, where, orderBy, deleteDoc, arrayRemove, serverTimestamp } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');
const NASA_API_KEY = 'F0y2EDV7Zo3jIKnnzxaN4PYb8FK4Lnp6rhOQ1d5Q';

export default function HomeScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [apodData, setApodData] = useState(null);
  const [loading, setLoading] = useState(true);
  const slideAnim = React.useRef(new Animated.Value(-width)).current;
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const colorScheme = useColorScheme();
  const star1Anim = React.useRef(new Animated.Value(0.3)).current;
  const star2Anim = React.useRef(new Animated.Value(0.3)).current;
  const star3Anim = React.useRef(new Animated.Value(0.3)).current;
  const [isFiltered, setIsFiltered] = useState(false);
  const [likes, setLikes] = useState({});
  const [comments, setComments] = useState({});
  const [showCommentInput, setShowCommentInput] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [editingComment, setEditingComment] = useState(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [favorites, setFavorites] = useState({});

  useEffect(() => {
    const initializeData = async () => {
      try {
        await fetchApodData();
      } catch (error) {
        console.error('Veri yüklenirken hata oluştu:', error);
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    if (loading) {
      const animateStars = () => {
        Animated.sequence([
          Animated.timing(star1Anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(star2Anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(star3Anim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(star1Anim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(star2Anim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(star3Anim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start(() => animateStars());
      };
      animateStars();
    }
  }, [loading]);

  const fetchApodData = async (selectedDate = null) => {
    try {
      setLoading(true);
      let url = `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}`;
      
      if (selectedDate) {
        const date = new Date(selectedDate);
        const formattedDate = date.toISOString().split('T')[0];
        url += `&date=${formattedDate}`;
      } else {
        const today = new Date();
        const startDate = new Date();
        startDate.setDate(today.getDate() - 30);
        url += `&start_date=${startDate.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      const photos = Array.isArray(data) ? data : [data];
      
      const filteredData = photos.filter(item => 
        item.media_type === 'image' && 
        item.url && 
        !item.url.includes('youtube.com') && 
        !item.url.includes('vimeo.com')
      );

      const sortedData = filteredData.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      
      const finalData = sortedData.slice(0, 25);
      setApodData(finalData);
    } catch (error) {
      console.error('APOD verisi alınırken hata oluştu:', error);
      setApodData([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? -width : 0;
    Animated.timing(slideAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.clear();
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
      router.replace('/(auth)/login');
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.replace('/(auth)/login');
      }
    });

    return () => unsubscribe();
  }, []);

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const handleItemPress = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchApodData().finally(() => setRefreshing(false));
  }, []);

  const handleApplyFilter = () => {
    fetchApodData(selectedDate);
    setIsFiltered(true);
  };

  const handleClearFilters = () => {
    setSelectedDate(new Date());
    setIsFiltered(false);
    fetchApodData(null);
  };

  // Firestore'dan beğeni ve yorumları yükle
  useEffect(() => {
    if (apodData) {
      apodData.forEach(item => {
        const postRef = doc(db, 'apod_posts', item.date);
        // Beğenileri dinle
        const likesUnsubscribe = onSnapshot(postRef, (doc) => {
          if (doc.exists()) {
            setLikes(prevLikes => ({
              ...prevLikes,
              [item.date]: doc.data().likes || []
            }));
          }
        });
        // Yorumları dinle
        const commentsRef = collection(db, 'apod_posts', item.date, 'comments');
        const commentsQuery = query(commentsRef, orderBy('timestamp', 'desc'));
        const commentsUnsubscribe = onSnapshot(commentsQuery, (snapshot) => {
          const newComments = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setComments(prevComments => ({
            ...prevComments,
            [item.date]: newComments
          }));
        });
        return () => {
          likesUnsubscribe();
          commentsUnsubscribe();
        };
      });
    }
  }, [apodData]);

  // Kullanıcının favorilerini Firestore'dan çek
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const q = query(collection(db, 'favorites'), where('user', '==', currentUser.email));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const favs = {};
      snapshot.forEach(doc => {
        favs[doc.data().photoId] = doc.data();
      });
      setFavorites(favs);
    });
    return () => unsubscribe();
  }, [auth.currentUser]);

  const handleComment = (itemId) => {
    setShowCommentInput(showCommentInput === itemId ? null : itemId);
    setCommentText('');
  };

  const onAddComment = async (itemId) => {
    if (await handleAddComment(itemId, commentText)) {
      setCommentText('');
      setShowCommentInput(null);
    }
  };

  const onDeleteComment = async (itemId, commentId) => {
    await handleDeleteComment(itemId, commentId);
  };

  const onEditComment = async (itemId, commentId) => {
    if (await handleEditComment(itemId, commentId, editCommentText)) {
      setEditingComment(null);
      setEditCommentText('');
    }
  };

  const onToggleFavorite = async (photo) => {
    await handleToggleFavorite(photo);
  };

  const renderLoadingAnimation = () => (
    <View style={styles.loadingContainer}>
      <View style={styles.loadingStars}>
        <Ionicons name="star" size={24} color="#6B4EFF" style={styles.star1} />
        <Ionicons name="star" size={24} color="#6B4EFF" style={styles.star2} />
        <Ionicons name="star" size={24} color="#6B4EFF" style={styles.star3} />
      </View>
    </View>
  );

  const renderWebHeader = () => (
    <View style={[styles.header, styles.webHeader]}>
      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <Ionicons name="menu" size={30} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.filterButton} 
        onPress={() => setIsFilterOpen(!isFilterOpen)}
      >
        <Ionicons name="funnel" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderMobileHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity style={styles.menuButton} onPress={toggleMenu}>
        <Ionicons name="menu" size={30} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.filterButton} 
        onPress={() => setIsFilterOpen(!isFilterOpen)}
      >
        <Ionicons name="funnel" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const renderItem = (item) => (
    <TouchableOpacity
      key={item.date}
      style={styles.itemContainer}
      onPress={() => handleItemPress(item)}
    >
      <Image
        source={{ uri: item.url }}
        style={styles.itemImage}
        resizeMode="cover"
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemDate}>
          {new Date(item.date).toLocaleDateString('tr-TR')}
        </Text>
        <View style={styles.interactionButtons}>
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleLike(item.date)}
          >
            <Ionicons
              name={likes[item.date]?.includes(auth.currentUser?.email) ? "heart" : "heart-outline"}
              size={24}
              color={likes[item.date]?.includes(auth.currentUser?.email) ? "#ff0000" : "#fff"}
            />
            <Text style={styles.interactionText}>
              {likes[item.date]?.length || 0} Beğeni
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => handleComment(item.date)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            <Text style={styles.interactionText}>
              {comments[item.date]?.length || 0} Yorum
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.interactionButton}
            onPress={() => onToggleFavorite(item)}
          >
            <Ionicons
              name={favorites[item.date] ? "star" : "star-outline"}
              size={24}
              color={favorites[item.date] ? "#FFD700" : "#fff"}
            />
            <Text style={styles.interactionText}>
              {favorites[item.date] ? "Favori" : "Favorilere Ekle"}
            </Text>
          </TouchableOpacity>
        </View>
        {showCommentInput === item.date && (
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder="Yorumunuzu yazın..."
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity
              style={styles.commentSubmitButton}
              onPress={() => onAddComment(item.date)}
            >
              <Text style={styles.commentSubmitText}>Gönder</Text>
            </TouchableOpacity>
          </View>
        )}
        {comments[item.date]?.length > 0 && (
          <View style={styles.commentsContainer}>
            {comments[item.date].map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUser}>{comment.user}</Text>
                  {auth.currentUser?.email === comment.user && (
                    <View style={styles.commentActions}>
                      <TouchableOpacity
                        onPress={() => {
                          setEditingComment(comment.id);
                          setEditCommentText(comment.text);
                        }}
                        style={styles.commentActionButton}
                      >
                        <Ionicons name="create-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => onDeleteComment(item.date, comment.id)}
                        style={styles.commentActionButton}
                      >
                        <Ionicons name="trash-outline" size={16} color="#fff" />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
                {editingComment === comment.id ? (
                  <View style={styles.editCommentContainer}>
                    <TextInput
                      style={styles.editCommentInput}
                      value={editCommentText}
                      onChangeText={setEditCommentText}
                      multiline
                    />
                    <View style={styles.editCommentButtons}>
                      <TouchableOpacity
                        style={[styles.editCommentButton, styles.cancelButton]}
                        onPress={() => {
                          setEditingComment(null);
                          setEditCommentText('');
                        }}
                      >
                        <Text style={styles.editCommentButtonText}>İptal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editCommentButton, styles.saveButton]}
                        onPress={() => onEditComment(item.date, comment.id)}
                      >
                        <Text style={styles.editCommentButtonText}>Kaydet</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.commentText}>{comment.text}</Text>
                )}
                <Text style={styles.commentTime}>
                  {comment.timestamp?.toDate ? 
                    new Date(comment.timestamp.toDate()).toLocaleString('tr-TR') : 
                    ''}
                  {comment.editedAt && ` (${new Date(comment.editedAt).toLocaleString('tr-TR')} tarihinde düzenlendi)`}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <ImageBackground
      source={colorScheme === 'dark' 
        ? require('assets/images/karanlık_mod.png')
        : require('assets/images/astroverse_giris.png')
      }
      style={styles.background}
    >
      <View style={[styles.overlay, colorScheme === 'dark' && styles.darkOverlay]}>
        {Platform.OS === 'web' ? renderWebHeader() : renderMobileHeader()}

        <Animated.View 
          style={[
            styles.sideMenu,
            {
              transform: [{ translateX: slideAnim }],
            }
          ]}
        >
          <View style={styles.menuHeader}>
            <View style={styles.profileSection}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={60} color="#fff" />
              </View>
              <Text style={styles.email}>{auth.currentUser?.email}</Text>
            </View>
            <TouchableOpacity onPress={toggleMenu}>
              <Ionicons name="close" size={30} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => router.push('/profile')}
          >
            <Ionicons name="person-circle" size={30} color="#fff" />
            <Text style={styles.profileButtonText}>Profil</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Ayarlar</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="notifications-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Bildirimler</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Yardım</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuLogoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuLogoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </Animated.View>

        {isFilterOpen && (
          <View style={styles.filterContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Tarih Filtrele</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>
                Seçilen Tarih: {selectedDate.toLocaleDateString('tr-TR')}
              </Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>Tarih Seç</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.applyFilterButton}
              onPress={handleApplyFilter}
            >
              <Text style={styles.applyFilterButtonText}>Filtrele</Text>
            </TouchableOpacity>

            {isFiltered && (
              <TouchableOpacity 
                style={[styles.applyFilterButton, styles.clearFilterButton]}
                onPress={handleClearFilters}
              >
                <Text style={styles.applyFilterButtonText}>Filtreleri Temizle</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={onDateChange}
            maximumDate={new Date()}
          />
        )}

        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#6B4EFF"
              colors={['#6B4EFF']}
              progressBackgroundColor="#000"
            />
          }
        >
          <View style={styles.container}>
            {loading ? (
              renderLoadingAnimation()
            ) : (
              <View style={styles.feedContainer}>
                {apodData && apodData.length > 0 ? (
                  apodData.map((item, index) => renderItem(item))
                ) : (
                  <View style={styles.noDataContainer}>
                    <Text style={styles.noDataText}>İçerik bulunamadı</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <Modal
          visible={showDetail}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowDetail(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowDetail(false)}
              >
                <Ionicons name="close" size={30} color="#fff" />
              </TouchableOpacity>
              
              {selectedItem && (
                <ScrollView style={styles.modalScrollView}>
                  <Image
                    source={{ uri: selectedItem.url }}
                    style={styles.modalImage}
                    resizeMode="contain"
                  />
                  <View style={styles.modalTextContainer}>
                    <Text style={styles.modalTitle}>{selectedItem.title}</Text>
                    <Text style={styles.modalDescription}>
                      {selectedItem.explanation}
                    </Text>
                    <Text style={styles.modalDate}>
                      {new Date(selectedItem.date).toLocaleDateString('tr-TR')}
                    </Text>
                  </View>
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingHorizontal: 10,
    zIndex: 100,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
  },
  menuButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  filterButton: {
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginRight: 10,
  },
  sideMenu: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: width * 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 99,
    padding: 20,
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 30,
    marginTop: 40,
  },
  profileSection: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  email: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
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
    fontSize: 16,
    color: '#fff',
  },
  menuLogoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginTop: 'auto',
  },
  menuLogoutText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  filterContainer: {
    position: 'absolute',
    top: 60,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 10,
    padding: 15,
    width: width * 0.8,
    zIndex: 98,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  dateContainer: {
    marginBottom: 15,
  },
  dateLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 5,
    textAlign: 'center',
  },
  dateButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  dateButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  applyFilterButton: {
    backgroundColor: '#6B4EFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  applyFilterButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    marginTop: 60,
  },
  container: {
    padding: 20,
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 100,
  },
  loadingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  star1: {
    transform: [{ scale: 0.8 }],
  },
  star2: {
    transform: [{ scale: 1 }],
  },
  star3: {
    transform: [{ scale: 0.8 }],
  },
  feedContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  itemContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  itemImage: {
    width: '100%',
    height: 200,
  },
  itemInfo: {
    padding: 15,
  },
  itemTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  itemDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  interactionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  interactionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  interactionText: {
    color: '#fff',
    marginLeft: 5,
    fontSize: 14,
  },
  commentInputContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
  },
  commentInput: {
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    padding: 8,
    marginBottom: 8,
    minHeight: 40,
  },
  commentSubmitButton: {
    backgroundColor: '#6B4EFF',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  commentSubmitText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  commentsContainer: {
    marginTop: 10,
  },
  commentItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  commentUser: {
    color: '#6B4EFF',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    color: '#fff',
    marginBottom: 4,
  },
  commentTime: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noDataText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '95%',
    height: '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 15,
    padding: 20,
    position: 'relative',
  },
  modalScrollView: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    padding: 5,
  },
  modalImage: {
    width: '100%',
    height: 350,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  modalTextContainer: {
    padding: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 16,
    color: '#fff',
    lineHeight: 24,
    textAlign: 'justify',
    opacity: 0.9,
    marginBottom: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    padding: 15,
  },
  modalDate: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    marginTop: 10,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginBottom: 10,
  },
  profileButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
  darkOverlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  webHeader: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingTop: Platform.OS === 'web' ? 20 : 20,
    paddingHorizontal: 20,
    zIndex: 1000,
  },
  scrollView: {
    flex: 1,
    marginTop: Platform.OS === 'web' ? 80 : 60,
  },
  sideMenu: {
    position: Platform.OS === 'web' ? 'fixed' : 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: Platform.OS === 'web' ? 300 : width * 0.8,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    zIndex: 99,
    padding: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Platform.OS === 'web' ? 20 : 0,
  },
  modalContent: {
    width: Platform.OS === 'web' ? '80%' : '95%',
    height: Platform.OS === 'web' ? '80%' : '90%',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderRadius: 15,
    padding: 20,
    position: 'relative',
  },
  clearFilterButton: {
    backgroundColor: '#FF4B4B',
    marginTop: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  commentActions: {
    flexDirection: 'row',
  },
  commentActionButton: {
    marginLeft: 8,
    padding: 4,
  },
  editCommentContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  editCommentInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    minHeight: 40,
  },
  editCommentButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editCommentButton: {
    padding: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  cancelButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  saveButton: {
    backgroundColor: 'rgba(0, 255, 0, 0.3)',
  },
  editCommentButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
}); 
