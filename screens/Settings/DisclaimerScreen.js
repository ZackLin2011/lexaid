import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '@react-navigation/native';

const DisclaimerScreen = () => {
  const { colors } = useTheme();

  const sections = [
    {
      title: 'Educational Prototype',
      content: 'This application is an educational prototype developed as part of a university module. It is not a commercial product and should be treated as a proof-of-concept.'
    },
    {
      title: 'Not Legal Advice',
      content: 'The information and calculations provided by this app do not constitute legal advice. The content is for informational purposes only. You should consult with a qualified legal professional for advice regarding your individual situation.'
    },
    {
      title: 'Accuracy of Information',
      content: 'While we strive to provide accurate information, calculations for court fees, interest rates, and working days are for reference only. Always verify with official sources, such as government websites or court documents. We are not responsible for any errors or omissions, or for any actions taken based on the information provided.'
    },
    {
      title: 'Local Data Storage',
      content: 'All data you enter into this application, including case details and tasks, is stored exclusively on your local device. No data is transmitted to or stored on any external servers.'
    }
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {sections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.title, { color: colors.primary }]}>{section.title}</Text>
            <Text style={[styles.paragraph, { color: colors.text }]}>{section.content}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 25,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'justify',
  },
});

export default DisclaimerScreen;