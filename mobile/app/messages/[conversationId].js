import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { subscribeToMessages, sendMessage } from '../../src/firebase/firestore';
import colors from '../../src/constants/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ChatScreen = () => {
  const { conversationId } = useLocalSearchParams();
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const flatListRef = useRef();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Karşı tarafın userId'sini bul
  const otherUserId = conversationId?.split('_').find(id => id !== user?.uid);

  useEffect(() => {
    if (!conversationId) return;
    const unsubscribe = subscribeToMessages(conversationId, setMessages);
    return () => unsubscribe();
  }, [conversationId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      await sendMessage(
        conversationId,
        { uid: user.uid, username: userData?.username || user.displayName },
        { uid: otherUserId },
        input.trim()
      );
      setInput('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (e) {
      // Hata yönetimi
    } finally {
      setSending(false);
    }
  };

  const renderItem = ({ item }) => {
    const isMe = item.from === user?.uid;
    return (
      <View style={[styles.messageRow, isMe ? styles.messageRowMe : styles.messageRowOther]}>
        <View style={[styles.messageBubble, isMe ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={styles.messageText}>{item.text}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.feedBackground }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 10}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Sohbet</Text>
        </View>
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
        <View style={[styles.inputRow, { paddingBottom: insets.bottom }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Mesaj yaz..."
            editable={!sending}
          />
          <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={sending || !input.trim()}>
            <Ionicons name="send" size={22} color={colors.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.feedBackground },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 32, paddingBottom: 16, paddingHorizontal: 12, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginLeft: 10 },
  messagesList: { padding: 18, paddingBottom: 40, paddingTop: 24 },
  messageRow: { flexDirection: 'row', marginBottom: 8 },
  messageRowMe: { justifyContent: 'flex-end' },
  messageRowOther: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '75%', padding: 10, borderRadius: 16 },
  bubbleMe: { backgroundColor: colors.primary, borderTopRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.surface, borderTopLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  messageText: { color: colors.text, fontSize: 15 },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.feedBackground, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 8, fontSize: 15, marginRight: 8 },
  sendButton: { backgroundColor: colors.primary, borderRadius: 20, padding: 10 },
});

export default ChatScreen; 