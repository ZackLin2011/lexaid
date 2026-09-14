import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';
import legalStandards from '../../data/fee_calculator_standards.json';

const LegalBasisScreen = ({ route }) => {
  const { colors } = useTheme();
  const { id } = route.params;
  const item = legalStandards.find(standard => standard.id === id);

  if (!item) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.text }}>Legal basis information not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>{item.name}</Text>
        
        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Source</Text>
          <Text style={[styles.bodyText, { color: colors.text }]}>{item.source}</Text>
        </View>

        <View style={[styles.section, { borderBottomColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Summary</Text>
          <Text style={[styles.bodyText, { color: colors.text }]}>{item.summary}</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.primary }]}>Legal Basis</Text>
          <Text style={[styles.bodyText, { color: colors.text }]}>{item.legal_basis}</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default LegalBasisScreen;