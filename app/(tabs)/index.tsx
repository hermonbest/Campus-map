import React, { useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MapViewer } from '../../components/MapViewer';
import { SearchModal } from '../../components/SearchModal';
import DestinationPickerModal, { RouteResult } from '../../components/DestinationPickerModal';
import BuildingCard from '../../components/BuildingCard';
import { getCachedMapImage, getMapUrl, cacheMapImage, getCachedItem, cacheData, checkVersion, clearCache, getCachedData, cacheAllData, cacheBuildingImages, cacheNoticeImages, cacheMapImageFile, getCachedMapImageFile, getCacheStatus } from '../../lib/cache';
import { supabase } from '../../lib/supabase';
import { dijkstra } from '../../lib/dijkstra';

interface Building {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  phone: string | null;
  email: string | null;
  hours: string | null;
  x_pos: number;
  y_pos: number;
  color: string;
  icon_type: string;
  entrance_node_id: string | null;
  is_frequent?: boolean; // Flag for frequently visited places
  offices?: Office[];
}

interface Office {
  id: string;
  building_id: string;
  room_number: string;
  staff_name: string;
  floor: number | null;
  is_frequent?: boolean; // Flag for main/frequently visited offices
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
  const [centerOnBuilding, setCenterOnBuilding] = useState<Building | null>(null);
  const [offices, setOffices] = useState<Office[]>([]);
  const [destinationPickerVisible, setDestinationPickerVisible] = useState(false);
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [userStartNodeId, setUserStartNodeId] = useState<string | null>(null);

  // Always start routes from the building named exactly "main enterance" (fallback if no user location)
  const mainEntranceBuilding = useMemo(
    () => buildings.find((b) => b.name.toLowerCase() === 'main enterance') ?? null,
    [buildings]
  );

  // Handle user location changes
  const handleUserLocationChange = (nodeId: string | null) => {
    setUserStartNodeId(nodeId);
  };

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

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      // Load map URL first (usually static)
      let currentMapUrl = await getCachedMapImage();
      if (!currentMapUrl || forceRefresh) {
        currentMapUrl = await getMapUrl();
        await cacheMapImage(currentMapUrl);
      }
      
      // Try to use cached map image file
      const cachedMapPath = await getCachedMapImageFile();
      if (cachedMapPath) {
        console.log('[LOAD_DATA] Using cached map image file');
        setMapUrl(cachedMapPath);
      } else {
        setMapUrl(currentMapUrl);
      }

      // Try to load all data from cache first
      const cached = await getCachedData();
      
      if (cached && !forceRefresh) {
        console.log('Using cached campus data (v' + cached.appVersion + ')');
        setBuildings(cached.buildings);
        setNodes(cached.nodes);
        setEdges(cached.edges);
        setOffices(cached.offices);

        // Load buildings with offices separately if not in main cache
        const cachedWithOffices = await getCachedItem('buildings_with_offices');
        if (cachedWithOffices) setBuildingsWithOffices(cachedWithOffices);
      } else {
        // Full sync required
        console.log('Performing full sync with server...');
        const freshData = await cacheAllData();
        setBuildings(freshData.buildings);
        setNodes(freshData.nodes);
        setEdges(freshData.edges);
        setOffices(freshData.offices);

        // Sync buildings with offices
        const { data: withOffices, error } = await supabase
          .from('buildings')
          .select('*, offices(*)')
          .eq('is_active', true);

        if (!error && withOffices) {
          setBuildingsWithOffices(withOffices);
          await cacheData('buildings_with_offices', withOffices);
        }
        
        console.log(`[LOAD_DATA] Data sync complete. Buildings: ${freshData.buildings.length}, Offices: ${freshData.offices.length}, BuildingsWithOffices: ${withOffices?.length || 0}`);
        
        // Cache images in background
        console.log('[LOAD_DATA] Starting image caching...');
        cacheBuildingImages(freshData.buildings).catch(err => console.error('[LOAD_DATA] Failed to cache building images:', err));
        cacheNoticeImages(freshData.notices).catch(err => console.error('[LOAD_DATA] Failed to cache notice images:', err));
        cacheMapImageFile(currentMapUrl).catch(err => console.error('[LOAD_DATA] Failed to cache map image:', err));
      }

