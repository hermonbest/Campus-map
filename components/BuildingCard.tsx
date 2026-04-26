import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
   Animated,
  Dimensions,
  PanResponder,
  Image,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCachedBuildingImage } from '../lib/cache';

interface Office {
  id: string;
  building_id: string;
  room_number: string;
  staff_name: string;
  floor: number | null;
}

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

interface BuildingCardProps {
  building: Building | null;
  loading?: boolean;
  onClose: () => void;
  onRouteToBuilding?: (building: Building) => void;
}

const SCREEN_HEIGHT = Dimensions.get('window').height;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.52;

export default function BuildingCard({ building, loading = false, onClose, onRouteToBuilding }: BuildingCardProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(CARD_HEIGHT)).current;
  const [cachedImagePath, setCachedImagePath] = useState<string | null>(null);

  // Load cached image when building changes
  useEffect(() => {
    if (building && building.image_url) {
      getCachedBuildingImage(building.id).then(path => {
        if (path) {
          setCachedImagePath(path);
        }
      });
    } else {
      setCachedImagePath(null);
    }
  }, [building]);

  // Slide in when building is set, slide out when null
  useEffect(() => {
    if (building || loading) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: CARD_HEIGHT,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [building, loading]);

  // Drag-to-dismiss
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 8,
      onPanResponderMove: (_, gesture) => {
        if (gesture.dy > 0) {
          translateY.setValue(gesture.dy);
        }
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dy > 80) {
          onClose();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 65,
            friction: 11,
          }).start();
        }
      },
    })
  ).current;

  if (!building && !loading) return null;

  return (
    <>
      {/* Tap-outside backdrop (transparent) */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        onPress={onClose}
        activeOpacity={1}
      />

      <Animated.View
        style={[
          styles.card,
          { paddingBottom: insets.bottom + 8, transform: [{ translateY }] },
        ]}
      >
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.dragArea}>
          <View style={styles.handle} />
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="small" color="#A1A1AA" />
            <Text style={styles.loadingText}>Loading…</Text>
          </View>
        ) : building ? (
          <>
            {/* Building Image */}
            {building.image_url && (
              <Image 
                source={{ uri: cachedImagePath || building.image_url }} 
                style={styles.buildingImage}
                resizeMode="contain"
              />
            )}
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.colorBadge, { backgroundColor: building.color }]}>
                <Ionicons name="business" size={20} color="#FFFFFF" />
              </View>
              <View style={styles.headerText}>
                <Text style={styles.buildingName}>{building.name}</Text>
              </View>
              <View style={styles.headerActions}>
                {onRouteToBuilding && building.entrance_node_id && (
                  <TouchableOpacity 
                    style={styles.goButton} 
                    onPress={() => onRouteToBuilding(building)}
                  >
                    <Ionicons name="navigate" size={16} color="#FFFFFF" />
                    <Text style={styles.goButtonText}>GO</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={16} color="#71717A" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Details - Description, Hours, Phone, Email */}
            {(building.description || building.hours || building.phone || building.email) && (
              <View style={styles.detailsSection}>
                {building.description && (
                  <Text style={styles.descriptionInDetails}>{building.description}</Text>
                )}
                {building.hours && (
                  <View style={styles.detailRow}>
                    <Ionicons name="time-outline" size={16} color="#71717A" />
                    <Text style={styles.detailText}>{building.hours}</Text>
                  </View>
                )}
                {building.phone && (
                  <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`tel:${building.phone}`)}>
                    <Ionicons name="call-outline" size={16} color="#3B82F6" />
                    <Text style={[styles.detailText, styles.detailLink]}>{building.phone}</Text>
                  </TouchableOpacity>
                )}
                {building.email && (
                  <TouchableOpacity style={styles.detailRow} onPress={() => Linking.openURL(`mailto:${building.email}`)}>
                    <Ionicons name="mail-outline" size={16} color="#3B82F6" />
                    <Text style={[styles.detailText, styles.detailLink]}>{building.email}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Offices */}
            <View style={styles.officeSection}>
              <Text style={styles.sectionLabel}>
                OFFICES · {building.offices?.length ?? 0}
              </Text>
            </View>

            {building.offices && building.offices.length > 0 ? (
              <ScrollView
                style={styles.officeList}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {building.offices.map((office, idx) => (
                  <View
                    key={office.id}
                    style={[
                      styles.officeRow,
                      idx === (building.offices!.length - 1) && styles.officeRowLast,
                    ]}
                  >
                    <View style={styles.officeLeft}>
                      <Text style={styles.staffName}>{office.staff_name}</Text>
                      <Text style={styles.roomNumber}>{office.room_number}</Text>
                    </View>
                    {office.floor != null && (
                      <View style={styles.floorBadge}>
                        <Text style={styles.floorText}>Floor {office.floor}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.noOfficeWrap}>
                <Text style={styles.noOfficeText}>No offices listed for this building.</Text>
              </View>
            )}
          </>
        ) : null}
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 200,
  },
  dragArea: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#3F3F46',
  },
  loadingWrap: {
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    color: '#71717A',
    fontSize: 14,
  },
  buildingImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#27272A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  colorBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  buildingName: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  description: {
    color: '#71717A',
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  goButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#27272A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  officeSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionLabel: {
    color: '#52525B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  officeList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  officeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 14,
    backgroundColor: '#27272A',
    borderRadius: 12,
    marginBottom: 8,
  },
  officeRowLast: {
    marginBottom: 0,
  },
  officeLeft: {
    flex: 1,
    gap: 2,
  },
  staffName: {
    color: '#FAFAFA',
    fontSize: 14,
    fontWeight: '500',
  },
  roomNumber: {
    color: '#71717A',
    fontSize: 12,
  },
  floorBadge: {
    backgroundColor: '#3F3F46',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
  },
  floorText: {
    color: '#A1A1AA',
    fontSize: 11,
    fontWeight: '600',
  },
  noOfficeWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  noOfficeText: {
    color: '#52525B',
    fontSize: 14,
    textAlign: 'center',
  },
  detailsSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  descriptionInDetails: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    color: '#A1A1AA',
    fontSize: 13,
  },
  detailLink: {
    color: '#3B82F6',
  },
});
