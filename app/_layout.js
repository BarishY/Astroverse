import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useSegments } from 'expo-router';
import { useColorScheme, Platform } from 'react-native';

export default function Layout() {
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!user && !inAuthGroup) {
        // Kullanıcı giriş yapmamışsa ve auth grubunda değilse, login sayfasına yönlendir
        router.replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        // Kullanıcı giriş yapmışsa ve auth grubundaysa, ana sayfaya yönlendir
        router.replace('/');
      }
    });

    return unsubscribe;
  }, [segments]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      // Web için gerekli meta etiketlerini ekle
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }
  }, []);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Astroverse',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(auth)/login"
        options={{
          title: 'Giriş Yap',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="(auth)/register"
        options={{
          title: 'Kayıt Ol',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="profile"
        options={{
          title: 'Profil',
          headerShown: false,
        }}
      />
    </Stack>
  );
}

Layout.displayName = 'Layout'; 