import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, ActivityIndicator, RefreshControl, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors } from '../../styles/tokens';
import { Ionicons } from '@expo/vector-icons';
import { useNotices } from '../../hooks/useNotices';

const { width } = Dimensions.get('window');

export default function NoticesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
   const { notices, loading, error, refresh } = useNotices();
  const [selectedNotice, setSelectedNotice] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNoticeClick = (notice: any) => {
    setSelectedNotice(notice);
    setIsModalOpen(true);
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options).toUpperCase();
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]} edges={['top']}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: isDark ? colors.primary : colors.surface, borderBottomWidth: 1, borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: isDark ? colors.white : colors.primary }]}>CAMPUS CURATOR</Text>
        </View>
        <Image style={styles.profileImg} source={require('../../assets/kue_logo.png')} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading && notices.length > 0} onRefresh={refresh} tintColor={isDark ? colors.white : colors.primary} />}
      >
        {/* Editoral Hero */}
        <View style={styles.heroSection}>
          <Text style={styles.heroSub}>UNIVERSITY HUB</Text>
          <Text style={[styles.heroTitle, { color: colors.primary }]}>
            The Campus Notice Board.
          </Text>
        </View>

        {loading && notices.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
            <ActivityIndicator size="large" color={colors.secondary} />
            <Text style={{ marginTop: 16, color: colors.textMuted, fontFamily: 'Inter_500Medium' }}>Fetching updates...</Text>
          </View>
        ) : notices.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="notifications-off-outline" size={64} color={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'} />
            <Text style={{ marginTop: 16, color: colors.textMuted, fontFamily: 'Inter_500Medium', fontSize: 18 }}>No new notices</Text>
            <Text style={{ color: colors.outline, fontSize: 14 }}>Try again later</Text>
            <TouchableOpacity onPress={refresh} style={{ marginTop: 24, paddingVertical: 10, paddingHorizontal: 20, backgroundColor: colors.secondary, borderRadius: 20 }}>
               <Text style={{ color: colors.white, fontWeight: '700' }}>Check Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* Map over notices */}
            {notices.map((notice, index) => {
              if (index === 0 && notice.imageUrl) {
                // Featured style if top notice has an image
                return (
                   <TouchableOpacity 
                    key={notice.id} 
                    activeOpacity={0.9} 
                    style={[styles.featuredCard, { backgroundColor: isDark ? colors.surfaceContainerLow : colors.surfaceContainerLowest }]}
                    onPress={() => handleNoticeClick(notice)}
                  >
                    <Image style={styles.featuredImage} source={{ uri: notice.imageUrl }} />
                    <View style={styles.featuredContent}>
                      <View style={styles.featuredMeta}>
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{notice.type.toUpperCase()}</Text>
                        </View>
                        <Text style={styles.dateText}>{formatDate(notice.date)}</Text>
                      </View>
                      <Text style={[styles.cardTitle, { color: colors.primary }]}>{notice.title}</Text>
                      <Text style={[styles.cardDesc, { color: colors.textMuted }]} numberOfLines={3}>
                        {notice.content}
                      </Text>
                      <View style={styles.readMoreContainer}>
                        <Text style={styles.readMoreText}>Read full announcement</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.secondary} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }

              // Secondary style for others
              return (
                 <TouchableOpacity 
                  key={notice.id} 
                  activeOpacity={0.8}
                  style={styles.secondaryCard}
                  onPress={() => handleNoticeClick(notice)}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Ionicons 
                      name={notice.type === 'Administrative' ? 'business' : notice.type === 'Academic' ? 'school' : 'megaphone'} 
                      size={28} 
                      color={colors.secondary} 
                      style={{ marginBottom: 16 }} 
                    />
                    <Text style={[styles.dateText, { color: 'rgba(255,255,255,0.6)', fontSize: 10 }]}>{formatDate(notice.date)}</Text>
                  </View>
                  <Text style={styles.secondaryTitle}>{notice.title}</Text>
                  <Text style={styles.secondaryDesc} numberOfLines={4}>{notice.content}</Text>
                  <View style={styles.secondaryFooter}>
                    <Text style={styles.secondaryFooterText}>POSTED BY {notice.author.toUpperCase()}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Gap at bottom for nav bar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Notice Detail Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setIsModalOpen(false)}
          />
          <View style={[styles.modalSheet, { backgroundColor: isDark ? colors.surfaceContainerLow : colors.white }]}>
            <View style={styles.modalHandle} />
            {selectedNotice && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                <View style={[styles.badge, { alignSelf: 'flex-start', marginBottom: 16 }]}>
                  <Text style={styles.badgeText}>{selectedNotice.type.toUpperCase()}</Text>
                </View>
                <Text style={[styles.modalDate, { color: colors.outline }]}>{formatDate(selectedNotice.date)}</Text>
                <Text style={[styles.modalTitle, { color: isDark ? colors.white : colors.primary }]}>
                  {selectedNotice.title}
                </Text>
                
                <View style={styles.authorBadge}>
                  <Ionicons name="person-circle-outline" size={20} color={colors.secondary} />
                  <Text style={[styles.authorText, { color: isDark ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>
                    POSTED BY {selectedNotice.author.toUpperCase()}
                  </Text>
                </View>

                {selectedNotice.imageUrl && (
                  <Image
                    source={{ uri: selectedNotice.imageUrl }}
                    style={styles.modalImage}
                    resizeMode="cover"
                  />
                )}

                <Text style={[styles.modalContent, { color: isDark ? colors.outlineVariant : colors.text }]}>
                  {selectedNotice.content}
                </Text>
                
                <TouchableOpacity 
                   style={{ marginTop: 40, paddingVertical: 16, backgroundColor: colors.primary, borderRadius: 16, alignItems: 'center' }}
                   onPress={() => setIsModalOpen(false)}
                >
                   <Text style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Close Announcement</Text>
                </TouchableOpacity>

                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    paddingTop: 16,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroSub: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 2,
    color: colors.secondary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1,
  },
  filterScroll: {
    marginTop: 24,
    marginLeft: -24,
  },
  filterContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipActiveText: {
    color: colors.white,
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  featuredCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
  },
  featuredImage: {
    width: '100%',
    height: width * 0.5,
  },
  featuredContent: {
    padding: 24,
  },
  featuredMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  badge: {
    backgroundColor: colors.secondaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    color: colors.onSecondaryContainer,
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: colors.outline,
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    lineHeight: 32,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 20,
    fontFamily: 'Inter_400Regular',
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  readMoreText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
    color: colors.secondary,
  },
  secondaryCard: {
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
  },
  secondaryTitle: {
    color: colors.white,
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    marginBottom: 12,
    lineHeight: 28,
  },
  secondaryDesc: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
  },
  secondaryFooter: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  secondaryFooterText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 2.5,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalScroll: {
    padding: 24,
    paddingTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalDate: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 28,
    fontFamily: 'Inter_700Bold',
    lineHeight: 36,
    marginBottom: 16,
  },
  authorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  authorText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  modalImage: {
    width: '100%',
    height: 240,
    borderRadius: 16,
    marginBottom: 24,
  },
  modalContent: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
    lineHeight: 26,
  }
});
