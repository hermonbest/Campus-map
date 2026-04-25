import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
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

interface SearchResult {
  type: 'building' | 'office';
  building: Building;
  office?: Office;
  displayText: string;
  subText: string;
}

interface SearchModalProps {
  visible: boolean;
  onClose: () => void;
  buildings: Building[];
  onSelect: (building: Building, office?: Office) => void;
}

export function SearchModal({ visible, onClose, buildings, onSelect }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setResults([]);
      return;
    }

    setLoading(true);
    const query = searchQuery.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search buildings
    buildings.forEach((building) => {
      // Match building name
      if (building.name.toLowerCase().includes(query)) {
        searchResults.push({
          type: 'building',
          building,
          displayText: building.name,
          subText: building.description || 'Building',
        });
      }

      // Search offices within this building
      if (building.offices && building.offices.length > 0) {
        building.offices.forEach((office) => {
          const matchRoom = office.room_number.toLowerCase().includes(query);
          const matchStaff = office.staff_name.toLowerCase().includes(query);

          if (matchRoom || matchStaff) {
            searchResults.push({
              type: 'office',
              building,
              office,
              displayText: `${office.room_number} - ${office.staff_name}`,
              subText: building.name,
            });
          }
        });
      }
    });

    // Sort results: exact matches first, then starts with, then contains
    searchResults.sort((a, b) => {
      const aExact = a.displayText.toLowerCase() === query;
      const bExact = b.displayText.toLowerCase() === query;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;

      const aStarts = a.displayText.toLowerCase().startsWith(query);
      const bStarts = b.displayText.toLowerCase().startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      return a.displayText.localeCompare(b.displayText);
    });

    setResults(searchResults);
    setLoading(false);
  }, [searchQuery, buildings]);

  const handleSelect = (result: SearchResult) => {
    onSelect(result.building, result.office);
    onClose();
    setSearchQuery('');
    setResults([]);
  };

  const handleClose = () => {
    onClose();
    setSearchQuery('');
    setResults([]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={handleClose}
      transparent={true}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContainer}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <Text style={styles.title}>Search</Text>
              <View style={styles.placeholder} />
            </View>

            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search buildings or offices..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <ScrollView style={styles.resultsContainer}>
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#3B82F6" />
                </View>
              ) : searchQuery.trim() === '' ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Start typing to search...</Text>
                </View>
              ) : results.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No results found</Text>
                </View>
              ) : (
                results.map((result, index) => (
                  <TouchableOpacity
                    key={`${result.type}-${result.building.id}-${result.office?.id || index}`}
                    style={styles.resultItem}
                    onPress={() => handleSelect(result)}
                  >
                    <View style={styles.resultIconContainer}>
                      <View
                        style={[
                          styles.resultIcon,
                          { backgroundColor: result.building.color },
                        ]}
                      >
                        <Ionicons 
                          name={result.type === 'building' ? 'business' : 'briefcase'} 
                          size={20} 
                          color="#FFFFFF" 
                        />
                      </View>
                    </View>
                    <View style={styles.resultTextContainer}>
                      <Text style={styles.resultDisplayText}>{result.displayText}</Text>
                      <Text style={styles.resultSubText}>{result.subText}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FAFAFA',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    maxHeight: '85%',
    minHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  cancelButton: {
    padding: 8,
    backgroundColor: '#E4E4E7',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontSize: 13,
    color: '#18181B',
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#18181B',
    letterSpacing: -0.3,
  },
  placeholder: {
    width: 60,
  },
  searchContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    fontSize: 15,
    color: '#18181B',
    borderWidth: 1,
    borderColor: 'rgba(226,232,240,0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  resultsContainer: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  resultIconContainer: {
    marginRight: 16,
  },
  resultIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultDisplayText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#18181B',
    letterSpacing: -0.2,
  },
  resultSubText: {
    fontSize: 13,
    color: '#71717A',
    marginTop: 4,
  },
});
