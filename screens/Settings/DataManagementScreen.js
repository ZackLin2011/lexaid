import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Button, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Sharing from 'expo-sharing';
import { writeExportFile } from '../../utils/dataFiles';

const DataManagementScreen = () => {
  const { colors } = useTheme();
  const [stats, setStats] = useState({ cases: 0, tasks: 0, terms: 0 });

  const getStats = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const caseKeys = keys.filter(k => k.startsWith('@case_') && k !== '@case_seed_done');
      const taskKeys = keys.filter(k => k.startsWith('@task_') && k !== '@task_seed_done');
      const termKeys = keys.filter(k => k.startsWith('@term_') && k !== '@term_seed_done');
      setStats({ cases: caseKeys.length, tasks: taskKeys.length, terms: termKeys.length });
    } catch (e) {
      console.error('Failed to fetch stats.', e);
      Alert.alert('Error', 'Could not retrieve storage statistics.');
    }
  };

  useEffect(() => {
    getStats();
  }, []);

  const exportData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const dataKeys = keys.filter(k => !['@case_seed_done', '@task_seed_done', '@term_seed_done'].includes(k));
      const allData = await AsyncStorage.multiGet(dataKeys);
      const jsonData = JSON.stringify(Object.fromEntries(allData), null, 2);
      
      const fileUri = writeExportFile(jsonData);
      if (!fileUri) {
        Alert.alert('Not available', 'Export is not supported in the web preview. Try it on your phone with Expo Go.');
        return;
      }

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, { mimeType: 'application/json', dialogTitle: 'Export your data' });
      } else {
        Alert.alert('Sharing not available', 'Data was saved, but sharing is not available on this device.');
      }
    } catch (e) {
      console.error('Failed to export data.', e);
      Alert.alert('Export Failed', 'An error occurred while exporting your data.');
    }
  };

  const clearData = () => {
    Alert.alert(
      'Clear All Local Data',
      'This will permanently delete all your data, including cases, tasks, and settings. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              await getStats(); // Refresh stats
              Alert.alert('Success', 'All local data has been cleared.');
            } catch (e) {
              console.error('Failed to clear data.', e);
              Alert.alert('Error', 'Could not clear all data.');
            }
          },
        },
      ]
    );
  };

  const Section = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>{title.toUpperCase()}</Text>
      <View style={[styles.card, { backgroundColor: colors.card }]}>{children}</View>
    </View>
  );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Section title="Storage Summary">
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: colors.text }]}>Cases</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{stats.cases}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: colors.text }]}>Tasks</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{stats.tasks}</Text>
        </View>
        <View style={styles.row}>
          <Text style={[styles.rowText, { color: colors.text }]}>Terms</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>{stats.terms}</Text>
        </View>
      </Section>

      <Section title="Export">
        <View style={styles.buttonContainer}>
            <Button title="Export Data as JSON" onPress={exportData} color={colors.primary} />
        </View>
      </Section>

      <Section title="Danger Zone">
        <View style={styles.buttonContainer}>
            <Button title="Clear All Local Data" onPress={clearData} color={'red'} />
        </View>
      </Section>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 20 },
    section: { marginHorizontal: 16, marginBottom: 20 },
    sectionTitle: { fontSize: 13, fontWeight: '600', marginLeft: 12, marginBottom: 8 },
    card: { borderRadius: 12, overflow: 'hidden', padding: 15 },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    rowText: { fontSize: 16 },
    rowValue: { fontSize: 16, fontWeight: 'bold' },
    buttonContainer: { padding: 15 },
});

export default DataManagementScreen;