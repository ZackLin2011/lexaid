import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Vibration } from 'react-native';
import { useFocusEffect, useNavigation, useRoute } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@react-navigation/native';
import { useSettings, useScaledFontSize } from '../../contexts/SettingsContext';
import taskScheduler from '../../utils/taskScheduler';

const TodoDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { todoId } = route.params;

  const [task, setTask] = useState(null);
  const [caseTitle, setCaseTitle] = useState('');

  const { colors } = useTheme();
  const { settings = {} } = useSettings();
  const getScaledFontSize = useScaledFontSize();

  const loadData = useCallback(async () => {
    try {
      const taskJSON = await AsyncStorage.getItem('@task_' + todoId);
      if (taskJSON) {
        const loadedTask = JSON.parse(taskJSON);
        setTask(loadedTask);

        if (loadedTask.caseId) {
          const caseJSON = await AsyncStorage.getItem('@case_' + loadedTask.caseId);
          if (caseJSON) {
            const caseData = JSON.parse(caseJSON);
            setCaseTitle(caseData.caseTitle || `Case ID: ${loadedTask.caseId}`);
          } else {
            setCaseTitle(`Case ID: ${loadedTask.caseId}`);
          }
        }
      }
    } catch (e) {
      console.error("Failed to load task details.", e);
      Alert.alert("Error", "Could not load task details.");
    }
  }, [todoId]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleToggleComplete = async () => {
    if (!task) return;

    const updatedTask = { ...task, completed: !task.completed };

    if (updatedTask.completed && updatedTask.notificationId) {
      await Notifications.cancelScheduledNotificationAsync(updatedTask.notificationId);
      updatedTask.notificationId = null;
    }

    try {
      await AsyncStorage.setItem('@task_' + todoId, JSON.stringify(updatedTask));
      setTask(updatedTask);
    } catch (e) {
      console.error("Failed to update task status.", e);
      Alert.alert("Error", "Could not update task status.");
    }
  };

  const handleDelete = () => {
    if (!task) return;

    if (settings.vibration) {
      Vibration.vibrate(100);
    }

    Alert.alert(
      "Delete Task",
      "Are you sure you want to permanently delete this task?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (task.notificationId) {
                await Notifications.cancelScheduledNotificationAsync(task.notificationId);
              }
              await AsyncStorage.removeItem('@task_' + todoId);
              navigation.goBack();
            } catch (e) {
              console.error("Failed to delete task.", e);
              Alert.alert("Error", "Could not delete the task.");
            }
          },
        },
      ]
    );
  };

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>Loading...</Text>
      </View>
    );
  }

  const isOverdue = !task.completed && taskScheduler.isOverdue(task);

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.card}>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text, fontSize: getScaledFontSize(24) }]}>
            {task.title}
          </Text>
          {task.completed && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={[styles.badgeText, { fontSize: getScaledFontSize(12) }]}>Completed</Text>
            </View>
          )}
        </View>
      </View>

      {task.description ? (
        <View style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text, fontSize: getScaledFontSize(16) }]}>Description</Text>
          <Text style={[styles.cardContent, { color: colors.text, fontSize: getScaledFontSize(14) }]}>
            {task.description}
          </Text>
        </View>
      ) : null}

      <View style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text, fontSize: getScaledFontSize(16) }]}>Details</Text>
        
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={getScaledFontSize(16)} color={colors.text} />
          <Text style={[styles.cardContent, { color: colors.text, fontSize: getScaledFontSize(14) }]}>
            Status: {task.isLongTerm ? 'Long-term' : (isOverdue ? 'Overdue' : 'Pending')}
          </Text>
        </View>

        {!task.isLongTerm && task.dueDate && (
          <View style={styles.detailItem}>
            <Ionicons name="calendar-outline" size={getScaledFontSize(16)} color={isOverdue ? colors.error : colors.text} />
            <Text style={[styles.cardContent, { color: isOverdue ? colors.error : colors.text, fontSize: getScaledFontSize(14) }]}>
              Due: {taskScheduler.formatDateTime(task.dueDate)}
            </Text>
          </View>
        )}

        {caseTitle ? (
          <View style={styles.detailItem}>
            <Ionicons name="briefcase-outline" size={getScaledFontSize(16)} color={colors.text} />
            <Text style={[styles.cardContent, { color: colors.text, fontSize: getScaledFontSize(14) }]}>
              Related Case: {caseTitle}
            </Text>
          </View>
        ) : null}

        <View style={styles.detailItem}>
          <Ionicons name="notifications-outline" size={getScaledFontSize(16)} color={colors.text} />
          <Text style={[styles.cardContent, { color: colors.text, fontSize: getScaledFontSize(14) }]}>
            Reminder: {task.remind ? 'On' : 'Off'}
          </Text>
        </View>
      </View>

      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleToggleComplete}
        >
          <Text style={[styles.buttonText, { fontSize: getScaledFontSize(16) }]}>
            {task.completed ? 'Mark as Incomplete' : 'Mark as Complete'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.card }]}
          onPress={() => navigation.navigate('EditTodo', { todoId })}
        >
          <Text style={[styles.buttonText, { color: colors.primary, fontSize: getScaledFontSize(16) }]}>
            Edit
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.card }]}
          onPress={handleDelete}
        >
          <Text style={[styles.buttonText, { color: colors.error, fontSize: getScaledFontSize(16) }]}>
            Delete
          </Text>
        </TouchableOpacity>
      </View>
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontWeight: 'bold',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  cardTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
  },
  cardContent: {
    lineHeight: 20,
    marginLeft: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  actionsContainer: {
    margin: 16,
  },
  button: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default TodoDetailScreen;