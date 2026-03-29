import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Dimensions, Keyboard } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '../../styles/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBuildings } from '../../hooks/useBuildings';
import { useState } from 'react';
import { searchCampus, SearchResult, offlineSearch, getCachedBuildings, getCachedOffices } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { buildings, loading: buildingsLoading, refresh } = useBuildings();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Define category order and filter from actual buildings
  const definedOrder = ['academic', 'administrative', 'library', 'dormitory', 'dining', 'health'];
  
  // Get available categories from buildings and sort by defined order
  const availableCategories = [...new Set(buildings.map(b => b.category.toLowerCase()))];
  const orderedCategories = definedOrder.filter(cat => availableCategories.includes(cat));
  // Add any remaining categories not in defined order
  const remainingCategories = availableCategories.filter(cat => !definedOrder.includes(cat));
  const categories = ['All', ...orderedCategories, ...remainingCategories];
  
  // Filter buildings by selected category
  const filteredBuildings = selectedCategory && selectedCategory !== 'All' 
    ? buildings.filter(b => b.category.toLowerCase() === selectedCategory.toLowerCase())
    : buildings;

  // Debug function to test cache
  const testCache = async () => {
    console.log('Testing cache...');
    const buildings = await getCachedBuildings();
    const offices = await getCachedOffices();
    console.log('Cache test results:', {
      buildingsCount: buildings?.length || 0,
      officesCount: offices?.length || 0,
      sampleBuilding: buildings?.[0],
      sampleOffice: offices?.[0]
    });
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length === 0) {
      setFilteredResults([]);
      setIsOfflineMode(false);
      return;
    }
    
    // Don't search if less than 2 characters (except when clearing)
    if (text.trim().length < 2) {
      setFilteredResults([]);
      return;
    }
    
    setIsSearching(true);
    try {
      const results = await searchCampus(text);
      setFilteredResults(results);
      setIsOfflineMode(false);
      console.log('Online search results:', results.length);
    } catch (error) {
      // Fall back to enhanced offline search
      console.log('API search failed, using offline search with offices');
      try {
        const offlineResults = await offlineSearch(text);
        setFilteredResults(offlineResults);
        setIsOfflineMode(true);
        console.log('Offline search returned:', offlineResults.length, 'results');
      } catch (offlineError) {
        console.error('Offline search also failed:', offlineError);
        setFilteredResults([]);
        setIsOfflineMode(true);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const onSelectLocation = (item: SearchResult) => {
    Keyboard.dismiss();
    router.push({
      pathname: '/',
      params: {
        locationId: item.buildingId,
        focusOffice: item.type === 'office' ? item.name : undefined
      }
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: isDark ? colors.primary : colors.surface, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: isDark ? colors.white : colors.primary }]}>KUE Search</Text>
        </View>
        <Image style={styles.profileImg} source={require('../../assets/kue_logo.png')} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Input Section */}
        <View style={styles.searchSection}>
          <View style={[styles.searchBox, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerHighest }]}>
            <Ionicons name="search" size={24} color={colors.outline} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.primary }]}
              placeholder="Find departments, labs..."
              placeholderTextColor={'rgba(0,0,0,0.4)'}
              value={searchQuery}
              onChangeText={handleSearch}
            />
          </View>

          {isOfflineMode && searchQuery.length > 0 && (
            <View style={[styles.offlineIndicator, { backgroundColor: isDark ? 'rgba(255,152,0,0.2)' : 'rgba(255,152,0,0.1)' }]}>
              <Ionicons name="alert-circle" size={16} color="#ff9800" />
              <Text style={[styles.offlineText, { color: '#ff9800' }]}>Offline Mode - Limited Results</Text>
            </View>
          )}

          {searchQuery.length > 0 && filteredResults.length > 0 && (
            <View style={[styles.resultsList, { backgroundColor: isDark ? colors.surfaceContainerLow : colors.surfaceContainerLowest }]}>
              {filteredResults.map((item) => (
                <TouchableOpacity
                  key={`${item.type}-${item.id}`}
                  style={[styles.resultItem, { borderBottomColor: 'rgba(0,0,0,0.05)' }]}
                  onPress={() => onSelectLocation(item)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                    <View style={[styles.resultIconContainer, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerHighest }]}>
                      <Text style={{ fontSize: 18 }}>{item.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultName, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
                      <Text style={[styles.resultCategory, { color: colors.textMuted }]} numberOfLines={1}>{item.category.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.outline} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {searchQuery.length > 0 && filteredResults.length === 0 && !isSearching && (
            <View style={styles.noResults}>
              <Text style={{ color: colors.textMuted, fontFamily: 'Inter_500Medium' }}>No results found</Text>
            </View>
          )}

          {isSearching && (
            <View style={styles.noResults}>
              <Text style={{ color: colors.textMuted, fontFamily: 'Inter_500Medium' }}>Searching...</Text>
            </View>
          )}

          {searchQuery.length === 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
              {categories.map((cat) => (
                <TouchableOpacity 
                  key={cat}
                  onPress={() => setSelectedCategory(cat === 'All' ? null : cat)}
                  style={[
                    styles.filterChip, 
                    (cat === 'All' ? selectedCategory === null : selectedCategory === cat) 
                      ? styles.filterChipActive 
                      : { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerHighest }
                  ]}
                >
                  <Text style={
                    (cat === 'All' ? selectedCategory === null : selectedCategory === cat) 
                      ? styles.filterChipActiveText 
                      : { color: colors.text, fontSize: 14, fontFamily: 'Inter_500Medium' }
                  }>{cat.charAt(0).toUpperCase() + cat.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Building Directory - Show when no search */}
        {searchQuery.length === 0 && filteredBuildings.length > 0 && (
          <View style={styles.buildingsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              📍 {selectedCategory || 'All'} Buildings ({filteredBuildings.length})
            </Text>
            <View style={styles.buildingsGrid}>
              {filteredBuildings.map((building) => (
                <TouchableOpacity
                  key={building.id}
                  style={[styles.buildingCard, { 
                    backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerLowest,
                  }]}
                  onPress={() => onSelectLocation({
                    id: building.id,
                    name: building.name,
                    type: 'building',
                    category: building.category,
                    icon: building.icon,
                    description: building.description,
                    buildingId: building.id
                  })}
                >
                  <Text style={{ fontSize: 32, marginBottom: 8, color: isDark ? colors.white : colors.text }}>{building.icon}</Text>
                  <Text style={[styles.buildingName, { color: colors.text }]} numberOfLines={2}>
                    {building.name}
                  </Text>
                  <Text style={[styles.buildingCategory, { color: colors.textMuted }]}>
                    {building.category}
                  </Text>
                  {building.offices && building.offices.length > 0 && (
                    <View style={styles.officeCountBadge}>
                      <Text style={styles.officeCountText}>{building.offices.length} offices</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuBtn: {
    padding: 8,
    borderRadius: 24,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
    letterSpacing: -0.5,
  },
  profileImg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e1e3e4',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  searchSection: {
    marginBottom: 32,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  filterScroll: {
    marginTop: 20,
    marginLeft: -24,
  },
  filterContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipActiveText: {
    color: colors.white,
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  sectionHeading: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    letterSpacing: 2,
    marginBottom: 16,
  },
  recentSection: {
    marginBottom: 24,
  },
  recentList: {
    gap: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  recentText: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  discoverCard: {
    height: 250,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  discoverImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  discoverOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  discoverContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  discoverBadge: {
    backgroundColor: colors.secondaryContainer,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  discoverBadgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: colors.onSecondaryContainer,
    letterSpacing: 1,
  },
  discoverTitle: {
    color: colors.white,
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 4,
  },
  discoverDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  resultsList: {
    marginTop: 16,
    borderRadius: 16,
    padding: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  resultName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 2,
  },
  resultCategory: {
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.5,
  },
  resultIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noResults: {
    marginTop: 32,
    alignItems: 'center',
  },
  offlineIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  offlineText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  buildingsSection: {
    marginTop: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    marginBottom: 16,
    marginLeft: 4,
  },
  buildingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  buildingCard: {
    width: '47%',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buildingName: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
    marginBottom: 4,
  },
  buildingCategory: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: 8,
  },
  officeCountBadge: {
    backgroundColor: colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  officeCountText: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: colors.onPrimaryContainer,
  },
});
