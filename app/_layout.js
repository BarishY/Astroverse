import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { auth } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter, useSegments } from 'expo-router';

export default function Layout() {
  const segments = useSegments();
  const router = useRouter();

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

  return (
    <Stack>
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
    </Stack>
  );
}

Layout.displayName = 'Layout'; 