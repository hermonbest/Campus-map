import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { dijkstra } from '../lib/dijkstra';

// ─── Interfaces ────────────────────────────────────────────────────────────────

interface Office {
  id: string;
  building_id: string;
  room_number: string;
  staff_name: string;
  floor: number | null;
  is_frequent?: boolean; // Flag for main/frequently visited offices
}

interface Building {
  id: string;
  name: string;
  description: string | null;
  image_url?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  color: string;
  icon_type: string;
  x_pos: number;
  y_pos: number;
  entrance_node_id: string | null;
  is_frequent?: boolean; // Flag for frequently visited places
  offices?: Office[];
}

interface NavNode {
  id: string;
  x_pos: number;
  y_pos: number;
  is_building_entrance: boolean;
  building_id: string | null;
}

interface NavEdge {
  id: string;
  node_a: string;
  node_b: string;
  weight: number;
}

export interface RouteResult {
  path: string[];
  totalDistance: number;
  destinationBuilding: Building;
  destinationOffice?: Office;
}

interface DestinationPickerModalProps {
  visible: boolean;
  buildings: Building[];
  offices: Office[];
  nodes: NavNode[];
  edges: NavEdge[];
  /** The building flagged as "main entrance" on the map (entrance_node_id must be set) - used as fallback */
  mainEntranceBuilding: Building | null;
  /** The user's current closest node ID - used as start point for routing */
  userStartNodeId: string | null;
  onRouteCalculated: (result: RouteResult) => void;
  onDismiss: () => void;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export default function DestinationPickerModal({
  visible,
  buildings,
  offices,
  nodes,
  edges,
  mainEntranceBuilding,
  userStartNodeId,
  onRouteCalculated,
  onDismiss,
}: DestinationPickerModalProps) {
  const insets = useSafeAreaInsets();
  const [calculating, setCalculating] = useState(false);
  const [expandedBuildingId, setExpandedBuildingId] = useState<string | null>(null);

  // Determine start node: use user's location if available, otherwise fall back to main entrance
  const startNodeId = userStartNodeId || mainEntranceBuilding?.entrance_node_id || null;
  
  // Determine if we're still waiting for location
  const isWaitingForLocation = !userStartNodeId && mainEntranceBuilding?.entrance_node_id;

  // Only show buildings that:
  //  a) are NOT the start building itself
  //  b) have an entrance node (so we can route to them)
  //  c) are marked as frequent (is_frequent = true)
  const routableBuildings = useMemo(
    () =>
      buildings.filter(
        (b) => b.id !== mainEntranceBuilding?.id && b.entrance_node_id !== null && b.is_frequent === true
      ),
    [buildings, mainEntranceBuilding]
  );

  // Map building_id → offices for quick lookup (only frequent offices)
  const officesByBuilding = useMemo(() => {
    const map: Record<string, Office[]> = {};
    for (const office of offices) {
      // Only include offices marked as frequent
      if (office.is_frequent === true) {
        if (!map[office.building_id]) map[office.building_id] = [];
        map[office.building_id].push(office);
      }
    }
    return map;
  }, [offices]);

  // ── Route calculation ────────────────────────────────────────────────────────

  const handleSelectBuilding = (building: Building) => {
    if (!startNodeId) return;
    if (!building.entrance_node_id) return;
    calculate(building, undefined);
  };

  const handleSelectOffice = (office: Office) => {
    const destBuilding = buildings.find((b) => b.id === office.building_id);
    if (!destBuilding?.entrance_node_id) return;
    if (!startNodeId) return;
    calculate(destBuilding, office);
  };

  const calculate = (destBuilding: Building, office?: Office) => {
    if (!startNodeId) return;

    setCalculating(true);

    // Run Dijkstra synchronously (it's fast for small graphs)
    const result = dijkstra(
      startNodeId,
      destBuilding.entrance_node_id!,
      nodes,
      edges
    );

    setCalculating(false);

    if (result) {
      onRouteCalculated({
        path: result.path,
        totalDistance: result.totalDistance,
        destinationBuilding: destBuilding,
        destinationOffice: office,
      });
    } else {
      // Still dismiss with an empty result so the map can show a "no path" state
      onRouteCalculated({
        path: [],
        totalDistance: 0,
        destinationBuilding: destBuilding,
        destinationOffice: office,
      });
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDismiss}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.headerLabel}>CAMPUS NAVIGATOR</Text>
            <Text style={styles.headerTitle}>Where to?</Text>
            {startNodeId && (
              <View style={styles.fromRow}>
                {isWaitingForLocation ? (
                  <>
                    <ActivityIndicator size="small" color="#3B82F6" />
                    <Text style={styles.fromText}>
                      Detecting your location...
                    </Text>
                  </>
                ) : (
                  <>
                    <View style={[styles.fromDot, { backgroundColor: '#3B82F6' }]} />
                    <Text style={styles.fromText}>
                      From: Your current location
                    </Text>
                  </>
                )}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.dismissButton} onPress={onDismiss}>
            <Ionicons name="close" size={18} color="#FAFAFA" />
          </TouchableOpacity>
        </View>

        {calculating && (
          <View style={styles.calculatingOverlay}>
            <ActivityIndicator size="small" color="#FAFAFA" />
            <Text style={styles.calculatingText}>Finding route…</Text>
          </View>
        )}

        {!startNodeId && (
          <View style={styles.emptyState}>
            <Ionicons name="warning-outline" size={32} color="#71717A" />
            <Text style={styles.emptyText}>
              No start location available. Please enable location services.
            </Text>
          </View>
        )}

        {/* Destination list */}
        {startNodeId && (
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
          >
            {routableBuildings.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={32} color="#71717A" />
                <Text style={styles.emptyText}>No destinations available yet.</Text>
              </View>
            )}

            {routableBuildings.map((building) => {
              const buildingOffices = officesByBuilding[building.id] ?? [];
              const isExpanded = expandedBuildingId === building.id;

              return (
                <View key={building.id} style={styles.buildingCard}>
                  {/* Building row */}
                  <TouchableOpacity
                    style={styles.buildingRow}
                    onPress={() => {
                      if (buildingOffices.length > 0) {
                        // Toggle sub-list if there are offices
                        setExpandedBuildingId(isExpanded ? null : building.id);
                      } else {
                        // Navigate directly to building
                        handleSelectBuilding(building);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    {/* Color badge */}
                    <View style={[styles.colorBadge, { backgroundColor: building.color }]}>
                      <Ionicons name="business" size={13} color="#FFFFFF" />
                    </View>

                    <View style={styles.buildingInfo}>
                      <Text style={styles.buildingName}>{building.name}</Text>
                      {buildingOffices.length > 0 && (
                        <Text style={styles.officeCount}>
                          {buildingOffices.length} office{buildingOffices.length !== 1 ? 's' : ''}
                        </Text>
                      )}
                    </View>

                    {/* Right action */}
                    {buildingOffices.length > 0 ? (
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color="#71717A"
                      />
                    ) : (
                      <View style={styles.goChip}>
                        <Text style={styles.goChipText}>GO</Text>
                      </View>
                    )}
                  </TouchableOpacity>

                  {/* Office sub-list */}
                  {isExpanded && buildingOffices.length > 0 && (
                    <View style={styles.officeList}>
                      {/* Also allow navigating to building directly */}
                      <TouchableOpacity
                        style={styles.officeRow}
                        onPress={() => handleSelectBuilding(building)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="enter-outline" size={14} color="#A1A1AA" style={styles.officeIcon} />
                        <View style={styles.officeTextWrap}>
                          <Text style={styles.officeName}>Building entrance</Text>
                        </View>
                        <View style={styles.goChip}>
                          <Text style={styles.goChipText}>GO</Text>
                        </View>
                      </TouchableOpacity>

                      {buildingOffices.map((office) => (
                        <TouchableOpacity
                          key={office.id}
                          style={styles.officeRow}
                          onPress={() => handleSelectOffice(office)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="person-outline" size={14} color="#A1A1AA" style={styles.officeIcon} />
                          <View style={styles.officeTextWrap}>
                            <Text style={styles.officeName} numberOfLines={1}>
                              {office.staff_name}
                            </Text>
                            <Text style={styles.officeRoom}>
                              {office.room_number}
                              {office.floor != null ? ` · Floor ${office.floor}` : ''}
                            </Text>
                          </View>
                          <View style={styles.goChip}>
                            <Text style={styles.goChipText}>GO</Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181B',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  headerLabel: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    color: '#FAFAFA',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.8,
  },
  fromRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  fromDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  fromText: {
    color: '#71717A',
    fontSize: 13,
    fontWeight: '500',
  },
  dismissButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  calculatingOverlay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  calculatingText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  buildingCard: {
    backgroundColor: '#27272A',
    borderRadius: 16,
    marginBottom: 10,
    overflow: 'hidden',
  },
  buildingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  colorBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  buildingInfo: {
    flex: 1,
  },
  buildingName: {
    color: '#FAFAFA',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  officeCount: {
    color: '#71717A',
    fontSize: 12,
    marginTop: 2,
  },
  officeList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  officeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    gap: 10,
  },
  officeIcon: {
    flexShrink: 0,
  },
  officeTextWrap: {
    flex: 1,
  },
  officeName: {
    color: '#D4D4D8',
    fontSize: 14,
    fontWeight: '500',
  },
  officeRoom: {
    color: '#52525B',
    fontSize: 12,
    marginTop: 1,
  },
  goChip: {
    backgroundColor: '#3F3F46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  goChipText: {
    color: '#FAFAFA',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    gap: 12,
  },
  emptyText: {
    color: '#52525B',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
  },
});
