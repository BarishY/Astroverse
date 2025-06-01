// src/components/feed/VideoPlayer.js
import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import colors from '../../constants/colors';

const VideoPlayer = ({ videoUrl, thumbnailUrl, style }) => {
  // YouTube embed URL'sini düzenle
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    // YouTube URL'sini kontrol et
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    // YouTube video ID'sini çıkar
    const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i)?.[1];
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}?rel=0&showinfo=0`;
    }
    
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  if (!embedUrl) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: colors.black,
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.black,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default VideoPlayer;
