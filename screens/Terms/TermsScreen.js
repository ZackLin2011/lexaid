import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useScaledFontSize } from '../../contexts/SettingsContext';
import { getStats } from '../../utils/termScheduler';
import legalTermsData from '../../data/legal_terms.json';

// terms library: search, filter, stats. seed sample terms on first launch.
const TermsScreen = ({ navigation }) => {
    const { colors } = useTheme();
    const scaledFontSize = useScaledFontSize();
    const searchBarFontSize = scaledFontSize(16);
    const chipFontSize = scaledFontSize(13);
    const termTextFontSize = scaledFontSize(17);
    const statusToggleFontSize = scaledFontSize(13);
    const definitionTextFontSize = scaledFontSize(14);
    const emptyListFontSize = scaledFontSize(16);

    const [allTerms, setAllTerms] = useState([]);
    const [cases, setCases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ total: 0, mastered: 0, dueToday: 0, masteredPct: 0 });

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        category: 'All',
        status: 'All',
        caseId: 'All',
    });

    const FilterChip = ({ label, isSelected, onPress, color }) => (
        <TouchableOpacity
            style={[styles.chip, { backgroundColor: isSelected ? color : colors.card, borderColor: isSelected ? color : colors.border }]}
            onPress={onPress}
        >
            <Text style={[styles.chipText, { color: isSelected ? 'white' : colors.text, fontSize: chipFontSize }]}>{label}</Text>
        </TouchableOpacity>
    );

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const seedDone = await AsyncStorage.getItem('@term_seed_done');
            let allKeys = await AsyncStorage.getAllKeys();
            let termKeys = allKeys.filter(k => k.startsWith('@term_') && k !== '@term_seed_done');

            if (!seedDone && termKeys.length === 0) {
                const today = new Date().toISOString().split('T')[0];
                const termsToSeed = legalTermsData.map(term => {
                    const id = `@term_${term.id || Date.now() + Math.random()}`;
                    return [id, JSON.stringify({ id, ...term, status: 'review', caseId: null, reviewCount: 0, intervalDays: 0, dueDate: today, lastReviewedAt: null, createdAt: new Date().toISOString(), source: 'seed' })];
                });
                await AsyncStorage.multiSet(termsToSeed);
                await AsyncStorage.setItem('@term_seed_done', 'true');
                allKeys = await AsyncStorage.getAllKeys();
                termKeys = allKeys.filter(k => k.startsWith('@term_') && k !== '@term_seed_done');
            }

            const termPairs = await AsyncStorage.multiGet(termKeys);
            const parsedTerms = termPairs.map(([key, value]) => {
                if (!value) return null;
                const t = JSON.parse(value);
                return { ...t, id: key };
            }).filter(Boolean);
            setAllTerms(parsedTerms.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));

            const caseKeys = allKeys.filter(key => key.startsWith('@case_') && key !== '@case_seed_done');
            if (caseKeys.length > 0) {
                const casePairs = await AsyncStorage.multiGet(caseKeys);
                const loadedCases = casePairs.map(([key, value], index) => {
                    const caseData = JSON.parse(value);
                    const t = caseData.caseTitle || caseData.title || caseData.name || key;
                    const d = caseData.courtDate || '';
                    return { id: key, name: d ? `${d} · ${t}` : t };
                });
                setCases(loadedCases);
            }

        } catch (error) {
            console.error("Failed to load data:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

    useEffect(() => {
        const today = new Date().toISOString().split('T')[0];
        setStats(getStats(allTerms, today));
    }, [allTerms]);

    const filteredTerms = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return allTerms.filter(term => {
            const searchMatch = !searchQuery || term.term.toLowerCase().includes(searchQuery.toLowerCase()) || term.definition.toLowerCase().includes(searchQuery.toLowerCase());
            const categoryMatch = filters.category === 'All' || term.category === filters.category.toLowerCase();
            const statusMatch = filters.status === 'All' ||
                (filters.status === 'Mastered' && term.status === 'mastered') ||
                (filters.status === 'To Review' && term.status !== 'mastered') ||
                (filters.status === 'Due Today' && term.dueDate <= today);
            const caseMatch = filters.caseId === 'All' || term.caseId === filters.caseId;
            return searchMatch && categoryMatch && statusMatch && caseMatch;
        });
    }, [allTerms, searchQuery, filters]);

    const toggleTermStatus = async (term) => {
        const newStatus = term.status === 'mastered' ? 'review' : 'mastered';
        const updatedTerm = { ...term, status: newStatus };
        try {
            await AsyncStorage.setItem(term.id, JSON.stringify(updatedTerm));
            setAllTerms(prevTerms => prevTerms.map(t => t.id === term.id ? updatedTerm : t));
        } catch (error) {
            console.error("Failed to update term status:", error);
        }
    };

    const renderItem = ({ item }) => {
        const categoryColors = {
            civil: '#4a90e2', criminal: '#d0021b', administrative: '#f5a623', general: '#7ed321'
        };
        const statusColors = { mastered: '#28a745', review: '#ffc107' };
        const relatedCase = item.caseId ? cases.find(c => c.id === item.caseId) : null;

        return (
            <TouchableOpacity style={[styles.itemContainer, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('EditTerm', { id: item.id })}>
                <View style={styles.itemHeader}>
                    <Text style={[styles.termText, { color: colors.text, fontSize: termTextFontSize }]}>{item.term}</Text>
                    <TouchableOpacity onPress={() => toggleTermStatus(item)}>
                        <Text style={{ color: colors.primary, fontSize: statusToggleFontSize }}>
                            {item.status === 'mastered' ? 'Mark for Review' : 'Mark as Mastered'}
                        </Text>
                    </TouchableOpacity>
                </View>
                <Text style={[styles.definitionText, { color: colors.text, fontSize: definitionTextFontSize }]} numberOfLines={2}>{item.definition}</Text>
                <View style={styles.itemFooter}>
                    <View style={styles.badges}>
                        <View style={[styles.badge, { backgroundColor: categoryColors[item.category] || '#888' }]}><Text style={styles.badgeText}>{item.category}</Text></View>
                        <View style={[styles.badge, { backgroundColor: statusColors[item.status] || '#888' }]}><Text style={styles.badgeText}>{item.status}</Text></View>
                    </View>
                    {relatedCase && <Text style={[styles.caseText, {color: colors.text}]}><Ionicons name="link" size={12} /> {relatedCase.name}</Text>}
                </View>
            </TouchableOpacity>
        );
    };

    const renderListHeader = () => (
        <View>
            <View style={styles.topRow}>
                <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Ionicons name="search" size={18} color={colors.text} style={{ marginRight: 6 }} />
                    <TextInput
                        style={[styles.searchInput, { color: colors.text, fontSize: searchBarFontSize }]}
                        placeholder="Search terms..."
                        placeholderTextColor={colors.text}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('EditTerm')} style={styles.iconButton}>
                    <Ionicons name="add-circle" size={32} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.navigate('TermCardView')} style={styles.iconButton}>
                    <Ionicons name="copy" size={26} color={colors.primary} />
                </TouchableOpacity>
            </View>

            <View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                    {['All', 'Civil', 'Criminal', 'Administrative', 'General'].map(cat => <FilterChip key={cat} label={cat} isSelected={filters.category === cat} onPress={() => setFilters(f => ({ ...f, category: cat }))} color={colors.primary} />)}
                </ScrollView>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                    {['All', 'To Review', 'Mastered', 'Due Today'].map(stat => <FilterChip key={stat} label={stat} isSelected={filters.status === stat} onPress={() => setFilters(f => ({ ...f, status: stat }))} color={colors.primary} />)}
                </ScrollView>
                {cases.length > 0 && (
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContainer}>
                        <FilterChip key="all-cases-filter" label="All Cases" isSelected={filters.caseId === 'All'} onPress={() => setFilters(f => ({ ...f, caseId: 'All' }))} color={colors.primary} />
                        {cases.map(c => <FilterChip key={c.id} label={c.name} isSelected={filters.caseId === c.id} onPress={() => setFilters(f => ({ ...f, caseId: c.id }))} color={colors.primary} />)}
                    </ScrollView>
                )}
            </View>

            <View style={[styles.statsCard, { backgroundColor: colors.card }]}>
                <View style={styles.statsTextContainer}>
                    <Text style={{ color: colors.text }}>Due: <Text style={{fontWeight: 'bold'}}>{stats.dueToday}</Text></Text>
                    <Text style={{ color: colors.text }}>Mastered: <Text style={{fontWeight: 'bold'}}>{stats.mastered}</Text></Text>
                    <Text style={{ color: colors.text }}>Total: <Text style={{fontWeight: 'bold'}}>{stats.total}</Text></Text>
                </View>
                <View style={[styles.progressBar, {backgroundColor: colors.border}]}><View style={{ height: '100%', width: `${stats.masteredPct}%`, backgroundColor: '#28a745' }} /></View>
            </View>
        </View>
    );

    if (loading) {
        return <View style={styles.centered}><ActivityIndicator size="large" color={colors.primary} /></View>;
    }

    return (
        <FlatList
            style={[styles.container, { backgroundColor: colors.background }]}
            data={filteredTerms}
            renderItem={renderItem}
            keyExtractor={item => item.id}
            ListHeaderComponent={renderListHeader}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 20 }}
            ListEmptyComponent={() => (
                <View style={styles.centeredEmpty}>
                    <Text style={{ color: colors.text, fontSize: emptyListFontSize }}>No terms match your filters.</Text>
                </View>
            )}
        />
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    centered: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    centeredEmpty: {
        marginTop: 50,
        alignItems: 'center',
        justifyContent: 'center'
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    searchContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        height: 42,
        borderRadius: 10,
        borderWidth: 1,
        paddingHorizontal: 12,
        marginRight: 10
    },
    searchInput: {
        flex: 1,
        padding: 0
    },
    iconButton: {
        paddingHorizontal: 2
    },
    filtersContainer: {
        paddingVertical: 5
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
        borderWidth: 1,
        marginRight: 8
    },
    chipText: {
        fontWeight: '600'
    },
    statsCard: {
        padding: 12,
        borderRadius: 8,
        marginTop: 5,
        marginBottom: 20
    },
    statsTextContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 8
    },
    progressBar: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden'
    },
    itemContainer: {
        padding: 15,
        borderRadius: 10,
        marginBottom: 10
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8
    },
    termText: {
        fontWeight: 'bold',
        flex: 1,
        marginRight: 10
    },
    definitionText: {
        opacity: 0.8,
        marginBottom: 10
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    badges: {
        flexDirection: 'row'
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 5,
        marginRight: 6
    },
    badgeText: {
        color: 'white',
        fontSize: 11,
        fontWeight: 'bold',
        textTransform: 'uppercase'
    },
    caseText: {
        fontSize: 12,
        fontStyle: 'italic'
    },
});

export default TermsScreen;
