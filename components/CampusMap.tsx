import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, useWindowDimensions, Linking, Platform, Keyboard, ActivityIndicator, Image, Modal, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, Overlay, PROVIDER_GOOGLE, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useBuildings } from '../hooks/useBuildings';
import mapStyle from '../data/mapStyle.json';
import { colors } from '../styles/tokens';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { LocationData } from '../lib/api';
import { useLocalSearchParams } from 'expo-router';

// Modular Sub-components
import MapLayer from './map/MapLayer';
import SearchOverlay from './map/SearchOverlay';
import BuildingSheet from './map/BuildingSheet';
import ActiveLocationCard from './map/ActiveLocationCard';


const OVERLAY_LAT_SPAN = 9.04128 - 9.03695;   // = 0.00439
const OVERLAY_LON_SPAN = 38.84315 - 38.83527;  // = 0.00788

const LATITUDE_DELTA_BASE = OVERLAY_LAT_SPAN * 1;

const CAMPUS_BOUNDARIES = {
  southWest: {
     latitude: 9.03689 + 0.0021,  // Pulled UP from the bottom
    longitude: 38.83527 + 0.0012  // Pulled IN from the left
  },
  northEast: {
    latitude: 9.04128 - 0.0022,   // Pulled DOWN from the top
    longitude: 38.84315 - 0.0012 // Pulled IN from the right
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
  const mapRef = useRef<MapView>(null!);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { locationId, focusOffice } = useLocalSearchParams<{ locationId: string; focusOffice?: string }>();
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

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

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapBoundaries(
        CAMPUS_BOUNDARIES.northEast,
        CAMPUS_BOUNDARIES.southWest
      );
    }
  }, [mapRef.current]);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // Use the API search for parity with the Search tab
      const results = await import('../lib/api').then(m => m.searchCampus(text));
      setSearchResults(results);
    } catch (err) {
      // Quietly fall back to local building filter if offline
      const local = buildings.filter((loc) =>
        loc.name.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(local.map(b => ({ ...b, type: 'building', buildingId: b.id })));
    } finally {
      setIsSearching(false);
    }
  };

  const selectLocation = (location: LocationData) => {
    Keyboard.dismiss(); // Clean up the UI
    setSelectedLocation(location);
    setSearchQuery('');
    setSearchResults([]);

    // Center the map on the selected location without changing zoom
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: LATITUDE_DELTA_BASE, // Use base deltas instead of zooming in
      longitudeDelta: LATITUDE_DELTA_BASE * ASPECT_RATIO,
    }, 1000);
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
    mapRef.current?.animateToRegion(CAMPUS_REGION, 1000);
  };

  const centerOnUser = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({
        latitude: userLocation.coords.latitude,
        longitude: userLocation.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 1000);
    }
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
      {/* 1. Base Map Layer */}
      <MapLayer
        mapRef={mapRef}
        initialRegion={CAMPUS_REGION}
        mapStyle={mapStyle}
        overlayBounds={OVERLAY_BOUNDS}
        buildings={buildings}
        selectedLocation={selectedLocation}
        userLocation={userLocation}
        onSelectLocation={selectLocation}
      />

      {/* 2. Top Search & Filter UI */}
      <SearchOverlay
        searchQuery={searchQuery}
        onSearchChange={handleSearch}
        onClearSearch={() => { setSearchQuery(''); setSearchResults([]); }}
        searchResults={searchResults}
        onSelectResult={selectSearchResult}
        isDark={isDark}
        topInset={insets.top}
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
      <View style={[styles.controlButtons, { bottom: height * 0.28 + 100 }]}>
        {__DEV__ && (
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: colors.secondaryContainer }]}
            onPress={async () => {
              try {
                await refresh();
                import('react-native-toast-message').then(Toast => Toast.default.show({
                  type: 'success',
                  text1: 'Data refreshed!',
                  position: 'bottom',
                }));
              } catch (e) {
                console.warn("Manual refresh failed:", e);
              }
            }}
          >
            <Ionicons name="cloud-download" size={24} color={colors.onSecondaryContainer} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerLowest }]}
          onPress={recenterMap}
        >
          <Ionicons name="contract" size={24} color={isDark ? colors.white : colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.controlButton, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerLowest }]}
          onPress={centerOnUser}
        >
          <Ionicons name="navigate" size={24} color={isDark ? colors.white : colors.primary} />
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
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
});
