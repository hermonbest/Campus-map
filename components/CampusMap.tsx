import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Dimensions, Linking, Platform, Keyboard, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Overlay, PROVIDER_GOOGLE, Polygon } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { useBuildings } from '../hooks/useBuildings';
import mapStyle from '../data/mapStyle.json';

const { width, height } = Dimensions.get('window');

const ASPECT_RATIO = width / height;

const OVERLAY_LAT_SPAN = 9.04128 - 9.03689;   // = 0.00439
const OVERLAY_LON_SPAN = 38.84315 - 38.83527;  // = 0.00788

// To properly constrain the map using setMapBoundaries without freezing pan,
// the screen viewport MUST be slightly smaller than the boundary box.
// Setting initial delta to 90% of the overlay's height.
const LATITUDE_DELTA = OVERLAY_LAT_SPAN * 0.9;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const CAMPUS_REGION = {
  latitude: 9.039085,  // (9.03689 + 9.04128) / 2
  longitude: 38.83921, // (38.83527 + 38.84315) / 2
  latitudeDelta: LATITUDE_DELTA,
  longitudeDelta: LONGITUDE_DELTA,
};

const CAMPUS_BOUNDARIES = {
  southWest: { 
    latitude: 9.03689 +   0.0023,  // Pulled UP from the bottom
    longitude: 38.83527 + 0.0012 // Pulled IN from the left
  },
  northEast: { 
    latitude: 9.04128 - 0.0023,  // Pulled DOWN from the top
    longitude: 38.84315 - 0.0012 // Pulled IN from the right
  },
};
const OVERLAY_BOUNDS: [[number, number], [number, number]] = [
  [9.03689, 38.83527], // South-West (Bottom-Left)
  [9.04128, 38.84315]  // North-East (Top-Right)
];

import { LocationData } from '../lib/api';

export default function CampusMap() {
  const { buildings, loading, error, refresh } = useBuildings();
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLocations, setFilteredLocations] = useState<LocationData[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const mapRef = useRef<MapView>(null);

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

  // Confine the map panning to the overlay corners
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setMapBoundaries(
        CAMPUS_BOUNDARIES.northEast,
        CAMPUS_BOUNDARIES.southWest
      );
    }
  }, [mapRef.current]);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredLocations([]);
    } else {
      const results = buildings.filter((loc) =>
        loc.name.toLowerCase().includes(text.toLowerCase())
      );
      setFilteredLocations(results);
    }
  };

  const selectLocation = (location: LocationData) => {
    Keyboard.dismiss(); // Clean up the UI
    setSelectedLocation(location);
    setSearchQuery('');
    setFilteredLocations([]);

    // Smoothly animate map to selected location
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: LATITUDE_DELTA / 4, // Zoom in a bit more on selection
      longitudeDelta: LONGITUDE_DELTA / 4,
    }, 1000);
  };

  const navigateToLocation = async () => {
    if (!selectedLocation) return;

    const { latitude, longitude, name } = selectedLocation;

    // Create platform-specific maps URLs
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
        // Fallback to web URL if the app isn't installed
        const browserUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        await Linking.openURL(browserUrl);
      }
    } catch (error) {
      console.error("Failed to open map:", error);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading buildings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#FF3B30" />
          <Text style={styles.errorText}>Failed to load buildings</Text>
          <Text style={styles.errorSubtext}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={refresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <MapView
        ref={mapRef}
        style={[styles.map, { backgroundColor: '#d9cfb9' }]}
        initialRegion={CAMPUS_REGION}
        provider={PROVIDER_GOOGLE}
        mapType="none"
        showsUserLocation={!!userLocation}
        {...({
          minZoomLevel: 17.6,
          maxZoomLevel: 27.5
        } as any)}
        rotateEnabled={false}
        pitchEnabled={false}
        customMapStyle={mapStyle}
        >
        <Overlay
          image={require('../assets/kue_map.png')}
          bounds={OVERLAY_BOUNDS}
          opacity={1.0}
        />
        {buildings.map((loc) => {
          const isSelected = selectedLocation?.id === loc.id;
          return (
            <React.Fragment key={loc.id}>
              {loc.polygon && (
                <Polygon
                  coordinates={loc.polygon}
                  fillColor={isSelected ? "rgba(79, 70, 229, 0.2)" : "rgba(255, 255, 255, 0.1)"}
                  strokeColor={isSelected ? "rgba(79, 70, 229, 1)" : "rgba(255, 255, 255, 0.7)"}
                  strokeWidth={2}
                  tappable={true}
                  onPress={() => selectLocation(loc)}
                  zIndex={1}
                />
              )}
              <Marker
                coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
                onPress={() => selectLocation(loc)}
                zIndex={isSelected ? 3 : 2}
              >
                <View style={[
                  styles.customMarker,
                  isSelected && styles.selectedMarker
                ]}>
                  <Text style={{ fontSize: 14 }}>
                    {loc.icon || '📍'}
                  </Text>
                </View>
              </Marker>
            </React.Fragment>
          );
        })}
      </MapView>

      {/* Floating Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dormitory, library..."
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {filteredLocations.length > 0 && (
          <View style={styles.dropdown}>
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => selectLocation(item)}
                >
                  <Text style={styles.dropdownItemText}>{item.name}</Text>
                  <Text style={styles.dropdownItemSub}>{item.category}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>

      {/* Selected Location Info Card */}
      {selectedLocation && (
        <View style={styles.infoCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{selectedLocation.name}</Text>
            <TouchableOpacity onPress={() => setSelectedLocation(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          <Text style={styles.cardCategory}>{selectedLocation.category.toUpperCase()}</Text>

          <TouchableOpacity style={styles.navigateButton} onPress={navigateToLocation}>
            <Ionicons name="navigate" size={20} color="white" />
            <Text style={styles.navigateText}>Navigate in Google Maps</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 10,
  },
  searchBox: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  dropdown: {
    backgroundColor: 'white',
    marginTop: 5,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  dropdownItemSub: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  infoCard: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  cardCategory: {
    fontSize: 12,
    color: '#888',
    marginBottom: 20,
    fontWeight: '600',
  },
  navigateButton: {
    flexDirection: 'row',
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigateText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  customMarker: {
    backgroundColor: 'white',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE', // indigo-200 equivalent
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMarker: {
    backgroundColor: '#4F46E5', // indigo-600 equivalent
    borderColor: '#4F46E5',
    transform: [{ scale: 1.2 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  errorSubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
