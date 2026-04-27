import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getCachedData, cacheAllData } from '../../lib/cache';
import { useFocusEffect } from '@react-navigation/native';
import { dijkstra } from '../../lib/dijkstra';
import { Building, Office, Node, Edge } from '../../lib/types';

export default function RouteScreen() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedStartBuilding, setSelectedStartBuilding] = useState<Building | null>(null);
  const [selectedDestinationOffice, setSelectedDestinationOffice] = useState<Office | null>(null);
  const [selectedDestinationBuilding, setSelectedDestinationBuilding] = useState<Building | null>(null);
  const [destinationType, setDestinationType] = useState<'office' | 'building'>('building');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [path, setPath] = useState<string[] | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [noPath, setNoPath] = useState(false);
  const [destinationBuilding, setDestinationBuilding] = useState<Building | null>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    try {
      const cached = await getCachedData();

      if (cached) {
        setBuildings(cached.buildings);
        setOffices(cached.offices);
        setNodes(cached.nodes);
        setEdges(cached.edges);
        console.log('[ROUTE] Using cached data (v' + cached.appVersion + ')');
      } else {
        console.log('[ROUTE] No cached data found, performing initial sync...');
        const freshData = await cacheAllData();
        setBuildings(freshData.buildings);
        setOffices(freshData.offices);
        setNodes(freshData.nodes);
        setEdges(freshData.edges);
        console.log('[ROUTE] Data synced from server');
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleCalculateRoute = async () => {
    console.log('[ROUTE] Starting route calculation');
    console.log('[ROUTE] Selected start building:', selectedStartBuilding?.name);
    console.log('[ROUTE] Start building entrance node:', selectedStartBuilding?.entrance_node_id);
    console.log('[ROUTE] Destination type:', destinationType);
    console.log('[ROUTE] Selected destination office:', selectedDestinationOffice?.staff_name);
    console.log('[ROUTE] Selected destination building:', selectedDestinationBuilding?.name);
    console.log('[ROUTE] Total buildings loaded:', buildings.length);
    console.log('[ROUTE] Total offices loaded:', offices.length);
    console.log('[ROUTE] Total nodes loaded:', nodes.length);
    console.log('[ROUTE] Total edges loaded:', edges.length);

    if (!selectedStartBuilding) {
      Alert.alert('Error', 'Please select a start building');
      return;
    }

    if (destinationType === 'office' && !selectedDestinationOffice) {
      Alert.alert('Error', 'Please select a destination office');
      return;
    }

    if (destinationType === 'building' && !selectedDestinationBuilding) {
      Alert.alert('Error', 'Please select a destination building');
      return;
    }

    if (!selectedStartBuilding.entrance_node_id) {
      console.error('[ROUTE] Start building has no entrance node');
      Alert.alert('Error', 'Start building has no entrance node');
      return;
    }

    setCalculating(true);
    setPath(null);
    setNoPath(false);
    setDestinationBuilding(null);

    try {
      // Get destination building
      let destBuilding: Building | null = null;
      
      if (destinationType === 'office' && selectedDestinationOffice) {
        destBuilding = buildings.find(b => b.id === selectedDestinationOffice.building_id) || null;
        console.log('[ROUTE] Destination building from office:', destBuilding?.name);
      } else if (destinationType === 'building' && selectedDestinationBuilding) {
        destBuilding = selectedDestinationBuilding;
        console.log('[ROUTE] Destination building selected directly:', destBuilding?.name);
      }
      
      if (!destBuilding || !destBuilding.entrance_node_id) {
        console.error('[ROUTE] Destination building has no entrance node');
        Alert.alert('Error', 'Destination building has no entrance node');
        setCalculating(false);
        return;
      }

      console.log('[ROUTE] Destination building entrance node:', destBuilding.entrance_node_id);
      setDestinationBuilding(destBuilding);

      // Calculate path using Dijkstra
      console.log('[ROUTE] Calling Dijkstra algorithm');
      const result = dijkstra(
        selectedStartBuilding.entrance_node_id,
        destBuilding.entrance_node_id,
        nodes,
        edges
      );

      if (result) {
        console.log('[ROUTE] Path found:', result.path);
        console.log('[ROUTE] Total distance:', result.totalDistance);
        setPath(result.path);
        setTotalDistance(result.totalDistance);
        
        // Redirect to map immediately
        router.push({
          pathname: '/',
          params: {
            showPath: 'true',
            pathNodes: JSON.stringify(result.path),
          },
        });
      } else {
        console.error('[ROUTE] No path found');
        setNoPath(true);
        
        // Redirect to map immediately but show destination building
        router.push({
          pathname: '/',
          params: {
            destinationBuildingId: destBuilding.id,
            noPathMessage: `No direct path found to ${destBuilding.name}`,
          },
        });
      }
    } catch (error) {
      console.error('[ROUTE] Error calculating route:', error);
      Alert.alert('Error', 'Failed to calculate route');
    } finally {
      setCalculating(false);
    }
  };


  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Navigate</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Start Building Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Start Building</Text>
          <View style={styles.listContainer}>
            {buildings.map((building) => (
              <TouchableOpacity
                key={building.id}
                style={[
                  styles.listItem,
                  selectedStartBuilding?.id === building.id && styles.selectedListItem,
                ]}
                onPress={() => setSelectedStartBuilding(building)}
              >
                <View style={[styles.colorDot, { backgroundColor: building.color }]}>
                  <Ionicons name="business" size={12} color="#FFFFFF" />
                </View>
                <Text style={styles.listItemText}>{building.name}</Text>
                {selectedStartBuilding?.id === building.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Destination Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination Type</Text>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[
                styles.typeButton,
                destinationType === 'building' && styles.selectedTypeButton,
              ]}
              onPress={() => {
                setDestinationType('building');
                setSelectedDestinationOffice(null);
              }}
            >
              <Text style={[
                styles.typeButtonText,
                destinationType === 'building' && styles.selectedTypeButtonText,
              ]}>Building</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.typeButton,
                destinationType === 'office' && styles.selectedTypeButton,
              ]}
              onPress={() => {
                setDestinationType('office');
                setSelectedDestinationBuilding(null);
              }}
            >
              <Text style={[
                styles.typeButtonText,
                destinationType === 'office' && styles.selectedTypeButtonText,
              ]}>Office</Text>
            </TouchableOpacity>
        </View>
        </View>

        {/* Destination Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {destinationType === 'office' ? 'Destination Office' : 'Destination Building'}
          </Text>
          <View style={styles.listContainer}>
            {destinationType === 'office' ? (
              offices.length === 0 ? (
                <Text style={styles.emptyText}>No offices available</Text>
              ) : (
                offices.map((office) => (
                  <TouchableOpacity
                    key={office.id}
                    style={[
                      styles.listItem,
                      selectedDestinationOffice?.id === office.id && styles.selectedListItem,
                    ]}
                    onPress={() => setSelectedDestinationOffice(office)}
                  >
                    <View style={styles.officeInfo}>
                      <Text style={styles.officeName}>{office.staff_name}</Text>
                      <Text style={styles.officeDetails}>
                        {office.room_number} {office.floor ? `• Floor ${office.floor}` : ''}
                      </Text>
                    </View>
                    {selectedDestinationOffice?.id === office.id && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                  </TouchableOpacity>
                ))
              )
            ) : (
              buildings.map((building) => (
                <TouchableOpacity
                  key={building.id}
                  style={[
                    styles.listItem,
                    selectedDestinationBuilding?.id === building.id && styles.selectedListItem,
                  ]}
                  onPress={() => setSelectedDestinationBuilding(building)}
                >
                  <View style={[styles.colorDot, { backgroundColor: building.color }]}>
                    <Ionicons name="business" size={12} color="#FFFFFF" />
                  </View>
                  <Text style={styles.listItemText}>{building.name}</Text>
                  {selectedDestinationBuilding?.id === building.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>

        {/* Calculate Button */}
        <TouchableOpacity
          style={[
            styles.calculateButton,
            (!selectedStartBuilding || 
              (destinationType === 'office' && !selectedDestinationOffice) ||
              (destinationType === 'building' && !selectedDestinationBuilding)) && styles.disabledButton,
          ]}
          onPress={handleCalculateRoute}
          disabled={!selectedStartBuilding || 
            (destinationType === 'office' && !selectedDestinationOffice) ||
            (destinationType === 'building' && !selectedDestinationBuilding) ||
            calculating}
        >
          {calculating ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.calculateButtonText}>Calculate Route</Text>
          )}
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181B', // Charcoal Ink
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#27272A',
    borderRadius: 12,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  sectionTitle: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  listContainer: {
    // Height determined by content to allow outer ScrollView to handle scrolling
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#27272A',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedListItem: {
    borderColor: '#FAFAFA',
  },
  colorDot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listItemText: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  officeInfo: {
    flex: 1,
  },
  officeName: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '500',
  },
  officeDetails: {
    color: '#A1A1AA',
    fontSize: 13,
    marginTop: 4,
  },
  checkmark: {
    color: '#FAFAFA',
    fontSize: 16,
    fontWeight: '600',
  },
  calculateButton: {
    backgroundColor: '#FAFAFA',
    padding: 18,
    borderRadius: 16,
    margin: 24,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: 'rgba(250, 250, 250, 0.3)',
  },
  calculateButtonText: {
    color: '#18181B',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 14,
    backgroundColor: '#27272A',
    borderRadius: 12,
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#3F3F46',
  },
  typeButtonText: {
    color: '#A1A1AA',
    fontSize: 14,
    fontWeight: '500',
  },
  selectedTypeButtonText: {
    color: '#FAFAFA',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
