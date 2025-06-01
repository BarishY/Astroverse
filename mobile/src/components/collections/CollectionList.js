import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '../../constants/colors';
import { getUserCollections } from '../../services/collectionService';
import { useAuth } from '../../hooks/useAuth';

const CollectionList = () => {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    loadCollections();
  }, [user]);

  const loadCollections = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const userCollections = await getUserCollections(user.uid);
      setCollections(userCollections);
    } catch (err) {
      console.error('Koleksiyonlar yüklenirken hata:', err);
      setError('Koleksiyonlar yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const renderCollection = ({ item }) => (
    <TouchableOpacity 
      style={styles.collectionItem}
      onPress={() => router.push(`/collection/${item.id}`)}
    >
      <View style={styles.collectionIcon}>
        <Ionicons name="images-outline" size={24} color={colors.primary} />
      </View>
      <View style={styles.collectionInfo}>
        <Text style={styles.collectionName}>{item.name}</Text>
        <Text style={styles.collectionDescription} numberOfLines={2}>
          {item.description || 'Açıklama yok'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadCollections}>
          <Text style={styles.retryButtonText}>Tekrar Dene</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (collections.length === 0) {
    return (
      <View style={styles.centered}>
        <Ionicons name="images-outline" size={60} color={colors.textLight} />
        <Text style={styles.emptyText}>Henüz koleksiyon oluşturmadınız</Text>
        <TouchableOpacity 
          style={styles.createButton}
          onPress={() => router.push('/collection/create')}
        >
          <Text style={styles.createButtonText}>Koleksiyon Oluştur</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <FlatList
      data={collections}
      renderItem={renderCollection}
      keyExtractor={item => item.id}
      contentContainerStyle={styles.listContainer}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    padding: 10,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  collectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.feedBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  collectionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorText: {
    color: colors.error,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 15,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CollectionList; 