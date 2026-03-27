import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  ScrollView
} from 'react-native';
import { colors, spacing, borderRadius, fontSize } from '@/styles/tokens';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function SettingsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Settings</Text>
          <Text style={styles.subtitle}>Customize your app experience</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="gear" size={24} color={colors.text} />
              <Text style={styles.settingText}>General</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="paintbrush" size={24} color={colors.text} />
              <Text style={styles.settingText}>Appearance</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="bell" size={24} color={colors.text} />
              <Text style={styles.settingText}>Notifications</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="lock" size={24} color={colors.text} />
              <Text style={styles.settingText}>Privacy</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="questionmark.circle" size={24} color={colors.text} />
              <Text style={styles.settingText}>Help Center</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="doc.text" size={24} color={colors.text} />
              <Text style={styles.settingText}>Terms & Privacy</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.aboutCard}>
            <Text style={styles.appName}>Mobile App Template</Text>
            <Text style={styles.version}>Version 1.0.0</Text>
            <Text style={styles.description}>
              A clean, modern React Native template for building amazing mobile apps.
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
    fontSize: fontSize.lg,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingsList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingText: {
    flex: 1,
    fontSize: fontSize.base,
    color: colors.text,
    marginLeft: spacing.md,
  },
  aboutCard: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  appName: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  version: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: fontSize.sm,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
});
