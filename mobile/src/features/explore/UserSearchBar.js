import React, { useState, useEffect } from 'react';
import { View, TextInput, FlatList, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import colors from '../../constants/colors';
import { searchUsers } from '../../firebase/firestore';

const UserSearchBar = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    searchUsers(query)
      .then(users => setResults(users))
      .catch(() => setError('Arama sırasında hata oluştu.'))
      .finally(() => setLoading(false));
  }, [query]);

  const handleUserPress = (userId) => {
    router.push(`/user/${userId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Ionicons name="search" size={20} color={colors.textLight} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.input}
          placeholder="Kullanıcı ara..."
          placeholderTextColor={colors.textLight}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>
      {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 10 }} />}
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={results}
        keyExtractor={item => item.uid}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.userItem} onPress={() => handleUserPress(item.uid)}>
            <Ionicons name="person-circle-outline" size={32} color={colors.primary} style={{ marginRight: 10 }} />
            <View>
              <Text style={styles.username}>{item.username}</Text>
            </View>
          </TouchableOpacity>
        )}
        style={{ marginTop: 10 }}
        ListEmptyComponent={query.length > 1 && !loading ? <Text style={styles.emptyText}>Kullanıcı bulunamadı.</Text> : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.feedBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 4,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  errorText: {
    color: colors.error,
    marginTop: 10,
  },
  emptyText: {
    color: colors.textLight,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default UserSearchBar; 