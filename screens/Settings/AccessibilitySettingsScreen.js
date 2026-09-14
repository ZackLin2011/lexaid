import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { useSettings, useScaledFontSize } from '../../contexts/SettingsContext';
import Ionicons from '@expo/vector-icons/Ionicons';

const AccessibilitySettingsScreen = () => {
  const { colors } = useTheme();
  const { fontScale, setFontScale } = useSettings();
  const scaledFontSize = useScaledFontSize();

  const fontOptions = [
    { label: 'Standard', value: 1 },
    { label: 'Large', value: 1.15 },
    { label: 'Extra Large', value: 1.35 },
  ];

  const PreviewText = () => {
    const scaledSize = scaledFontSize(16);
    return (
        <Text style={[styles.previewText, { color: colors.text, fontSize: scaledSize }]}>
            This is how text will appear with your selected size. The quick brown fox jumps over the lazy dog.
        </Text>
    );
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>FONT SIZE</Text>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          {fontOptions.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[styles.row, index === fontOptions.length - 1 && styles.noBorder]}
              onPress={() => setFontScale(option.value)}
            >
              <Text style={[styles.rowText, { color: colors.text }]}>{option.label}</Text>
              {fontScale === option.value && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text, opacity: 0.6 }]}>PREVIEW</Text>
        <View style={[styles.card, { backgroundColor: colors.card, padding: 20 }]}>
            <PreviewText />
        </View>
      </View>
      
      <Text style={[styles.infoText, { color: colors.text, opacity: 0.6 }]}>
        This app supports Dynamic Type. The font size for text throughout the app will scale according to your selection. It also respects the "Reduce Motion" setting to provide a better accessibility experience.
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 20 },
  section: { marginHorizontal: 16, marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginLeft: 12, marginBottom: 8 },
  card: { borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128, 128, 128, 0.3)',
  },
  noBorder: { borderBottomWidth: 0 },
  rowText: { fontSize: 16 },
  previewText: { lineHeight: 24 },
  infoText: {
    marginHorizontal: 28,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
  },
});

export default AccessibilitySettingsScreen;