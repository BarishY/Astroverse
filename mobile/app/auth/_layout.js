// app/auth/_layout.js
import React from 'react';
import { Stack, Redirect, useRouter } from 'expo-router'; // useRouter eklendi (opsiyonel)
import { useAuth } from '../../src/hooks/useAuth'; // src içindeki hook'a giden yol

export default function AuthLayout() {
  const { user, loading } = useAuth();
  const router = useRouter(); // Opsiyonel: Geri butonu gibi özel durumlar için

  // Eğer Firebase hala kullanıcı durumunu kontrol ediyorsa,
  // hiçbir şey gösterme veya bir yükleme göstergesi göster.
  if (loading) {
    // Bir yükleme göstergesi göstermek daha iyi bir kullanıcı deneyimi olabilir
    // import { ActivityIndicator, View } from 'react-native';
    // return <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}><ActivityIndicator size="large" /></View>;
    return null;
  }

  // Eğer kullanıcı zaten giriş yapmışsa, onu auth ekranlarından
  // ana uygulama sekmelerine (/(tabs)) yönlendir.
  if (user) {
    console.log("AuthLayout: Kullanıcı giriş yapmış, /(tabs) adresine yönlendiriliyor.");
    return <Redirect href="/(tabs)" />;
  }

  // Kullanıcı giriş yapmamışsa, login ve signup ekranlarının
  // gösterileceği Stack navigator'u döndür.
  console.log("AuthLayout: Kullanıcı giriş yapmamış, Auth Stack gösteriliyor.");
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
    // Bu Stack, app/auth/login.js ve app/auth/signup.js
    // dosyalarını otomatik olarak ekran olarak alacaktır.
  );
}
