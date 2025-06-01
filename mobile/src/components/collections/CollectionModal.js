// src/components/collections/CollectionModal.js
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth'; // Auth hook'umuz
import { getUserCollections, toggleSaveToCollection } from '../../firebase/firestore'; // Firestore fonksiyonlarımız
import { createCollection, deleteCollection } from '../../services/collectionService';
import colors from '../../constants/colors'; // Renklerimiz

const CollectionModal = ({ isVisible, onClose, post }) => {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [loadingCollections, setLoadingCollections] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [savingToCollectionId, setSavingToCollectionId] = useState(null); // Hangi koleksiyona kaydediliyor
  const [deletingCollectionId, setDeletingCollectionId] = useState(null);

  useEffect(() => {
    if (isVisible && user) {
      setLoadingCollections(true);
      getUserCollections(user.uid, user.uid)
        .then((fetchedCollections) => {
          setCollections(fetchedCollections || []);
        })
        .catch(err => {
          console.error("Koleksiyonlar yüklenirken hata:", err);
          Alert.alert("Hata", "Koleksiyonlarınız yüklenirken bir sorun oluştu.");
        })
        .finally(() => setLoadingCollections(false));
    } else if (!isVisible) {
      // Modal kapandığında state'leri sıfırla
      setCollections([]);
      setNewCollectionName('');
      setIsCreating(false);
      setSavingToCollectionId(null);
      setDeletingCollectionId(null);
    }
  }, [isVisible, user]);

  const handleCreateAndSaveCollection = async () => {
    if (!newCollectionName.trim()) {
      Alert.alert("Geçersiz Ad", "Koleksiyon adı boş olamaz.");
      return;
    }
    if (!post || !post.date) {
        Alert.alert("Hata", "Kaydedilecek gönderi bilgisi eksik.");
        return;
    }
    setIsCreating(true);
    try {
      const newCol = await createCollection(user.uid, {
        name: newCollectionName.trim(),
        privacy: 'private'
      });
      // Yeni koleksiyonu listeye hemen ekle (optimistic)
      setCollections(prev => [newCol, ...prev]); // Başa ekle
      setNewCollectionName('');
      // Yeni oluşturulan koleksiyona gönderiyi kaydet
      await handleSaveToSpecificCollection(newCol.id);
    } catch (error) {
      Alert.alert("Oluşturma Hatası", "Koleksiyon oluşturulurken bir hata oluştu: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveToSpecificCollection = async (collectionId) => {
    if (!post || !collectionId || !post.date || !post.title || !post.media_type || !post.url) {
        Alert.alert("Hata", "Kaydedilecek gönderi veya koleksiyon bilgileri eksik.");
        return;
    }
    setSavingToCollectionId(collectionId); // Hangi koleksiyona kaydedildiğini işaretle
    try {
      await toggleSaveToCollection(
          collectionId,
          post.date, // postId
          post.title,
          post.media_type,
          post.url
        );
      // TODO: Kullanıcıya hangi koleksiyona eklendiğini/kaldırıldığını daha net belirt.
      // Şimdilik genel bir mesaj ve modalı kapatıyoruz.
      // Belki de modalı kapatmayıp, o satırda bir "eklendi" ikonu gösterebiliriz.
      Alert.alert("Başarılı", `'${post.title}' koleksiyona eklendi/kaldırıldı.`);
      onClose();
    } catch (error) {
      Alert.alert("Kaydetme Hatası", "Gönderi koleksiyona kaydedilirken bir sorun oluştu: " + error.message);
    } finally {
        setSavingToCollectionId(null);
    }
  };

  const handleDeleteCollection = async (collectionId, event) => {
    event.stopPropagation(); // Butona tıklandığında koleksiyona kaydetme işlemini engelle
    Alert.alert(
      "Koleksiyonu Sil",
      "Bu koleksiyonu silmek istediğinizden emin misiniz?",
      [
        {
          text: "İptal",
          style: "cancel"
        },
        {
          text: "Sil",
          style: "destructive",
          onPress: async () => {
            try {
              setDeletingCollectionId(collectionId);
              await deleteCollection(collectionId);
              setCollections(prev => prev.filter(col => col.id !== collectionId));
              Alert.alert("Başarılı", "Koleksiyon başarıyla silindi.");
            } catch (error) {
              Alert.alert("Hata", "Koleksiyon silinirken bir hata oluştu: " + error.message);
            } finally {
              setDeletingCollectionId(null);
            }
          }
        }
      ]
    );
  };

  const renderCollectionItem = ({ item }) => (
    <TouchableOpacity
      style={styles.collectionRow}
      onPress={() => handleSaveToSpecificCollection(item.id)}
      disabled={savingToCollectionId === item.id || deletingCollectionId === item.id}
    >
      <Ionicons name="albums-outline" size={24} color={colors.secondary} style={styles.collectionIcon} />
      <Text style={styles.collectionName}>{item.name}</Text>
      {savingToCollectionId === item.id && <ActivityIndicator size="small" color={colors.primary} />}
      {deletingCollectionId === item.id ? (
        <ActivityIndicator size="small" color={colors.error} />
      ) : (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => handleDeleteCollection(item.id, e)}
        >
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Ionicons name="close-circle-outline" size={32} color={colors.textSecondary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Koleksiyona Kaydet</Text>

          {loadingCollections ? (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }}/>
          ) : (
            <>
              <Text style={styles.subTitle}>Mevcut Koleksiyonlarım:</Text>
              <FlatList
                data={collections}
                renderItem={renderCollectionItem}
                keyExtractor={(item) => item.id.toString()} // ID'nin string olduğundan emin ol
                style={styles.list}
                ListEmptyComponent={<Text style={styles.emptyListText}>Henüz koleksiyonunuz yok. Aşağıdan oluşturabilirsiniz.</Text>}
              />

              <View style={styles.separator} />

              <Text style={styles.subTitle}>Yeni Koleksiyon Oluştur:</Text>
              <TextInput
                style={styles.input}
                placeholder="Yeni Koleksiyon Adı"
                value={newCollectionName}
                onChangeText={setNewCollectionName}
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity
                style={[styles.createButton, (isCreating || !newCollectionName.trim()) && styles.disabledButton]}
                onPress={handleCreateAndSaveCollection}
                disabled={isCreating || !newCollectionName.trim()}
              >
                {isCreating ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Text style={styles.createButtonText}>Oluştur ve Kaydet</Text>
                )}
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end', // Modalı alta yasla
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContent: {
    backgroundColor: colors.background,
    paddingTop: 20, // Kapatma butonu için boşluk
    paddingBottom: Platform.OS === 'ios' ? 30 : 20, // Klavye için altta boşluk
    paddingHorizontal: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%', // Ekranın çoğunu kaplamasın
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    zIndex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: colors.text,
  },
  subTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
    color: colors.text,
  },
  list: {
    maxHeight: Platform.OS === 'ios' ? 180 : 150, // iOS için biraz daha fazla yer
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 15,
  },
  emptyListText: {
    textAlign: 'center',
    paddingVertical: 20,
    color: colors.textSecondary,
  },
  collectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  collectionIcon: {
    marginRight: 12,
  },
  collectionName: {
    fontSize: 16,
    color: colors.text,
    flex: 1, // Uzun isimler için
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: colors.white, // Input arkaplanı
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: colors.textLight, // Devre dışı buton rengi
  },
  createButtonText: {
    color: colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
});

export default CollectionModal;
