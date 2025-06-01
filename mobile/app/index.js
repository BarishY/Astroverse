import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../src/constants/colors';
import { fetchLastNasaApodsLast2Days } from '../src/services/nasaApi';

export default function HomeScreen() {
  const [apods, setApods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchApods = async () => {
    try {
      setLoading(true);
      console.log('APOD verileri yükleniyor...');
      const data = await fetchLastNasaApodsLast2Days();
      
      if (data && data.length > 0) {
        console.log('Yeni APOD verileri alındı:', {
          count: data.length,
          dates: data.map(item => item.date)
        });
        setApods(data);
      } else {
        console.log('Yeni APOD verisi bulunamadı');
      }
    } catch (error) {
      console.error('APOD verileri yüklenirken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchApods();
    // Her 5 dakikada bir kontrol et
    const intervalId = setInterval(fetchApods, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const onRefresh = () => {
    console.log('Manuel yenileme başlatıldı');
    setRefreshing(true);
    fetchApods();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Astronova</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => router.push('/profile')}
        >
          <Ionicons name="person-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Son Günlerin Uzay Fotoğrafları</Text>
        {apods.map((apod, index) => (
          <TouchableOpacity 
            key={apod.date}
            style={styles.apodCard}
            onPress={() => router.push(`/apod/${apod.date}`)}
          >
            <Image 
              source={{ uri: apod.url }} 
              style={styles.apodImage}
              resizeMode="cover"
            />
            <View style={styles.apodInfo}>
              <Text style={styles.apodDate}>{apod.date}</Text>
              <Text style={styles.apodTitle} numberOfLines={2}>{apod.title}</Text>
              <Text style={styles.apodExplanation} numberOfLines={3}>
                {apod.explanation}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
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
    backgroundColor: colors.feedBackground,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  profileButton: {
    padding: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  apodCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  apodImage: {
    width: '100%',
    height: 200,
  },
  apodInfo: {
    padding: 15,
  },
  apodDate: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 5,
  },
  apodTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  apodExplanation: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
}); 