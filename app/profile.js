import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, ScrollView, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { auth } from '../config/firebase';
import { signOut, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { Ionicons } from '@expo/vector-icons';

export default function ProfileScreen() {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handlePasswordChange = async () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Hata', 'Lütfen tüm alanları doldurun.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Hata', 'Yeni şifreler eşleşmiyor.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Hata', 'Yeni şifre en az 6 karakter olmalıdır.');
      return;
    }

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        oldPassword
      );

      // Önce kullanıcıyı yeniden doğrula
      await reauthenticateWithCredential(user, credential);
      
      // Şifreyi güncelle
      await updatePassword(user, newPassword);
      
      Alert.alert('Başarılı', 'Şifreniz başarıyla güncellendi.');
      setIsChangingPassword(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Şifre güncellenirken hata oluştu:', error);
      Alert.alert('Hata', 'Şifre güncellenirken bir hata oluştu. Lütfen eski şifrenizi kontrol edin.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  return (
    <ImageBackground
      source={require('assets/images/astroverse_giris.png')}
      style={styles.background}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={30} color="#fff" />
        </TouchableOpacity>

        <ScrollView style={styles.scrollView}>
          <View style={styles.container}>
            <View style={styles.profileHeader}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person-circle" size={100} color="#fff" />
              </View>
              <Text style={styles.email}>{auth.currentUser?.email}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Hesap Bilgileri</Text>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="person-outline" size={24} color="#fff" style={styles.menuIcon} />
                <Text style={styles.menuItemText}>Profil Düzenle</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.menuItem} 
                onPress={() => setIsChangingPassword(!isChangingPassword)}
              >
                <Ionicons name="lock-closed-outline" size={24} color="#fff" style={styles.menuIcon} />
                <Text style={styles.menuItemText}>Şifre Değiştir</Text>
              </TouchableOpacity>
            </View>

            {isChangingPassword && (
              <View style={styles.passwordSection}>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Eski Şifre"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry={!showOldPassword}
                    value={oldPassword}
                    onChangeText={setOldPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowOldPassword(!showOldPassword)}
                  >
                    <Ionicons 
                      name={showOldPassword ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Yeni Şifre"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry={!showNewPassword}
                    value={newPassword}
                    onChangeText={setNewPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                  >
                    <Ionicons 
                      name={showNewPassword ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Yeni Şifre (Tekrar)"
                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons 
                      name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                      size={24} 
                      color="#fff" 
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.updateButton} onPress={handlePasswordChange}>
                  <Text style={styles.updateButtonText}>Şifreyi Güncelle</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tercihler</Text>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="notifications-outline" size={24} color="#fff" style={styles.menuIcon} />
                <Text style={styles.menuItemText}>Bildirimler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem}>
                <Ionicons name="moon-outline" size={24} color="#fff" style={styles.menuIcon} />
                <Text style={styles.menuItemText}>Karanlık Mod</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={24} color="#fff" style={styles.menuIcon} />
              <Text style={styles.logoutButtonText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
  backButton: {
    position: 'absolute',
    top: 20,
    left: 10,
    zIndex: 100,
    padding: 10,
  },
  scrollView: {
    flex: 1,
  },
  container: {
    padding: 20,
    marginTop: 60,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  email: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
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
  passwordSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    padding: 15,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  updateButton: {
    backgroundColor: '#6B4EFF',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    marginTop: 20,
  },
  logoutButtonText: {
    fontSize: 16,
    color: '#fff',
    marginLeft: 15,
  },
}); 