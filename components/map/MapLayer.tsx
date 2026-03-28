import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Overlay, PROVIDER_GOOGLE, Polygon } from 'react-native-maps';
import { LocationData } from '@/lib/api';

interface MapLayerProps {
  mapRef: React.RefObject<MapView>;
  initialRegion: any;
  mapStyle: any;
  overlayBounds: [[number, number], [number, number]];
  buildings: LocationData[];
  selectedLocation: LocationData | null;
  userLocation: any;
  onSelectLocation: (loc: LocationData) => void;
}

export default function MapLayer({
  mapRef,
  initialRegion,
  mapStyle,
  overlayBounds,
  buildings,
  selectedLocation,
  userLocation,
  onSelectLocation,
}: MapLayerProps) {
  return (
    <MapView
      ref={mapRef}
      style={[styles.map, { backgroundColor: '#cd934dff' }]}
      initialRegion={initialRegion}
      provider={PROVIDER_GOOGLE}
      mapType="standard"
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
        image={require('../../assets/kue_map.png')}
        bounds={overlayBounds}
        opacity={1.0}
      />
      {buildings.map((loc) => {
        const isSelected = selectedLocation?.id === loc.id;
        return (
          <React.Fragment key={loc.id}>
            {loc.polygon && (
              <Polygon
                coordinates={loc.polygon}
                fillColor={isSelected ? "rgba(79, 70, 229, 0.45)" : "rgba(255, 255, 255, 0.1)"}
                strokeColor={isSelected ? "rgba(79, 70, 229, 1)" : "rgba(255, 255, 255, 0.7)"}
                strokeWidth={isSelected ? 4 : 2}
                tappable={true}
                onPress={() => onSelectLocation(loc)}
                zIndex={isSelected ? 10 : 1}
              />
            )}
            <Marker
              coordinate={{ latitude: loc.latitude, longitude: loc.longitude }}
              onPress={() => onSelectLocation(loc)}
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
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: '#4F46E5', // colors.primary
    borderColor: '#4F46E5',
    transform: [{ scale: 1.2 }],
  },
});
