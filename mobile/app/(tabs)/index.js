// app/(tabs)/index.js
import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { SafeAreaView, StyleSheet, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors'; // Bu yol doğru
import NasaFeed from '../../src/features/home_feed/NasaFeed';
import PersonalizedFeed from '../../src/features/home_feed/PersonalizedFeed';

const TopTab = createMaterialTopTabNavigator();

const HomeScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <TopTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
            height: 3, // İndikatör yüksekliği
          },
          tabBarLabelStyle: {
            textTransform: 'none', // Yazıların büyük harf olmasını engeller
            fontWeight: 'bold',
            fontSize: 15,
          },
          tabBarStyle: {
            backgroundColor: colors.surface, // Sekme çubuğunun arkaplan rengi
            elevation: 0, // Android'de gölgeyi kaldırır
            shadowOpacity: 0, // iOS'ta gölgeyi kaldırır
          },
        }}
      >
        <TopTab.Screen
          name="NasaFeed"
          options={{ title: 'NASA' }}
          component={NasaFeed}
        />
        <TopTab.Screen
          name="FollowingFeed"
          options={{ title: 'Bana Özel' }}
          component={PersonalizedFeed}
        />
      </TopTab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0, // Android için StatusBar boşluğu
  },
});

export default HomeScreen;
