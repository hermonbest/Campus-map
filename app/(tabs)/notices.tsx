import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCachedData, cacheAllData, clearCache, checkVersion } from '../../lib/cache';
import NoticeDetailModal from '../../components/NoticeDetailModal';

interface Notice {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  start_date: string | null;
  end_date: string | null;
  priority: string;
  category: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export default function Notices() {
  const insets = useSafeAreaInsets();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState<Notice | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      
      const cached = await getCachedData();
      
      if (cached && !forceRefresh) {
        console.log('Using cached notices');
        setNotices(cached.notices || []);
      } else {
        console.log('Fetching fresh notices');
        const freshData = await cacheAllData();
        setNotices(freshData.notices || []);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading notices:', error);
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await clearCache();
      await loadData(true);
      setRefreshing(false);
    } catch (error) {
      console.error('Error refreshing notices:', error);
      setRefreshing(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'normal': return '#3B82F6';
      case 'informational': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'events': return '#8B5CF6';
      case 'maintenance': return '#F59E0B';
      case 'announcements': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading notices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.headerTitle}>Notices</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <ActivityIndicator size="small" color="#3B82F6" />
          ) : (
            <Ionicons name="refresh" size={24} color="#3B82F6" />
          )}
        </TouchableOpacity>
      </View>

      {/* Notices Grid */}
      <ScrollView
        style={styles.noticesContainer}
        contentContainerStyle={styles.noticesContent}
        showsVerticalScrollIndicator={false}
      >
        {notices.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="megaphone-outline" size={64} color="#A1A1AA" />
            <Text style={styles.emptyText}>No notices found</Text>
          </View>
        ) : (
          notices.map((notice) => (
            <TouchableOpacity
              key={notice.id}
              style={styles.noticeCard}
              onPress={() => setSelectedNotice(notice)}
              activeOpacity={0.7}
            >
              {notice.image_url && (
                <Image
                  source={{ uri: notice.image_url }}
                  style={styles.noticeImage}
                  resizeMode="cover"
                />
              )}
              
              <View style={styles.noticeContent}>
                <View style={styles.noticeHeader}>
                  <Text style={styles.noticeTitle} numberOfLines={2}>
                    {notice.title}
                  </Text>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: getPriorityColor(notice.priority) },
                    ]}
                  >
                    <Text style={styles.priorityText}>
                      {notice.priority.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                </View>

                <Text style={styles.noticeDescription} numberOfLines={3}>
                  {notice.description}
                </Text>

                <View style={styles.noticeFooter}>
                  <View
                    style={[
                      styles.categoryBadge,
                      { backgroundColor: getCategoryColor(notice.category) + '20' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        { color: getCategoryColor(notice.category) },
                      ]}
                    >
                      {notice.category}
                    </Text>
                  </View>
                  
                  {notice.end_date && (
                    <Text style={styles.dateText}>
                      {formatDate(notice.end_date)}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Notice Detail Modal */}
      <NoticeDetailModal
        visible={!!selectedNotice}
        notice={selectedNotice}
        onClose={() => setSelectedNotice(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticesContainer: {
    flex: 1,
  },
  noticesContent: {
    padding: 16,
    gap: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    marginTop: 16,
    color: '#A1A1AA',
    fontSize: 16,
  },
  noticeCard: {
    backgroundColor: '#18181B',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  noticeImage: {
    width: '100%',
    height: 160,
  },
  noticeContent: {
    padding: 16,
  },
  noticeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  noticeTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  noticeDescription: {
    fontSize: 14,
    color: '#A1A1AA',
    lineHeight: 20,
    marginBottom: 12,
  },
  noticeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dateText: {
    fontSize: 12,
    color: '#71717A',
  },
});
