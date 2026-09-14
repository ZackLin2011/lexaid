import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

// Reusable Dropdown component
export const Dropdown = ({ label, items, selectedValue, onValueChange }) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.componentContainer}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <TouchableOpacity
        style={[styles.dropdownHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => setIsOpen(!isOpen)}
      >
        <Text style={{ color: colors.text }}>{selectedValue || 'Select...'}</Text>
      </TouchableOpacity>
      {isOpen && (
        <View style={[styles.dropdownList, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.value}
              style={styles.dropdownItem}
              onPress={() => {
                onValueChange(item.value);
                setIsOpen(false);
              }}
            >
              <Text style={{ color: colors.text }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// Reusable RadioGroup Component
export const RadioGroup = ({ label, items, selectedValue, onValueChange }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.componentContainer}>
      <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
      <View style={styles.radioGroupContainer}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.value}
            style={styles.radioOption}
            onPress={() => onValueChange(item.value)}
          >
            <View
              style={[
                styles.radioCircle,
                { borderColor: colors.primary },
                selectedValue === item.value && { backgroundColor: colors.primary },
              ]}
            />
            <Text style={[styles.radioLabel, { color: colors.text }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

// A Reusable DatePicker Component
export const DatePicker = ({ label, date, onDateChange }) => {
    const { colors } = useTheme();
    const [show, setShow] = useState(false);

    const onChange = (event, selectedDate) => {
        setShow(false);
        if (selectedDate) {
            onDateChange(selectedDate);
        }
    };

    return (
        <View style={styles.componentContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            <TouchableOpacity
                style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: 'center' }]}
                onPress={() => setShow(true)}
            >
                <Text style={{ color: colors.text }}>{date.toLocaleDateString()}</Text>
            </TouchableOpacity>
            {show && (
                <DateTimePicker
                    value={date}
                    mode="date"
                    display="default"
                    onChange={onChange}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
  componentContainer: {
    marginBottom: 15,
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
  },
  dropdownHeader: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    justifyContent: 'center',
  },
  dropdownList: {
    marginTop: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  dropdownItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  radioGroupContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    marginBottom: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 8,
  },
  radioLabel: {
    fontSize: 16,
  },
});