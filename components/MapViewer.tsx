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
              style={StyleSheet.absoluteFill} 
              width={imageWidth} 
              height={imageHeight}
            >
              <Polyline
                points={polylinePoints}
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
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    height: '100%',
  },
  buildingMarker: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  destinationMarker: {
    borderWidth: 4,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 10,
  },
  buildingMarkerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  noPathOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#EF4444',
  },
  noPathText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },
});