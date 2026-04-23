import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, useWindowDimensions, Linking, Platform, Keyboard, ActivityIndicator, Image, Modal, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useBuildings } from '../hooks/useBuildings';
import { colors } from '../styles/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LocationData } from '../lib/api';
import { useLocalSearchParams } from 'expo-router';
import offlineManager from '../lib/offlineManager';

// Modular Sub-components
import MapLayer, { MapRef } from './map/MapLayer';
import SearchOverlay from './map/SearchOverlay';
import BuildingSheet from './map/BuildingSheet';
import ActiveLocationCard from './map/ActiveLocationCard';
import OfflineIndicator from './OfflineIndicator';


const OVERLAY_LAT_SPAN = 9.04128 - 9.03689;   // = 0.00439
const OVERLAY_LON_SPAN = 38.84315 - 38.83527;  // = 0.00788

const LATITUDE_DELTA_BASE = OVERLAY_LAT_SPAN * 1;

const CAMPUS_BOUNDARIES = {
  southWest: {
    latitude: 9.03689,
    longitude: 38.83527
  },
  northEast: {
    latitude: 9.04128,
    longitude: 38.84315
  },
};

const OVERLAY_BOUNDS: [[number, number], [number, number]] = [
  [9.03689, 38.83527], // South-West (Bottom-Left)
  [9.04128, 38.84315]  // North-East (Top-Right)
];

