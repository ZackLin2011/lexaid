import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useScaledFontSize } from '../../contexts/SettingsContext';

const screenWidth = Dimensions.get('window').width;

const CaseStatisticScreen = () => {
    const { colors } = useTheme();
    const scaledFontSize = useScaledFontSize();
    const [statsData, setStatsData] = useState(null);
    const [loading, setLoading] = useState(true);

    const processData = (cases) => {
        const caseTypeCounts = cases.reduce((acc, c) => {
            acc[c.caseType] = (acc[c.caseType] || 0) + 1;
            return acc;
        }, {});

        const statusCounts = cases.reduce((acc, c) => {
            acc[c.status] = (acc[c.status] || 0) + 1;
            return acc;
        }, { 'In Progress': 0, 'Closed': 0, 'Adjourned': 0 });

        const pieChartData = Object.keys(caseTypeCounts).map((key, index) => ({
            name: key,
            population: caseTypeCounts[key],
            color: `rgba(${ (index * 60) % 255 }, ${ (index * 100) % 255 }, ${ (index * 40 + 100) % 255 }, 1)`,
            legendFontColor: colors.text,
            legendFontSize: scaledFontSize(14),
        }));

        const barChartData = {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
            }],
        };

        return {
            totalCases: cases.length,
            caseTypeCounts,
            statusCounts,
            pieChartData,
            barChartData,
        };
    };

    const loadStats = useCallback(async () => {
        setLoading(true);
        try {
            const keys = await AsyncStorage.getAllKeys();
            const caseKeys = keys.filter(key => key.startsWith('@case_') && key !== '@case_seed_done');
            if (caseKeys.length > 0) {
                const items = await AsyncStorage.multiGet(caseKeys);
                const cases = items.map(item => JSON.parse(item[1]));
                setStatsData(processData(cases));
            } else {
                setStatsData(null); // No cases found
            }
        } catch (e) {
            console.error("Failed to load stats.", e);
        } finally {
            setLoading(false);
        }
    }, [colors.text, scaledFontSize]);

    useFocusEffect(
        useCallback(() => {
            loadStats();
        }, [loadStats])
    );

    const chartConfig = {
        backgroundGradientFrom: colors.card,
        backgroundGradientTo: colors.card,
        // colors.primary can be a hex string or rgb() string, so parsing both.
        //also note: parsing 'rgb(0, 122, 255)' as hex will have a NaN and the charts broke.
        color: (opacity = 1) => {
            const c = colors.primary || '#4a90e2';
            const rgbMatch = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            let r, g, b;
            if (rgbMatch) {
                r = Number(rgbMatch[1]);
                g = Number(rgbMatch[2]);
                b = Number(rgbMatch[3]);
            } else {
                const hex = c.replace('#', '');
                r = parseInt(hex.substr(0,2),16);
                g = parseInt(hex.substr(2,2),16);
                b = parseInt(hex.substr(4,2),16);
            }
            return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + opacity + ')';
        },
        labelColor: (opacity = 1) => colors.text,
        strokeWidth: 2,
        barPercentage: 0.7,
        useShadowColorFromDataset: false,
    };

    if (loading) {
        return <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />;
    }

    if (!statsData || statsData.totalCases === 0) {
        return (
            <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: colors.text, fontSize: scaledFontSize(18) }}>No data yet.</Text>
            </View>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
            <Text style={[styles.title, { color: colors.text, fontSize: scaledFontSize(28) }]}>Case Statistics</Text>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text, fontSize: scaledFontSize(20) }]}>Cases by Type</Text>
                <PieChart
                    data={statsData.pieChartData}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={chartConfig}
                    accessor={"population"}
                    backgroundColor={"transparent"}
                    paddingLeft={"15"}
                    center={[10, 0]}
                    absolute
                />
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text, fontSize: scaledFontSize(20) }]}>Cases by Status</Text>
                <BarChart
                    data={statsData.barChartData}
                    width={screenWidth - 60}
                    height={220}
                    chartConfig={chartConfig}
                    yAxisLabel=""
                    yAxisSuffix=""
                    fromZero
                />
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.chartTitle, { color: colors.text, fontSize: scaledFontSize(20) }]}>Summary</Text>
                <Text style={[styles.summaryText, { color: colors.text, fontSize: scaledFontSize(16) }]}>Total Cases: {statsData.totalCases}</Text>
                {Object.entries(statsData.caseTypeCounts).map(([type, count]) => (
                    <Text key={type} style={[styles.summaryText, { color: colors.text, fontSize: scaledFontSize(16) }]}>{type}: {count}</Text>
                ))}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 15,
    },
    title: {
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    card: {
        borderRadius: 12,
        padding: 15,
        marginBottom: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    chartTitle: {
        fontWeight: 'bold',
        marginBottom: 15,
    },
    summaryText: {
        alignSelf: 'flex-start',
        lineHeight: 24,
    }
});

export default CaseStatisticScreen;