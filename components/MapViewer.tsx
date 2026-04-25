import React, { useRef, useEffect } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, StatusBar, Platform, ScrollView, TouchableOpacity, Text } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';

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

interface MapViewerProps {
  mapUrl: string;
  buildings?: Building[];
  onBuildingPress?: (building: Building) => void;
  path?: string[]; // Array of node IDs for the path
  nodes?: Array<{ id: string; x_pos: number; y_pos: number }>; // All nodes for coordinate lookup
  destinationBuildingId?: string; // Building ID to highlight when no path exists
  noPathMessage?: string; // Message to display when no path exists
}

export function MapViewer({ mapUrl, buildings = [], onBuildingPress, path, nodes = [], destinationBuildingId, noPathMessage }: MapViewerProps) {
  const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);
  
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
            <Svg 
              style={[StyleSheet.absoluteFill, { backgroundColor: 'transparent' }]} 
              width={imageWidth} 
              height={imageHeight}
              viewBox={`0 0 ${imageWidth} ${imageHeight}`}
            >
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke="#10B981"
                strokeWidth="4"
                strokeDasharray="10, 5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          )}
          
          {buildings.map((building) => (
            <TouchableOpacity
              key={building.id}
              style={[
                styles.buildingMarker,
                {
                  left: building.x_pos * imageWidth - 15,
                  top: building.y_pos * imageHeight - 15,
                  backgroundColor: building.color,
                },
                destinationBuildingId === building.id && styles.destinationMarker,
              ]}
              onPress={() => onBuildingPress?.(building)}
            >
              <Text style={styles.buildingMarkerText}>B</Text>
            </TouchableOpacity>
          ))}

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
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FAFAFA',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  destinationMarker: {
    borderWidth: 3,
    borderColor: '#18181B',
    transform: [{ scale: 1.15 }],
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
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
});