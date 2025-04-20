import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../config/firebase';
import { useRouter, useSegments } from 'expo-router';
import { useColorScheme } from 'react-native';

// Reanimated'ı en üstte import et
import 'react-native-reanimated';

export default function Layout() {
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      const inAuthGroup = segments[0] === '(auth)';

      if (!user && !inAuthGroup) {
        router.replace('/(auth)/login');
      } else if (user && inAuthGroup) {
        router.replace('/');
      }
    });

    return () => unsubscribe();
  }, [segments]);

  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
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
          }}
        />
        <Stack.Screen
          name="(auth)/login"
          options={{
            title: 'Giriş Yap',
          }}
        />
        <Stack.Screen
          name="(auth)/register"
          options={{
            title: 'Kayıt Ol',
          }}
        />
        <Stack.Screen
          name="(auth)/forgot-password"
          options={{
            title: 'Şifre Sıfırlama',
          }}
        />
        <Stack.Screen
          name="profile"
          options={{
            title: 'Profil',
          }}
        />
      </Stack>
    </>
  );
}

Layout.displayName = 'Layout'; 