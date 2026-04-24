import React, { useRef, useEffect } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, StatusBar, Platform, ScrollView } from 'react-native';

interface MapViewerProps {
  mapUrl: string;
}

export function MapViewer({ mapUrl }: MapViewerProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  
  const androidStatusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const availableHeight = SCREEN_HEIGHT - androidStatusBarHeight;

  // Calculate dimensions to force height fill
  const imageAspectRatio = 1320 / 744;
  const imageHeight = availableHeight;
  const imageWidth = imageHeight * imageAspectRatio;

  // Scroll to middle on mount
  useEffect(() => {
    const middlePosition = (imageWidth - SCREEN_WIDTH) / 2;
    scrollViewRef.current?.scrollTo({ x: middlePosition, y: 0, animated: false });
  }, [imageWidth, SCREEN_WIDTH]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
      >
        <Image
          source={{ uri: mapUrl }}
          style={{
            width: imageWidth,
            height: imageHeight,
          }}
          resizeMode="cover"
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    height: '100%',
  },
});