      // Show the destination picker once data is ready (only if no active route)
      setDestinationPickerVisible(true);
      setLoading(false);
    } catch (error) {
      console.error('Error loading campus data:', error);
      setLoading(false);
    }
  };

  const handleBuildingPress = async (building: Building) => {
    setCardLoading(true);
    
    // First, check if we already have this building with offices in our local state
    const localBuilding = buildingsWithOffices.find(b => b.id === building.id);
    
    if (localBuilding && localBuilding.offices && localBuilding.offices.length > 0) {
      console.log(`[BUILDING_PRESS] Found local building data with ${localBuilding.offices.length} offices`);
      setSelectedBuilding(localBuilding);
      setCardLoading(false);
      return;
    }

    console.log(`[BUILDING_PRESS] Local data missing or empty, fetching from Supabase for ID: ${building.id}`);
    setSelectedBuilding({ ...building, offices: [] }); 
    
    try {
      const { data, error } = await supabase
        .from('buildings')
        .select('*, offices(*)')
        .eq('id', building.id)
        .single();
        
      if (error) {
        console.error('[BUILDING_PRESS] Supabase error:', error);
        throw error;
      }
      
      if (data) {
        console.log(`[BUILDING_PRESS] Fetched data success: ${data.offices?.length || 0} offices found`);
        setSelectedBuilding(data);
      }
    } catch (e) {
      console.error('[BUILDING_PRESS] Failed to load building details:', e);
    } finally {
      setCardLoading(false);
    }
  };

  const checkForUpdates = async () => {
    try {
      const versionCheck = await checkVersion();
      setVersionInfo({
        serverVersion: versionCheck.serverVersion,
        cachedVersion: versionCheck.cachedVersion,
      });

      if (versionCheck.needsUpdate) {
        console.log(`Update available: v${versionCheck.serverVersion}. Syncing...`);
        // Subtle update in background
        await loadData(true);
      }
    } catch (error) {
      console.error('Background update check failed:', error);
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
    setActiveRoute(null);
    setDestinationBuildingId(null);
    setNoPathMessage(null);
    router.setParams({});
  };

  const handleRouteCalculated = (result: RouteResult) => {
    setDestinationPickerVisible(false);
    setActiveRoute(result);

    if (result.path.length > 1) {
      setPath(result.path);
      setNoPathMessage(null);
      setDestinationBuildingId(null);
    } else {
      // No path found — highlight the destination building
      setPath(null);
      setDestinationBuildingId(result.destinationBuilding.id);
      setNoPathMessage(`No direct path to ${result.destinationBuilding.name}`);
    }
  };

  const handleRouteToBuilding = (building: Building) => {
    // Close the building card
    setSelectedBuilding(null);
    
    // Calculate route from user's current location to this building
    if (!userStartNodeId) {
      // No user location available, show error
      setNoPathMessage('Location not available. Please enable location services.');
      setDestinationBuildingId(building.id);
      setPath(null);
      return;
    }

    if (!building.entrance_node_id) {
      setNoPathMessage('This building has no entrance node.');
      setDestinationBuildingId(building.id);
      setPath(null);
      return;
    }

    // Calculate route using Dijkstra
    const result = dijkstra(
      userStartNodeId,
      building.entrance_node_id,
      nodes,
      edges
    );

    if (result && result.path.length > 1) {
      setPath(result.path);
      setNoPathMessage(null);
      setDestinationBuildingId(null);
      setActiveRoute({
        path: result.path,
        totalDistance: result.totalDistance,
        destinationBuilding: building,
      });
    } else {
      // No path found
      setPath(null);
      setDestinationBuildingId(building.id);
      setNoPathMessage(`No direct path to ${building.name}`);
    }
  };

  const handleSearchResultSelect = (building: Building, office?: Office) => {
    // 1. Center map on the selected building
    setCenterOnBuilding(building);
    setSearchModalVisible(false);
    
    // 2. Open the building details card
    handleBuildingPress(building);
    
    // 3. Clear centering after animation
    setTimeout(() => setCenterOnBuilding(null), 2000);
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
        centerOnBuilding={centerOnBuilding}
        showUserLocation={true}
        onUserLocationChange={handleUserLocationChange}
      />

      {/* Top bar: Where-to picker + Search button */}
      <View style={[styles.floatingControls, { top: insets.top + 10 }]}>
        {/* Destination picker trigger */}
        <TouchableOpacity
          style={styles.searchBarContainer}
          onPress={() => setDestinationPickerVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={18} color="#A1A1AA" style={{ marginRight: 10 }} />
          {activeRoute ? (
            <Text style={styles.searchBarText} numberOfLines={1}>
              → {activeRoute.destinationOffice
                ? `${activeRoute.destinationOffice.staff_name} (${activeRoute.destinationOffice.room_number})`
                : activeRoute.destinationBuilding.name}
            </Text>
          ) : (
            <Text style={styles.searchBarText}>Where to?</Text>
          )}
        </TouchableOpacity>

        {/* Search button */}
        <TouchableOpacity
          style={styles.searchIconButton}
          onPress={() => setSearchModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="search" size={20} color="#FAFAFA" />
        </TouchableOpacity>
      </View>

      {/* Refresh button */}
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

      {/* Clear route button */}
      {path && (
        <TouchableOpacity
          style={[styles.clearRouteButton, { bottom: insets.bottom + 80 }]}
          onPress={handleClearRoute}
        >
          <Ionicons name="close" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Destination picker shown on launch or when tapping the search bar */}
      <DestinationPickerModal
        visible={destinationPickerVisible}
        buildings={buildings}
        offices={offices}
        nodes={nodes}
        edges={edges}
        mainEntranceBuilding={mainEntranceBuilding}
        userStartNodeId={userStartNodeId}
        onRouteCalculated={handleRouteCalculated}
        onDismiss={() => setDestinationPickerVisible(false)}
      />

      <SearchModal
        visible={searchModalVisible}
        onClose={() => setSearchModalVisible(false)}
        buildings={buildingsWithOffices}
        onSelect={handleSearchResultSelect}
      />

      {/* Building details bottom-sheet card */}
      <BuildingCard
        building={selectedBuilding}
        loading={cardLoading}
        onClose={() => setSelectedBuilding(null)}
        onRouteToBuilding={handleRouteToBuilding}
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchBarContainer: {
    flex: 1,
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
    flex: 1,
  },
  searchIconButton: {
    width: 50,
    height: 50,
    borderRadius: 20,
    backgroundColor: 'rgba(24, 24, 27, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
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
