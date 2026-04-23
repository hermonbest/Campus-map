import React, { useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, View, Text, Image, useWindowDimensions, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  clamp,
  interpolate
} from 'react-native-reanimated';
import { LocationData } from '@/lib/api';
import { colors } from '@/styles/tokens';

// Constants for coordinate projection (must match lib/api.ts)
const MAP_BOUNDS = {
  southWest: { latitude: 9.03689, longitude: 38.83527 },
  northEast: { latitude: 9.04128, longitude: 38.84315 },
};

interface MapLayerProps {
  buildings: LocationData[];
  selectedLocation: LocationData | null;
  userLocation: any;
  onSelectLocation: (loc: LocationData) => void;
}

export interface MapRef {
  recenter: () => void;
  animateTo: (latitude: number, longitude: number) => void;
  centerOnUser: () => void;
}

const MapLayer = forwardRef<MapRef, MapLayerProps>(({
  buildings,
  selectedLocation,
  userLocation,
  onSelectLocation,
}, ref) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  
  // Image aspect ratio (we'll assume a value until loaded or use layout)
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [containerSize, setContainerSize] = useState({ width: 1, height: 1 });

  // Pan and Zoom shared values
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  // Constants for clamping
  const MIN_SCALE = 1;
  const MAX_SCALE = 5;

  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    setContainerSize({ width, height });
  };

  const onImageLoad = (event: any) => {
    // We can get dimensions here if needed, but we'll use container layout for scaling
  };

  // Recenter map logic
  const recenter = useCallback(() => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
    savedScale.value = 1;
    savedTranslateX.value = 0;
    savedTranslateY.value = 0;
  }, []);

  const animateTo = useCallback((lat: number, lon: number) => {
    const lonRange = MAP_BOUNDS.northEast.longitude - MAP_BOUNDS.southWest.longitude;
    const latRange = MAP_BOUNDS.northEast.latitude - MAP_BOUNDS.southWest.latitude;

    const targetX = ((lon - MAP_BOUNDS.southWest.longitude) / lonRange) * containerSize.width;
    const targetY = ((MAP_BOUNDS.northEast.latitude - lat) / latRange) * containerSize.height;

    const zoomScale = 3;
    scale.value = withSpring(zoomScale);
    
    // We want to center the target point
    // translation = (center - target * scale)
    translateX.value = withSpring((containerSize.width / 2) - (targetX * zoomScale));
    translateY.value = withSpring((containerSize.height / 2) - (targetY * zoomScale));
    
    savedScale.value = zoomScale;
    savedTranslateX.value = (containerSize.width / 2) - (targetX * zoomScale);
    savedTranslateY.value = (containerSize.height / 2) - (targetY * zoomScale);
  }, [containerSize]);

  const centerOnUser = useCallback(() => {
    if (userLocation) {
      animateTo(userLocation.coords.latitude, userLocation.coords.longitude);
    }
  }, [userLocation, animateTo]);

  useImperativeHandle(ref, () => ({
    recenter,
    animateTo,
    centerOnUser
  }));

  // Pinch Gesture
  const pinchGesture = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  // Pan Gesture
  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
      
      // Limit panning so image doesn't completely leave view
      // This is a simple implementation, can be refined
      const maxTranslateX = (containerSize.width * scale.value - containerSize.width) / 2;
      const maxTranslateY = (containerSize.height * scale.value - containerSize.height) / 2;
      
      // We don't clamp strictly here to allow smooth movement, but we could
    })
    .onEnd(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    });

  const composedGesture = Gesture.Race(pinchGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Marker positioning helper
  const getMarkerPosition = (lat: number, lon: number) => {
    const lonRange = MAP_BOUNDS.northEast.longitude - MAP_BOUNDS.southWest.longitude;
    const latRange = MAP_BOUNDS.northEast.latitude - MAP_BOUNDS.southWest.latitude;

    const x = ((lon - MAP_BOUNDS.southWest.longitude) / lonRange) * 100;
    const y = ((MAP_BOUNDS.northEast.latitude - lat) / latRange) * 100;

    return { left: `${x}%`, top: `${y}%` };
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container} onLayout={onLayout}>
        <GestureDetector gesture={composedGesture}>
          <Animated.View style={[styles.mapContent, animatedStyle]}>
            <Image
              source={require('../../assets/kue_map.png')}
              style={styles.mapImage}
              resizeMode="contain"
            />
            
            {/* Building Markers */}
            {buildings.map((loc) => {
              const isSelected = selectedLocation?.id === loc.id;
              const pos = getMarkerPosition(loc.latitude, loc.longitude);
              
              return (
                <View 
                  key={loc.id} 
                  style={[
                    styles.markerWrapper, 
                    { left: pos.left as any, top: pos.top as any },
                    isSelected && { zIndex: 10 }
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => onSelectLocation(loc)}
                    style={[
                      styles.customMarker,
                      isSelected && styles.selectedMarker
                    ]}
                  >
                    <Text style={{ fontSize: 14 }}>
                      {loc.icon || '📍'}
                    </Text>
                  </TouchableOpacity>
                </View>
              );
            })}

            {/* User Location Marker */}
            {userLocation && (
              <View 
                style={[
                  styles.markerWrapper, 
                  getMarkerPosition(userLocation.coords.latitude, userLocation.coords.longitude) as any,
                  { zIndex: 20 }
                ]}
              >
                <View style={styles.userDot}>
                  <View style={styles.userDotPulse} />
                  <View style={styles.userDotInner} />
                </View>
              </View>
            )}
          </Animated.View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50ff', // Match the previous map background
    overflow: 'hidden',
  },
  mapContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapImage: {
    width: '100%',
    height: '100%',
  },
  markerWrapper: {
    position: 'absolute',
    width: 32,
    height: 32,
    marginLeft: -16, // Center marker on point
    marginTop: -16,
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#4F46E5',
    borderColor: '#4F46E5',
    transform: [{ scale: 1.2 }],
  },
  userDot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4285F4',
    borderWidth: 2,
    borderColor: 'white',
  },
  userDotPulse: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(66, 133, 244, 0.3)',
  },
});

export default MapLayer;
