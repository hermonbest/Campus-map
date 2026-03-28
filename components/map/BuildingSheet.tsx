import React from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/tokens';
import { LocationData } from '@/lib/api';

interface BuildingSheetProps {
  isVisible: boolean;
  onClose: () => void;
  selectedLocation: LocationData | null;
  isDark: boolean;
  focusOffice?: string;
}

export default function BuildingSheet({ isVisible, onClose, selectedLocation, isDark, focusOffice }: BuildingSheetProps) {
  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      academic: 'school',
      dining: 'restaurant',
      dormitory: 'home',
      library: 'library',
      recreation: 'fitness',
      parking: 'car',
      administrative: 'business',
      health: 'medical',
      other: 'information-circle',
      // Additional categories
      'under construction': 'construct',
      classes: 'book',
      gym: 'barbell',
      parks: 'leaf',
      offices: 'business',
      labs: 'flask',
      dorms: 'bed',
      'housing staff': 'people',
      cafeteria: 'restaurant',
      construction: 'hammer',
      gate: 'enter-outline', // Using enter-outline icon for gates
      restroom: 'water-outline', // Using water-outline icon for restrooms
    };
    return icons[category] || 'information-circle';
  };

  // Don't render if not visible or no location
  if (!isVisible || !selectedLocation) {
    return null;
  }

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.detailsOverlay}>
        <TouchableOpacity
          style={styles.detailsBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.detailsSheet, { backgroundColor: isDark ? colors.primaryContainer : colors.white }]}>
          <View style={styles.detailsHandle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsScroll}>
            {/* Hero Image */}
            {selectedLocation.imageUrl && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: selectedLocation.imageUrl }}
                  style={styles.detailsImage}
                  resizeMode="cover"
                />
                <View style={styles.categoryBadge}>
                  <Ionicons name={getCategoryIcon(selectedLocation.category)} size={14} color={colors.onPrimaryContainer} />
                  <Text style={styles.categoryBadgeText}>
                    {selectedLocation.category.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}

            {/* Header Section */}
            <View style={styles.headerSection}>
              <View style={styles.titleRow}>
                <View style={[styles.iconContainer, { backgroundColor: isDark ? colors.primaryContainer : colors.secondaryContainer }]}>
                  <Text style={{ fontSize: 24 }}>{selectedLocation.icon || '📍'}</Text>
                </View>
                <View style={styles.titleContainer}>
                  <Text style={[styles.detailsTitle, { color: isDark ? colors.white : colors.primary }]}>
                    {selectedLocation.name}
                  </Text>
                  {selectedLocation.wheelchairAccessible && (
                    <View style={styles.accessibilityBadge}>
                      <Ionicons name="accessibility" size={12} color={colors.secondary} />
                      <Text style={styles.accessibilityBadgeText}>Wheelchair Accessible</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* Description */}
            <View style={styles.detailsSection}>
              <View style={styles.sectionHeader}>
                <Ionicons name="document-text-outline" size={18} color={colors.secondary} />
                <Text style={[styles.sectionLabel, { color: colors.secondary }]}>DESCRIPTION</Text>
              </View>
              <Text style={[styles.sectionText, { color: isDark ? colors.white : colors.text }]}>
                {selectedLocation.description || "No description available for this building."}
              </Text>
            </View>

            {/* Key Info Grid */}
            <View style={styles.infoGrid}>
              <View style={[styles.infoTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <View style={styles.infoTileContent}>
                  <Text style={styles.tileLabel}>HOURS</Text>
                  <Text style={[styles.tileValue, { color: isDark ? colors.white : colors.text }]}>
                    {selectedLocation.hours || "Not specified"}
                  </Text>
                </View>
              </View>

              <View style={[styles.infoTile, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                <Ionicons name="layers-outline" size={20} color={colors.primary} />
                <View style={styles.infoTileContent}>
                  <Text style={styles.tileLabel}>FLOORS</Text>
                  <Text style={[styles.tileValue, { color: isDark ? colors.white : colors.text }]}>
                    {selectedLocation.floorCount || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Amenities */}
            {selectedLocation.amenities && selectedLocation.amenities.trim() !== '' && (
              <View style={styles.detailsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="sparkles-outline" size={18} color={colors.secondary} />
                  <Text style={[styles.sectionLabel, { color: colors.secondary }]}>AMENITIES</Text>
                </View>
                <View style={styles.amenitiesContainer}>
                  {selectedLocation.amenities.split(',').filter(a => a.trim()).map((amenity, idx) => (
                    <View key={idx} style={[styles.amenityChip, { backgroundColor: isDark ? colors.primaryContainer : colors.secondaryContainer }]}>
                      <Ionicons name="checkmark-circle" size={14} color={isDark ? colors.onPrimaryContainer : colors.onSecondaryContainer} />
                      <Text style={[styles.amenityText, { color: isDark ? colors.onPrimaryContainer : colors.onSecondaryContainer }]}>
                        {amenity.trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Contact Information */}
            {(selectedLocation.phone || selectedLocation.website) && (
              <View style={styles.detailsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="call-outline" size={18} color={colors.secondary} />
                  <Text style={[styles.sectionLabel, { color: colors.secondary }]}>CONTACT</Text>
                </View>
                <View style={styles.contactRow}>
                  {selectedLocation.phone && (
                    <TouchableOpacity
                      style={[styles.contactBtn, { backgroundColor: isDark ? colors.primaryContainer : 'rgba(79, 70, 229, 0.1)' }]}
                      onPress={() => Linking.openURL(`tel:${selectedLocation.phone}`)}
                    >
                      <Ionicons name="call" size={18} color={colors.primary} />
                      <Text style={[styles.contactBtnText, { color: colors.primary }]}>{selectedLocation.phone}</Text>
                    </TouchableOpacity>
                  )}
                  {selectedLocation.website && (
                    <TouchableOpacity
                      style={[styles.contactBtn, { backgroundColor: isDark ? colors.secondaryContainer : 'rgba(6, 182, 212, 0.1)' }]}
                      onPress={() => Linking.openURL(selectedLocation.website!)}
                    >
                      <Ionicons name="globe" size={18} color={colors.secondary} />
                      <Text style={[styles.contactBtnText, { color: colors.secondary }]}>Website</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {/* Inside This Building Section */}
            {selectedLocation.offices && selectedLocation.offices.length > 0 && (
              <View style={styles.detailsSection}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="business-outline" size={18} color={colors.secondary} />
                  <Text style={[styles.sectionLabel, { color: colors.secondary }]}>INSIDE THIS BUILDING</Text>
                </View>
                <View style={styles.officesList}>
                  {selectedLocation.offices.map((office) => {
                    const isFocused = focusOffice === office.name;
                    return (
                      <View
                        key={office.id}
                        style={[
                          styles.officeCard,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
                          isFocused && { borderColor: colors.primary, borderWidth: 1.5, backgroundColor: isDark ? 'rgba(0,10,32,0.3)' : 'rgba(199,210,254,0.2)' }
                        ]}
                      >
                        <View style={styles.officeHeader}>
                          <View style={styles.officeNameRow}>
                            <Ionicons name="location-outline" size={16} color={colors.primary} />
                            <Text style={[styles.officeName, { color: isDark ? colors.white : colors.text }]}>{office.name}</Text>
                          </View>
                          <View style={[styles.floorBadge, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerHighest }]}>
                            <Ionicons name="arrow-up-circle" size={12} color={isDark ? colors.white : colors.text} />
                            <Text style={[styles.floorText, { color: isDark ? colors.white : colors.text }]}>FL {office.floor}</Text>
                          </View>
                        </View>
                        {office.description && (
                          <Text style={[styles.officeDesc, { color: isDark ? colors.white : colors.textMuted }]}>{office.description}</Text>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  detailsOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  detailsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  detailsSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  detailsHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 12,
  },
  detailsScroll: {
    padding: 24,
  },
  // Image Container
  imageContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  detailsImage: {
    width: '100%',
    height: 200,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },
  categoryBadge: {
    position: 'absolute',
    top: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    color: colors.white,
  },
  // Header Section
  headerSection: {
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  titleContainer: {
    flex: 1,
    paddingTop: 4,
  },
  detailsTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    lineHeight: 32,
  },
  accessibilityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  accessibilityBadgeText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: colors.secondary,
  },
  // Sections
  detailsSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1.5,
  },
  sectionText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
  },
  infoTileContent: {
    flex: 1,
  },
  tileLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: colors.outline,
    letterSpacing: 1,
    marginBottom: 4,
  },
  tileValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  // Amenities
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  amenityText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  // Contact
  contactRow: {
    flexDirection: 'row',
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  contactBtnText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  // Offices
  officesList: {
    gap: 12,
    marginTop: 8,
  },
  officeCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  officeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  officeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  officeName: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  floorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  floorText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  officeDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 20,
    marginLeft: 22,
  },
});
