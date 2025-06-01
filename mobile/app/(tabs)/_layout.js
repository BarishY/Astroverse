// app/(tabs)/_layout.js
import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/hooks/useAuth'; // Auth hook'umuz
import colors from '../../src/constants/colors'; // Renklerimiz

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    // Auth durumu yüklenirken bir yükleme göstergesi gösterilebilir
    // veya null dönerek app/_layout.js'deki yükleme ekranının devam etmesi sağlanabilir.
    return null;
  }

  if (!user) {
    // Kullanıcı giriş yapmamışsa, login ekranına yönlendir.
    // app/_layout.js bu yönlendirmeyi zaten yapmalı, ama burada da bir güvence olabilir.
    return <Redirect href="/auth/login" />;
  }

  // Kullanıcı giriş yapmışsa, tabları göster.
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'index') { // app/(tabs)/index.js
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'messages') { // app/(tabs)/messages.js
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'explore') { // app/(tabs)/explore.js
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'profile') { // app/(tabs)/profile.js
            iconName = focused ? 'person-circle' : 'person-circle-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary, // constants/colors.js'den
        tabBarInactiveTintColor: 'gray',
        // headerShown: false, // Eğer her tab kendi başlığını yönetecekse veya app/_layout.js'deki Stack yönetecekse.
        // Şimdilik başlıkları tablara bırakalım, gerekirse Stack'ten yönetiriz.
      })}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Mesajlar',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Keşfet',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
        }}
      />
    </Tabs>
  );
}
