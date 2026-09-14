import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, ScrollView, RefreshControl, Alert } from 'react-native';
import { useNavigation, useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useScaledFontSize } from '../../contexts/SettingsContext';
import caseSeed from '../../data/case_seed.json';

const FILTER_STATUSES = ['All', 'In Progress', 'Closed', 'Adjourned'];

// case list with search, status filter and pull-to-refresh.
// seed some sample cases on first launch so it is not empty.
const CaseListScreen = () => {
    const navigation = useNavigation();
    const { colors } = useTheme();
    const scaledFontSize = useScaledFontSize();

    const [cases, setCases] = useState([]);
    const [filteredCases, setFilteredCases] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('All');
    const [refreshing, setRefreshing] = useState(false);

    const loadCases = useCallback(async () => {
        try {
            const keys = await AsyncStorage.getAllKeys();
            const caseKeys = keys.filter(key => key.startsWith('@case_') && key !== '@case_seed_done');
            
            if (caseKeys.length === 0) {
                const seedDone = await AsyncStorage.getItem('@case_seed_done');
                if (!seedDone) {
                    const casesToSave = caseSeed.map(c => {
                        const newCase = {
                            ...c,
                            createdAt: new Date().toISOString(),
                            source: 'seed'
                        };
                        return ['@case_' + newCase.id, JSON.stringify(newCase)];
                    });
                    await AsyncStorage.multiSet(casesToSave);
                    await AsyncStorage.setItem('@case_seed_done', 'true');
                    const seededCases = caseSeed.map(c => ({ ...c, createdAt: new Date().toISOString(), source: 'seed' }));
                    setCases(seededCases);
                } else {
                    setCases([]);
                }
            } else {
                const items = await AsyncStorage.multiGet(caseKeys);
                const loadedCases = items.map(item => JSON.parse(item[1]));
                setCases(loadedCases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            }
        } catch (e) {
            console.error("Failed to load cases.", e);
            Alert.alert("Error", "Failed to load cases.");
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadCases();
        }, [loadCases])
    );

    useEffect(() => {
        let filtered = cases;
        if (searchTerm) {
            const lowercasedTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(c => 
                (c.caseTitle || '').toLowerCase().includes(lowercasedTerm) ||
                (c.claimant || '').toLowerCase().includes(lowercasedTerm) ||
                (c.defendant || '').toLowerCase().includes(lowercasedTerm) ||
                (c.caseNumber || '').toLowerCase().includes(lowercasedTerm)
            );
        }
        if (selectedStatus !== 'All') {
            filtered = filtered.filter(c => c.status === selectedStatus);
        }
        setFilteredCases(filtered);
    }, [cases, searchTerm, selectedStatus]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadCases().then(() => setRefreshing(false));
    }, [loadCases]);

    const renderCaseCard = ({ item }) => (
        <TouchableOpacity style={[styles.card, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('CaseDetail', { caseId: item.id })}>
            <View style={styles.cardHeader}>
                <Text style={[styles.caseTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>{item.caseTitle}</Text>
            </View>
            <View style={styles.badgeContainer}>
                <View style={[styles.badge, { backgroundColor: colors.primary, opacity: 0.8 }]}>
                    <Text style={[styles.badgeText, { color: colors.card, fontSize: scaledFontSize(12) }]}>{item.caseType}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: colors.border }]}>
                    <Text style={[styles.badgeText, { color: colors.text, fontSize: scaledFontSize(12) }]}>{item.status}</Text>
                </View>
            </View>
            <Text style={[styles.caseInfo, { color: colors.text, fontSize: scaledFontSize(14) }]}>Court Date: {item.courtDate}</Text>
            <Text style={[styles.caseInfo, { color: colors.text, fontSize: scaledFontSize(14) }]}>{item.court}</Text>
            <Text style={[styles.caseInfo, { color: colors.text, fontSize: scaledFontSize(12) }]}>Case No: {item.caseNumber}</Text>
        </TouchableOpacity>
    );

    const ListEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.text, fontSize: scaledFontSize(16) }]}>
                {cases.length === 0 ? 'No cases found. Tap "+ New Case" to get started.' : 'No cases match your filters.'}
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.toolbar}>
                <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
                    <Ionicons name="search" size={scaledFontSize(18)} color={colors.text} style={styles.searchIcon} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text, fontSize: scaledFontSize(14) }]}
                        placeholder="Search by title, party, or number..."
                        placeholderTextColor={colors.border}
                        value={searchTerm}
                        onChangeText={setSearchTerm}
                    />
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('CaseStatistic')} style={styles.iconButton} accessibilityLabel="View statistics">
                    <Ionicons name="stats-chart" size={scaledFontSize(22)} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('EditCase')} style={[styles.newCaseButton, { backgroundColor: colors.primary }]}>
                    <Text style={[styles.newCaseButtonText, { color: colors.card, fontSize: scaledFontSize(14) }]}>+ New</Text>
                </TouchableOpacity>
            </View>


            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {FILTER_STATUSES.map(status => (
                        <TouchableOpacity 
                            key={status} 
                            style={[
                                styles.chip,
                                { backgroundColor: selectedStatus === status ? colors.primary : colors.card },
                            ]}
                            onPress={() => setSelectedStatus(status)}
                        >
                            <Text style={{ color: selectedStatus === status ? colors.card : colors.text, fontSize: scaledFontSize(14) }}>{status}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            <FlatList
                data={filteredCases}
                renderItem={renderCaseCard}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContainer}
                ListEmptyComponent={ListEmptyComponent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 8,
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 44,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginRight: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
    },
    iconButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    newCaseButton: {
        paddingHorizontal: 12,
        height: 44,
        borderRadius: 8,
        justifyContent: 'center',
    },
    newCaseButtonText: {
        fontWeight: 'bold',
    },
    filterContainer: {
        paddingHorizontal: 15,
        marginBottom: 10,
    },
    chip: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        paddingHorizontal: 15,
        paddingBottom: 20,
    },
    card: {
        borderRadius: 12,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    caseTitle: {
        fontWeight: 'bold',
        flex: 1,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    badge: {
        borderRadius: 5,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: 8,
    },
    badgeText: {
        fontWeight: '500',
    },
    caseInfo: {
        marginBottom: 4,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 50,
    },
    emptyText: {
        textAlign: 'center',
    },
});

export default CaseListScreen;