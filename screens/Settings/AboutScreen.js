import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Constants from 'expo-constants';
import Ionicons from '@expo/vector-icons/Ionicons';

const AboutScreen = () => {
  const { colors } = useTheme();
  const version = Constants.expoConfig.version || '1.0.0';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
            <Ionicons name="apps-outline" size={80} color={colors.primary} />
            <Text style={[styles.appName, { color: colors.text }]}>LexAid</Text>
            <Text style={[styles.version, { color: colors.text, opacity: 0.7 }]}>Version {version}</Text>
        </View>

        <View style={styles.contentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About the App</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                LexAid is an English legal toolkit designed for managing cases, tasks, and court fees. 
            </Text>
        </View>

        <View style={styles.contentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Project Details</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                This application was built as the final project for the BSc Computer Science Mobile Development module.
            </Text>
        </View>

        <View style={styles.contentSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Technology Stack</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>
                - React Native
                - Expo
                - React Navigation
            </Text>
        </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 10,
  },
  version: {
    fontSize: 16,
    marginTop: 5,
  },
  contentSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128, 128, 128, 0.3)',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default AboutScreen;