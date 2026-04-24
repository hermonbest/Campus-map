import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';

interface Office {
  id: string;
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

        <View style={styles.header}>
          <View style={[styles.colorBadge, { backgroundColor: building.color }]}>
            <Text style={styles.badgeText}>B</Text>
          </View>
          <Text style={styles.buildingName}>{building.name}</Text>
        </View>

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
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  backButton: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  colorBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  buildingName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  section: {
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
  },
  officeCard: {
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  roomNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  staffName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  floor: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
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
