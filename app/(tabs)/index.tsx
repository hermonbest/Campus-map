import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MapViewer } from '../../components/MapViewer';
import { SearchModal } from '../../components/SearchModal';
import { getCachedMapImage, getMapUrl, cacheMapImage, getCachedItem, cacheData, checkVersion, clearCache, getCachedData, cacheAllData } from '../../lib/cache';
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

interface Node {
  id: string;
  x_pos: number;
  y_pos: number;
  is_building_entrance: boolean;
  building_id: string | null;
}

interface Edge {
  id: string;
  node_a: string;
  node_b: string;
  weight: number;
}

export default function Index() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [mapUrl, setMapUrl] = useState<string | null>(null);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{ serverVersion: number; cachedVersion: number } | null>(null);
  const [path, setPath] = useState<string[] | null>(null);
  const [destinationBuildingId, setDestinationBuildingId] = useState<string | null>(null);
  const [noPathMessage, setNoPathMessage] = useState<string | null>(null);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [buildingsWithOffices, setBuildingsWithOffices] = useState<Building[]>([]);

  useEffect(() => {
    loadData();
    checkForUpdates();
  }, []);

  // Handle path parameters from route screen
  useEffect(() => {
    if (params.showPath === 'true' && params.pathNodes) {
      try {
        const pathNodes = JSON.parse(params.pathNodes as string);
        // Only update if path is different
        const currentPathStr = path ? JSON.stringify(path) : '';
        const newPathStr = JSON.stringify(pathNodes);
        if (currentPathStr !== newPathStr) {
          setPath(pathNodes);
        }
      } catch (error) {
        console.error('Error parsing path nodes:', error);
      }
    }
    if (params.destinationBuildingId && params.destinationBuildingId !== destinationBuildingId) {
      setDestinationBuildingId(params.destinationBuildingId as string);
    }
    if (params.noPathMessage && params.noPathMessage !== noPathMessage) {
      setNoPathMessage(params.noPathMessage as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.showPath, params.pathNodes, params.destinationBuildingId, params.noPathMessage]);

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

      // Load buildings with offices for search
      const cachedBuildingsWithOffices = await getCachedItem('buildings_with_offices');
      
      if (cachedBuildingsWithOffices) {
        setBuildingsWithOffices(cachedBuildingsWithOffices);
      } else {
        const { data, error } = await supabase
          .from('buildings')
          .select('*, offices(*)')
          .eq('is_active', true);
        
        if (error) throw error;
        if (data) {
          setBuildingsWithOffices(data);
          await cacheData('buildings_with_offices', data);
        }
      }

      // Load nodes
      const cachedNodes = await getCachedItem('nodes');
      
      if (cachedNodes) {
        setNodes(cachedNodes);
      } else {
        const { data, error } = await supabase
          .from('nav_nodes')
          .select('*');
        
        if (error) throw error;
        if (data) {
          setNodes(data);
          await cacheData('nodes', data);
        }
      }

      // Load edges
      const cachedEdges = await getCachedItem('edges');
      
      if (cachedEdges) {
        setEdges(cachedEdges);
      } else {
        const { data, error } = await supabase
          .from('nav_edges')
          .select('*');
        
        if (error) throw error;
        if (data) {
          setEdges(data);
          await cacheData('edges', data);
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

  const handleClearRoute = () => {
    setPath(null);
    setDestinationBuildingId(null);
    setNoPathMessage(null);
    router.setParams({});
  };

  const handleSearchResultSelect = (building: Building, office?: any) => {
    if (office) {
      // If an office was selected, navigate to building details
      router.push(`/building-details?buildingId=${building.id}`);
    } else {
      // If a building was selected, navigate to building details
      router.push(`/building-details?buildingId=${building.id}`);
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
      <MapViewer 
        mapUrl={mapUrl} 
        buildings={buildings} 
        onBuildingPress={handleBuildingPress}
        path={path || undefined}
        nodes={nodes}
        destinationBuildingId={destinationBuildingId || undefined}
        noPathMessage={noPathMessage || undefined}
      />
      <View style={styles.refreshBar}>
        {versionInfo && versionInfo.serverVersion > versionInfo.cachedVersion && (
          <Text style={styles.updateAvailable}>Update available (v{versionInfo.serverVersion})</Text>
        )}
        <View style={styles.buttonRow}>
          <TouchableOpacity 
            style={styles.searchButton} 
            onPress={() => setSearchModalVisible(true)}
          >
            <Text style={styles.primaryButtonText}>Search</Text>
          </TouchableOpacity>
          {(path || destinationBuildingId) && (
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={handleClearRoute}
            >
              <Text style={styles.secondaryButtonText}>Clear</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.routeButton} 
            onPress={() => router.push('/route' as any)}
          >
            <Text style={styles.primaryButtonText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.secondaryButton} 
            onPress={handleRefresh}
            disabled={refreshing}
          >
            <Text style={styles.secondaryButtonText}>
              {refreshing ? 'Syncing...' : 'Sync'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        buildings={buildingsWithOffices}
        onSelect={handleSearchResultSelect}
      />
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
    backgroundColor: '#18181B',
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  updateAvailable: {
    color: '#A1A1AA',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  searchButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
  },
  secondaryButton: {
    backgroundColor: '#27272A',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
  },
  routeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 16,
    flex: 1,
  },
  primaryButtonText: {
    color: '#18181B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
