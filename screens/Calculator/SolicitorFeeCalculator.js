import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Dropdown } from './SharedComponents';
import { estimateSolicitorFee } from '../../utils/feeCalculations';

const SolicitorFeeCalculator = () => {
  const { colors } = useTheme();

  const [caseType, setCaseType] = useState(null);
  const [claimValue, setClaimValue] = useState('');
  const [region, setRegion] = useState('england');
  const [result, setResult] = useState(null);

  const caseTypes = [
    { label: 'Civil monetary claim', value: 'civil' },
    { label: 'Family / Divorce matter', value: 'family' },
    { label: 'Intellectual property dispute', value: 'ip' },
    { label: 'Commercial contract dispute', value: 'commercial' },
  ];

  const regions = [
    { label: 'England', value: 'england' },
    { label: 'Wales', value: 'wales' },
  ];

  const calculateFee = () => {
    const value = parseFloat(claimValue);
    const result = estimateSolicitorFee({ caseType, region, value });
    if (result.error) {
      Alert.alert('Invalid Input', result.error);
      return;
    }
    setResult(`£${result.lowerBound.toFixed(2)} - £${result.upperBound.toFixed(2)}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Solicitor Fee Calculator</Text>

      <Dropdown
        label="Case Type"
        items={caseTypes}
        selectedValue={caseType}
        onValueChange={setCaseType}
      />

      <Text style={[styles.label, { color: colors.text }]}>Claim Value (£)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        keyboardType="numeric"
        value={claimValue}
        onChangeText={setClaimValue}
        placeholder="Enter the total value of your claim"
        placeholderTextColor={colors.text}
      />

      <Dropdown
        label="Region"
        items={regions}
        selectedValue={region}
        onValueChange={setRegion}
      />

      <View style={styles.buttonContainer}>
        <Button title="Calculate" onPress={calculateFee} color={colors.primary} />
      </View>

      {result && (
        <View style={[styles.resultsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.resultText, { color: colors.text }]}>Estimated solicitor fee range: {result}</Text>
          <Text style={[styles.disclaimer, { color: colors.text }]}>
            Disclaimer: This is a guideline estimate only. Actual fees will vary based on the solicitor, case complexity, and specific work required.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    marginBottom: 15,
  },
  buttonContainer: {
    marginTop: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  resultsContainer: {
    marginTop: 20,
    padding: 15,
    borderRadius: 8,
  },
  resultText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  disclaimer: {
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default SolicitorFeeCalculator;
