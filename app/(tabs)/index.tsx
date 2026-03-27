import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView,
  TouchableOpacity,
  ScrollView
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, borderRadius, fontSize } from '@/styles/tokens';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to Your App</Text>
          <Text style={styles.subtitle}>Start building your amazing features</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="plus.circle.fill" size={32} color={colors.primary} />
              <Text style={styles.actionTitle}>Add New</Text>
              <Text style={styles.actionDescription}>Create new items</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="list.bullet" size={32} color={colors.secondary} />
              <Text style={styles.actionTitle}>View All</Text>
              <Text style={styles.actionDescription}>Browse items</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="gear" size={32} color={colors.textMuted} />
              <Text style={styles.actionTitle}>Settings</Text>
              <Text style={styles.actionDescription}>Configure app</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <IconSymbol name="info.circle" size={32} color={colors.warning} />
              <Text style={styles.actionTitle}>About</Text>
              <Text style={styles.actionDescription}>App information</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Getting Started</Text>
          <View style={styles.tipCard}>
            <IconSymbol name="lightbulb.fill" size={24} color={colors.warning} />
            <Text style={styles.tipText}>
              This is a template app. You can start adding your features by modifying the screens and components.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.base,
    color: colors.textMuted,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: fontSize.xl,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  actionCard: {
    width: '48%',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionTitle: {
    fontSize: fontSize.base,
    fontWeight: '600',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  actionDescription: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  tipText: {
    flex: 1,
    fontSize: fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
});
