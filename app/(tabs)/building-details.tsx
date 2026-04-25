import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator, TouchableOpacity, Image, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

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
  x_pos: number;
  y_pos: number;
  color: string;
  icon_type: string;
  entrance_node_id: string | null;
  image_url: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours: string | null;
  offices?: Office[];
}

export default function BuildingDetails() {
  const { buildingId } = useLocalSearchParams<{ buildingId: string }>();
  const router = useRouter();
  const [building, setBuilding] = useState<Building | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (buildingId) {
      loadBuildingDetails();
    }
  }, [buildingId]);

  const loadBuildingDetails = async () => {
    try {
      setLoading(true);
      
      // Fetch building with offices
      const { data: buildingData, error: buildingError } = await supabase
        .from('buildings')
        .select('*, offices(*)')
        .eq('id', buildingId)
        .eq('is_active', true)
        .single();

      if (buildingError) throw buildingError;
      
      if (buildingData) {
        setBuilding(buildingData);
      }
    } catch (error) {
      console.error('Error loading building details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading building details...</Text>
      </View>
    );
  }

  if (!building) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Building not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>← Back to Map</Text>
        </TouchableOpacity>

        {building.image_url && (
          <Image 
            source={{ uri: building.image_url }} 
            style={styles.buildingImage}
            resizeMode="cover"
          />
        )}

        <View style={styles.header}>
          <View style={[styles.colorBadge, { backgroundColor: building.color }]}>
            <Ionicons name="business" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.buildingName}>{building.name}</Text>
        </View>

        {(building.hours || building.phone || building.email || building.website) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Details</Text>
            <View style={styles.detailsGrid}>
              {building.hours && (
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={20} color="#71717A" />
                  <View style={styles.detailTextContent}>
                    <Text style={styles.detailLabel}>Hours</Text>
                    <Text style={styles.detailValue}>{building.hours}</Text>
                  </View>
                </View>
              )}
              {building.phone && (
                <TouchableOpacity 
                  style={styles.detailItem}
                  onPress={() => Linking.openURL(`tel:${building.phone}`)}
                >
                  <Ionicons name="call-outline" size={20} color="#3B82F6" />
                  <View style={styles.detailTextContent}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={[styles.detailValue, { color: '#3B82F6' }]}>{building.phone}</Text>
                  </View>
                </TouchableOpacity>
              )}
              {building.email && (
                <TouchableOpacity 
                  style={styles.detailItem}
                  onPress={() => Linking.openURL(`mailto:${building.email}`)}
                >
                  <Ionicons name="mail-outline" size={20} color="#3B82F6" />
                  <View style={styles.detailTextContent}>
                    <Text style={styles.detailLabel}>Email</Text>
                    <Text style={[styles.detailValue, { color: '#3B82F6' }]}>{building.email}</Text>
                  </View>
                </TouchableOpacity>
              )}
              {building.website && (
                <TouchableOpacity 
                  style={styles.detailItem}
                  onPress={() => Linking.openURL(building.website!)}
                >
                  <Ionicons name="globe-outline" size={20} color="#3B82F6" />
                  <View style={styles.detailTextContent}>
                    <Text style={styles.detailLabel}>Website</Text>
                    <Text style={[styles.detailValue, { color: '#3B82F6' }]}>Visit Website</Text>
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {building.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{building.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Offices ({building.offices?.length || 0})
          </Text>
          
          {building.offices && building.offices.length > 0 ? (
            building.offices.map((office) => (
              <View key={office.id} style={styles.officeCard}>
                <Text style={styles.roomNumber}>{office.room_number}</Text>
                <Text style={styles.staffName}>{office.staff_name}</Text>
                {office.floor && (
                  <Text style={styles.floor}>Floor {office.floor}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noOffices}>No offices in this building</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
  },
  backButtonText: {
    fontSize: 15,
    color: '#18181B',
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  buildingImage: {
    width: '100%',
    height: 250,
    backgroundColor: '#E4E4E7',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226,232,240,0.5)',
  },
  colorBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '600',
  },
  buildingName: {
    fontSize: 28,
    fontWeight: '600',
    color: '#18181B',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  detailsGrid: {
    gap: 20,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  detailTextContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A1A1AA',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    color: '#3F3F46',
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#18181B',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 15,
    color: '#71717A',
    lineHeight: 26,
  },
  officeCard: {
    padding: 20,
    backgroundColor: '#FAFAFA',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.5)',
  },
  roomNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#18181B',
  },
  staffName: {
    fontSize: 15,
    color: '#71717A',
    marginTop: 4,
  },
  floor: {
    fontSize: 13,
    color: '#A1A1AA',
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  noOffices: {
    fontSize: 16,
    color: '#999',
    fontStyle: 'italic',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: '#dc2626',
    fontSize: 16,
    textAlign: 'center',
  },
});
