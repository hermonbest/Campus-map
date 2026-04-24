import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { MapViewer } from '../../components/MapViewer';
import { getCachedMapImage, getMapUrl, cacheMapImage } from '../../lib/cache';

export default function Index() {
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMap();
  }, []);

  const loadMap = async () => {
    try {
      // Try to get cached map URL first
      const cachedUrl = await getCachedMapImage();
      
      if (cachedUrl) {
        setMapUrl(cachedUrl);
        setLoading(false);
      } else {
        // If no cached URL, fetch from Supabase and cache it
        const url = await getMapUrl();
        await cacheMapImage(url);
        setMapUrl(url);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading map:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading map...</Text>
      </View>
    );
  }

  if (!mapUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load map</Text>
      </View>
    );
  }

  return <MapViewer mapUrl={mapUrl} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});
