import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Animated, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Notifications from 'expo-notifications';
import { Picker } from '@react-native-picker/picker';

import { useTheme } from '@react-navigation/native';
import { useSettings, useScaledFontSize } from '../../contexts/SettingsContext';
import taskScheduler from '../../utils/taskScheduler';

// create or edit a task, and schedule a notification if the user wants a reminder.
const EditTodoScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const todoId = route.params?.todoId;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isLongTerm, setIsLongTerm] = useState(false);
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [remind, setRemind] = useState(true);
  const [caseId, setCaseId] = useState(null);
  const [cases, setCases] = useState([]);
  const [notificationId, setNotificationId] = useState(null);
  const [createdAt, setCreatedAt] = useState(null);

  const { colors } = useTheme();
  const { taskReminders } = useSettings();
  const getScaledFontSize = useScaledFontSize();

  const [shakeAnimation] = useState(new Animated.Value(0));

  useEffect(() => {
    const loadTask = async () => {
      if (todoId) {
        const taskJSON = await AsyncStorage.getItem('@task_' + todoId);
        if (taskJSON) {
          const task = JSON.parse(taskJSON);
          setTitle(task.title);
          setDescription(task.description || '');
          setIsLongTerm(task.isLongTerm || false);
          if (task.dueDate) setDueDate(new Date(task.dueDate));
          setRemind(task.remind || false);
          setCaseId(task.caseId || null);
          setNotificationId(task.notificationId || null);
          setCreatedAt(task.createdAt);
        }
      }
    };

    const loadCases = async () => {
      const caseKeys = await AsyncStorage.getAllKeys();
      const caseItems = await AsyncStorage.multiGet(caseKeys.filter(k => k.startsWith('@case_') && k !== '@case_seed_done'));
      const loadedCases = caseItems.map(item => JSON.parse(item[1])).filter(Boolean);
      setCases(loadedCases);
    };

    loadTask();
    loadCases();
  }, [todoId]);

  const handleSave = async () => {
    if (!title) {
      triggerShake();
      Alert.alert("Validation Error", "Task title is required.");
      return;
    }

    const id = todoId || `task_${Date.now()}`;
    let newNotificationId = notificationId;

    if (notificationId) {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      newNotificationId = null;
    }

    if (!isLongTerm && remind && taskReminders) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status === 'granted') {
          newNotificationId = await Notifications.scheduleNotificationAsync({
            content: { title },
            trigger: { date: taskScheduler.getNotificationTime(dueDate.toISOString()) },
          });
        }
      } catch (e) {
        console.error("Failed to schedule notification", e);
      }
    }

    const taskData = {
      id,
      title,
      description,
      isLongTerm,
      dueDate: isLongTerm ? null : dueDate.toISOString(),
      remind,
      caseId,
      completed: false, // New/edited tasks are not completed by default
      createdAt: todoId ? createdAt : new Date().toISOString(), // Keep original creation date if editing
      notificationId: newNotificationId,
    };

    try {
      await AsyncStorage.setItem('@task_' + id, JSON.stringify(taskData));
      Alert.alert("Success", "Task saved successfully.");
      navigation.goBack();
    } catch (e) {
      console.error("Failed to save task", e);
      Alert.alert("Error", "Failed to save the task.");
    }
  };

  const triggerShake = () => {
    shakeAnimation.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnimation, { toValue: 0, duration: 50, useNativeDriver: true })
    ]).start();
  };

  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || dueDate;
    setShowDatePicker(false);
    setDueDate(currentDate);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ transform: [{ translateX: shakeAnimation }] }}>
        <View style={styles.card}>
          <TextInput
            style={[styles.input, { color: colors.text, fontSize: getScaledFontSize(16) }]}
            placeholder="Task Title"
            placeholderTextColor={colors.placeholder}
            value={title}
            onChangeText={setTitle}
          />
        </View>

        <View style={styles.card}>
          <TextInput
            style={[styles.input, { color: colors.text, fontSize: getScaledFontSize(14), height: 100 }]}
            placeholder="Description (optional)"
            placeholderTextColor={colors.placeholder}
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
      </Animated.View>

      <View style={styles.card}>
        <View style={styles.switchRow}>
          <Text style={{ color: colors.text, fontSize: getScaledFontSize(16) }}>Long-term Task</Text>
          <Switch
            trackColor={{ false: colors.disabled, true: colors.primary }}
            thumbColor={colors.background}
            onValueChange={setIsLongTerm}
            value={isLongTerm}
          />
        </View>
      </View>

      {!isLongTerm && (
        <View style={styles.card}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerRow}>
            <Text style={{ color: colors.text, fontSize: getScaledFontSize(16) }}>Due Date</Text>
            <Text style={{ color: colors.primary, fontSize: getScaledFontSize(16) }}>
              {taskScheduler.formatDateTime(dueDate)}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            // here, use date only.
            <DateTimePicker
              value={dueDate}
              mode={Platform.OS === 'ios' ? 'datetime' : 'date'}
              display="default"
              onChange={onDateChange}
            />
          )}
          <View style={styles.switchRow}>
            <Text style={{ color: colors.text, fontSize: getScaledFontSize(16) }}>Remind me</Text>
            <Switch
              trackColor={{ false: colors.disabled, true: colors.primary }}
              thumbColor={colors.background}
              onValueChange={setRemind}
              value={remind}
            />
          </View>
        </View>
      )}

      <View style={styles.card}>
        <Text style={{ color: colors.text, fontSize: getScaledFontSize(16), marginBottom: 10 }}>Related Case</Text>
        <View style={{ backgroundColor: colors.border, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}>
          <Picker
            selectedValue={caseId}
            onValueChange={(itemValue) => setCaseId(itemValue)}
            style={{ color: colors.text }}
            dropdownIconColor={colors.text}
          >
            <Picker.Item label="None" value={null} />
            {cases.map((c) => (
              <Picker.Item 
                key={c.id} 
                label={`${c.courtDate ? new Date(c.courtDate).toLocaleDateString() + ' · ' : ''}${c.caseTitle}`} 
                value={c.id} 
              />
            ))}
          </Picker>
        </View>
      </View>

      <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
        <Text style={[styles.saveButtonText, { fontSize: getScaledFontSize(18) }]}>Save Task</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(128, 128, 128, 0.1)',
  },
  input: {
    padding: 0, // Reset padding
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  pickerButton: {
    padding: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  saveButton: {
    margin: 16,
    padding: 18,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default EditTodoScreen;