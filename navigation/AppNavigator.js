import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { useTheme } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';

import { useSettings } from '../contexts/SettingsContext';

// Screens – Cases
import CaseListScreen from '../screens/Cases/CaseListScreen';
import CaseDetailScreen from '../screens/Cases/CaseDetailScreen';
import EditCaseScreen from '../screens/Cases/EditCaseScreen';
import CaseStatisticScreen from '../screens/Cases/CaseStatisticScreen';

// Screens – Tasks
import TasksScreen from '../screens/Tasks/TasksScreen';
import TodoDetailScreen from '../screens/Tasks/TodoDetailScreen';
import EditTodoScreen from '../screens/Tasks/EditTodoScreen';

// Screens – Calculator
import CalculatorScreen from '../screens/Calculator/CalculatorScreen';
import CourtFeeCalculator from '../screens/Calculator/CourtFeeCalculator';
import SolicitorFeeCalculator from '../screens/Calculator/SolicitorFeeCalculator';
import StatutoryInterestCalculator from '../screens/Calculator/StatutoryInterestCalculator';
import DayCalculator from '../screens/Calculator/DayCalculator';
import LegalBasisScreen from '../screens/Calculator/LegalBasisScreen';

// Screens –Terms
import TermsScreen from '../screens/Terms/TermsScreen';
import EditTermScreen from '../screens/Terms/EditTermScreen';
import TermCardViewScreen from '../screens/Terms/TermCardViewScreen';

// Screens –   Settings
import SettingsScreen from '../screens/Settings/SettingsScreen';
import NotificationSettingsScreen from '../screens/Settings/NotificationSettingsScreen';
import AccessibilitySettingsScreen from '../screens/Settings/AccessibilitySettingsScreen';
import DataManagementScreen from '../screens/Settings/DataManagementScreen';
import AboutScreen from '../screens/Settings/AboutScreen';
import DisclaimerScreen from '../screens/Settings/DisclaimerScreen';

// navigation setup swith 5 bottom tabs
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const commonStackOptions = {
  headerShown: true,
  headerTitleAlign: 'center',
};

// Cases Stack Navigator
const CasesStack = () => {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen name="CaseList" component={CaseListScreen} options={{ title: 'Cases' }} />
      <Stack.Screen name="CaseDetail" component={CaseDetailScreen} options={{ title: 'Case Detail' }} />
      <Stack.Screen name="EditCase" component={EditCaseScreen} options={{ title: 'Edit Case' }} />
      <Stack.Screen name="CaseStatistic" component={CaseStatisticScreen} options={{ title: 'Statistics' }} />
    </Stack.Navigator>
  );
};

// Tasks Stack Navigator
const TasksStack = () => {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen name="TasksList" component={TasksScreen} options={{ title: 'Tasks' }} />
      <Stack.Screen name="TodoDetail" component={TodoDetailScreen} options={{ title: 'Task Detail' }} />
      <Stack.Screen
        name="EditTodo"
        component={EditTodoScreen}
        options={({ route }) => ({
          title: route.params?.todoId ? 'Edit Task' : 'New Task',
        })}
      />
    </Stack.Navigator>
  );
};

// Settings Stack Navigator
const SettingsStack = () => {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen name="SettingsList" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen name="AccessibilitySettings" component={AccessibilitySettingsScreen} options={{ title: 'Accessibility' }} />
      <Stack.Screen name="DataManagement" component={DataManagementScreen} options={{ title: 'Data Management' }} />
      <Stack.Screen name="About" component={AboutScreen} options={{ title: 'About' }} />
      <Stack.Screen name="Disclaimer" component={DisclaimerScreen} options={{ title: 'Disclaimer' }} />
    </Stack.Navigator>
  );
};

// Calculator Stack Navigator
const CalculatorStack = () => {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen name="CalculatorHome" component={CalculatorScreen} options={{ title: 'Calculator Hub' }} />
      <Stack.Screen name="CourtFeeCalculator" component={CourtFeeCalculator} options={{ title: 'Court Fee' }} />
      <Stack.Screen name="SolicitorFeeCalculator" component={SolicitorFeeCalculator} options={{ title: 'Solicitor Fee' }} />
      <Stack.Screen name="StatutoryInterestCalculator" component={StatutoryInterestCalculator} options={{ title: 'Statutory Interest' }} />
      <Stack.Screen name="DayCalculator" component={DayCalculator} options={{ title: 'Day Calculator' }} />
      <Stack.Screen name="LegalBasis" component={LegalBasisScreen} options={{ title: 'Legal Basis' }} />
    </Stack.Navigator>
  );
};

// Terms Stack Navigator
const TermsStack = () => {
  return (
    <Stack.Navigator screenOptions={commonStackOptions}>
      <Stack.Screen name="TermsList" component={TermsScreen} options={{ title: 'Terms' }} />
      <Stack.Screen name="EditTerm" component={EditTermScreen} options={{ title: 'Add/Edit Term' }} />
      <Stack.Screen name="TermCardView" component={TermCardViewScreen} options={{ title: 'Card View' }} />
    </Stack.Navigator>
  );
};

//  tab icon animation
const TabIcon = ({ name, focused, color, size, reduceMotion }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) return; // Skip animation if reduceMotion is on

    if (focused) {
      // Animate scale up and then back down
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 150, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [focused, reduceMotion, scaleAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Ionicons name={name} size={size} color={color} />
    </Animated.View>
  );
};

const AppNavigator = () => {
  const { colors } = useTheme();
  const { reduceMotion } = useSettings();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const routeState = route.state;
        const isNested = !!routeState && routeState.index > 0;
        return {
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.text,
          tabBarStyle: {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            display: isNested ? 'none' : 'flex',
          },
          tabBarLabelStyle: {
            fontWeight: 'bold',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName;
            if (route.name === 'Cases') {
              iconName = focused ? 'briefcase' : 'briefcase-outline';
            } else if (route.name === 'Tasks') {
              iconName = focused ? 'checkbox' : 'checkbox-outline';
            } else if (route.name === 'Calculator') {
              iconName = focused ? 'calculator' : 'calculator-outline';
            } else if (route.name === 'Terms') {
              iconName = focused ? 'book' : 'book-outline';
            } else if (route.name === 'Settings') {
              iconName = focused ? 'settings' : 'settings-outline';
            }

            return <TabIcon name={iconName} focused={focused} color={color} size={size} reduceMotion={reduceMotion} />;
          },
        };
      }}
    >
      <Tab.Screen name="Cases" component={CasesStack} />
      <Tab.Screen name="Tasks" component={TasksStack} />
      <Tab.Screen name="Calculator" component={CalculatorStack} />
      <Tab.Screen name="Terms" component={TermsStack} />
      <Tab.Screen name="Settings" component={SettingsStack} />
    </Tab.Navigator>
  );
};

export default AppNavigator;
