
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ActivityIndicator, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useTheme } from '@react-navigation/native';
import Swiper from 'react-native-deck-swiper';

import { useSettings, useScaledFontSize } from '../../contexts/SettingsContext';
import { getDueTerms, applyReview } from '../../utils/termScheduler';

// flashcard review screen: swipe through terms, tap to flip, then mark
// 'again' or 'good' so the spaced repetition can reschedule it.
const TermCardViewScreen = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { vibration, reduceMotion } = useSettings();
  const scaledFontSize = useScaledFontSize();

  const [terms, setTerms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const swiperRef = useRef(null);

  const animatedValue = useRef(new Animated.Value(0)).current;
  const isFlippedRef = useRef(false);

  const frontInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backInterpolate = animatedValue.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });

  const loadTerms = useCallback(async () => {
    setLoading(true);
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const termKeys = allKeys.filter(k => k.startsWith('@term_') && k !== '@term_seed_done');
      const termPairs = await AsyncStorage.multiGet(termKeys);
      const parsedTerms = termPairs.map(([, value]) => value ? JSON.parse(value) : null).filter(Boolean);
      
      const today = new Date().toISOString().split('T')[0];
      const dueTerms = getDueTerms(parsedTerms, today);
      const notDueTerms = parsedTerms.filter(term => !dueTerms.includes(term));
      
      const sortedTerms = [
        ...dueTerms.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate)),
        ...notDueTerms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      ];

      setTerms(sortedTerms);
    } catch (error) {
      console.error("Failed to load terms for review:", error);
      Alert.alert("Error", "Failed to load terms.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTerms();
  }, [loadTerms]);

  const flipCard = () => {
    const next = !isFlippedRef.current;
    isFlippedRef.current = next;
    if (reduceMotion) return;
    Animated.timing(animatedValue, {
      toValue: next ? 180 : 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const handleReview = async (performance) => {
    if (currentIndex >= terms.length) return;

    const term = terms[currentIndex];
    const today = new Date().toISOString().split('T')[0];
    const updatedTerm = applyReview(term, performance, today);

    try {
      await AsyncStorage.setItem(term.id, JSON.stringify(updatedTerm));
      swiperRef.current.swipeLeft(); // Or swipeRight, doesn't matter
    } catch (error) {
      console.error("Failed to save review:", error);
      Alert.alert("Error", "Failed to save your review.");
    }
  };
  
  const onSwiped = (index) => {
    // Reset flip state for the next card
    if (isFlippedRef.current) {
        animatedValue.setValue(0);
        isFlippedRef.current = false;
    }
    setCurrentIndex(index + 1);
  };

  const renderCard = (term) => {
    if (!term) return null;

    const frontAnimatedStyle = { transform: [{ rotateY: frontInterpolate }] };
    const backAnimatedStyle = { transform: [{ rotateY: backInterpolate }] };

    return (
      <TouchableOpacity activeOpacity={1} style={[styles.card, { backgroundColor: colors.card }]} onPress={flipCard}>
        <Animated.View style={[styles.cardFace, frontAnimatedStyle]}>
          <Text style={[styles.termText, { color: colors.text, fontSize: scaledFontSize(32) }]}>{term.term}</Text>
        </Animated.View>
        <Animated.View style={[styles.cardFace, styles.cardBack, backAnimatedStyle]}>
          <Text style={[styles.definitionText, { color: colors.text, fontSize: scaledFontSize(18) }]}>{term.definition}</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  }

  if (terms.length === 0 || currentIndex >= terms.length) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.congratsText, { color: colors.text, fontSize: scaledFontSize(24) }]}>
          You're all caught up! 🎉
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.button, { backgroundColor: colors.primary, marginTop: 20 }]}>
          <Text style={[styles.buttonText, { color: 'white' }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.swiperContainer}>
        <Swiper
          ref={swiperRef}
          cards={terms}
          renderCard={renderCard}
          onSwiped={onSwiped}
          onSwipedAll={() => setCurrentIndex(terms.length)}
          stackSize={3}
          stackSeparation={15}
          animateOverlayLabelsOpacity
          animateCardOpacity
          disableTopSwipe
          disableBottomSwipe
          cardVerticalMargin={16}
          marginBottom={250}
          cardIndex={currentIndex}
          backgroundColor={'transparent'}
          containerStyle={{ flex: 1 }}
        />
      </View>
      <View style={styles.bottomContainer}>
        <Text style={[styles.progressText, { color: colors.text }]}>
          {Math.min(currentIndex + 1, terms.length)} / {terms.length}
        </Text>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity onPress={() => handleReview('again')} style={[styles.button, { backgroundColor: colors.notification }]}>
            <Text style={[styles.buttonText, { color: 'white' }]}>Needs Review</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleReview('good')} style={[styles.button, { backgroundColor: colors.primary }]}>
            <Text style={[styles.buttonText, { color: 'white' }]}>Mark as Mastered</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  swiperContainer: {
    flex: 1,
    paddingHorizontal: 16,
    overflow: 'hidden',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    flex: 1,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    elevation: 3,
    shadowOffset: { width: 1, height: 1 },
    shadowColor: 'black',
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  cardFace: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backfaceVisibility: 'hidden',
    position: 'absolute',
  },
  cardBack: {
    
  },
  termText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  definitionText: {
    textAlign: 'center',
  },
  bottomContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    marginBottom: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    minWidth: 150,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  congratsText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default TermCardViewScreen;