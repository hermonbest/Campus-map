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

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <IconSymbol name="person.fill" size={48} color={colors.white} />
          </View>
          <Text style={styles.title}>User Profile</Text>
          <Text style={styles.subtitle}>user@example.com</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="person" size={24} color={colors.text} />
              <Text style={styles.settingText}>Edit Profile</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="bell" size={24} color={colors.text} />
              <Text style={styles.settingText}>Notifications</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="lock" size={24} color={colors.text} />
              <Text style={styles.settingText}>Privacy & Security</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="questionmark.circle" size={24} color={colors.text} />
              <Text style={styles.settingText}>Help & Support</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Settings</Text>
          <View style={styles.settingsList}>
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="gear" size={24} color={colors.text} />
              <Text style={styles.settingText}>General Settings</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="paintbrush" size={24} color={colors.text} />
              <Text style={styles.settingText}>Appearance</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <IconSymbol name="info" size={24} color={colors.text} />
              <Text style={styles.settingText}>About</Text>
              <IconSymbol name="chevron.right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity style={styles.logoutButton}>
          <IconSymbol name="arrow.right.square" size={24} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
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
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: spacing.xs,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
    marginTop: spacing.lg,
  },
  logoutText: {
    color: colors.error,
    fontSize: fontSize.base,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
});
