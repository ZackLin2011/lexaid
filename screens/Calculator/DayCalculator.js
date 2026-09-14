import React, { useState } from 'react';
import { View, Text, Button, StyleSheet, ScrollView, Alert } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { RadioGroup, DatePicker } from './SharedComponents';
import { getWorkingDays } from './holidays';

const DayCalculator = () => {
  const { colors } = useTheme();

  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [mode, setMode] = useState('total_days');
  const [result, setResult] = useState(null);

  const modes = [
    { label: 'Count total calendar days', value: 'total_days' },
    { label: 'Count working days', value: 'working_days' },
  ];

  const calculateDays = () => {
    if (endDate < startDate && (mode === 'total_days' || mode === 'working_days')) {
      Alert.alert('Invalid Dates', 'End date cannot be earlier than the start date.');
      return;
    }

    let calculatedResult = '';
    switch (mode) {
      case 'total_days':
        const timeDiff = endDate.getTime() - startDate.getTime();
        const dayDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
        calculatedResult = `${dayDiff} calendar days`;
        break;
      case 'working_days':
        const workingDays = getWorkingDays(startDate, endDate);
        calculatedResult = `${workingDays} working days`;
        break;
      default:
        break;
    }
    setResult(calculatedResult);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <Text style={[styles.title, { color: colors.text }]}>Day & Working Day Calculator</Text>

      <DatePicker label="Start Date" date={startDate} onDateChange={setStartDate} />
      <DatePicker label="End Date" date={endDate} onDateChange={setEndDate} />

      <RadioGroup
        label="Calculation Mode"
        items={modes}
        selectedValue={mode}
        onValueChange={setMode}
      />

      <View style={styles.buttonContainer}>
        <Button title="Calculate" onPress={calculateDays} color={colors.primary} />
      </View>

      {result && (
        <View style={[styles.resultsContainer, { backgroundColor: colors.card }]}>
          <Text style={[styles.resultText, { color: colors.text }]}>Result: {result}</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  buttonContainer: { marginTop: 20, borderRadius: 8, overflow: 'hidden' },
  resultsContainer: { marginTop: 20, padding: 15, borderRadius: 8 },
  resultText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
});

export default DayCalculator;