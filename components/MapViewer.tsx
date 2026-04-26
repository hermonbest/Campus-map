import React, { useRef, useEffect, useMemo } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, StatusBar, Platform, ScrollView, TouchableOpacity, Text } from 'react-native';
import Svg, { Polyline, Defs, LinearGradient, Stop, Circle } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedProps, withRepeat, withTiming, Easing, withSequence, runOnJS, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useUserLocation } from '../hooks/useUserLocation';

const AnimatedPolyline = Animated.createAnimatedComponent(Polyline);

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
  offices?: Office[];
}

interface Office {
  id: string;
  building_id: string;
  room_number: string;
  staff_name: string;
  floor: number | null;
}

interface MapViewerProps {
  mapUrl: string | null;
  buildings?: Building[];
  onBuildingPress?: (building: Building) => void | Promise<void>;
  path?: string[]; // Array of node IDs for the path
  nodes?: Array<{ id: string; x_pos: number; y_pos: number }>; // All nodes for coordinate lookup
  destinationBuildingId?: string; // Building ID to highlight when no path exists
  noPathMessage?: string; // Message to display when no path exists
  centerOnBuilding?: Building | null; // Building to center on with animation
  showUserLocation?: boolean; // Enable real-time location tracking
  onUserLocationChange?: (nodeId: string | null) => void; // Callback when user's closest node changes
  isOnRoute?: boolean; // Whether user is currently following a route
}

