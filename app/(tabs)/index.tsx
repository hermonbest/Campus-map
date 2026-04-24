import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MapViewer } from '../../components/MapViewer';
import { getCachedMapImage, getMapUrl, cacheMapImage, getCachedItem, cacheData, checkVersion, clearCache } from '../../lib/cache';
import { supabase } from '../../lib/supabase';

interface Building {
  id: string;
  name: string;
  description: string | null;
  x_pos: number;
  y_pos: number;
  color: string;
  icon_type: string;
  offices?: Array<{
    id: string;
    room_number: string;
    staff_name: string;
    floor: number | null;
  }>;
}

export default function Index() {
  const router = useRouter();
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{ serverVersion: number; cachedVersion: number } | null>(null);

  useEffect(() => {
    loadData();
    checkForUpdates();
  }, []);

  const loadData = async () => {
    try {
      // Load map
      const cachedUrl = await getCachedMapImage();
      
      if (cachedUrl) {
        setMapUrl(cachedUrl);
      } else {
        const url = await getMapUrl();
        await cacheMapImage(url);
        setMapUrl(url);
      }

      // Load buildings
      const cachedBuildings = await getCachedItem('buildings');
      
      if (cachedBuildings) {
        setBuildings(cachedBuildings);
      } else {
        const { data, error } = await supabase
          .from('buildings')
          .select('*')
          .eq('is_active', true);
        
        if (error) throw error;
        if (data) {
          setBuildings(data);
          await cacheData('buildings', data);
        }
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleBuildingPress = (building: Building) => {
    router.push(`/building-details?buildingId=${building.id}`);
  };

  const checkForUpdates = async () => {
    try {
      const versionCheck = await checkVersion();
      setVersionInfo({
        serverVersion: versionCheck.serverVersion,
        cachedVersion: versionCheck.cachedVersion,
      });
    } catch (error) {
      console.error('Error checking version:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      
      // Clear cache and reload data
      await clearCache();
      await loadData();
      await checkForUpdates();
      
      setRefreshing(false);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setRefreshing(false);
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

  return (
    <View style={styles.container}>
      <MapViewer mapUrl={mapUrl} buildings={buildings} onBuildingPress={handleBuildingPress} />
      <View style={styles.refreshBar}>
        {versionInfo && versionInfo.serverVersion > versionInfo.cachedVersion && (
          <Text style={styles.updateAvailable}>Update available (v{versionInfo.serverVersion})</Text>
        )}
        <TouchableOpacity 
          style={styles.refreshButton} 
          onPress={handleRefresh}
          disabled={refreshing}
        >
          <Text style={styles.refreshButtonText}>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
  refreshBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  updateAvailable: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
  },
  refreshButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