export default function CampusMap() {
  const { width, height } = useWindowDimensions();
  const ASPECT_RATIO = width / height;
  const LATITUDE_DELTA = LATITUDE_DELTA_BASE;
  const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

  const CAMPUS_REGION = {
    latitude: 9.039085,  // (9.03689 + 9.04128) / 2
    longitude: 38.83921, // (38.83527 + 38.84315) / 2
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  };
  const { buildings, loading, error, refresh } = useBuildings();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const mapRef = useRef<MapRef>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { locationId, focusOffice } = useLocalSearchParams<{ locationId: string; focusOffice?: string }>();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

   const onRefresh = async () => {
     console.log('[CampusMap] Pull-to-refresh triggered');
     setRefreshing(true);
     try {
       await refresh();
       console.log('[CampusMap] Refresh completed');
     } catch (err) {
       console.error('[CampusMap] Refresh failed:', err);
     } finally {
       setRefreshing(false);
     }
   };

  useEffect(() => {
    if (locationId && buildings.length > 0) {
      const building = buildings.find(b => b.id === locationId);
      if (building) {
        selectLocation(building);
        if (focusOffice) {
          setIsDetailsOpen(true);
        }
      }
    }
  }, [locationId, buildings, focusOffice]);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Permission to access location was denied');
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);

      Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 5 },
        (loc) => setUserLocation(loc)
      );
    })();
  }, []);

  // Removed automatic recenter to prevent black area issue

  const handleSearch = async (text: string) => {
    console.log('Map search triggered:', text);
    setSearchQuery(text);
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }

    // Don't search if less than 2 characters
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Always use offline search first
      const { offlineSearch } = await import('../lib/api');
      const offlineResults = await offlineSearch(text);
      console.log('Offline results:', offlineResults.length);
      setSearchResults(offlineResults);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (location: LocationData) => {
    Keyboard.dismiss(); // Clean up the UI
    setSelectedLocation(location);
    // Don't auto-open details sheet - let user tap ActiveLocationCard instead
    setSearchQuery('');
    setSearchResults([]);

    // Center the map on the selected location without changing zoom
    mapRef.current?.animateTo(location.latitude, location.longitude);
  };

  const selectSearchResult = (item: any) => {
    const building = buildings.find(b => b.id === item.buildingId);
    if (building) {
      selectLocation(building);
      if (item.type === 'office') {
        // Pass the office name to focus it in the details sheet
        // We set isDetailsOpen true so the user sees the office list immediately
        setIsDetailsOpen(true);
      }
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const navigateToLocation = async () => {
    if (!selectedLocation) return;
    const { latitude, longitude, name } = selectedLocation;
    const scheme = Platform.select({ ios: 'maps:0,0?q=', android: 'geo:0,0?q=' });
    const latLng = `${latitude},${longitude}`;
    const label = name;
    const url = Platform.select({
      ios: `${scheme}${label}@${latLng}`,
      android: `${scheme}${latLng}(${label})`
    }) ?? '';

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        const browserUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        await Linking.openURL(browserUrl);
      }
    } catch (error) {
      console.error("Failed to open map:", error);
    }
  };

  const recenterMap = () => {
    mapRef.current?.recenter();
  };

  const centerOnUser = () => {
    mapRef.current?.centerOnUser();
  };

   if (loading) {
     return (
       <View style={{ flex: 1, backgroundColor: isDark ? colors.background : colors.surface }}>
         <View style={styles.loadingContainer}>
           <ActivityIndicator size="large" color={colors.primary} />
           <Text style={styles.loadingText}>Loading buildings...</Text>
         </View>
       </View>
     );
   }

   if (error) {
     return (
       <View style={{ flex: 1, backgroundColor: isDark ? colors.background : colors.surface }}>
         <View style={styles.errorContainer}>
           <Ionicons name="alert-circle" size={48} color={colors.error} />
           <Text style={styles.errorText}>Failed to load buildings</Text>
           <Text style={styles.errorSubtext}>{error}</Text>
           <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={refresh}>
             <Text style={styles.retryButtonText}>Retry</Text>
           </TouchableOpacity>
         </View>
       </View>
     );
   }

   return (
     <View style={styles.container}>
       {/* Offline Indicator */}
       <OfflineIndicator />
       
       {/* Header with KUE branding */}
       <View style={[styles.header, { backgroundColor: isDark ? colors.primary : colors.surface, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
         <View style={styles.headerLeft}>
           <Text style={[styles.title, { color: isDark ? colors.white : colors.primary }]}>KUE Map</Text>
         </View>
         <Image style={styles.profileImg} source={require('../assets/kue_logo.png')} />
       </View>

       {/* Scrollable Map Container with Pull-to-Refresh */}
       <View style={{ flex: 1 }}>
         <ScrollView
           refreshControl={
             <RefreshControl
               refreshing={refreshing}
               onRefresh={onRefresh}
               tintColor={colors.primary}
               colors={[colors.primary]}
               progressViewOffset={100} // Offset below header
             />
           }
           contentContainerStyle={{ flexGrow: 1 }}
           scrollEnabled={false} // Disable scrolling, map handles its own panning
         >
           <View style={{ flex: 1, paddingBottom: 60 + Math.max(insets.bottom) }}>
             <MapLayer
               ref={mapRef}
               buildings={buildings}
               selectedLocation={selectedLocation}
               userLocation={userLocation}
               onSelectLocation={selectLocation}
             />
           </View>
        </ScrollView>
      </View>

      {/* 2. Top Search & Filter UI */}
      <SearchOverlay
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onClearSearch={() => { setSearchQuery(''); setSearchResults([]); }}
        searchResults={searchResults}
        onSelectResult={selectSearchResult}
        isDark={isDark}
        topInset={insets.top}
        isSearching={isSearching}
      />

      {/* 3. Floating Quick Info Card (Shows when marker is selected) */}
      <ActiveLocationCard
        selectedLocation={selectedLocation}
        onClose={() => { setSelectedLocation(null); setIsDetailsOpen(false); }}
        onNavigate={navigateToLocation}
        onOpenDetails={() => setIsDetailsOpen(true)}
        isDark={isDark}
      />

      {/* 4. Full Info Modal (Slide up sheet) */}
      <BuildingSheet
        isVisible={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        selectedLocation={selectedLocation}
        isDark={isDark}
        focusOffice={focusOffice}
      />

      {/* 5. Map Control Buttons */}
      <View style={[styles.controlButtons, { bottom: height * 0.28 + 80 }]}>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.primary }]}
          onPress={recenterMap}
        >
          <Ionicons name="contract" size={20} color={colors.white} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: colors.primary }]}
          onPress={centerOnUser}
        >
          <Ionicons name="navigate" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000ff',
  },
  contentWrapper: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e1e3e4',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorSubtext: {
    fontSize: 14,
    color: colors.outline,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
  },
  retryButtonText: {
    color: 'white',
    fontFamily: 'Inter_700Bold',
  },
  controlButtons: {
    position: 'absolute',
    right: 20,
    zIndex: 35,
    gap: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 6,
  },
});
