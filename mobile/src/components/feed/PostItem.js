// src/components/feed/PostItem.js
import React, { useState, useEffect } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router'; // Expo Router navigasyonu için
import { Ionicons } from '@expo/vector-icons'; // İkonlar için
import VideoPlayer from './VideoPlayer'; // Aynı klasördeki VideoPlayer
import LikeButton from './LikeButton'; // Aynı klasördeki LikeButton
import CommentButton from './CommentButton'; // Aynı klasördeki CommentButton
import SaveButton from './SaveButton'; // Aynı klasördeki SaveButton
import colors from '../../constants/colors'; // Renklerimiz
import { timeAgo } from '../../utils/dateHelpers'; // Tarih formatlama yardımcısı
import { listenToNasaApodPostInteractions } from '../../firebase/firestore';

const { width } = Dimensions.get('window');

const PostItem = ({ post }) => {
    const router = useRouter();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!post?.date) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsubscribe = listenToNasaApodPostInteractions(post.date, (data) => {
            const currentComments = data?.comments || [];
            const sortedComments = [...currentComments].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            setComments(sortedComments);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [post?.date]);

    if (!post || !post.date) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Gönderi verisi yüklenemedi.</Text>
            </View>
        );
    }

    const handlePress = () => {
        const postDataString = JSON.stringify(post);
        router.push({ pathname: `/post/${post.date}`, params: { postData: postDataString } });
    };

    const imageUrl = post.hdurl || post.url;
    const lastTwoComments = comments.slice(0, 2);
    const hasMoreComments = comments.length > 2;

    const handleViewAllComments = () => {
        const postDataString = JSON.stringify(post);
        router.push({ pathname: `/post/${post.date}`, params: { postData: postDataString } });
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.avatarPlaceholder}>
                    <Ionicons name="planet-outline" size={24} color={colors.primary} />
                </View>
                <View>
                    <Text style={styles.username}>NASA APOD</Text>
                    <Text style={styles.postDate}>{timeAgo(post.date)}</Text>
                </View>
            </View>

            {/* Medya */}
            <TouchableOpacity onPress={handlePress} activeOpacity={0.8}>
                {post.media_type === 'image' && imageUrl ? (
                    <Image source={{ uri: imageUrl }} style={styles.media} resizeMode="cover" />
                ) : post.media_type === 'video' && post.url ? (
                    <VideoPlayer videoUrl={post.url} thumbnailUrl={post.thumbnail_url} style={styles.media} />
                ) : (
                    <View style={[styles.media, styles.placeholderMedia]}>
                        <Ionicons name="image-outline" size={50} color={colors.textLight} />
                        <Text style={styles.placeholderText}>Medya yüklenemedi</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* İçerik */}
            <View style={styles.content}>
                <Text style={styles.title} onPress={handlePress}>{post.title}</Text>
                {post.explanation && (
                    <Text style={styles.explanation} numberOfLines={3} onPress={handlePress}>
                        {post.explanation}
                    </Text>
                )}
            </View>

            {/* Butonlar üstte */}
            <View style={styles.actionsContainer}>
                <LikeButton postId={post.date} postTitle={post.title} />
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <CommentButton postId={post.date} postData={post} />
                    <SaveButton post={post} />
                </View>
            </View>

            {/* Yorumlar butonların altında */}
            <View style={styles.commentsContainer}>
                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                ) : lastTwoComments.length === 0 ? null : (
                    lastTwoComments.map((comment, index) => (
                        <View key={index} style={styles.commentItem}>
                            <Text style={styles.commentText}>
                                <Text style={styles.commentUsername}>{comment.username}</Text>
                                {' '}{comment.text}
                            </Text>
                        </View>
                    ))
                )}
                {hasMoreComments && !loading && (
                    <TouchableOpacity onPress={handleViewAllComments} style={styles.viewAllButton}>
                        <Text style={styles.viewAllText}>{comments.length - 2} yorum daha gör</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        marginVertical: 8,
        marginHorizontal: 10,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
        elevation: 4,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingVertical: 12,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.feedBackground,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    username: {
        fontWeight: '600',
        fontSize: 15,
        color: colors.text,
    },
    postDate: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
    },
    media: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: colors.border,
    },
    placeholderMedia: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.feedBackground,
    },
    placeholderText: {
        marginTop: 8,
        color: colors.textLight,
        fontSize: 13,
    },
    content: {
        paddingHorizontal: 15,
        paddingTop: 12,
        paddingBottom: 10,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 6,
        color: colors.text,
        lineHeight: 22,
    },
    explanation: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    actionsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 7,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        marginTop: 10,
    },
    commentsContainer: {
        paddingHorizontal: 15,
        paddingBottom: 10,
        paddingTop: 0,
    },
    commentItem: {
        marginBottom: 4,
    },
    commentText: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },
    commentUsername: {
        fontWeight: '600',
        color: colors.text,
    },
    viewAllButton: {
        marginTop: 4,
    },
    viewAllText: {
        fontSize: 13,
        color: colors.primary,
        fontWeight: '500',
    },
    errorText: {
        padding: 20,
        textAlign: 'center',
        color: colors.error,
        fontSize: 15,
    }
});

export default PostItem;
