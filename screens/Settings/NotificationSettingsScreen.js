import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, Button, Alert, Linking } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSettings } from '../../contexts/SettingsContext';
import * as Notifications from 'expo-notifications';
import Ionicons from '@expo/vector-icons/Ionicons';

const NotificationSettingsScreen = () => {
  const { colors } = useTheme();
  const {
    courtReminders,
    setCourtReminders,
    taskReminders,
    setTaskReminders,
    vibration,
    setVibration,
  } = useSettings();
  const [permissionStatus, setPermissionStatus] = useState(null);

  const checkPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  useEffect(() => {
    checkPermissions();
  }, []);

  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status !== 'granted') {
      Alert.alert(
        'Permission Denied',
        'Notifications are disabled. Please enable them in your system settings to receive reminders.',
        [
          { text: 'Cancel' },
          { text: 'Open Settings', onPress: () => Linking.openURL('app-settings:') },
        ]
      );
    }
  };

  const handleCourtReminderChange = (key, value) => {
    setCourtReminders({ ...courtReminders, [key]: value });
  };

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>{title.toUpperCase()}</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );

  const SettingRow = ({ title, description, value, onValueChange }) => (
    <View style={styles.row}>
      <View style={styles.textContainer}>
        <Text style={[styles.rowText, { color: colors.text }]}>{title}</Text>
        {description && <Text style={[styles.rowDescription, { color: colors.text, opacity: 0.5 }]}>{description}</Text>}
      </View>
      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Section title="Reminders">
        <View style={styles.subSectionHeader}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.subSectionTitle, { color: colors.text }]}>Court Date Reminders</Text>
        </View>
        <SettingRow title="7 days before" value={courtReminders['7d']} onValueChange={(val) => handleCourtReminderChange('7d', val)} />
        <SettingRow title="24 hours before" value={courtReminders['24h']} onValueChange={(val) => handleCourtReminderChange('24h', val)} />
        <SettingRow title="2 hours before" value={courtReminders['2h']} onValueChange={(val) => handleCourtReminderChange('2h', val)} />
        
        <View style={[styles.subSectionHeader, { marginTop: 10 }]}>
            <Ionicons name="checkbox-outline" size={20} color={colors.primary} />
            <Text style={[styles.subSectionTitle, { color: colors.text }]}>Task Deadline Reminders</Text>
        </View>
        <SettingRow title="Remind for due tasks" value={taskReminders} onValueChange={setTaskReminders} />
      </Section>

      <Section title="Feedback">
        <SettingRow title="Vibration Feedback" description="Provides haptic feedback on certain actions." value={vibration} onValueChange={setVibration} />
      </Section>

      <Section title="Permissions">
        <View style={styles.row}>
            <View style={styles.textContainer}>
                <Text style={[styles.rowText, { color: colors.text }]}>Notification Permission</Text>
                <Text style={[styles.rowDescription, { color: colors.text, opacity: 0.5 }]}>
                    Status: {permissionStatus ? permissionStatus.charAt(0).toUpperCase() + permissionStatus.slice(1) : 'Checking...'}
                </Text>
            </View>
            {permissionStatus !== 'granted' && (
                <Button title="Request" onPress={requestPermissions} color={colors.primary} />
            )}
        </View>
        {permissionStatus === 'denied' && (
            <Text style={[styles.permissionWarning, { color: colors.notification }]}>
                Notifications are disabled. Enable them in your system settings to receive court and task reminders.
            </Text>
        )}
      </Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20 },
    section: { marginHorizontal: 16, marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '600', marginLeft: 12, marginBottom: 8 },
    card: { borderRadius: 12, overflow: 'hidden' },
    subSectionHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingTop: 15, paddingBottom: 5 },
    subSectionTitle: { fontSize: 16, fontWeight: '600', marginLeft: 8 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 15, minHeight: 50 },
    textContainer: { flex: 1, marginRight: 10 },
    rowText: { fontSize: 16 },
    rowDescription: { fontSize: 13, marginTop: 2 },
    permissionWarning: { marginHorizontal: 16, marginVertical: 10, textAlign: 'center' },
});

export default NotificationSettingsScreen;