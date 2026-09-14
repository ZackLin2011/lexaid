import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Image, Alert, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, useTheme, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useScaledFontSize } from '../../contexts/SettingsContext';
import { getCoordinates, getForecast, findDayForecast, weatherDescription, weatherRisk } from '../../utils/weather';

// detail page of a case, shows all fields and the evidence list with photos.
const CaseDetailScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { colors } = useTheme();
    const scaledFontSize = useScaledFontSize();
    const { caseId } = route.params;

    const [caseData, setCaseData] = useState(null);
    const [selectedEvidence, setSelectedEvidence] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [weather, setWeather] = useState(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [weatherError, setWeatherError] = useState(null);

    const loadCaseData = useCallback(async () => {
        try {
            const jsonValue = await AsyncStorage.getItem(`@case_${caseId}`);
            if (jsonValue !== null) {
                const data = JSON.parse(jsonValue);
                setCaseData(data);
                navigation.setOptions({
                    headerRight: () => (
                        <TouchableOpacity onPress={() => navigation.navigate('EditCase', { caseId: data.id })} style={{ paddingRight: 15 }}>
                            <Text style={{ color: colors.primary, fontSize: scaledFontSize(17), fontWeight: '600' }}>Edit</Text>
                        </TouchableOpacity>
                    ),
                });
            } else {
                Alert.alert("Error", "Case not found. It might have been deleted.");
                navigation.goBack();
            }
        } catch (e) {
            console.error("Failed to load case data.", e);
            Alert.alert("Error", "Failed to load case data.");
        }
    }, [caseId, navigation, colors.primary, scaledFontSize]);

    useFocusEffect(
        useCallback(() => {
            loadCaseData();
        }, [loadCaseData])
    );

    // Fetch the weather for the court location when the case is loaded and uses the free Open-Meteo.
    const loadWeather = useCallback(async () => {
        if (!caseData) return;
        const location = caseData.courtLocation || caseData.court;
        if (!location) {
            setWeather(null);
            setWeatherError('Add a court location to see the weather.');
            return;
        }
        setWeatherLoading(true);
        setWeatherError(null);
        setWeather(null);
        try {
            const coords = await getCoordinates(location);
            if (!coords) {
                setWeatherError('Could not find the court location.');
                return;
            }
            const forecast = await getForecast(coords);
            const day = findDayForecast(forecast, caseData.courtDate);
            setWeather({ location: coords.name, day, forecast });
        } catch (e) {
            setWeatherError('Could not load the weather. Check your connection.');
        } finally {
            setWeatherLoading(false);
        }
    }, [caseData]);

    useEffect(() => {
        loadWeather();
    }, [loadWeather]);

    const openEvidenceModal = (evidence) => {
        setSelectedEvidence(evidence);
        setIsModalVisible(true);
    };

    const renderInfoRow = (label, value) => {
        if (!value) return null;
        return (
            <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: colors.text, fontSize: scaledFontSize(15) }]}>{label}:</Text>
                <Text style={[styles.infoValue, { color: colors.text, fontSize: scaledFontSize(15) }]} selectable>{value}</Text>
            </View>
        );
    };

    if (!caseData) {
        return <View style={[styles.container, { backgroundColor: colors.background }]} />;
    }

    const risk = weather && weather.day ? weatherRisk(weather.day) : null;
    const riskColor = risk
        ? risk.level === 'high'
            ? '#FF453A'
            : risk.level === 'moderate'
                ? '#F5A623'
                : '#28A745'
        : null;

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
            {/* Case Info Card */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.caseTitle, { color: colors.text, fontSize: scaledFontSize(24) }]}>{caseData.caseTitle}</Text>
                <Text style={[styles.caseNumber, { color: colors.border, fontSize: scaledFontSize(14) }]}>{caseData.caseNumber}</Text>
                <View style={styles.badgeContainer}>
                    <View style={[styles.badge, { backgroundColor: colors.primary, opacity: 0.8 }]}>
                        <Text style={[styles.badgeText, { color: colors.card, fontSize: scaledFontSize(12) }]}>{caseData.caseType}</Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: colors.border }]}>
                        <Text style={[styles.badgeText, { color: colors.text, fontSize: scaledFontSize(12) }]}>{caseData.status}</Text>
                    </View>
                </View>
            </View>

            {/* Parties & Legal Reps Card */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                {renderInfoRow(caseData.caseType === 'Criminal' ? 'Prosecution' : 'Claimant', caseData.claimant)}
                {renderInfoRow('Defendant', caseData.defendant)}
                {renderInfoRow('Solicitor', caseData.solicitor)}
                {renderInfoRow('Barrister', caseData.barrister)}
            </View>

            {/* Court Info Card */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                {renderInfoRow('Court', caseData.court)}
                {renderInfoRow('Judge', caseData.judge)}
                {renderInfoRow('Court Date', caseData.courtDate)}
                {renderInfoRow('Court Location', caseData.courtLocation)}
                {renderInfoRow('Material Deadline', caseData.materialDeadline)}
                {renderInfoRow('Claim Value', caseData.claimValue ? `£${Number(caseData.claimValue).toLocaleString()}` : null)}
            </View>

            {/* Notes Card */}
            {caseData.notes && (
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>Notes</Text>
                    <Text style={[styles.notesText, { color: colors.text, fontSize: scaledFontSize(15) }]}>{caseData.notes}</Text>
                </View>
            )}

            {/* Weather & Risk Card */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>Weather & Risk</Text>
                {weatherLoading ? (
                    <View style={styles.weatherRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.infoValue, { color: colors.text, fontSize: scaledFontSize(15), marginLeft: 8 }]}>Loading weather...</Text>
                    </View>
                ) : weatherError ? (
                    <View style={styles.weatherRow}>
                        <Text style={[styles.infoValue, { color: colors.text, fontSize: scaledFontSize(15) }]}>{weatherError}</Text>
                        <TouchableOpacity onPress={loadWeather} style={{ marginLeft: 10 }}>
                            <Text style={{ color: colors.primary, fontSize: scaledFontSize(14) }}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : weather ? (
                    <View>
                        <Text style={[styles.infoValue, { color: colors.text, fontSize: scaledFontSize(15) }]}>
                            {weather.location}{weather.day ? ` on ${weather.day.date}` : ''}
                        </Text>
                        {weather.day ? (
                            <>
                                <Text style={[styles.infoValue, { color: colors.text, fontSize: scaledFontSize(15) }]}>
                                    {weatherDescription(weather.day.code)}
                                    {weather.day.tempMin != null ? ` · ${weather.day.tempMin}°C - ${weather.day.tempMax}°C` : ''}
                                    {weather.day.rainProb != null ? ` · Rain ${weather.day.rainProb}%` : ''}
                                    {weather.day.windMax != null ? ` · Wind ${weather.day.windMax} km/h` : ''}
                                </Text>
                                {risk && (
                                    <Text style={[styles.riskText, { color: riskColor, fontSize: scaledFontSize(14) }]}>{risk.message}</Text>
                                )}
                            </>
                        ) : (
                            <Text style={[styles.infoValue, { color: colors.text, fontSize: scaledFontSize(15) }]}>
                                {caseData.courtDate ? 'No forecast for this date yet (16-day limit).' : 'Set a court date to see the forecast.'}
                            </Text>
                        )}
                    </View>
                ) : null}
            </View>

            {/* Evidence Section */}
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <Text style={[styles.cardTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>Evidence</Text>
                {caseData.evidence && caseData.evidence.length > 0 ? (
                    caseData.evidence.map(item => (
                        <TouchableOpacity key={item.id} style={styles.evidenceItem} onPress={() => openEvidenceModal(item)}>
                            {item.photoUri && <Image source={{ uri: item.photoUri }} style={styles.evidenceThumbnail} />}
                            <View style={styles.evidenceTextContainer}>
                                <Text style={[styles.evidenceTitle, { color: colors.text, fontSize: scaledFontSize(16) }]}>#{item.number}: {item.title}</Text>
                                <Text style={[styles.evidenceDescription, { color: colors.border, fontSize: scaledFontSize(14) }]} numberOfLines={1}>{item.description}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={scaledFontSize(20)} color={colors.border} />
                        </TouchableOpacity>
                    ))
                ) : (
                    <Text style={[styles.emptyText, { color: colors.border, fontSize: scaledFontSize(15) }]}>No evidence yet — use Edit to add.</Text>
                )}
            </View>

            {/* Evidence Modal */}
            {selectedEvidence && (
                <Modal
                    animationType="slide"
                    transparent={false}
                    visible={isModalVisible}
                    onRequestClose={() => setIsModalVisible(false)}
                >
                    <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
                        <ScrollView contentContainerStyle={styles.modalContent}>
                            <Text style={[styles.modalTitle, { color: colors.text, fontSize: scaledFontSize(22) }]}>{selectedEvidence.title}</Text>
                            <Text style={[styles.modalDescription, { color: colors.text, fontSize: scaledFontSize(17), lineHeight: scaledFontSize(24) }]}>{selectedEvidence.description}</Text>
                            {selectedEvidence.photoUri && (
                                <Image source={{ uri: selectedEvidence.photoUri }} style={styles.modalImage} resizeMode="contain" />
                            )}
                        </ScrollView>
                        <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.primary }]} onPress={() => setIsModalVisible(false)}>
                            <Text style={[styles.closeButtonText, { color: colors.card, fontSize: scaledFontSize(18) }]}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </Modal>
            )}
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
    caseTitle: {
        fontWeight: 'bold',
        marginBottom: 4,
    },
    caseNumber: {
        marginBottom: 10,
    },
    badgeContainer: {
        flexDirection: 'row',
        marginBottom: 5,
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
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 8,
    },
    infoLabel: {
        fontWeight: '600',
        flex: 1,
    },
    infoValue: {
        flex: 2,
        textAlign: 'right',
    },
    cardTitle: {
        fontWeight: 'bold',
        marginBottom: 10,
    },
    notesText: {
        lineHeight: 22,
    },
    weatherRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    riskText: {
        marginTop: 6,
        fontStyle: 'italic',
    },
    evidenceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    evidenceThumbnail: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: 15,
    },
    evidenceTextContainer: {
        flex: 1,
    },
    evidenceTitle: {
        fontWeight: '600',
    },
    evidenceDescription: {
        marginTop: 2,
    },
    emptyText: {
        textAlign: 'center',
        paddingVertical: 20,
    },
    modalContainer: {
        flex: 1,
        paddingTop: 60,
    },
    modalContent: {
        padding: 20,
    },
    modalTitle: {
        fontWeight: 'bold',
        marginBottom: 15,
    },
    modalDescription: {
        marginBottom: 20,
    },
    modalImage: {
        width: '100%',
        height: 400,
        borderRadius: 12,
        alignSelf: 'center',
    },
    closeButton: {
        margin: 20,
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    closeButtonText: {
        fontWeight: 'bold',
    },
});

export default CaseDetailScreen;