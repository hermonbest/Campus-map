import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getCachedNoticeImage } from '../lib/cache';

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

interface NoticeDetailModalProps {
  visible: boolean;
  notice: Notice | null;
  onClose: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function NoticeDetailModal({
  visible,
  notice,
  onClose,
}: NoticeDetailModalProps) {
  const insets = useSafeAreaInsets();
  const [cachedImagePath, setCachedImagePath] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadImage() {
      if (notice?.image_url) {
        const cached = await getCachedNoticeImage(notice.id);
        if (isMounted) {
          setCachedImagePath(cached);
        }
      }
    }

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [notice?.id]);

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
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!notice) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notice Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Image */}
          {notice.image_url && (
            <Image
              source={{ uri: cachedImagePath || notice.image_url }}
              style={styles.noticeImage}
              resizeMode="cover"
            />
          )}

          {/* Content */}
          <View style={styles.noticeContent}>
            {/* Title */}
            <Text style={styles.title}>{notice.title}</Text>

            {/* Badges */}
            <View style={styles.badgesContainer}>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: getPriorityColor(notice.priority) },
                ]}
              >
                <Text style={styles.badgeText}>
                  {notice.priority.toUpperCase()}
                </Text>
              </View>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: getCategoryColor(notice.category) + '20' },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: getCategoryColor(notice.category) },
                  ]}
                >
                  {notice.category.toUpperCase()}
                </Text>
              </View>
            </View>

            {/* Description */}
            <Text style={styles.description}>{notice.description}</Text>

            {/* Dates */}
            <View style={styles.datesSection}>
              <Text style={styles.sectionTitle}>Schedule</Text>
              
              {notice.start_date && (
                <View style={styles.dateRow}>
                  <Ionicons name="time-outline" size={20} color="#3B82F6" />
                  <Text style={styles.dateText}>
                    Start: {formatDate(notice.start_date)}
                  </Text>
                </View>
              )}
              
              {notice.end_date && (
                <View style={styles.dateRow}>
                  <Ionicons name="calendar-outline" size={20} color="#3B82F6" />
                  <Text style={styles.dateText}>
                    End: {formatDate(notice.end_date)}
                  </Text>
                </View>
              )}

              {!notice.start_date && !notice.end_date && (
                <Text style={styles.noDateText}>No schedule set</Text>
              )}
            </View>

            {/* Metadata */}
            <View style={styles.metadataSection}>
              <Text style={styles.metadataText}>
                Created: {new Date(notice.created_at).toLocaleDateString()}
              </Text>
              {notice.updated_at !== notice.created_at && (
                <Text style={styles.metadataText}>
                  Updated: {new Date(notice.updated_at).toLocaleDateString()}
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  closeButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  noticeImage: {
    width: '100%',
    height: 250,
  },
  noticeContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: '#E4E4E7',
    lineHeight: 24,
    marginBottom: 24,
  },
  datesSection: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#A1A1AA',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    color: '#E4E4E7',
  },
  noDateText: {
    fontSize: 14,
    color: '#71717A',
    fontStyle: 'italic',
  },
  metadataSection: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  metadataText: {
    fontSize: 12,
    color: '#71717A',
    marginBottom: 4,
  },
});
