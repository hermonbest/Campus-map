import React, { useState, useCallback, useImperativeHandle, forwardRef, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, useWindowDimensions, TouchableOpacity, Platform } from 'react-native';
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  clamp,
  runOnJS
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { LocationData, MAP_BOUNDS } from '@/lib/api';
import { colors } from '@/styles/tokens';

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

// Image aspect ratio (1320x744 from the actual image)
const IMAGE_ASPECT_RATIO = 1320 / 744;

// Vertical offset to move map upward (negative = up, positive = down)
const MAP_VERTICAL_OFFSET = 0;

const MapLayer = forwardRef<MapRef, MapLayerProps>(({
  buildings,
  selectedLocation,
  userLocation,
  onSelectLocation,
}, ref) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // 1. Calculate the base image dimensions (cover mode at scale 1)
  const baseImageDims = useMemo(() => {
    const { width: CW, height: CH } = containerSize;

    if (CW === 0 || CH === 0) return { width: 0, height: 0 };

    const CA = CW / CH;
    const IA = IMAGE_ASPECT_RATIO;

    let width, height;
    if (CA > IA) {
      // Container is wider than image aspect ratio -> width fills container
      width = CW;
      height = CW / IA;
    } else {
      // Container is taller than image aspect ratio -> height fills container
      height = CH;
      width = CH * IA;
    }
    return { width, height };
  }, [containerSize]);

  // Pan and Zoom shared values
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(MAP_VERTICAL_OFFSET);

  // Temporary values for gesture processing
  const startScale = useSharedValue(1);
  const startTranslateX = useSharedValue(0);
  const startTranslateY = useSharedValue(0);

  const MIN_SCALE = 1;
  const MAX_SCALE = 6;

  const onLayout = (event: any) => {
    const { width, height } = event.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setContainerSize({ width, height });
    }
  };

  const CH = containerSize.height;

  // Helper to clamp translation based on current scale
  // Ensures the image always covers the container
  const getClampedTranslate = (tx: number, ty: number, s: number) => {
    'worklet';
    const scaledW = baseImageDims.width * s;
    const scaledH = baseImageDims.height * s;
    
    const limitX = Math.max(0, (scaledW - containerSize.width) / 2);
    const limitY = Math.max(0, (scaledH - containerSize.height) / 2);

    return {
      x: clamp(tx, -limitX, limitX),
      y: clamp(ty, -limitY, limitY)
    };
  };

  // Recenter map logic
  const recenter = useCallback(() => {
    scale.value = withSpring(1);
    translateX.value = withSpring(0);
    translateY.value = withSpring(MAP_VERTICAL_OFFSET);
  }, []);

  const animateTo = useCallback((lat: number, lon: number) => {
    const lonRange = MAP_BOUNDS.northEast.longitude - MAP_BOUNDS.southWest.longitude;
    const latRange = MAP_BOUNDS.northEast.latitude - MAP_BOUNDS.southWest.latitude;

    // Normalized position on image (0-1)
    const ix = (lon - MAP_BOUNDS.southWest.longitude) / lonRange;
    const iy = (MAP_BOUNDS.northEast.latitude - lat) / latRange;

    // Position in local coordinates of the base image view
    const targetX = (ix - 0.5) * baseImageDims.width;
    const targetY = (iy - 0.5) * baseImageDims.height;

    const zoomScale = 3;
    const nextScale = clamp(zoomScale, MIN_SCALE, MAX_SCALE);
    
    // In Reanimated, transform: [{translateX}, {translateY}, {scale}]
    // Target translation to center the point:
    // tx = -targetX * nextScale
    const clamped = getClampedTranslate(-targetX * nextScale, -targetY * nextScale, nextScale);
    
    scale.value = withSpring(nextScale);
    translateX.value = withSpring(clamped.x);
    translateY.value = withSpring(clamped.y);
  }, [baseImageDims, containerSize]);

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

  // Combined Pan and Pinch Gesture
  const gesture = Gesture.Simultaneous(
    Gesture.Pan()
      .onStart(() => {
        startTranslateX.value = translateX.value;
        startTranslateY.value = translateY.value;
      })
      .onUpdate((e) => {
        const nextX = startTranslateX.value + e.translationX;
        const nextY = startTranslateY.value + e.translationY;
        const clamped = getClampedTranslate(nextX, nextY, scale.value);
        translateX.value = clamped.x;
        translateY.value = clamped.y;
      }),
    Gesture.Pinch()
      .onStart(() => {
        startScale.value = scale.value;
        startTranslateX.value = translateX.value;
        startTranslateY.value = translateY.value;
      })
      .onUpdate((e) => {
        const nextScale = clamp(startScale.value * e.scale, MIN_SCALE, MAX_SCALE);
        
        // Focal point zoom logic
        // We want to keep the focal point at the same screen position
        const focalX = e.focalX - containerSize.width / 2;
        const focalY = e.focalY - containerSize.height / 2;

        // How much the scale changed
        const scaleChange = nextScale / startScale.value;
        
        // Adjust translation to compensate for scale around focal point
        const nextX = startTranslateX.value + (focalX - startTranslateX.value) * (1 - scaleChange);
        const nextY = startTranslateY.value + (focalY - startTranslateY.value) * (1 - scaleChange);
        
        const clamped = getClampedTranslate(nextX, nextY, nextScale);
        
        scale.value = nextScale;
        translateX.value = clamped.x;
        translateY.value = clamped.y;
      })
  );

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    };
  });

  // Inverse scale style for markers to keep them constant size
  const markerIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 / scale.value }],
    };
  });

  // Marker positioning helper - GPS to pixels (for user location)
  // Returns pixel position relative to the top-left of the image
  const getMarkerStyle = (lat: number, lon: number) => {
    const lonRange = MAP_BOUNDS.northEast.longitude - MAP_BOUNDS.southWest.longitude;
    const latRange = MAP_BOUNDS.northEast.latitude - MAP_BOUNDS.southWest.latitude;

    const ix = (lon - MAP_BOUNDS.southWest.longitude) / lonRange;
    const iy = (MAP_BOUNDS.northEast.latitude - lat) / latRange;

    return {
      left: ix * baseImageDims.width,
      top: iy * baseImageDims.height,
    };
  };

  // Marker positioning helper - Percentage to pixels (for buildings)
  // Uses direct percentage like web admin for perfect alignment
  const getMarkerStyleFromPercent = (positionX: number, positionY: number) => {
    return {
      left: (positionX / 100) * baseImageDims.width,
      top: (positionY / 100) * baseImageDims.height,
    };
  };

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.container} onLayout={onLayout}>
        <GestureDetector gesture={gesture}>
          <View style={styles.gestureCapture}>
            <Animated.View style={[
              { 
                width: baseImageDims.width, 
                height: baseImageDims.height,
              }, 
              animatedStyle
            ]}>
              <Image
                source={require('../../assets/kue_map.png')}
                style={StyleSheet.absoluteFill}
                contentFit="fill"
                cachePolicy="memory-disk"
              />
              
              {/* Building Markers */}
              {buildings.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                // Use percentage-based positioning to match web admin exactly
                const pos = getMarkerStyleFromPercent(loc.positionX, loc.positionY);

                return (
                  <View
                    key={loc.id}
                    style={[
                      styles.markerWrapper,
                      { left: pos.left, top: pos.top },
                      isSelected && { zIndex: 10 }
                    ]}
                  >
                    <Animated.View style={markerIconStyle}>
                      <TouchableOpacity
                        activeOpacity={0.7}
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
                    </Animated.View>
                  </View>
                );
              })}

              {/* User Location Marker */}
              {userLocation && (
                <View 
                  style={[
                    styles.markerWrapper, 
                    getMarkerStyle(userLocation.coords.latitude, userLocation.coords.longitude),
                    { zIndex: 20 }
                  ]}
                >
                  <Animated.View style={markerIconStyle}>
                    <View style={styles.userDot}>
                      <View style={styles.userDotPulse} />
                      <View style={styles.userDotInner} />
                    </View>
                  </Animated.View>
                </View>
              )}
            </Animated.View>
          </View>
        </GestureDetector>
      </View>
    </GestureHandlerRootView>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Black background to avoid seeing anything during layout
    overflow: 'hidden',
  },
  gestureCapture: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  markerWrapper: {
    position: 'absolute',
    width: 0, // Zero size container to perfectly center children
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
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
