// src/components/general/LoadingIndicator.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import colors from '../../constants/colors'; // Renklerimiz

const LoadingIndicator = ({
  size = 'large', // 'small' veya 'large'
  color = colors.primary,
  style, // Dışarıdan verilecek ek container stilleri
  text, // Yükleme göstergesinin altında gösterilecek metin
  textStyle, // Metin için ek stil
  fullScreen = false, // Tam ekran kaplayıp kaplamayacağı
}) => {
  if (fullScreen) {
    return (
      <View style={[styles.fullScreenContainer, style]}>
        <ActivityIndicator size={size} color={color} />
        {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={[styles.text, textStyle]}>{text}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  fullScreenContainer: {
    flex: 1, // Tam ekran kaplaması için
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // Hafif şeffaf arkaplan
    position: 'absolute', // Diğer içeriklerin üzerine gelmesi için (opsiyonel)
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10, // Diğer elemanların üzerinde olması için (opsiyonel)
  },
  text: {
    marginTop: 10,
    fontSize: 14,
    color: colors.textSecondary,
  },
});

export default LoadingIndicator;
