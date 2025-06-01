// app/_layout.js
import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, StatusBar } from 'react-native';
import { useAuth } from '../src/hooks/useAuth'; // Bu yol doğru: src/hooks/useAuth.js
// Firebase config dosyasını import ederek Firebase'in başlatılmasını sağlıyoruz.
// Bu satır, config.js içindeki kodun en az bir kere çalışmasını garanti eder.
import '../src/firebase/config'; // Bu yol doğru: src/firebase/config.js
import colors from '../src/constants/colors';

const InitialLayout = () => {
    const { user, loading } = useAuth(); // Auth hook'undan kullanıcı ve yükleme durumunu al
    const segments = useSegments(); // Mevcut URL segmentlerini al (örn: ['(tabs)', 'profile'])
    const router = useRouter(); // Yönlendirme için router hook'u

    useEffect(() => {
        // Eğer Auth durumu hala yükleniyorsa (loading true ise), yönlendirme yapma
        if (loading) {
            console.log("RootLayout: Auth durumu yükleniyor...");
            return;
        }

        // Mevcut rota segmentinin 'auth' grubunda olup olmadığını kontrol et
        const inAuthGroup = segments[0] === 'auth';
        // Mevcut rota segmentinin '(tabs)' grubunda olup olmadığını kontrol et
        const inTabsGroup = segments[0] === '(tabs)';

        console.log('RootLayout - User:', user ? user.uid : null, 'Loading:', loading, 'Segments:', segments.join('/'));

        if (user) {
            // Kullanıcı giriş yapmışsa
            if (inAuthGroup || segments.length === 0) {
                // Eğer auth ekranlarındaysa veya uygulama ilk açılıyorsa (segment yoksa)
                // ana uygulama sekmelerine (/(tabs)) yönlendir.
                console.log('RootLayout: Kullanıcı giriş yapmış, /(tabs) adresine yönlendiriliyor.');
                router.replace('/(tabs)');
            }
            // Kullanıcı giriş yapmış ve zaten (tabs) veya başka bir ana uygulama ekranındaysa bir şey yapma
        } else {
            // Kullanıcı giriş yapmamışsa
            if (!inAuthGroup) {
                // Eğer auth ekranlarında değilse (örneğin, (tabs)'a gitmeye çalışıyorsa veya ilk açılışsa)
                // giriş ekranına (/auth/login) yönlendir.
                console.log('RootLayout: Kullanıcı giriş yapmamış ve auth grubunda değil, /auth/login adresine yönlendiriliyor.');
                router.replace('/auth/login');
            }
            // Kullanıcı giriş yapmamış ve zaten auth ekranlarındaysa bir şey yapma
        }
    }, [user, loading, segments, router]); // Bu hook, bu değerler değiştiğinde tekrar çalışır

    // Auth durumu yüklenirken bir yükleme göstergesi göster
    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    // Yükleme bittikten sonra, yönlendirme mantığı çalışana kadar
    // veya yönlendirme gerekmiyorsa Stack navigator'u render et.
    return (
        <>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    animation: 'slide_from_right',
                }}
            >
                {/* Bu ekranlar Expo Router tarafından dosya sistemine göre otomatik olarak bulunur */}
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="auth" />
                <Stack.Screen
                    name="post/[id]" // Dinamik post detay sayfası için rota
                    options={{
                        headerShown: true, // Bu özel ekran için başlık göster
                        title: "Gönderi Detayı",
                        // Geri butonu için ek ayarlar yapılabilir
                        // headerBackTitleVisible: false,
                    }}
                />
                <Stack.Screen
                    name="collection/[id]" // Dinamik koleksiyon detay sayfası için rota
                    options={{
                        headerShown: true, // Bu özel ekran için başlık göster
                        title: "Koleksiyon Detayı",
                        // headerBackTitleVisible: false,
                    }}
                />
                {/* İleride eklenebilecek diğer modal veya tam ekran sayfalar buraya gelebilir */}
                {/* <Stack.Screen name="modal" options={{ presentation: 'modal' }} /> */}
                {/* +not-found.js dosyası otomatik olarak ele alınır */}
            </Stack>
        </>
    );
};

const styles = StyleSheet.create({
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff', // Yükleme ekranı için arkaplan
    }
});

export default InitialLayout;
