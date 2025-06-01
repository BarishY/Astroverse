import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../src/constants/colors';
import { createCollection } from '../src/firebase/firestore';
import { useAuth } from '../src/hooks/useAuth';

export default function CreateCollectionScreen() {
  const [name, setName] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Hata', 'Koleksiyon adı boş olamaz');
      return;
    }

    setLoading(true);
    try {
      const collectionData = {
        name: name.trim(),
        privacy,
        ownerUsername: user.displayName || 'Bilinmeyen Kullanıcı',
        coverImage: null,
      };

      await createCollection(user.uid, collectionData);
      Alert.alert('Başarılı', 'Koleksiyon başarıyla oluşturuldu');
      router.back();
    } catch (error) {
      console.error('Koleksiyon oluşturma hatası:', error);
      Alert.alert('Hata', 'Koleksiyon oluşturulurken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Yeni Koleksiyon Oluştur</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Koleksiyon Adı"
        value={name}
        onChangeText={setName}
        maxLength={50}
      />

      <View style={styles.privacyContainer}>
        <Text style={styles.privacyTitle}>Gizlilik Ayarları</Text>
        <TouchableOpacity
          style={[styles.privacyOption, privacy === 'private' && styles.selectedPrivacy]}
          onPress={() => setPrivacy('private')}
        >
          <Text style={[styles.privacyText, privacy === 'private' && styles.selectedPrivacyText]}>
            Özel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.privacyOption, privacy === 'followers' && styles.selectedPrivacy]}
          onPress={() => setPrivacy('followers')}
        >
          <Text style={[styles.privacyText, privacy === 'followers' && styles.selectedPrivacyText]}>
            Takipçiler
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.privacyOption, privacy === 'public' && styles.selectedPrivacy]}
          onPress={() => setPrivacy('public')}
        >
          <Text style={[styles.privacyText, privacy === 'public' && styles.selectedPrivacyText]}>
            Herkese Açık
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.createButton, loading && styles.disabledButton]}
        onPress={handleCreate}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Oluştur</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    fontSize: 16,
  },
  privacyContainer: {
    marginBottom: 20,
  },
  privacyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  privacyOption: {
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 10,
  },
  selectedPrivacy: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  privacyText: {
    fontSize: 16,
    color: '#333',
  },
  selectedPrivacyText: {
    color: '#fff',
  },
  createButton: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
}); 