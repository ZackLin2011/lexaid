import React, { useState, useEffect, useCallback, useLayoutEffect } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, 
    RefreshControl, Alert, Vibration, Animated
} from 'react-native';
import { useNavigation, useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { Swipeable } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';

import { useSettings, useScaledFontSize } from '../../contexts/SettingsContext';
import taskScheduler from '../../utils/taskScheduler';
import taskSeed from '../../data/task_seed.json';

const FILTER_STATUSES = ['All', 'Overdue', 'Completed'];

// main task screen: calendar + list, search, filters, swipe for deletion abd syncs notifications with the global reminder switch.
const TasksScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { taskReminders, vibration } = useSettings();
    const scaledFontSize = useScaledFontSize();

    const [tasks, setTasks] = useState([]);
    const [caseTitles, setCaseTitles] = useState({});
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [selectedDate, setSelectedDate] = useState(null);
    const [markedDates, setMarkedDates] = useState({});
    const [refreshing, setRefreshing] = useState(false);

    // DATA HANDLING 
    const loadData = useCallback(async () => {
        try {
            const allKeys = await AsyncStorage.getAllKeys();
            const taskKeys = allKeys.filter(k => k.startsWith('@task_') && k !== '@task_seed_done');
            const caseKeys = allKeys.filter(k => k.startsWith('@case_') && k !== '@case_seed_done');

            let loadedTasks = [];
            if (taskKeys.length > 0) {
                const items = await AsyncStorage.multiGet(taskKeys);
                loadedTasks = items.map(i => JSON.parse(i[1])).filter(Boolean);
            } else {
                const seedDone = await AsyncStorage.getItem('@task_seed_done');
                if (!seedDone) {
                    const tasksToSave = taskSeed.map(t => ['@task_' + t.id, JSON.stringify(t)]);
                    await AsyncStorage.multiSet(tasksToSave);
                    await AsyncStorage.setItem('@task_seed_done', 'true');
                    loadedTasks = taskSeed;
                }
            }

            if (caseKeys.length > 0) {
                const caseItems = await AsyncStorage.multiGet(caseKeys);
                const titles = caseItems.reduce((acc, item) => {
                    const caseData = JSON.parse(item[1]);
                    acc[caseData.id] = caseData.caseTitle;
                    return acc;
                }, {});
                setCaseTitles(titles);
            }

            // Sync notifications with global setting
            if (taskReminders === false) {
                const updates = [];
                for (const task of loadedTasks) {
                    if (task?.notificationId) {
                        await Notifications.cancelScheduledNotificationAsync(task.notificationId);
                        task.notificationId = null;
                        updates.push(['@task_' + task.id, JSON.stringify(task)]);
                    }
                }
                if (updates.length > 0) await AsyncStorage.multiSet(updates);
            }

            const validTasks = loadedTasks.filter(Boolean);
            setTasks(validTasks.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

        } catch (e) {
            console.error("Failed to load tasks.", e);
            Alert.alert("Error", "Failed to load tasks.");
        }
    }, [taskReminders]);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    useEffect(() => {
        const status = selectedStatus ? selectedStatus.toLowerCase() : 'all';
        const filtered = taskScheduler.filterTasks(tasks, { query: searchTerm, status, date: selectedDate });
        setFilteredTasks(filtered);
    }, [tasks, searchTerm, selectedStatus, selectedDate]);

    useEffect(() => {
        setMarkedDates(taskScheduler.getMarkedDates(tasks));
    }, [tasks]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData().then(() => setRefreshing(false));
    }, [loadData]);

    // UI HANDLERS 
    const handleToggleComplete = async (task) => {
        const updatedTask = { ...task, completed: !task.completed };
        if (updatedTask.completed && updatedTask.notificationId) {
            await Notifications.cancelScheduledNotificationAsync(updatedTask.notificationId);
            updatedTask.notificationId = null;
        }
        await AsyncStorage.setItem('@task_' + task.id, JSON.stringify(updatedTask));
        setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    };

    const handleDeleteTask = (task) => {
        if (vibration) Vibration.vibrate(100);
        Alert.alert(
            'Delete Task',
            `Are you sure you want to delete "${task.title}"? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        if (task.notificationId) {
                            await Notifications.cancelScheduledNotificationAsync(task.notificationId);
                        }
                        await AsyncStorage.removeItem('@task_' + task.id);
                        setTasks(prev => prev.filter(t => t.id !== task.id));
                    }
                }
            ]
        );
    };

    // if only one task is on this day, open it directly, otherwise filter the list.
    const handleDayPress = (day) => {
        if (day.dateString === selectedDate) {
            setSelectedDate(null);
            return;
        }
        const tasksOnDate = taskScheduler.getTasksForDate(tasks, day.dateString);
        if (tasksOnDate.length === 1) {
            navigation.navigate('TodoDetail', { todoId: tasksOnDate[0].id });
        } else {
            setSelectedDate(day.dateString);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('EditTodo')} style={{ marginRight: 15 }}>
                    <Ionicons name="add-circle-outline" size={scaledFontSize(28)} color={colors.primary} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, colors.primary, scaledFontSize]);

    // RENDER 
    const renderTaskItem = ({ item }) => {
        const isTaskOverdue = taskScheduler.isOverdue(item);

        const renderRightActions = (progress, dragX) => {
            const trans = dragX.interpolate({
                inputRange: [-80, 0],
                outputRange: [0, 80],
                extrapolate: 'clamp',
            });
            return (
                <TouchableOpacity onPress={() => handleDeleteTask(item)} style={styles.deleteButton}>
                    <Animated.View style={{ transform: [{ translateX: trans }] }}>
                        <Ionicons name="trash-outline" size={scaledFontSize(24)} color="white" />
                    </Animated.View>
                </TouchableOpacity>
            );
        };

        return (
            <Swipeable renderRightActions={renderRightActions}>
                <TouchableOpacity 
                    style={[styles.taskCard, { backgroundColor: colors.card, opacity: item.completed ? 0.6 : 1 }]} 
                    onPress={() => navigation.navigate('TodoDetail', { todoId: item.id })}
                >
                    <TouchableOpacity onPress={() => handleToggleComplete(item)} style={styles.checkbox}>
                        {item.completed && <Ionicons name="checkmark-circle" size={scaledFontSize(26)} color={colors.primary} />}
                    </TouchableOpacity>
                    <View style={styles.taskContent}>
                        <Text style={[styles.taskTitle, { color: colors.text, fontSize: scaledFontSize(16), textDecorationLine: item.completed ? 'line-through' : 'none' }]}>{item.title}</Text>
                        <View style={styles.taskMeta}>
                            {item.isLongTerm ? (
                                <Text style={[styles.metaText, { color: colors.primary, fontSize: scaledFontSize(12) }]}>Long-term</Text>
                            ) : item.dueDate && (
                                <Text style={[styles.metaText, { color: isTaskOverdue && !item.completed ? '#FF453A' : colors.text, fontSize: scaledFontSize(12) }]}>
                                    {taskScheduler.formatDateTime(item.dueDate)}
                                </Text>
                            )}
                            {isTaskOverdue && !item.completed && <View style={styles.overdueBadge}><Text style={styles.overdueText}>Overdue</Text></View>}
                        </View>
                        {item.caseId && caseTitles[item.caseId] && (
                            <Text style={[styles.caseLink, { color: colors.text, fontSize: scaledFontSize(12) }]}>
                                <Ionicons name="attach" size={scaledFontSize(12)} /> {caseTitles[item.caseId]}
                            </Text>
                        )}
                    </View>
                </TouchableOpacity>
            </Swipeable>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <Calendar
                onDayPress={handleDayPress}
                calendarHeight={200}
                hideExtraDays
                markedDates={{
                    ...markedDates,
                    [selectedDate]: { ...markedDates[selectedDate], selected: true, selectedColor: colors.primary },
                }}
                theme={{
                    backgroundColor: colors.background,
                    calendarBackground: colors.card,
                    textSectionTitleColor: colors.border,
                    selectedDayBackgroundColor: colors.primary,
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: colors.primary,
                    dayTextColor: colors.text,
                    textDisabledColor: colors.border,
                    dotColor: colors.primary,
                    selectedDotColor: '#ffffff',
                    arrowColor: colors.primary,
                    monthTextColor: colors.text,
                }}
            />
            {selectedDate && (
                <View style={[styles.selectedDateHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontSize: scaledFontSize(14) }}>Selected: {selectedDate} 路 {filteredTasks.length} tasks</Text>
                    <TouchableOpacity onPress={() => setSelectedDate(null)}>
                        <Text style={{ color: colors.primary, fontSize: scaledFontSize(14) }}>Show All</Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.controlsContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChips}>
                    {FILTER_STATUSES.map(status => (
                        <TouchableOpacity
                            key={status}
                            style={[
                                styles.chip,
                                { backgroundColor: selectedStatus === status ? colors.primary : colors.card },
                            ]}
                            onPress={() => setSelectedStatus(status)}
                        >
                            <Text style={{ color: selectedStatus === status ? '#FFF' : colors.text, fontSize: scaledFontSize(13) }}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
                <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name="search" size={scaledFontSize(15)} color={colors.text} style={{marginRight: 6}} />
                    <TextInput
                        style={{ flex: 1, color: colors.text, fontSize: scaledFontSize(13) }}
                        placeholder="Search"
                        placeholderTextColor={colors.border}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
            </View>
            <FlatList
                data={filteredTasks}
                renderItem={renderTaskItem}
                keyExtractor={item => item.id}
                contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 20 }}
                ListEmptyComponent={() => (
                    <View style={styles.emptyContainer}>
                        <Text style={{ color: colors.text, fontSize: scaledFontSize(16) }}>
                            {tasks.length === 0 ? 'No tasks yet. Tap + to add one.' : 'No tasks match your filters.'}
                        </Text>
                    </View>
                )}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    selectedDateHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: 10, borderBottomWidth: 1 },
    controlsContainer: { flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#333' },
    searchContainer: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, paddingHorizontal: 8, height: 36, width: 110 },
    filterChips: { flex: 1 },
    chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 20, marginRight: 10, justifyContent: 'center', alignItems: 'center' },
    taskCard: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3, elevation: 2 },
    checkbox: { width: 44, height: 44, justifyContent: 'center', alignItems: 'flex-start' },
    taskContent: { flex: 1 },
    taskTitle: { fontWeight: 'bold' },
    taskMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
    metaText: { marginRight: 8 },
    overdueBadge: { backgroundColor: '#FF453A', borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
    overdueText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
    caseLink: { marginTop: 6 },
    deleteButton: { backgroundColor: '#FF453A', justifyContent: 'center', alignItems: 'center', width: 80, height: '100%' },
    emptyContainer: { marginTop: 50, alignItems: 'center' },
});

export default TasksScreen;