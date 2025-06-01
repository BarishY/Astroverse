import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TextInput, TouchableOpacity, Alert, Image, Modal, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import { getCollectionDetailsWithItems, updateCollectionDetails, toggleSaveToCollection, toggleLikeCollection, addCommentToCollection, toggleLikeCollectionComment, subscribeToCollectionInteractions } from '../../src/firebase/firestore';
import { useAuth } from '../../src/hooks/useAuth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../src/firebase/config';
import { deleteCollection } from '../../src/services/collectionService';

const PRIVACY_OPTIONS = [
  { value: 'private', label: 'Gizli' },
  { value: 'followers', label: 'Takipçilere Özel' },
  { value: 'public', label: 'Herkese Açık' },
];

const CollectionDetailScreen = () => {
  const { id: collectionId } = useLocalSearchParams();
  const { user } = useAuth();
  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [privacy, setPrivacy] = useState('private');
  const [saving, setSaving] = useState(false);
  const [canAccess, setCanAccess] = useState(true);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [interactions, setInteractions] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const router = useRouter();

  // isOwner kontrolünü burada yapıyoruz
  const isOwner = user && collection && collection.ownerId === user.uid;

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await getCollectionDetailsWithItems(collectionId);
        setCollection(data);
        setName(data.name);
        setPrivacy(data.privacy);

        // Koleksiyon sahibi her zaman erişebilir
        if (user?.uid === data.ownerId) {
          setCanAccess(true);
        } else {
          // Diğer kullanıcılar için gizlilik kontrolü
          if (data.privacy === 'private') {
            setCanAccess(false);
          } else if (data.privacy === 'followers') {
            // Koleksiyon sahibinin takipçilerini kontrol et
            const ownerRef = doc(db, 'users', data.ownerId);
            const ownerSnap = await getDoc(ownerRef);
            const ownerData = ownerSnap.data();
            
            // Kullanıcının email'ini kontrol et
            const checkFollower = async (followerId) => {
              const followerRef = doc(db, 'users', followerId);
              const followerSnap = await getDoc(followerRef);
              const followerData = followerSnap.data();
              return followerData?.email === user?.email;
            };

            const followerChecks = await Promise.all(
              (ownerData?.followers || []).map(checkFollower)
            );
            
            const isFollower = followerChecks.some(isFollower => isFollower);
            setCanAccess(isFollower);
          } else {
            // Herkese açık koleksiyonlar için erişim var
            setCanAccess(true);
          }
        }
      } catch (e) {
        console.error('Koleksiyon yükleme hatası:', e);
        Alert.alert('Hata', 'Koleksiyon yüklenemedi.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [collectionId, user]);

  // Etkileşimleri dinle
  useEffect(() => {
    if (!collectionId) return;
    
    const unsubscribe = subscribeToCollectionInteractions(collectionId, (data) => {
      setInteractions(data);
    });
    
    return () => unsubscribe();
  }, [collectionId]);

  const handleSave = async () => {
    if (!isOwner) return;
    if (!name.trim()) {
      Alert.alert('Hata', 'Koleksiyon adı boş olamaz.');
      return;
    }
    setSaving(true);
    try {
      await updateCollectionDetails(collectionId, { name: name.trim(), privacy });
      setCollection({ ...collection, name: name.trim(), privacy });
      setEditing(false);
      Alert.alert('Başarılı', 'Koleksiyon güncellendi.');
    } catch (e) {
      Alert.alert('Hata', 'Koleksiyon güncellenemedi.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCollection = () => {
    Alert.alert(
      "Koleksiyonu Sil",
      "Bu koleksiyonu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.",
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
              await deleteCollection(collectionId);
              Alert.alert("Başarılı", "Koleksiyon başarıyla silindi.");
              router.back();
            } catch (error) {
              Alert.alert("Hata", "Koleksiyon silinirken bir hata oluştu: " + error.message);
            }
          }
        }
      ]
    );
  };

  const handleDeleteItem = async (itemId) => {
    Alert.alert(
      "Öğeyi Sil",
      "Bu öğeyi koleksiyondan silmek istediğinizden emin misiniz?",
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
              setDeletingItemId(itemId);
              // Silinecek item'ın detaylarını bul
              const item = collection.itemsData.find(i => i.postId === itemId);
              await toggleSaveToCollection(
                collectionId,
                itemId,
                item?.title || '',
                item?.media_type || item?.mediaType || '',
                item?.url || ''
              );
              // Koleksiyonu yeniden yükle
              const data = await getCollectionDetailsWithItems(collectionId);
              setCollection(data);
              Alert.alert("Başarılı", "Öğe koleksiyondan silindi.");
            } catch (error) {
              Alert.alert("Hata", "Öğe silinirken bir hata oluştu: " + error.message);
            } finally {
              setDeletingItemId(null);
            }
          }
        }
      ]
    );
  };

  const handleLike = async () => {
    if (!user) {
      Alert.alert('Uyarı', 'Beğenmek için giriş yapmalısınız.');
      return;
    }
    try {
      await toggleLikeCollection(collectionId, user.uid);
    } catch (e) {
      console.error('Beğeni hatası:', e);
      Alert.alert('Hata', 'Beğeni işlemi başarısız.');
    }
  };

  const handleComment = async () => {
    if (!user) {
      Alert.alert('Uyarı', 'Yorum yapmak için giriş yapmalısınız.');
      return;
    }
    if (!commentText.trim()) {
      Alert.alert('Uyarı', 'Yorum boş olamaz.');
      return;
    }
    
    setSendingComment(true);
    try {
      await addCommentToCollection(collectionId, user.uid, user.displayName || 'Kullanıcı', commentText);
      setCommentText('');
    } catch (e) {
      console.error('Yorum hatası:', e);
      Alert.alert('Hata', 'Yorum gönderilemedi.');
    } finally {
      setSendingComment(false);
    }
  };

  const handleLikeComment = async (commentId) => {
    if (!user) {
      Alert.alert('Uyarı', 'Beğenmek için giriş yapmalısınız.');
      return;
    }
    try {
      await toggleLikeCollectionComment(collectionId, commentId, user.uid);
    } catch (e) {
      console.error('Yorum beğeni hatası:', e);
      Alert.alert('Hata', 'Beğeni işlemi başarısız.');
    }
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (!collection) {
    return <View style={styles.centered}><Text style={styles.errorText}>Koleksiyon bulunamadı.</Text></View>;
  }

  // Koleksiyon sahibi her zaman erişebilir
  if (!isOwner && !canAccess) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {collection.privacy === 'private' 
            ? 'Bu koleksiyon gizli.' 
            : 'Bu koleksiyon sadece takipçilere özel.'}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color={colors.primary} />
        </TouchableOpacity>
        {editing ? (
          <TextInput
            style={styles.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="Koleksiyon Adı"
            maxLength={40}
          />
        ) : (
          <Text style={styles.title}>{collection.name}</Text>
        )}
        {isOwner && !editing && (
          <View style={styles.headerButtons}>
            <TouchableOpacity style={styles.editButton} onPress={() => setEditing(true)}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteCollection}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>
      {isOwner && editing && (
        <View style={styles.privacyRow}>
          {PRIVACY_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.privacyOption, privacy === opt.value && styles.privacyOptionSelected]}
              onPress={() => setPrivacy(opt.value)}
            >
              <Text style={[styles.privacyText, privacy === opt.value && styles.privacyTextSelected]}>{opt.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      {isOwner && editing && (
        <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
          <Text style={styles.saveButtonText}>{saving ? 'Kaydediliyor...' : 'Kaydet'}</Text>
        </TouchableOpacity>
      )}

      {/* Etkileşim Bilgileri */}
      <View style={styles.interactionInfo}>
        <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
          <Ionicons 
            name={interactions?.likes?.includes(user?.uid) ? "heart" : "heart-outline"} 
            size={24} 
            color={interactions?.likes?.includes(user?.uid) ? colors.error : colors.textSecondary} 
          />
          <Text style={styles.interactionCount}>{interactions?.likeCount || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.commentCount}
          onPress={() => setShowCommentModal(true)}
        >
          <Ionicons name="chatbubble-outline" size={24} color={colors.textSecondary} />
          <Text style={styles.interactionCount}>{interactions?.commentCount || 0}</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={collection.itemsData || []}
        keyExtractor={(item, index) => `${item.postId}-${index}`}
        contentContainerStyle={styles.mediaSlider}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => {
          const imageUrl = item.hdurl || item.url;
          const isImage = item.media_type === 'image' || item.mediaType === 'image';
          const isVideo = item.media_type === 'video' || item.mediaType === 'video';
          return (
            <View style={styles.mediaSlide}>
              <TouchableOpacity 
                style={styles.mediaContainer}
                onPress={() => router.push({ pathname: `/post/${item.postId}`, params: { postData: JSON.stringify(item) } })}
                activeOpacity={0.9}
              >
                {isImage && imageUrl ? (
                  <Image 
                    source={{ uri: imageUrl }} 
                    style={styles.mediaImageFull} 
                    resizeMode="cover"
                  />
                ) : isVideo ? (
                  <View style={styles.videoContainerFull}>
                    <Ionicons name="videocam" size={40} color={colors.textSecondary} />
                  </View>
                ) : (
                  <View style={styles.videoContainerFull}>
                    <Ionicons name="image-outline" size={40} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>
                {isOwner && (
                  <TouchableOpacity
                    style={styles.deleteItemButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleDeleteItem(item.postId);
                    }}
                    disabled={deletingItemId === item.postId}
                  >
                    {deletingItemId === item.postId ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <Ionicons name="trash-outline" size={20} color={colors.error} />
                    )}
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Koleksiyonda hiç medya yok.</Text>
          </View>
        }
      />

      {/* Yorumlar ve Yorum Ekleme Alanı - FlatList'in ALTINDA SABİT */}
      <View style={styles.commentsSection}>
        <View style={styles.commentsHeaderRow}>
          <Text style={styles.commentsTitle}>Yorumlar</Text>
          <TouchableOpacity style={styles.addCommentButton} onPress={() => setShowCommentModal(true)}>
            <Ionicons name="chatbubble-ellipses-outline" size={22} color={colors.primary} />
            <Text style={styles.addCommentText}>Yorum Yap</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.commentsScroll} contentContainerStyle={{paddingBottom: 10}}>
          {interactions?.comments?.length > 0 ? (
            interactions.comments.slice().reverse().map((comment) => (
              <View key={comment.id} style={styles.commentItem}>
                <View style={styles.commentHeader}>
                  <Text style={styles.commentUsername}>{comment.username}</Text>
                  <TouchableOpacity 
                    style={styles.commentLikeButton}
                    onPress={() => handleLikeComment(comment.id)}
                  >
                    <Ionicons 
                      name={comment.likes?.includes(user?.uid) ? "heart" : "heart-outline"} 
                      size={16} 
                      color={comment.likes?.includes(user?.uid) ? colors.error : colors.textSecondary} 
                    />
                    <Text style={styles.commentLikeCount}>{comment.likeCount || 0}</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.commentText}>{comment.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>Henüz yorum yok.</Text>
          )}
        </ScrollView>
      </View>

      {/* Yorum Yapma Modalı */}
      <Modal
        visible={showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yorum Yap</Text>
              <TouchableOpacity onPress={() => setShowCommentModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.modalInput}
              placeholder="Yorumunuzu yazın..."
              value={commentText}
              onChangeText={setCommentText}
              multiline
            />
            <TouchableOpacity 
              style={[styles.modalSendButton, (!commentText.trim() || sendingComment) && styles.modalSendButtonDisabled]} 
              onPress={() => {
                handleComment();
                setShowCommentModal(false);
              }}
              disabled={!commentText.trim() || sendingComment}
            >
              {sendingComment ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.modalSendButtonText}>Gönder</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.feedBackground },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.feedBackground },
  errorText: { color: colors.error, fontSize: 16, textAlign: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 15, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  backButton: { marginRight: 10 },
  title: { fontSize: 20, fontWeight: 'bold', color: colors.text, flex: 1 },
  nameInput: { fontSize: 20, fontWeight: 'bold', color: colors.text, flex: 1, borderBottomWidth: 1, borderColor: colors.primary, paddingVertical: 2 },
  headerButtons: { flexDirection: 'row', alignItems: 'center' },
  editButton: { marginLeft: 10 },
  deleteButton: { marginLeft: 10 },
  privacyRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginVertical: 10 },
  privacyOption: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16, borderWidth: 1, borderColor: colors.border, marginHorizontal: 5 },
  privacyOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  privacyText: { color: colors.textSecondary, fontSize: 14 },
  privacyTextSelected: { color: colors.white, fontWeight: 'bold' },
  saveButton: { backgroundColor: colors.primary, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 30, marginBottom: 10 },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  mediaSlider: { 
    paddingVertical: 0,
  },
  mediaSlide: {
    width: 320,
    marginHorizontal: 4,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 4,
    shadowColor: colors.black,
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaContainer: {
    alignItems: 'center',
  },
  mediaImageFull: { 
    width: 280, 
    height: 280, 
    borderRadius: 10, 
    backgroundColor: colors.feedBackground 
  },
  videoContainerFull: { 
    width: 280, 
    height: 280, 
    borderRadius: 10, 
    backgroundColor: colors.feedBackground, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  itemTitle: {
    marginTop: 12,
    fontSize: 15,
    color: colors.text,
    textAlign: 'center',
    fontWeight: 'bold'
  },
  deleteItemButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 4,
    zIndex: 1
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  emptyText: {
    color: colors.textLight,
    fontSize: 15,
    textAlign: 'center'
  },
  interactionInfo: {
    flexDirection: 'row',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  commentCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  interactionCount: {
    marginLeft: 5,
    fontSize: 16,
    color: colors.textSecondary,
  },
  commentsSection: {
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 10,
    maxHeight: 250,
  },
  commentsScroll: {
    maxHeight: 220,
  },
  commentItem: {
    marginBottom: 15,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  commentUsername: {
    fontWeight: 'bold',
    color: colors.text,
  },
  commentLikeButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentLikeCount: {
    marginLeft: 5,
    fontSize: 14,
    color: colors.textSecondary,
  },
  commentText: {
    color: colors.text,
    lineHeight: 20,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  modalInput: {
    backgroundColor: colors.feedBackground,
    borderRadius: 10,
    padding: 15,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  modalSendButton: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalSendButtonDisabled: {
    opacity: 0.5,
  },
  modalSendButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  commentsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  addCommentText: {
    color: colors.primary,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
});

export default CollectionDetailScreen;
