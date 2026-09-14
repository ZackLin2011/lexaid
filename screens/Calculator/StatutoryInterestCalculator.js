import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { RadioGroup, DatePicker } from './SharedComponents';
import { Ionicons } from '@expo/vector-icons';
import { calculateStatutoryInterest } from '../../utils/feeCalculations';

const StatutoryInterestCalculator = () => {
  const { colors } = useTheme();

  const [principal, setPrincipal] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [mode, setMode] = useState('flat');
  const [rateType, setRateType] = useState('judgment');
  const [dayCountMethod, setDayCountMethod] = useState('exclude_start');
  const [yearBase, setYearBase] = useState('365');
  const [rateMultiplier, setRateMultiplier] = useState(1);
  const [result, setResult] = useState(null);

  const calculateInterest = () => {
    const principalAmount = parseFloat(principal);
    const calculation = calculateStatutoryInterest({
      principal: principalAmount,
      startDate,
      endDate,
      rateType,
      dayCountMethod,
      yearBase,
      rateMultiplier,
    });
    if (calculation.error) {
      const title = calculation.error.includes('earlier') ? 'Invalid Dates' : 'Invalid Input';
      Alert.alert(title, calculation.error);
      return;
    }

    setResult(`£${calculation.interest.toFixed(2)}`);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Statutory Interest Calculator</Text>

      <Text style={[styles.label, { color: colors.text }]}>Principal amount (£)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
        keyboardType="numeric"
        value={principal}
        onChangeText={setPrincipal}
        placeholder="Enter principal amount"
        placeholderTextColor={colors.text}
      />

      <DatePicker label="Start Date" date={startDate} onDateChange={setStartDate} />
      <DatePicker label="End Date" date={endDate} onDateChange={setEndDate} />

      <RadioGroup
        label="Mode"
        items={[{ label: 'Flat Statutory Rate', value: 'flat' }, { label: 'Period Variable Rate', value: 'variable' }]}
        selectedValue={mode}
        onValueChange={setMode}
      />
      <RadioGroup
        label="Rate Type"
        items={[{ label: 'Judgment debt rate', value: 'judgment' }, { label: 'Contract statutory rate', value: 'contract' }]}
        selectedValue={rateType}
        onValueChange={setRateType}
      />
      <RadioGroup
        label="Day count method"
        items={[{ label: 'Exclude start date', value: 'exclude_start' }, { label: 'Include both start & end date', value: 'include_both' }]}
        selectedValue={dayCountMethod}
        onValueChange={setDayCountMethod}
      />
      <RadioGroup
        label="Year base"
        items={[{ label: '360 days', value: '360' }, { label: '365 days', value: '365' }]}
        selectedValue={yearBase}
        onValueChange={setYearBase}
      />

      <View style={styles.multiplierContainer}>
        <Text style={[styles.label, { color: colors.text }]}>Rate multiplier</Text>
        <View style={styles.multiplierControls}>
          <TouchableOpacity onPress={() => setRateMultiplier(m => Math.max(0.1, m - 0.1))}>
            <Ionicons name="remove-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.multiplierValue, { color: colors.text }]}>{rateMultiplier.toFixed(1)}x</Text>
          <TouchableOpacity onPress={() => setRateMultiplier(m => m + 0.1)}>
            <Ionicons name="add-circle" size={32} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Calculate" onPress={calculateInterest} color={colors.primary} />
      </View>

      {result && (
        <View style={[styles.resultsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.resultText, { color: colors.text }]}>Total accrued statutory interest: {result}</Text>
          <Text style={[styles.disclaimer, { color: colors.text }]}>
            Disclaimer: This calculation is for informational purposes only and based on the inputs provided. It is not legal advice.
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 15, fontSize: 16, marginBottom: 15 },
    buttonContainer: { marginTop: 20, borderRadius: 8, overflow: 'hidden' },
    resultsContainer: { marginTop: 20, padding: 15, borderRadius: 8 },
    resultText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    disclaimer: { fontSize: 12, textAlign: 'center', fontStyle: 'italic' },
    multiplierContainer: { marginTop: 10, marginBottom: 10 },
    multiplierControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
    multiplierValue: { fontSize: 20, fontWeight: 'bold' },
});

export default StatutoryInterestCalculator;
