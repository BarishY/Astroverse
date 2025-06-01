// app/(tabs)/explore.js
import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors'; 
import UserSearchBar from '../../src/features/explore/UserSearchBar';
// Oluşturduğumuz RecentCollections bileşenini import ediyoruz
import RecentCollections from '../../src/features/explore_feed/RecentCollections'; 
import PopularCollections from '../../src/features/explore_feed/PopularCollections';

const TopTab = createMaterialTopTabNavigator();

// Popüler Koleksiyonlar için Placeholder component'i
const CollectionListPlaceholder = ({ title }) => (
  <View style={styles.placeholderContainer}>
    <Ionicons name="telescope-outline" size={60} color={colors.textLight} />
    <Text style={styles.placeholderTitle}>{title}</Text>
    <Text style={styles.placeholderSubtitle}>
      Bu bölüm yakında en harika uzay koleksiyonlarıyla dolacak!
    </Text>
  </View>
);

const ExploreScreen = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Arama Çubuğunu en üste ekliyoruz */}
      <UserSearchBar /> 
      
      {/* Üst Sekme Navigasyonu */}
      <TopTab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
            height: 3,
            borderRadius: 3, // İndikatöre hafif yuvarlaklık
          },
          tabBarLabelStyle: {
            textTransform: 'none',
            fontWeight: 'bold',
            fontSize: 15,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            elevation: 0, // Android - Gölgeyi kaldır
            shadowOpacity: 0, // iOS - Gölgeyi kaldır
            borderBottomWidth: 1, // Hafif bir ayırıcı çizgi
            borderBottomColor: colors.border,
          },
          // Sekmeler arası geçiş animasyonunu etkinleştirebilirsiniz (isteğe bağlı)
          // animationEnabled: true, 
        }}
      >
        {/* Son Koleksiyonlar Sekmesi - Artık gerçek bileşeni gösteriyor */}
        <TopTab.Screen 
          name="RecentCollectionsTab"
          component={RecentCollections}
          options={{ title: 'Son Koleksiyonlar' }}
        />
        {/* Popüler Koleksiyonlar Sekmesi - Şimdilik placeholder */}
        <TopTab.Screen 
          name="PopularCollectionsTab" // İsmi değiştirdim
          component={PopularCollections}
          options={{ title: 'Popüler Koleksiyonlar' }}
        />
      </TopTab.Navigator>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface, // Arka planı surface olarak değiştirdim, daha tutarlı olabilir
    paddingTop: Platform.OS === 'android' ? 25 : 0, // Android için status bar boşluğu
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.feedBackground, // Arka plan rengi
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 15,
    marginBottom: 8,
    textAlign: 'center',
  },
  placeholderSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ExploreScreen;
