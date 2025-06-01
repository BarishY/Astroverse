// src/components/profile/ProfileHeader.js
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../constants/colors'; // Renklerimiz
// import { useRouter } from 'expo-router'; // Eğer "Profili Düzenle" butonu olacaksa

const ProfileHeader = ({ user, userData, collectionsCount, onEditProfile }) => {
  // const router = useRouter(); // "Profili Düzenle" için

  if (!user || !userData) {
    // Bu durum genellikle ProfileScreen'de ele alınır ama yine de bir fallback
    return (
      <View style={styles.container}>
        <Text>Kullanıcı bilgileri yükleniyor...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.avatarContainer}>
        {userData.profilePicUrl ? (
          <Image source={{ uri: userData.profilePicUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Ionicons name="person-circle-outline" size={80} color={colors.primary} />
          </View>
        )}
        {/* TODO: Profil resmi yükleme/değiştirme butonu eklenebilir */}
      </View>

      <Text style={styles.username}>{userData.username || 'Kullanıcı Adı'}</Text>
      {user.email && <Text style={styles.email}>{user.email}</Text>}
      {userData.bio && <Text style={styles.bio}>{userData.bio}</Text>}

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{collectionsCount || 0}</Text>
          <Text style={styles.statLabel}>Koleksiyon</Text>
        </View>
        <TouchableOpacity style={styles.statItem} onPress={() => console.log("Takipçiler sayfasına git")}>
          <Text style={styles.statNumber}>{userData.followers?.length || 0}</Text>
          <Text style={styles.statLabel}>Takipçi</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.statItem} onPress={() => console.log("Takip edilenler sayfasına git")}>
          <Text style={styles.statNumber}>{userData.following?.length || 0}</Text>
          <Text style={styles.statLabel}>Takip</Text>
        </TouchableOpacity>
      </View>

      {/* TODO: "Profili Düzenle" veya "Ayarlar" butonu */}
      {/* <TouchableOpacity
        style={styles.editButton}
        onPress={() => {
          if (onEditProfile) {
            onEditProfile();
          } else {
            // router.push('/profile/edit'); // Örnek bir rota
            console.log("Profili düzenle tıklandı");
          }
        }}
      >
        <Ionicons name="settings-outline" size={20} color={colors.primary} />
        <Text style={styles.editButtonText}>Profili Düzenle</Text>
      </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 15,
    backgroundColor: colors.surface, // Arkaplan rengi
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginBottom: 12,
    // Profil resmi için ek stiller eklenebilir
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingVertical: 10,
    marginTop: 5,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    // borderBottomWidth: 1, // Eğer altında başka bir bölüm yoksa bu kaldırılabilir
    // borderBottomColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 10, // İstatistikler arasına boşluk
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: colors.primary,
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginTop: 15,
  },
  editButtonText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});

export default ProfileHeader;
