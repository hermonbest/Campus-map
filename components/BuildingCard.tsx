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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCachedBuildingImage } from '../lib/cache';
import { Building, Office } from '../lib/types';

interface BuildingCardProps {
  building: Building | null;
  loading?: boolean;
  onClose: () => void;
  onRouteToBuilding?: (building: Building) => void;
  expanded?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_COLLAPSED_HEIGHT = SCREEN_HEIGHT * 0.52;
const COLLAPSED_Y = SCREEN_HEIGHT - CARD_COLLAPSED_HEIGHT;
const EXPANDED_Y = 0;

export default function BuildingCard({ building, loading = false, onClose, onRouteToBuilding, expanded = false }: BuildingCardProps) {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [cachedImagePath, setCachedImagePath] = useState<string | null>(null);

  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isExpandedRef = useRef(false);
  const scrollOffset = useRef(0);
  const lastScrollTime = useRef(0);

  useEffect(() => {
    isExpandedRef.current = isExpanded;
  }, [isExpanded]);

  useEffect(() => {
    setIsExpanded(expanded);
  }, [expanded]);

  useEffect(() => {
    if (building || loading) {
      animateTo(isExpanded ? EXPANDED_Y : COLLAPSED_Y);
    } else {
      setIsExpanded(false);
      animateTo(SCREEN_HEIGHT);
    }
  }, [building, loading, isExpanded]);

  const animateTo = (toValue: number) => {
    Animated.spring(translateY, {
      toValue,
      useNativeDriver: true,
      damping: 30,
      stiffness: 180,
      mass: 1,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gesture) => {
        if (!isExpandedRef.current) {
          return Math.abs(gesture.dy) > 5;
        }

        const isAtTop = scrollOffset.current <= 0;
        const isRecentlyScrolling = Date.now() - lastScrollTime.current < 100;
        const isPullingDown = gesture.dy > 15 && gesture.vy > 0;

        if (isExpandedRef.current && isAtTop && isPullingDown && !isRecentlyScrolling) {
          return true;
        }

        return false;
      },
      onPanResponderMove: (_, gesture) => {
        if (Math.abs(gesture.dy) < 10) return;

        const currentPos = isExpandedRef.current ? EXPANDED_Y : COLLAPSED_Y;
        const newY = currentPos + gesture.dy;

        const clampedY = Math.min(
          Math.max(newY, EXPANDED_Y),
          SCREEN_HEIGHT
        );

        translateY.setValue(clampedY);
      },
      onPanResponderRelease: (_, gesture) => {
        const { dy, vy } = gesture;

        if (isExpandedRef.current) {
          if (dy > 120 || vy > 0.5) {
            setIsExpanded(false);
          } else {
            animateTo(EXPANDED_Y);
          }
        } else {
          if (dy < -80 || vy < -0.5) {
            setIsExpanded(true);
          } else if (dy > 100 || vy > 0.5) {
            onClose();
          } else {
            animateTo(COLLAPSED_Y);
          }
        }
      },
    })
  ).current;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollOffset.current = Math.max(0, event.nativeEvent.contentOffset.y);
    lastScrollTime.current = Date.now();
  };

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      if (building?.image_url) {
        const cached = await getCachedBuildingImage(building.id);
        if (isMounted) {
          setCachedImagePath(cached);
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [building?.id]);

  if (!building && !loading) return null;

  return (
    <>
      <View
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
      >
        <TouchableOpacity
          style={{ height: COLLAPSED_Y }}
          onPress={onClose}
          activeOpacity={1}
        />
      </View>

      <Animated.View
        style={[
          styles.card,
          {
            height: SCREEN_HEIGHT,
            transform: [{ translateY }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.dragArea}>
          <View style={styles.handle} />
        </View>

        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
          {loading ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="small" color="#A1A1AA" />
              <Text style={styles.loadingText}>Loading…</Text>
            </View>
          ) : building ? (
            <ScrollView 
              style={styles.contentScroll} 
              contentContainerStyle={{ paddingBottom: 60 }}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              bounces={false}
            >
              {building.image_url && (
                <Image 
                  source={{ uri: cachedImagePath || building.image_url }} 
                  style={styles.buildingImage}
                  resizeMode="cover"
                />
              )}
              
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

              <View style={styles.officeSection}>
                <Text style={styles.sectionLabel}>
                  OFFICES · {building.offices?.length ?? 0}
                </Text>
              </View>

              {building.offices && building.offices.length > 0 ? (
                <View style={styles.officeList}>
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
                </View>
              ) : (
                <View style={styles.noOfficeWrap}>
                  <Text style={styles.noOfficeText}>No offices listed for this building.</Text>
                </View>
              )}
            </ScrollView>
          ) : null}
        </View>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 20,
    zIndex: 200,
    overflow: 'hidden',
  },
  dragArea: {
    width: '100%',
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  handle: {
    width: 40,
    height: 5,
    backgroundColor: '#3F3F46',
    borderRadius: 3,
  },
  contentScroll: {
    flex: 1,
  },
  buildingName: {
    color: '#FAFAFA',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  loadingWrap: {
    alignItems: 'center',
    gap: 10,
    marginTop: 50,
  },
  loadingText: {
    color: '#71717A',
    fontSize: 14,
  },
  buildingImage: {
    width: '100%',
    height: 150,
    backgroundColor: '#27272A',
    marginBottom: 16,
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
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  noOfficeText: {
    color: '#52525B',
    fontSize: 14,
    textAlign: 'center',
  },
});
