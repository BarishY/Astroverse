import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../src/constants/colors';
import VideoPlayer from '../../src/components/feed/VideoPlayer';
import { useAuth } from '../../src/hooks/useAuth';
import { listenToNasaApodPostInteractions, addCommentToNasaApodPost } from '../../src/firebase/firestore';
import { timeAgo } from '../../src/utils/dateHelpers';
import { extractKeywordsWithGemini, findSimilarApodImagesFromApi } from '../../src/services/gemini';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const PostDetailScreen = () => {
  const { postData } = useLocalSearchParams();
  const post = postData ? JSON.parse(postData) : null;
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [similarImages, setSimilarImages] = useState([]);
  const [similarLoading, setSimilarLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!post?.date) {
      setLoading(false);
      return;
    }

    const unsubscribe = listenToNasaApodPostInteractions(post.date, (data) => {
      const currentComments = data?.comments || [];
      // Yorumları tarihe göre sırala (en yeniden en eskiye)
      const sortedComments = [...currentComments].sort((a, b) => 
        b.createdAt.toDate() - a.createdAt.toDate()
      );
      setComments(sortedComments);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [post?.date]);

  useEffect(() => {
    const fetchSimilar = async () => {
      if (!post?.title && !post?.explanation) return;
      setSimilarLoading(true);
      try {
        const keywords = await extractKeywordsWithGemini(post.title || '', post.explanation || '');
        console.log('Gemini anahtar kelimeler:', keywords);
        const similars = await findSimilarApodImagesFromApi(keywords, post.date);
        console.log('Benzer görseller:', similars);
        setSimilarImages(similars);
      } catch (e) {
        setSimilarImages([]);
      } finally {
        setSimilarLoading(false);
      }
    };
    fetchSimilar();
  }, [post?.title, post?.explanation, post?.date]);

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert("Giriş Gerekli", "Yorum yapmak için lütfen giriş yapın.");
      return;
    }

    if (!commentText.trim()) {
      Alert.alert("Hata", "Yorum boş olamaz.");
      return;
    }

    try {
      setSubmitting(true);
      await addCommentToNasaApodPost(
        post.date,
        user.uid,
        user.email.split('@')[0],
        commentText,
        post.title,
        post.url,
        post.media_type
      );
      setCommentText('');
    } catch (error) {
      console.error('Yorum ekleme hatası:', error);
      Alert.alert("Hata", "Yorum eklenirken bir sorun oluştu.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Gönderi bulunamadı.</Text>
      </View>
    );
  }

  const imageUrl = post.hdurl || post.url;

  return (
    <ScrollView style={styles.container}>
      {/* Başlık ve Tarih */}
      <View style={styles.header}>
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="planet-outline" size={24} color={colors.primary} />
        </View>
        <View>
          <Text style={styles.username}>NASA APOD</Text>
          <Text style={styles.postDate}>{post.date}</Text>
        </View>
      </View>

      {/* Medya */}
      {post.media_type === 'image' && imageUrl ? (
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.media} 
          resizeMode="contain"
        />
      ) : post.media_type === 'video' && post.url ? (
        <View style={styles.videoContainer}>
          <VideoPlayer 
            videoUrl={post.url} 
            thumbnailUrl={post.thumbnail_url} 
            style={styles.video}
          />
        </View>
      ) : (
        <View style={[styles.media, styles.placeholderMedia]}>
          <Ionicons name="image-outline" size={50} color={colors.textLight} />
          <Text style={styles.placeholderText}>Medya yüklenemedi</Text>
        </View>
      )}

      {/* İçerik */}
      <View style={styles.content}>
        <Text style={styles.title}>{post.title}</Text>
        {post.explanation && (
          <Text style={styles.explanation}>{post.explanation}</Text>
        )}
        {post.copyright && (
          <Text style={styles.copyright}>© {post.copyright}</Text>
        )}
      </View>

      {/* Benzer Görseller */}
      <View style={styles.similarSection}>
        <Text style={styles.similarTitle}>Bunları da beğenebilirsin</Text>
        {similarLoading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 16 }} />
        ) : similarImages.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.similarList}>
            {similarImages.map((img) => (
              <TouchableOpacity
                key={img.date}
                style={styles.similarItem}
                onPress={() => router.push({ pathname: `/post/${img.date}`, params: { postData: JSON.stringify(img) } })}
                activeOpacity={0.85}
              >
                <Image source={{ uri: img.url }} style={styles.similarImage} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <Text style={styles.noSimilarText}>Şu an için benzer görsel bulunamadı</Text>
        )}
      </View>

      {/* Yorumlar Bölümü */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Yorumlar</Text>
        
        {/* Yorum Yazma Alanı */}
        <View style={styles.commentInputContainer}>
          <TextInput
            style={styles.commentInput}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Yorumunuzu yazın..."
            placeholderTextColor={colors.textLight}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.submitButtonText}>Gönder</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Yorumlar Listesi */}
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
        ) : comments.length === 0 ? (
          <Text style={styles.noCommentsText}>Henüz yorum yapılmamış</Text>
        ) : (
          comments.map((comment, index) => (
            <View key={index} style={styles.commentItem}>
              <Text style={styles.commentUsername}>{comment.username}</Text>
              <Text style={styles.commentText}>{comment.text}</Text>
              <Text style={styles.commentTime}>{timeAgo(comment.createdAt.toDate())}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: colors.surface,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.feedBackground,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: colors.text,
  },
  postDate: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  media: {
    width: '100%',
    height: width * 0.75,
    backgroundColor: colors.feedBackground,
  },
  videoContainer: {
    width: '100%',
    height: width * 0.5625, // 16:9 aspect ratio
    backgroundColor: colors.black,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholderMedia: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    color: colors.textLight,
  },
  content: {
    padding: 15,
    backgroundColor: colors.surface,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: colors.text,
  },
  explanation: {
    fontSize: 16,
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 10,
  },
  copyright: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
  },
  errorText: {
    padding: 20,
    textAlign: 'center',
    color: colors.error,
    fontSize: 16,
  },
  commentsSection: {
    padding: 15,
    backgroundColor: colors.surface,
    marginTop: 10,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  commentInputContainer: {
    marginBottom: 20,
  },
  commentInput: {
    backgroundColor: colors.feedBackground,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingIndicator: {
    marginVertical: 20,
  },
  noCommentsText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  commentItem: {
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  commentUsername: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  commentText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  commentTime: {
    fontSize: 12,
    color: colors.textLight,
  },
  similarSection: {
    marginTop: 18,
    marginBottom: 8,
    paddingHorizontal: 15,
  },
  similarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  similarList: {
    flexDirection: 'row',
    gap: 10,
  },
  similarItem: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    marginRight: 10,
    backgroundColor: colors.feedBackground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  similarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  noSimilarText: {
    fontSize: 14,
    color: colors.textLight,
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default PostDetailScreen;
