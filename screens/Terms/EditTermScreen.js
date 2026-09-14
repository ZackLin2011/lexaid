import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@react-navigation/native';
import { useScaledFontSize } from '../../contexts/SettingsContext';

// Mock Picker, to be replace with a proper 
const CustomPicker = ({ label, selectedValue, onValueChange, items }) => {
    const { colors } = useTheme();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <View style={styles.pickerContainer}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            <TouchableOpacity
                style={[styles.pickerHeader, { backgroundColor: colors.card }]}
                onPress={() => setIsOpen(!isOpen)}
            >
                <Text style={{ color: colors.text }}>
                    {(() => {
                        if (!selectedValue) return 'Select...';
                        const found = items.find(it => it.value === selectedValue);
                        return found ? found.label : 'Select...';
                    })()}
                </Text>
            </TouchableOpacity>
            {isOpen && (
                <View style={{ backgroundColor: colors.card, borderRadius: 8, marginTop: 4 }}>
                    {items.map(item => (
                        <TouchableOpacity
                            key={item.value}
                            style={styles.pickerItem}
                            onPress={() => {
                                onValueChange(item.value);
                                setIsOpen(false);
                            }}
                        >
                            <Text style={{ color: colors.text }}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
};


// Add or edit a term, and optionally link it to a case for review later.
const EditTermScreen = ({ route, navigation }) => {
    const { colors } = useTheme();
    const scaledFontSize = useScaledFontSize();

    const termId = route.params?.id;
    const isEditing = !!termId;

    const [term, setTerm] = useState('');
    const [definition, setDefinition] = useState('');
    const [category, setCategory] = useState('general');
    const [status, setStatus] = useState('review');
    const [relatedCaseId, setRelatedCaseId] = useState(null);
    const [cases, setCases] = useState([]);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const loadData = async () => {
            // Load cases for the picker
            try {
                const allKeys = await AsyncStorage.getAllKeys();
                const caseKeys = allKeys.filter(key => key.startsWith('@case_') && key !== '@case_seed_done');
                if (caseKeys.length > 0) {
                    const casePairs = await AsyncStorage.multiGet(caseKeys);
                    const loadedCases = casePairs.map(([key, value]) => {
                        const caseData = JSON.parse(value);
                        const title = caseData.caseTitle || caseData.title || caseData.name || key;
                        const date = caseData.courtDate || '';
                        return {
                            id: key,
                            name: date ? `${date} · ${title}` : title,
                        };
                    });
                    setCases(loadedCases);
                }
            } catch (e) {
                console.error("Failed to load cases.", e);
            }

            // If editing, load the term data
            if (isEditing) {
                try {
                    const termData = await AsyncStorage.getItem(termId);
                    if (termData) {
                        const parsedData = JSON.parse(termData);
                        setTerm(parsedData.term || '');
                        setDefinition(parsedData.definition || '');
                        setCategory(parsedData.category || 'general');
                        setStatus(parsedData.status || 'review');
                        setRelatedCaseId(parsedData.caseId || null);
                    }
                } catch (e) {
                    console.error("Failed to load term.", e);
                }
            }
        };

        loadData();
    }, [isEditing, termId]);

    const validate = () => {
        const newErrors = {};
        if (!term.trim()) newErrors.term = 'Term is required.';
        if (!definition.trim()) newErrors.definition = 'Definition is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) {
            return;
        }

        const today = new Date().toISOString().split('T')[0];
        const newId = `@term_${Date.now()}`;
        const key = isEditing ? termId : newId;

        const termData = {
            id: key,
            term,
            definition,
            category,
            status,
            caseId: relatedCaseId,
            source: 'user',
            reviewCount: 0,
            intervalDays: 0,
            dueDate: today,
            lastReviewedAt: null,
            createdAt: today,
        };
        
        if (isEditing) {
            const existingDataRaw = await AsyncStorage.getItem(key);
            if (existingDataRaw) {
                const existingData = JSON.parse(existingDataRaw);
                termData.source = existingData.source || 'user';
                termData.createdAt = existingData.createdAt || today;
                termData.reviewCount = existingData.reviewCount || 0;
                termData.intervalDays = existingData.intervalDays || 0;
                termData.dueDate = existingData.dueDate || today;
                termData.lastReviewedAt = existingData.lastReviewedAt || null;
            }
        }


        try {
            await AsyncStorage.setItem(key, JSON.stringify(termData));
            Alert.alert('Success', 'Term saved successfully.');
            navigation.goBack();
        } catch (e) {
            Alert.alert('Error', 'Failed to save term.');
            console.error("Failed to save term.", e);
        }
    };

    const handleDelete = async () => {
        if (!isEditing) return;
        Alert.alert(
            'Delete Term',
            'Are you sure you want to delete this term? This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete', style: 'destructive', onPress: async () => {
                        try {
                            await AsyncStorage.removeItem(termId);
                            Alert.alert('Deleted', 'Term has been deleted.');
                            navigation.goBack();
                        } catch (e) {
                            Alert.alert('Error', 'Failed to delete term.');
                        }
                    }
                }
            ]
        );
    };

    const inputStyle = (field) => ([
        styles.input,
        {
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: errors[field] ? 'red' : colors.border,
            fontSize: scaledFontSize(16),
        }
    ]);

    return (
        <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.form}>
                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Term</Text>
                    <TextInput
                        style={inputStyle('term')}
                        value={term}
                        onChangeText={setTerm}
                        placeholder="e.g., Habeas Corpus"
                        placeholderTextColor={colors.text}
                    />
                    {errors.term && <Text style={styles.errorText}>{errors.term}</Text>}
                </View>

                <View style={styles.section}>
                    <Text style={[styles.label, { color: colors.text }]}>Definition</Text>
                    <TextInput
                        style={[inputStyle('definition'), { height: 120, textAlignVertical: 'top' }]}
                        value={definition}
                        onChangeText={setDefinition}
                        placeholder="A writ requiring a person under arrest to be brought before a judge..."
                        placeholderTextColor={colors.text}
                        multiline
                    />
                    {errors.definition && <Text style={styles.errorText}>{errors.definition}</Text>}
                </View>

                <CustomPicker
                    label="Category"
                    selectedValue={category}
                    onValueChange={setCategory}
                    items={[
                        { label: 'General', value: 'general' },
                        { label: 'Civil', value: 'civil' },
                        { label: 'Criminal', value: 'criminal' },
                        { label: 'Administrative', value: 'administrative' },
                    ]}
                />

                <CustomPicker
                    label="Status"
                    selectedValue={status}
                    onValueChange={setStatus}
                    items={[
                        { label: 'To Review', value: 'review' },
                        { label: 'Mastered', value: 'mastered' },
                    ]}
                />

                <CustomPicker
                    label="Related Case"
                    selectedValue={relatedCaseId}
                    onValueChange={setRelatedCaseId}
                    items={[
                        { label: 'None', value: null },
                        ...cases.map((c) => ({ label: c.name, value: c.id }))
                    ]}
                />

                <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                    <Text style={styles.saveButtonText}>Save Term</Text>
                </TouchableOpacity>

                {isEditing && (
                    <TouchableOpacity style={[styles.deleteButton, { backgroundColor: '#FF3B30' }]} onPress={handleDelete}>
                        <Text style={styles.saveButtonText}>Delete Term</Text>
                    </TouchableOpacity>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    form: {
        padding: 20,
    },
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    errorText: {
        color: 'red',
        marginTop: 4,
    },
    saveButton: {
        marginTop: 20,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteButton: {
        marginTop: 12,
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    pickerContainer: {
        marginBottom: 20,
    },
    pickerHeader: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
    },
    pickerItem: {
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    }
});

export default EditTermScreen;