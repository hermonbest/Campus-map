import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/tokens';
import { LocationData } from '@/lib/api';

interface ActiveLocationCardProps {
  selectedLocation: LocationData | null;
  onClose: () => void;
  onNavigate: () => void;
  onOpenDetails: () => void;
  isDark: boolean;
}

export default function ActiveLocationCard({ selectedLocation, onClose, onNavigate, onOpenDetails, isDark }: ActiveLocationCardProps) {
  if (!selectedLocation) return null;

  return (
    <View style={[styles.activeInfoCard, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerLowest }]}>
      <View style={[styles.goldPillar, { backgroundColor: colors.secondary }]} />
      <View style={styles.infoContent}>
        <Text style={[styles.currentlyAtText, { color: colors.secondary }]}>CURRENTLY AT</Text>
        <View style={styles.infoRow}>
          <Text style={[styles.activeTitle, { color: isDark ? colors.primary : colors.white}]} numberOfLines={1}>
            {selectedLocation.name}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={isDark ? colors.outlineVariant : colors.outline} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.activeDesc, { color: isDark ? colors.primary : colors.primary }]} numberOfLines={3}>
          {selectedLocation.description || "No description available for this building."}
        </Text>
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.navButtonPrimary, { backgroundColor: colors.primary }]} onPress={onNavigate}>
            <Ionicons name="walk" size={16} color="white" />
            <Text style={styles.navButtonText}>Navigate</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.detailsButton}
            onPress={onOpenDetails}
          >
            <Text style={[styles.detailsButtonText, { color: colors.primary }]}>DETAILS</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  activeInfoCard: {
    position: 'absolute',
    bottom: 100, // Above bottom nav
    left: 24,
    right: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 30,
    flexDirection: 'row',
  },
  goldPillar: {
    width: 4,
  },
  infoContent: {
    flex: 1,
    padding: 24,
  },
  currentlyAtText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 2,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  activeTitle: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
    flex: 1,
  },
  activeDesc: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    lineHeight: 22,
    marginBottom: 20,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navButtonPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  navButtonText: {
    color: 'white',
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  detailsButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  detailsButtonText: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
});
