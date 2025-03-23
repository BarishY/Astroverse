import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, Animated, Dimensions, TextInput, Platform, Image, Modal, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { auth } from '../config/firebase';
import { signOut } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

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

  useEffect(() => {
    fetchApodData();
  }, []);

  const fetchApodData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const startDate = new Date();
      startDate.setDate(today.getDate() - 30); // Son 30 günün fotoğraflarını al

      const response = await fetch(
        `https://api.nasa.gov/planetary/apod?api_key=${NASA_API_KEY}&start_date=${startDate.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}`
      );
      const data = await response.json();
      const filteredData = data.filter(item => 
        item.media_type === 'image' && 
        item.url && 
        !item.url.includes('youtube.com') && 
        !item.url.includes('vimeo.com')
      );
      const sortedData = filteredData.sort((a, b) => 
        new Date(b.date) - new Date(a.date)
      );
      setApodData(sortedData.slice(0, 25));
    } catch (error) {
      console.error('APOD verisi alınırken hata oluştu:', error);
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
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

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

  return (
    <ImageBackground
      source={require('assets/images/astroverse_giris.png')}
      style={styles.background}
    >
      <View style={styles.overlay}>
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

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile')}>
            <Ionicons name="person-outline" size={24} color="#fff" style={styles.menuIcon} />
            <Text style={styles.menuItemText}>Profil</Text>
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
              <Text style={styles.filterTitle}>Filtrele</Text>
              <TouchableOpacity onPress={() => setIsFilterOpen(false)}>
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.dateContainer}>
              <Text style={styles.dateLabel}>Tarih Seçin</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateButtonText}>
                  {selectedDate.toLocaleDateString('tr-TR')}
                </Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                testID="datePicker"
                value={selectedDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}

            <TouchableOpacity style={styles.applyFilterButton}>
              <Text style={styles.applyFilterButtonText}>Filtrele</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView 
          style={styles.scrollView}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#fff"
              colors={['#fff']}
              progressBackgroundColor="#6B4EFF"
            />
          }
        >
          <View style={styles.container}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Yükleniyor...</Text>
              </View>
            ) : (
              <View style={styles.feedContainer}>
                {apodData && apodData.length > 0 ? (
                  apodData.map((item, index) => (
                    <View key={index} style={styles.feedItem}>
                      <TouchableOpacity onPress={() => handleItemPress(item)}>
                        <Image
                          source={{ uri: item.url }}
                          style={styles.feedImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                      <View style={styles.feedContent}>
                        <Text style={styles.feedTitle}>{item.title}</Text>
                        <Text style={styles.feedDate}>
                          {new Date(item.date).toLocaleDateString('tr-TR')}
                        </Text>
                      </View>
                    </View>
                  ))
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
  },
  loadingText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
  feedContainer: {
    width: '100%',
    paddingBottom: 20,
  },
  feedItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  feedImage: {
    width: '100%',
    height: 200,
  },
  feedContent: {
    padding: 15,
  },
  feedTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  feedDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
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
}); 
