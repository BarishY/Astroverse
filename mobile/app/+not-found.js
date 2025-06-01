// app/+not-found.js
import React from 'react';
import { Stack, Link } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../src/constants/colors'; // Renklerimiz

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sayfa Bulunamadı!' }} />
      <View style={styles.container}>
        <Ionicons name="planet-outline" size={100} color={colors.textLight} />
        <Text style={styles.title}>Oops! Kayboldun Galiba.</Text>
        <Text style={styles.message}>
          Aradığın sayfa mevcut değil veya taşınmış olabilir.
        </Text>
        <Link href="/(tabs)" asChild>
          {/* asChild prop'u Link'in stilini ve davranışını çocuğuna devretmesini sağlar */}
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkButtonText}>Ana Sayfaya Dön</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    color: colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  linkButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  linkButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
