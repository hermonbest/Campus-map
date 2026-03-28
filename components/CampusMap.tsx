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


const OVERLAY_LAT_SPAN = 9.04128 - 9.03689;   // = 0.00439
const OVERLAY_LON_SPAN = 38.84315 - 38.83527;  // = 0.00788

const LATITUDE_DELTA_BASE = OVERLAY_LAT_SPAN * 0.9;

const CAMPUS_BOUNDARIES = {
  southWest: {
    latitude: 9.03689 + 0.0023,  // Pulled UP from the bottom
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
  const mapRef = useRef<MapView>(null);

  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const { locationId } = useLocalSearchParams<{ locationId: string }>();

  useEffect(() => {
    if (locationId && buildings.length > 0) {
      const building = buildings.find(b => b.id === locationId);
      if (building) {
        selectLocation(building);
      }
    }
  }, [locationId, buildings]);

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

    // Center the map on the selected location without changing zoom
    mapRef.current?.animateToRegion({
      latitude: location.latitude,
      longitude: location.longitude,
      latitudeDelta: LATITUDE_DELTA_BASE, // Use base deltas instead of zooming in
      longitudeDelta: LATITUDE_DELTA_BASE * ASPECT_RATIO,
    }, 1000);
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
      <MapView
        ref={mapRef}
        style={[styles.map, { backgroundColor: '#e39156' }]}
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
                  fillColor={isSelected ? "rgba(0, 10, 30, 0.2)" : "rgba(255, 255, 255, 0.1)"}
                  strokeColor={isSelected ? "rgba(0, 10, 30, 1)" : "rgba(255, 255, 255, 0.7)"}
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

      {/* Top Header */}
      <View style={[styles.header, { top: Math.max(insets.top, 16), backgroundColor: isDark ? colors.primary : colors.surface }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: isDark ? colors.white : colors.primary }]}>KUE</Text>
        </View>
        <View>
          <Image style={styles.profileImg} source={require('../assets/kue_logo.png')} />
        </View>
      </View>

      {/* Search Input Filter for Map (Mobile PRD style) */}
      <View style={[styles.searchOverlay, { top: Math.max(insets.top, 16) + 70 }]}>
        <View style={[styles.modernSearchBox, { backgroundColor: isDark ? 'rgba(0,10,30,0.85)' : 'rgba(248,249,250,0.85)' }]}>
          <Ionicons name="search" size={20} color={isDark ? colors.white : colors.primary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: isDark ? colors.white : colors.primary }]}
            placeholder="Search campus landmarks..."
            placeholderTextColor={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(25,28,29,0.6)'}
            value={searchQuery}
            onChangeText={handleSearch}
          />
        </View>

        {filteredLocations.length > 0 && (
          <View style={[styles.dropdown, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerLowest }]}>
            <FlatList
              data={filteredLocations}
              keyExtractor={(item) => item.id}
              style={{ maxHeight: 200 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.dropdownItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                  onPress={() => selectLocation(item)}
                >
                  <Text style={[styles.dropdownItemText, { color: isDark ? colors.white : colors.text }]}>{item.name}</Text>
                  <Text style={[styles.dropdownItemSub, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>{item.category}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        )}
      </View>



      {/* FAB: Find My Location */}
      <TouchableOpacity
        style={[styles.fabLocation]}
        activeOpacity={0.9}
        onPress={async () => {
          if (userLocation) {
            mapRef.current?.animateToRegion({
              latitude: userLocation.coords.latitude,
              longitude: userLocation.coords.longitude,
              latitudeDelta: LATITUDE_DELTA / 4,
              longitudeDelta: LONGITUDE_DELTA / 4,
            }, 1000);
          }
        }}
      >
        <Ionicons name="locate" size={24} color={colors.white} />
      </TouchableOpacity>

      {/* Selected Location Info Card (Asymmetric Style) */}
      {selectedLocation && (
        <View style={[styles.activeInfoCard, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerLowest }]}>
          <View style={[styles.goldPillar, { backgroundColor: colors.secondary }]} />
          <View style={styles.infoContent}>
            <Text style={[styles.currentlyAtText, { color: colors.secondary }]}>CURRENTLY AT</Text>
            <View style={styles.infoRow}>
              <Text style={[styles.activeTitle, { color: isDark ? colors.primary : colors.white}]} numberOfLines={1}>{selectedLocation.name}</Text>
              <TouchableOpacity onPress={() => setSelectedLocation(null)}>
                <Ionicons name="close" size={24} color={isDark ? colors.outlineVariant : colors.outline} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.activeDesc, { color: isDark ? colors.primary : colors.primary }]} numberOfLines={3}>
              {selectedLocation.description || "No description available for this building."}
            </Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.navButtonPrimary, { backgroundColor: colors.primary }]} onPress={navigateToLocation}>
                <Ionicons name="walk" size={16} color="white" />
                <Text style={styles.navButtonText}>Navigate</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => setIsDetailsOpen(true)}
              >
                <Text style={[styles.detailsButtonText, { color: colors.primary }]}>DETAILS</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}


      {/* Building Details Modal */}
      <Modal visible={isDetailsOpen} transparent animationType="slide">
        <View style={styles.detailsOverlay}>
          <TouchableOpacity
            style={styles.detailsBackdrop}
            activeOpacity={1}
            onPress={() => setIsDetailsOpen(false)}
          />
          <View style={[styles.detailsSheet, { backgroundColor: isDark ? colors.surfaceContainerLowest : colors.white }]}>
            <View style={styles.detailsHandle} />

            {selectedLocation && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsScroll}>
                <View style={styles.detailsHeader}>
                  <Text style={[styles.detailsTitle, { color: isDark ? colors.white : colors.primary }]}>
                    {selectedLocation.name}
                  </Text>
                  <TouchableOpacity onPress={() => setIsDetailsOpen(false)} style={styles.detailsCloseBtn}>
                    <Ionicons name="close-circle" size={32} color={colors.outline} />
                  </TouchableOpacity>
                </View>

                <View style={[styles.categoryBadge, { backgroundColor: isDark ? colors.primaryContainer : colors.secondaryContainer }]}>
                  <Text style={[styles.categoryBadgeText, { color: isDark ? colors.onPrimaryContainer : colors.onSecondaryContainer }]}>
                    {selectedLocation.category.toUpperCase()}
                  </Text>
                </View>

                {selectedLocation.imageUrl && (
                  <Image
                    source={{ uri: selectedLocation.imageUrl }}
                    style={styles.detailsImage}
                    resizeMode="cover"
                  />
                )}

                <View style={styles.detailsSection}>
                  <Text style={[styles.sectionLabel, { color: colors.secondary }]}>DESCRIPTION</Text>
                  <Text style={[styles.sectionText, { color: isDark ? colors.outlineVariant : colors.text }]}>
                    {selectedLocation.description || "No description available for this building."}
                  </Text>
                </View>

                <View style={styles.infoGrid}>
                  <View style={styles.infoTile}>
                    <Ionicons name="time-outline" size={20} color={colors.primary} />
                    <View>
                      <Text style={styles.tileLabel}>HOURS</Text>
                      <Text style={[styles.tileValue, { color: isDark ? colors.white : colors.text }]}>
                        {selectedLocation.hours || "Not specified"}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.infoTile}>
                    <Ionicons name="layers-outline" size={20} color={colors.primary} />
                    <View>
                      <Text style={styles.tileLabel}>FLOORS</Text>
                      <Text style={[styles.tileValue, { color: isDark ? colors.white : colors.text }]}>
                        {selectedLocation.floorCount || "N/A"}
                      </Text>
                    </View>
                  </View>
                </View>

                {selectedLocation.amenities && (
                  <View style={styles.detailsSection}>
                    <Text style={[styles.sectionLabel, { color: colors.secondary }]}>AMENITIES</Text>
                    <View style={styles.amenitiesContainer}>
                      {selectedLocation.amenities.split(',').map((amenity, idx) => (
                        <View key={idx} style={[styles.amenityChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                          <Text style={[styles.amenityText, { color: isDark ? colors.outlineVariant : colors.textMuted }]}>
                            {amenity.trim()}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <View style={styles.contactRow}>
                  {selectedLocation.phone && (
                    <TouchableOpacity
                      style={[styles.contactBtn, { backgroundColor: colors.primaryContainer }]}
                      onPress={() => Linking.openURL(`tel:${selectedLocation.phone}`)}
                    >
                      <Ionicons name="call" size={18} color={colors.primary} />
                      <Text style={[styles.contactBtnText, { color: colors.primary }]}>Call</Text>
                    </TouchableOpacity>
                  )}
                  {selectedLocation.website && (
                    <TouchableOpacity
                      style={[styles.contactBtn, { backgroundColor: colors.secondaryContainer }]}
                      onPress={() => Linking.openURL(selectedLocation.website!)}
                    >
                      <Ionicons name="globe" size={18} color={colors.secondary} />
                      <Text style={[styles.contactBtnText, { color: colors.secondary }]}>Website</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {selectedLocation.wheelchairAccessible && (
                  <View style={styles.accessibilityNote}>
                    <Ionicons name="body" size={16} color={colors.secondary} />
                    <Text style={[styles.accessibilityText, { color: colors.secondary }]}>Wheelchair Accessible</Text>
                  </View>
                )}

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e39156',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  customMarker: {
    backgroundColor: 'white',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#C7D2FE',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedMarker: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    transform: [{ scale: 1.2 }],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // --- New Styles for KUE Overlays --- //
  header: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 24,
    zIndex: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuBtn: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  profileImg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: colors.surfaceContainerHighest,
  },
  searchOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 40,
  },
  modernSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  dropdownItemSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },

  fabLocation: {
    position: 'absolute',
    bottom: 240, // Above the active info card and bottom nav
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
    zIndex: 30,
  },
  activeInfoCard: {
    position: 'absolute',
    bottom: 100, // Above bottom nav
    left: 24,
    right: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 30,
    flexDirection: 'row',
  },
  goldPillar: {
    width: 4,
  },
  infoContent: {
    flex: 1,
    padding: 24,
  },
  currentlyAtText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  activeDesc: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    lineHeight: 22,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  detailsButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  // Drawer
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawerContainer: {
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  drawerHeader: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  drawerProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  drawerProfileImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  drawerProfileName: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  drawerProfileSub: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    color: colors.outline,
  },
  drawerLinks: {
    paddingTop: 16,
  },
  drawerLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  drawerLinkText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  // Details Modal
  detailsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  detailsSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  detailsHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 12,
  },
  detailsScroll: {
    padding: 24,
  },
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailsTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    flex: 1,
    marginRight: 16,
  },
  detailsCloseBtn: {
    marginTop: -4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 20,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  detailsImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
  },
  tileLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: colors.outline,
    letterSpacing: 1,
  },
  tileValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  amenityText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  accessibilityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  accessibilityText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  }
});
