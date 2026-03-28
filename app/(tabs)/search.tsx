import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Dimensions, Keyboard } from 'react-native';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '../../styles/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useBuildings } from '../../hooks/useBuildings';
import { useState } from 'react';
import { searchCampus, SearchResult } from '../../lib/api';

const { width } = Dimensions.get('window');

export default function SearchScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const { buildings, loading: buildingsLoading, refresh } = useBuildings();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.trim().length > 0) {
      setIsSearching(true);
      try {
        const results = await searchCampus(text);
        setFilteredResults(results);
      } catch (error) {
        // Quietly fall back to local building search if offline
        if (buildings) {
          const local = buildings.filter((loc) =>
            loc.name.toLowerCase().includes(text.toLowerCase())
          );
          setFilteredResults(local.map(b => ({
            id: b.id,
            name: b.name,
            type: 'building',
            category: b.category,
            icon: b.icon,
            description: b.description,
            buildingId: b.id
          })));
        }
      } finally {
        setIsSearching(false);
      }
    } else {
      setFilteredResults([]);
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
          <Text style={[styles.title, { color: isDark ? colors.white : colors.primary }]}>KUE </Text>
          {__DEV__ && (
            <TouchableOpacity 
              onPress={async () => {
                try {
                  await refresh();
                  import('react-native-toast-message').then(Toast => Toast.default.show({
                    type: 'success',
                    text1: 'Data synced for dev',
                    position: 'bottom',
                  }));
                } catch (e) {
                  console.warn("Dev sync failed:", e);
                }
              }}
              style={{ marginLeft: 8, padding: 4 }}
            >
              <Ionicons name="sync-outline" size={16} color={isDark ? colors.white : colors.primary} />
            </TouchableOpacity>
          )}
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
              <View style={[styles.filterChip, styles.filterChipActive]}>
                <Text style={styles.filterChipActiveText}>Buildings</Text>
              </View>
              {['Events', 'Services', 'Faculties', 'Spaces'].map(cat => (
                <View key={cat} style={[styles.filterChip, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerHighest }]}>
                  <Text style={{ color: colors.text, fontSize: 14, fontFamily: 'Inter_500Medium' }}>{cat}</Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent & Trending */}
        <View style={styles.recentSection}>
          <Text style={[styles.sectionHeading, { color: colors.outline }]}>RECENT SEARCHES</Text>
          <View style={styles.recentList}>
            {['Main Library Level 3', 'Bio-Engineering Dept.', 'Student Union Café'].map((item) => (
              <TouchableOpacity key={item} style={styles.recentItem}>
                <Ionicons name="time-outline" size={18} color={'rgba(0,0,0,0.4)'} />
                <Text style={[styles.recentText, { color: colors.text }]}>{item}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Discovery Card */}
        <View style={{ marginTop: 24, marginBottom: 120 }}>
          <Text style={[styles.sectionHeading, { color: colors.outline }]}>CURATED FOR YOU</Text>
          <TouchableOpacity activeOpacity={0.9} style={styles.discoverCard}>
            <Image style={styles.discoverImage} source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDvRew7f225xNxDDk3lsdesvCJMKDHXmJ5kUQ7Ny6lpQBQA3wp82Lm6SSBIHDzpL3wHVr5piQswoBhwmmdN8NMJnhOvgZDbXDlH9o1pInjr6266-BYVWv65MTRc8IH6Zb2Mr9jRGe3Se7sP3RrML83oox9BNmYwu3R29YHRjc4QPv_VLtEKQKuIS7502-Fy65A8Uw77YhRd-6aH-tI31-MmfpopgVqpRZ0XwFANJpl2JVgj2JBrxgmxf7SBS-rCjGVM-_TClfguLWY" }} />
            <View style={styles.discoverOverlay} />
            <View style={styles.discoverContent}>
              <View style={styles.discoverBadge}>
                <Text style={styles.discoverBadgeText}>FEATURED</Text>
              </View>
              <Text style={styles.discoverTitle}>School of Visual Arts</Text>
              <Text style={styles.discoverDesc}>Explore the new digital media galleries.</Text>
            </View>
          </TouchableOpacity>
        </View>
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
  }
});
