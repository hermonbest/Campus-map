import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
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
      <View style={[styles.floatingControls, { top: insets.top + 10 }]}>
        <TouchableOpacity 
          style={styles.searchBarContainer} 
          onPress={() => setSearchModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color="#A1A1AA" style={{ marginRight: 12 }} />
          <Text style={styles.searchBarText}>Search campus, offices...</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={[styles.floatingRefreshButton, { bottom: insets.bottom + 20 }]} 
        onPress={handleRefresh}
        disabled={refreshing}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color="#FFFFFF" />
        ) : (
          <Ionicons name="refresh" size={24} color="#FFFFFF" />
        )}
      </TouchableOpacity>

      {path && (
        <TouchableOpacity 
          style={[styles.clearRouteButton, { bottom: insets.bottom + 80 }]} 
          onPress={handleClearRoute}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}
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
  floatingControls: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 100,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(24, 24, 27, 0.75)',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  searchBarText: {
    color: '#A1A1AA',
    fontSize: 15,
    fontWeight: '500',
  },
  floatingRefreshButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(24, 24, 27, 0.85)',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  clearRouteButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
});
