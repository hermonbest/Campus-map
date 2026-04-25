import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { getCachedItem } from '../../lib/cache';
import { supabase } from '../../lib/supabase';
import { dijkstra } from '../../lib/dijkstra';

interface Building {
  id: string;
  name: string;
  description: string | null;
  x_pos: number;
  y_pos: number;
  color: string;
  icon_type: string;
  entrance_node_id: string | null;
  offices?: Array<{
    id: string;
    room_number: string;
    staff_name: string;
    floor: number | null;
  }>;
}

interface Office {
  id: string;
  building_id: string;
  room_number: string;
  staff_name: string;
  floor: number | null;
  building?: Building;
}

interface Node {
  id: string;
  x_pos: number;
  y_pos: number;
  is_building_entrance: boolean;
  building_id: string | null;
}

interface Edge {
  id: string;
  node_a: string;
  node_b: string;
  weight: number;
}

export default function RouteScreen() {
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [offices, setOffices] = useState<Office[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedStartBuilding, setSelectedStartBuilding] = useState<Building | null>(null);
  const [selectedDestinationOffice, setSelectedDestinationOffice] = useState<Office | null>(null);
  const [selectedDestinationBuilding, setSelectedDestinationBuilding] = useState<Building | null>(null);
  const [destinationType, setDestinationType] = useState<'office' | 'building'>('office');
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [path, setPath] = useState<string[] | null>(null);
  const [totalDistance, setTotalDistance] = useState<number>(0);
  const [noPath, setNoPath] = useState(false);
  const [destinationBuilding, setDestinationBuilding] = useState<Building | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const cachedBuildings = await getCachedItem('buildings');
      const cachedOffices = await getCachedItem('offices');
      const cachedNodes = await getCachedItem('nodes');
      const cachedEdges = await getCachedItem('edges');

      if (cachedBuildings) setBuildings(cachedBuildings);
      if (cachedOffices) setOffices(cachedOffices);
      if (cachedNodes) setNodes(cachedNodes);
      if (cachedEdges) setEdges(cachedEdges);

      // If no cached offices, try to fetch from Supabase
      if (!cachedOffices) {
        const { data, error } = await supabase.from('offices').select('*');
        if (!error && data) {
          setOffices(data);
        }
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
      } else {
        console.error('[ROUTE] No path found');
        setNoPath(true);
      }
    } catch (error) {
      console.error('[ROUTE] Error calculating route:', error);
      Alert.alert('Error', 'Failed to calculate route');
    } finally {
      setCalculating(false);
    }
  };

  const handleNavigateToMap = () => {
    if (path) {
      router.push({
        pathname: '/',
        params: {
          showPath: 'true',
          pathNodes: JSON.stringify(path),
        },
      });
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
          <ScrollView style={styles.listContainer}>
            {buildings.map((building) => (
              <TouchableOpacity
                key={building.id}
                style={[
                  styles.listItem,
                  selectedStartBuilding?.id === building.id && styles.selectedListItem,
                ]}
                onPress={() => setSelectedStartBuilding(building)}
              >
                <View style={[styles.colorDot, { backgroundColor: building.color }]} />
                <Text style={styles.listItemText}>{building.name}</Text>
                {selectedStartBuilding?.id === building.id && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Destination Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destination Type</Text>
          <View style={styles.typeSelector}>
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
          </View>
        </View>

        {/* Destination Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {destinationType === 'office' ? 'Destination Office' : 'Destination Building'}
          </Text>
          <ScrollView style={styles.listContainer}>
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
                  <View style={[styles.colorDot, { backgroundColor: building.color }]} />
                  <Text style={styles.listItemText}>{building.name}</Text>
                  {selectedDestinationBuilding?.id === building.id && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
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

        {/* Route Result */}
        {path && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>Route Found!</Text>
            <Text style={styles.resultText}>
              Total distance: {Math.round(totalDistance)} pixels
            </Text>
            <Text style={styles.resultText}>
              {path.length} nodes in path
            </Text>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={handleNavigateToMap}
            >
              <Text style={styles.navigateButtonText}>View on Map</Text>
            </TouchableOpacity>
          </View>
        )}

        {noPath && destinationBuilding && (
          <View style={styles.resultSection}>
            <Text style={styles.resultTitle}>No Direct Path Available</Text>
            <Text style={styles.resultText}>
              Destination: {destinationBuilding.name}
            </Text>
            {selectedDestinationOffice && (
              <>
                <Text style={styles.resultText}>
                  Office: {selectedDestinationOffice.staff_name}
                </Text>
                {selectedDestinationOffice.floor && (
                  <Text style={styles.resultText}>
                    Floor: {selectedDestinationOffice.floor}
                  </Text>
                )}
              </>
            )}
            <Text style={styles.hintText}>
              The destination building location is shown on the map
            </Text>
            <TouchableOpacity
              style={styles.navigateButton}
              onPress={() => router.push('/')}
            >
              <Text style={styles.navigateButtonText}>View on Map</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  backButtonText: {
    color: '#3B82F6',
    fontSize: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  listContainer: {
    maxHeight: 200,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedListItem: {
    backgroundColor: '#3B82F6',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  listItemText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  officeInfo: {
    flex: 1,
  },
  officeName: {
    color: '#fff',
    fontSize: 16,
  },
  officeDetails: {
    color: '#888',
    fontSize: 14,
    marginTop: 4,
  },
  checkmark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  calculateButton: {
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#333',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultSection: {
    margin: 16,
    padding: 16,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#10B981',
  },
  resultTitle: {
    color: '#10B981',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  hintText: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 16,
  },
  navigateButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  navigateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedTypeButton: {
    backgroundColor: '#3B82F6',
  },
  typeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  selectedTypeButtonText: {
    color: '#fff',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
