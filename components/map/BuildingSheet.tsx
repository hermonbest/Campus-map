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
  if (!selectedLocation) return null;

  return (
    <Modal visible={isVisible} transparent animationType="slide">
      <View style={styles.detailsOverlay}>
        <TouchableOpacity
          style={styles.detailsBackdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.detailsSheet, { backgroundColor: isDark ? colors.surfaceContainerLowest : colors.white }]}>
          <View style={styles.detailsHandle} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsScroll}>
            <View style={styles.detailsHeader}>
              <Text style={[styles.detailsTitle, { color: isDark ? colors.white : colors.primary }]}>
                {selectedLocation.name}
              </Text>
              <TouchableOpacity onPress={onClose} style={styles.detailsCloseBtn}>
                <Ionicons name="close-circle" size={32} color={colors.outline} />
              </TouchableOpacity>
            </View>

            <View style={[styles.categoryBadge, { backgroundColor: isDark ? colors.primaryContainer : colors.secondaryContainer }]}>
              <Text style={[styles.categoryBadgeText, { color: isDark ? colors.onPrimaryContainer : colors.onSecondaryContainer }]}>
                {selectedLocation.category.toUpperCase()}
              </Text>
            </View>

            {selectedLocation.imageUrl && (
              <Image
                source={{ uri: selectedLocation.imageUrl }}
                style={styles.detailsImage}
                resizeMode="cover"
              />
            )}

            <View style={styles.detailsSection}>
              <Text style={[styles.sectionLabel, { color: colors.secondary }]}>DESCRIPTION</Text>
              <Text style={[styles.sectionText, { color: isDark ? colors.outlineVariant : colors.text }]}>
                {selectedLocation.description || "No description available for this building."}
              </Text>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoTile}>
                <Ionicons name="time-outline" size={20} color={colors.primary} />
                <View>
                  <Text style={styles.tileLabel}>HOURS</Text>
                  <Text style={[styles.tileValue, { color: isDark ? colors.white : colors.text }]}>
                    {selectedLocation.hours || "Not specified"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoTile}>
                <Ionicons name="layers-outline" size={20} color={colors.primary} />
                <View>
                  <Text style={styles.tileLabel}>FLOORS</Text>
                  <Text style={[styles.tileValue, { color: isDark ? colors.white : colors.text }]}>
                    {selectedLocation.floorCount || "N/A"}
                  </Text>
                </View>
              </View>
            </View>

            {selectedLocation.amenities && (
              <View style={styles.detailsSection}>
                <Text style={[styles.sectionLabel, { color: colors.secondary }]}>AMENITIES</Text>
                <View style={styles.amenitiesContainer}>
                  {selectedLocation.amenities.split(',').map((amenity, idx) => (
                    <View key={idx} style={[styles.amenityChip, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                      <Text style={[styles.amenityText, { color: isDark ? colors.outlineVariant : colors.textMuted }]}>
                        {amenity.trim()}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.contactRow}>
              {selectedLocation.phone && (
                <TouchableOpacity
                  style={[styles.contactBtn, { backgroundColor: colors.primaryContainer }]}
                  onPress={() => Linking.openURL(`tel:${selectedLocation.phone}`)}
                >
                  <Ionicons name="call" size={18} color={colors.primary} />
                  <Text style={[styles.contactBtnText, { color: colors.primary }]}>Call</Text>
                </TouchableOpacity>
              )}
              {selectedLocation.website && (
                <TouchableOpacity
                  style={[styles.contactBtn, { backgroundColor: colors.secondaryContainer }]}
                  onPress={() => Linking.openURL(selectedLocation.website!)}
                >
                  <Ionicons name="globe" size={18} color={colors.secondary} />
                  <Text style={[styles.contactBtnText, { color: colors.secondary }]}>Website</Text>
                </TouchableOpacity>
              )}
            </View>
            {selectedLocation.wheelchairAccessible && (
              <View style={styles.accessibilityNote}>
                <Ionicons name="body" size={16} color={colors.secondary} />
                <Text style={[styles.accessibilityText, { color: colors.secondary }]}>Wheelchair Accessible</Text>
              </View>
            )}

            {/* Inside This Building Section */}
            {selectedLocation.offices && selectedLocation.offices.length > 0 && (
              <View style={styles.detailsSection}>
                <Text style={[styles.sectionLabel, { color: colors.secondary }]}>INSIDE THIS BUILDING</Text>
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
                          <Text style={[styles.officeName, { color: isDark ? colors.white : colors.text }]}>{office.name}</Text>
                          <View style={[styles.floorBadge, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerHighest }]}>
                            <Text style={[styles.floorText, { color: isDark ? colors.white : colors.text }]}>FL {office.floor}</Text>
                          </View>
                        </View>
                        {office.description && (
                          <Text style={[styles.officeDesc, { color: isDark ? colors.outlineVariant : colors.textMuted }]}>{office.description}</Text>
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
  detailsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  detailsTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    flex: 1,
    marginRight: 16,
  },
  detailsCloseBtn: {
    marginTop: -4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 20,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  detailsImage: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    marginBottom: 24,
  },
  detailsSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  sectionText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 24,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  infoTile: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 16,
  },
  tileLabel: {
    fontSize: 9,
    fontFamily: 'Inter_700Bold',
    color: colors.outline,
    letterSpacing: 1,
  },
  tileValue: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  amenityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  amenityText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 16,
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
  accessibilityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  accessibilityText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  officesList: {
    gap: 12,
    marginTop: 8,
  },
  officeCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  officeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  officeName: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    flex: 1,
    marginRight: 10,
  },
  floorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  floorText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  officeDesc: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
  },
});
