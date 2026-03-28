import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/styles/tokens';

interface SearchOverlayProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onClearSearch: () => void;
  searchResults: any[];
  onSelectResult: (item: any) => void;
  isDark: boolean;
  topInset: number;
}

export default function SearchOverlay({
  searchQuery,
  onSearchChange,
  onClearSearch,
  searchResults,
  onSelectResult,
  isDark,
  topInset
}: SearchOverlayProps) {
  return (
    <View style={[styles.searchOverlay, { top: Math.max(topInset, 16) + 70 }]}>
      <View style={[styles.modernSearchBox, { backgroundColor: isDark ? 'rgba(0,10,30,0.85)' : 'rgba(248,249,250,0.85)' }]}>
        <Ionicons name="search" size={20} color={isDark ? colors.white : colors.primary} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: isDark ? colors.white : colors.primary }]}
          placeholder="Search campus landmarks..."
          placeholderTextColor={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(25,28,29,0.6)'}
          value={searchQuery}
          onChangeText={onSearchChange}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={onClearSearch}>
            <Ionicons name="close-circle" size={20} color={isDark ? colors.white : colors.outline} />
          </TouchableOpacity>
        )}
      </View>

      {searchResults.length > 0 && (
        <View style={[styles.dropdown, { backgroundColor: isDark ? colors.surfaceContainerHigh : colors.surfaceContainerLowest }]}>
          <FlatList
            data={searchResults}
            keyExtractor={(item) => `${item.type}-${item.id}`}
            style={{ maxHeight: 250 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.dropdownItem, { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}
                onPress={() => onSelectResult(item)}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Text style={{ fontSize: 18 }}>{item.icon || (item.type === 'office' ? '🏢' : '📍')}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.dropdownItemText, { color: isDark ? colors.white : colors.text }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.dropdownItemSub, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textMuted }]} numberOfLines={1}>
                      {item.type === 'office' ? `Office • ${item.category}` : item.category}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    zIndex: 40,
  },
  modernSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 52,
    borderRadius: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 8,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
  },
  dropdownItemText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 4,
  },
  dropdownItemSub: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
});