export function MapViewer({ mapUrl, buildings = [], onBuildingPress, path, nodes = [], destinationBuildingId, noPathMessage, centerOnBuilding, showUserLocation = false, onUserLocationChange, isOnRoute = false }: MapViewerProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  const pulsingScale = useSharedValue(1);
  
  // Real-time location tracking
  const { location: userLocation, isOnCampus } = useUserLocation(showUserLocation, nodes, isOnRoute, path);

  // Notify parent when user's closest node changes
  useEffect(() => {
    if (userLocation?.closestNodeId) {
      onUserLocationChange?.(userLocation.closestNodeId);
    }
  }, [userLocation?.closestNodeId, onUserLocationChange]);

  const androidStatusBarHeight = Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 0;
  const availableHeight = SCREEN_HEIGHT - androidStatusBarHeight;

  // Calculate dimensions to force height fill
  const imageAspectRatio = 1320 / 744;
  const imageHeight = availableHeight;
  const imageWidth = imageHeight * imageAspectRatio;

  // Scroll to middle on mount
  useEffect(() => {
    const middlePosition = (imageWidth - SCREEN_WIDTH) / 2;
    scrollViewRef.current?.scrollTo({ x: middlePosition, y: 0, animated: false });
  }, [imageWidth, SCREEN_WIDTH]);

  // Center map on user's location when first detected
  useEffect(() => {
    if (userLocation && showUserLocation) {
      const centerX = userLocation.x * imageWidth - SCREEN_WIDTH / 2;
      scrollViewRef.current?.scrollTo({ x: centerX, y: 0, animated: true });
    }
  }, [userLocation?.x, showUserLocation, imageWidth, SCREEN_WIDTH]);

  // Center on building when centerOnBuilding prop changes
  useEffect(() => {
    if (centerOnBuilding) {
      const targetX = centerOnBuilding.x_pos * imageWidth;
      const scrollX = targetX - SCREEN_WIDTH / 2;
      scrollViewRef.current?.scrollTo({ x: scrollX, y: 0, animated: true });

      // Trigger pulsing animation
      pulsingScale.value = withSequence(
        withTiming(1.5, { duration: 300, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.3, { duration: 200, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.2, { duration: 150, easing: Easing.out(Easing.ease) }),
        withTiming(1, { duration: 150, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [centerOnBuilding, imageWidth, SCREEN_WIDTH]);

  // Calculate path coordinates from node IDs
  const pathCoordinates = path && nodes.length > 0
    ? path.map(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) return null;
      return {
        x: Number(node.x_pos) * imageWidth,
        y: Number(node.y_pos) * imageHeight,
      };
    }).filter(Boolean) as Array<{ x: number; y: number }>
    : [];

  // Convert coordinates to polyline points string
  const polylinePoints = pathCoordinates.length > 0
    ? pathCoordinates.map(coord => `${coord.x},${coord.y}`).join(' ')
    : '';

  // Calculate total path length for the draw-in effect
  const totalLength = useMemo(() => {
    let len = 0;
    for (let i = 1; i < pathCoordinates.length; i++) {
      const dx = pathCoordinates[i].x - pathCoordinates[i - 1].x;
      const dy = pathCoordinates[i].y - pathCoordinates[i - 1].y;
      len += Math.sqrt(dx * dx + dy * dy);
    }
    return len;
  }, [pathCoordinates]);

  // Animation states
  const dashOffset = useSharedValue(0);
  const drawOffset = useSharedValue(0);
  const dashOpacity = useSharedValue(0);

  useEffect(() => {
    if (pathCoordinates.length > 1 && totalLength > 0) {
      // 1. Setup initial states
      dashOffset.value = 0;
      drawOffset.value = totalLength;
      dashOpacity.value = 1;

      // 2. Start the "draw-in" effect for the solid background line
      drawOffset.value = withTiming(
        0,
        { duration: 1200, easing: Easing.out(Easing.cubic) },
        (finished) => {
          if (finished) {
            // Fade in the marching ants after drawing finishes
            dashOpacity.value = withTiming(1, { duration: 400 });
          }
        }
      );

      // 3. Start the marching ants continuous loop
      // Pattern is 10, 5 -> total 15. Animate 0 to -15 for continuous loop.
      dashOffset.value = withRepeat(
        withTiming(-15, { duration: 600, easing: Easing.linear }),
        -1,
        false
      );
    }
  }, [pathCoordinates.length, totalLength]);

  const animatedBackgroundProps = useAnimatedProps(() => ({
    strokeDashoffset: drawOffset.value,
  }));

  const animatedPolylineProps = useAnimatedProps(() => ({
    strokeDashoffset: dashOffset.value,
    opacity: dashOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsHorizontalScrollIndicator={false}
      >
        <View style={{ width: imageWidth, height: imageHeight, position: 'relative' }}>
          <Image
            source={{ uri: mapUrl }}
            style={{
              width: imageWidth,
              height: imageHeight,
            }}
            resizeMode="cover"
          />

          {/* Render path using SVG */}
          {pathCoordinates.length > 1 && (
            <>
              {/* Debug logs for development */}
              {(() => {
                console.log(`[MAP_VIEWER] Rendering path with ${pathCoordinates.length} points, length: ${totalLength.toFixed(2)}`);
                console.log(`[MAP_VIEWER] Polyline points: ${polylinePoints.substring(0, 100)}...`);
                return null;
              })()}
              <Svg
                style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]}
                width={imageWidth}
                height={imageHeight}
                viewBox={`0 0 ${imageWidth} ${imageHeight}`}
                pointerEvents="none"
              >
                {/* 1. Solid background line (always visible) */}
                <Polyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#000000ff"
                  strokeOpacity="0.2"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {/* 2. Main path line with draw-in effect */}
                <AnimatedPolyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#000000ff"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray={`${totalLength}, ${totalLength}`}
                  animatedProps={animatedBackgroundProps}
                />
                {/* 3. Marching ants foreground */}
                <AnimatedPolyline
                  points={polylinePoints}
                  fill="none"
                  stroke="#9df70dff"
                  strokeWidth="2"
                  strokeDasharray="10, 5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  animatedProps={animatedPolylineProps}
                />
              </Svg>
            </>
          )}

          {buildings.map((building) => {
            const isSelected = centerOnBuilding?.id === building.id;
            return (
              <Animated.View
                key={building.id}
                style={[
                  styles.buildingMarker,
                  {
                    left: building.x_pos * imageWidth - 12,
                    top: building.y_pos * imageHeight - 12,
                    backgroundColor: building.color,
                    transform: [{ scale: isSelected ? pulsingScale : 1 }],
                  },
                  destinationBuildingId === building.id && styles.destinationMarker,
                  isSelected && styles.pulsingMarker,
                ]}
              >
                <TouchableOpacity
                  onPress={() => onBuildingPress?.(building)}
                  style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}
                >
                  <Ionicons name="business" size={12} color="#FAFAFA" />
                </TouchableOpacity>
              </Animated.View>
            );
          })}

          {/* User location marker */}
          {showUserLocation && userLocation && (
            <>
              {/* Pulsing outer ring */}
              <View
                style={[
                  styles.userLocationOuter,
                  {
                    left: userLocation.x * imageWidth - 20,
                    top: userLocation.y * imageHeight - 20,
                  },
                ]}
              />
              {/* Inner dot */}
              <View
                style={[
                  styles.userLocationInner,
                  {
                    left: userLocation.x * imageWidth - 8,
                    top: userLocation.y * imageHeight - 8,
                    backgroundColor: isOnCampus ? '#3482ff' : '#EF4444',
                  },
                ]}
              />
            </>
          )}

          {/* No-path message overlay */}
          {noPathMessage && destinationBuildingId && (
            <View style={styles.noPathOverlay}>
              <Text style={styles.noPathText}>{noPathMessage}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181B',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    height: '100%',
  },
  buildingMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  destinationMarker: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.25 }],
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  pulsingMarker: {
    borderWidth: 4,
    borderColor: '#10B981',
    shadowColor: '#10B981',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 16,
    zIndex: 100,
  },
  buildingMarkerText: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '600',
  },
  noPathOverlay: {
    position: 'absolute',
    bottom: 32,
    left: 24,
    right: 24,
    backgroundColor: '#FAFAFA',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 12,
  },
  noPathText: {
    color: '#18181B',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  userLocationOuter: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userLocationInner: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
});