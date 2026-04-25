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
                        <Text style={styles.resultIconText}>
                          {result.type === 'building' ? 'B' : 'O'}
                        </Text>
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    minHeight: '50%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  cancelButton: {
    padding: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  placeholder: {
    width: 50,
  },
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultIconContainer: {
    marginRight: 12,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultIconText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultTextContainer: {
    flex: 1,
  },
  resultDisplayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  resultSubText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
