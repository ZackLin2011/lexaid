import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import legalStandards from '../../data/fee_calculator_standards.json';

import { useSettings } from '../../contexts/SettingsContext';

const AnimatedBubble = ({ icon, title, onPress, delay }) => {
  const { colors } = useTheme();
  const { reduceMotion } = useSettings(); // Get reduceMotion setting
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) return; // Skip animation if reduceMotion is true

    const createAnimation = (animation, toValue, duration) => {
      return Animated.timing(animation, {
        toValue,
        duration,
        useNativeDriver: true,
      });
    };

    const scaleLoop = Animated.sequence([
      createAnimation(scaleAnim, 1.05, 1500),
      createAnimation(scaleAnim, 1, 1500),
    ]);

    const rotationLoop = Animated.sequence([
      createAnimation(rotationAnim, 1, 2000),
      createAnimation(rotationAnim, -1, 2000),
      createAnimation(rotationAnim, 0, 2000),
    ]);

    const staggeredLoop = Animated.stagger(delay, [
      Animated.loop(scaleLoop),
      Animated.loop(rotationLoop),
    ]);

    staggeredLoop.start();
  }, [scaleAnim, rotationAnim, delay, reduceMotion]);

  const rotation = rotationAnim.interpolate({
    inputRange: [-1, 1],
    outputRange: ['-2deg', '2deg'],
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }, { rotate: rotation }] }}>
      <TouchableOpacity
        style={[styles.bubble, { backgroundColor: colors.card }]}
        onPress={onPress}
      >
        <Ionicons name={icon} size={48} color={colors.primary} />
        <Text style={[styles.bubbleText, { color: colors.text }]}>{title}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// hub page of the calculators, plus a list of the legal basis references.
const CalculatorScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const calculators = [
    {
      icon: 'scale-outline',
      title: 'Court Fee',
      screen: 'CourtFeeCalculator',
      delay: 0,
    },
    {
      icon: 'document-text-outline',
      title: 'Solicitor Fee',
      screen: 'SolicitorFeeCalculator',
      delay: 500,
    },
    {
      icon: 'cash-outline',
      title: 'Statutory Interest',
      screen: 'StatutoryInterestCalculator',
      delay: 250,
    },
    {
      icon: 'calendar-outline',
      title: 'Day Calculator',
      screen: 'DayCalculator',
      delay: 750,
    },
  ];

  const renderLegalBasisItem = ({ item }) => (
    <TouchableOpacity 
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]} 
      onPress={() => navigation.navigate('LegalBasis', { id: item.id })}
    >
      <Ionicons name="book-outline" size={24} color={colors.primary} style={styles.cardIcon} />
      <View style={styles.cardTextContainer}>
        <Text style={[styles.cardTitle, { color: colors.text }]} numberOfLines={1}>{item.name}</Text>
        <Text style={[styles.cardSource, { color: colors.text }]} numberOfLines={1}>{item.source}</Text>
        <Text style={[styles.cardSummary, { color: colors.text }]} numberOfLines={2}>{item.summary}</Text>
      </View>
      <Ionicons name="chevron-forward-outline" size={22} color={colors.text} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView edges={['bottom', 'left', 'right']} style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.bubbleSection}>
        <View style={styles.grid}>
          {calculators.map((calc) => (
            <View key={calc.title} style={styles.bubbleContainer}>
              <AnimatedBubble
                icon={calc.icon}
                title={calc.title}
                onPress={() => navigation.navigate(calc.screen)}
                delay={calc.delay}
              />
            </View>
          ))}
        </View>
      </View>
      <View style={[styles.legalBasisSection, { borderTopColor: colors.border }]}>
        <Text style={[styles.legalBasisTitle, { color: colors.text }]}>Legal Basis</Text>
        <FlatList
          data={legalStandards}
          renderItem={renderLegalBasisItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bubbleSection: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingBottom: 14,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bubbleContainer: {
    width: '50%',
    padding: 4,
    alignItems: 'center',
  },
  bubble: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  bubbleText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  legalBasisSection: {
    flex: 1, // Takes up ~1/3 of the screen
    borderTopWidth: 1,
  },
  legalBasisTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingTop: 8,
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardIcon: {
    marginRight: 12,
  },
  cardTextContainer: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  cardSource: {
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
  cardSummary: {
    fontSize: 13,
    marginTop: 4,
  },
});

export default CalculatorScreen;