import React, { useRef, useEffect } from 'react';
import { View, Image, StyleSheet, useWindowDimensions, StatusBar, Platform, ScrollView, TouchableOpacity, Text } from 'react-native';

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
}

export function MapViewer({ mapUrl, buildings = [], onBuildingPress }: MapViewerProps) {
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
              ]}
              onPress={() => onBuildingPress?.(building)}
            >
              <Text style={styles.buildingMarkerText}>B</Text>
            </TouchableOpacity>
          ))}
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
  buildingMarkerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});