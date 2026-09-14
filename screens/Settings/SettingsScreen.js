import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSettings } from '../../contexts/SettingsContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const SettingsScreen = ({ navigation }) => {
  const { colors } = useTheme();
  const { themeMode, setThemeMode, reduceMotion, setReduceMotion, fontScale } = useSettings();

  const fontScaleMap = { 1: 'Standard', 1.15: 'Large', 1.35: 'Extra Large' };

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: colors.card }]}>
        {children}
      </View>
    </View>
  );

  const SettingRow = ({ title, icon, onPress, value }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.primary} style={styles.rowIcon} />
      <Text style={[styles.rowText, { color: colors.text }]}>{title}</Text>
      <View style={styles.rowRight}>
        {value && <Text style={[styles.rowValue, { color: colors.text, opacity: 0.7 }]}>{value}</Text>}
        <Ionicons name="chevron-forward" size={22} color={colors.text} style={{ opacity: 0.5 }} />
      </View>
    </TouchableOpacity>
  );

  const ThemeSelector = () => (
    <View style={styles.themeSelectorContainer}>
      {['system', 'light', 'dark'].map((mode, index) => (
        <TouchableOpacity
          key={mode}
          style={[
            styles.themeButton,
            { 
              backgroundColor: themeMode === mode ? colors.primary : 'transparent',
              borderTopLeftRadius: index === 0 ? 8 : 0,
              borderBottomLeftRadius: index === 0 ? 8 : 0,
              borderTopRightRadius: index === 2 ? 8 : 0,
              borderBottomRightRadius: index === 2 ? 8 : 0,
            }
          ]}
          onPress={() => setThemeMode(mode)}
        >
          <Text style={{ color: themeMode === mode ? 'white' : colors.text, textTransform: 'capitalize', fontSize: 14 }} numberOfLines={1}>{mode}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Section title="Appearance">
        <View style={styles.row}>
            <Ionicons name="color-palette-outline" size={22} color={colors.primary} style={styles.rowIcon} />
            <Text style={[styles.rowText, { color: colors.text }]}>Theme</Text>
        </View>
        <ThemeSelector />
      </Section>

      <Section title="Accessibility">
        <SettingRow title="Font Size" icon="text-outline" onPress={() => navigation.navigate('AccessibilitySettings')} value={fontScaleMap[fontScale]} />
        <View style={styles.row}>
            <Ionicons name="eye-off-outline" size={22} color={colors.primary} style={styles.rowIcon} />
            <Text style={[styles.rowText, { color: colors.text }]}>Reduce Motion</Text>
            <Switch value={reduceMotion} onValueChange={setReduceMotion} />
        </View>
      </Section>

      <Section title="Notifications">
        <SettingRow title="Notification & Vibration" icon="notifications-outline" onPress={() => navigation.navigate('NotificationSettings')} />
      </Section>

      <Section title="Data">
        <SettingRow title="Data Management" icon="archive-outline" onPress={() => navigation.navigate('DataManagement')} />
      </Section>

      <Section title="About">
        <SettingRow title="About" icon="information-circle-outline" onPress={() => navigation.navigate('About')} />
        <SettingRow title="Disclaimer" icon="shield-checkmark-outline" onPress={() => navigation.navigate('Disclaimer')} />
      </Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    section: { marginHorizontal: 16, marginTop: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '600', marginLeft: 12, marginBottom: 8 },
    sectionCard: { borderRadius: 12, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, paddingBottom: 15, minHeight: 50 },
    rowIcon: { marginRight: 15 },
    rowText: { flex: 1, fontSize: 16 },
    rowRight: { flexDirection: 'row', alignItems: 'center' },
    rowValue: { marginRight: 8, fontSize: 16 },
    themeSelectorContainer: { 
        flexDirection: 'row', 
        borderRadius: 8, 
        overflow: 'hidden',
        marginHorizontal: 15,
        marginBottom: 15,
        backgroundColor: 'rgba(128, 128, 128, 0.2)'
    },
    themeButton: { 
        flex: 1, 
        paddingVertical: 8, 
        alignItems: 'center', 
        justifyContent: 'center' 
    },
});

export default SettingsScreen;