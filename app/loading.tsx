import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { cacheMapImage, cacheAllData, getMapUrl, cacheMapImageFile, getCachedData } from '../lib/cache';

export default function LoadingScreen() {
  const router = useRouter();
  const [status, setStatus] = useState('Initializing...');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setStatus('Fetching map URL...');
      setProgress(10);
      
      const mapUrl = await getMapUrl();
      
      setStatus('Caching map image...');
      setProgress(30);
      
      await cacheMapImage(mapUrl);
      
      setStatus('Downloading campus data...');
      setProgress(50);
      
      const data = await cacheAllData();
      
      setStatus('Caching images...');
      setProgress(70);
      
      // Cache images in background
      const { cacheBuildingImages, cacheNoticeImages } = await import('../lib/cache');
      await Promise.all([
        cacheMapImageFile(mapUrl).catch(err => console.error('[LOADING] Failed to cache map image:', err)),
        cacheBuildingImages(data.buildings).catch(err => console.error('[LOADING] Failed to cache building images:', err)),
        cacheNoticeImages(data.notices).catch(err => console.error('[LOADING] Failed to cache notice images:', err)),
      ]);
      
      setStatus('Loading complete!');
      setProgress(100);
      
      // Navigate to main screen after a short delay
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
      
    } catch (error) {
      console.error('Error loading initial data:', error);
      setStatus('Error loading data. Please check your connection.');
      setProgress(0);
      
      // Still navigate after a delay to allow user to see the error
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 3000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.status}>{status}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%` }]} />
        </View>
        <Text style={styles.progressText}>{progress}%</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
  },
  status: {
    marginTop: 20,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginTop: 20,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
  },
  progressText: {
    marginTop: 10,
    fontSize: 14,
    color: '#888',
  },
});
