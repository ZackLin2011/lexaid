import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { Dropdown, RadioGroup } from './SharedComponents';
import { calculateCourtFee } from '../../utils/feeCalculations';

const CourtFeeCalculator = () => {
  const { colors } = useTheme();

  // State management for all form fields
  const [claimType, setClaimType] = useState(null);
  const [claimValue, setClaimValue] = useState('');
  const [reduceFee, setReduceFee] = useState('no');
  const [results, setResults] = useState(null);

  const claimTypes = [
    { label: 'Monetary civil claim (General property claim)', value: 'monetary' },
    { label: 'Divorce petition', value: 'divorce' },
    { label: 'Defamation / Personal Harm claim', value: 'defamation' },
    { label: 'Trade mark / Patent intellectual property claim', value: 'ip' },
    { label: 'Other administrative tribunal matters', value: 'tribunal' },
    { label: 'Insolvency / Bankruptcy application', value: 'insolvency' },
    { label: 'Application for probate', value: 'probate' },
    { label: 'Application to set aside arbitration award', value: 'arbitration' },
  ];

  const reduceFeeOptions = [
    { label: 'No', value: 'no' },
    { label: 'Yes', value: 'yes' },
  ];

  const calculateFees = () => {
    const value = parseFloat(claimValue);
    const result = calculateCourtFee({ claimType, value, reduceFee });
    if (result.error) {
      Alert.alert('Invalid Input', result.error);
      return;
    }

    setResults({
      issueFee: `£${result.issueFee.toFixed(2)}`,
      securityForCosts: `£${result.securityForCosts.toFixed(2)}`,
      enforcementFee: `£${result.enforcementFee.toFixed(2)}`,
    });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Court Fee Calculator</Text>

      <Dropdown
        label="Claim Type"
        items={claimTypes}
        selectedValue={claimType}
        onValueChange={setClaimType}
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

      <RadioGroup
        label="Reduce fee?"
        items={reduceFeeOptions}
        selectedValue={reduceFee}
        onValueChange={setReduceFee}
      />

      <View style={styles.buttonContainer}>
        <Button title="Calculate" onPress={calculateFees} color={colors.primary} />
      </View>

      {results && (
        <View style={[styles.resultsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.resultRow, { color: colors.text }]}>Court issue fee: {results.issueFee}</Text>
          <Text style={[styles.resultRow, { color: colors.text }]}>Security for costs estimate: {results.securityForCosts}</Text>
          <Text style={[styles.resultRow, { color: colors.text }]}>Enforcement application fee: {results.enforcementFee}</Text>
          <Text style={[styles.disclaimer, { color: colors.text }]}>
            Disclaimer: These figures are estimates for guidance only and are not a substitute for legal advice. Fees are subject to change and case specifics.
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
  resultRow: {
    fontSize: 16,
    marginBottom: 10,
  },
  disclaimer: {
    fontSize: 12,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default CourtFeeCalculator;
