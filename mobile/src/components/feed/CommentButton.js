// src/components/feed/CommentButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, View, ActivityIndicator, Modal, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { listenToNasaApodPostInteractions, addCommentToNasaApodPost, getUserProfile } from '../../firebase/firestore';
import colors from '../../constants/colors';

const CommentButton = ({ postId, postData }) => {
    const router = useRouter();
    const { user } = useAuth();
    const [commentsCount, setCommentsCount] = useState(0); 
    const [loading, setLoading] = useState(true);
    const [modalVisible, setModalVisible] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!postId) {
            setLoading(false);
            return;
        }
        setLoading(true);
        const unsubscribe = listenToNasaApodPostInteractions(postId, (data) => {
            const currentComments = data?.comments || [];
            setCommentsCount(currentComments.length); 
            setLoading(false);
        });

        return () => {
            unsubscribe();
        };
    }, [postId]);

    const handlePress = () => {
        if (!user) {
            Alert.alert("Giriş Gerekli", "Yorum yapmak için lütfen giriş yapın.");
            return;
        }
        setModalVisible(true); 
    };

    const handleSubmit = async () => {
        if (!commentText.trim()) {
            Alert.alert("Hata", "Yorum boş olamaz.");
            return;
        }

        try {
            setSubmitting(true);
            const userProfile = await getUserProfile(user.uid);
            const username = userProfile?.username || user.email.split('@')[0];
            await addCommentToNasaApodPost(
                postId,
                user.uid,
                username,
                commentText,
                postData?.title,
                postData?.url,
                postData?.media_type
            );
            setCommentText('');
            setModalVisible(false);
        } catch (error) {
            console.error('Yorum ekleme hatası:', error);
            Alert.alert("Hata", "Yorum eklenirken bir sorun oluştu.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View> 
            <TouchableOpacity
                style={styles.button}
                onPress={handlePress} 
                disabled={!postId || loading}
            >
                <Ionicons
                    name="chatbubble-outline"
                    size={26}
                    color={colors.text}
                />
                {loading ? (
                    <ActivityIndicator size="small" color={colors.primary} style={styles.countText} />
                ) : (
                    <Text style={styles.countText}>{commentsCount}</Text>
                )}
            </TouchableOpacity>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalOverlay}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Yorum Yap</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>
                        
                        <TextInput
                            style={styles.input}
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
                                <Text style={styles.submitButtonText}>Yorum Yap</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    countText: {
        marginLeft: 6,
        fontSize: 14,
        color: colors.textSecondary,
        minWidth: 15,
        textAlign: 'left',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 34 : 20,
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
    input: {
        backgroundColor: colors.feedBackground,
        borderRadius: 8,
        padding: 12,
        color: colors.text,
        minHeight: 100,
        textAlignVertical: 'top',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: colors.border,
    },
    submitButton: {
        backgroundColor: colors.primary,
        padding: 15,
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
});

export default CommentButton;

