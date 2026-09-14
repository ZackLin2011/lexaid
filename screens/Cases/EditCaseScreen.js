import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet, TouchableOpacity, Alert, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRoute, useNavigation, useTheme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { savePhotoToAppDir, deletePhotoFile } from '../../utils/dataFiles';
import { Ionicons } from '@expo/vector-icons';
import { useScaledFontSize } from '../../contexts/SettingsContext';
import { Picker } from '@react-native-picker/picker'; // Assuming this is used in the project

// create or edit a case, including evidence items and taking photos for them.
const CASE_TYPES = ['Criminal', 'Civil – Contract', 'Civil – Tort', 'Civil – Property', 'Family', 'Employment Tribunal', 'Commercial', 'Administrative & Judicial Review', 'Probate', 'Other'];
const STATUS_OPTIONS = ['In Progress', 'Closed', 'Adjourned'];
const COURT_OPTIONS = ['Magistrates\' Court', 'Crown Court', 'County Court', 'High Court – King\'s Bench', 'High Court – Chancery', 'High Court – Family', 'Court of Appeal', 'Supreme Court', 'Employment Tribunal', 'First-tier Tribunal'];

const EditCaseScreen = () => {
    const route = useRoute();
    const navigation = useNavigation();
    const { colors } = useTheme();
    const scaledFontSize = useScaledFontSize();
    const caseId = route.params?.caseId;
    const isEditing = !!caseId;

    const [caseData, setCaseData] = useState({ caseTitle: '', caseNumber: '', caseType: CASE_TYPES[0], status: STATUS_OPTIONS[0], court: COURT_OPTIONS[0], claimant: '', defendant: '', solicitor: '', barrister: '', judge: '', courtDate: '', courtLocation: '', materialDeadline: '', claimValue: '', notes: '', evidence: [] });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        navigation.setOptions({ title: isEditing ? 'Edit Case' : 'New Case' });
        if (isEditing) {
            const loadCase = async () => {
                const jsonValue = await AsyncStorage.getItem(`@case_${caseId}`);
                if (jsonValue) setCaseData(JSON.parse(jsonValue));
            };
            loadCase();
        }
    }, [isEditing, caseId, navigation]);

    const handleInputChange = (field, value) => {
        setCaseData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!caseData.caseTitle.trim()) newErrors.caseTitle = 'Case Title is required.';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;

        try {
            const id = isEditing ? caseId : `ts_${Date.now()}`;
            const key = `@case_${id}`;
            const dataToSave = { ...caseData, id, updatedAt: new Date().toISOString() };
            if (!isEditing) dataToSave.createdAt = new Date().toISOString();

            await AsyncStorage.setItem(key, JSON.stringify(dataToSave));
            Alert.alert('Success', `Case ${isEditing ? 'updated' : 'created'} successfully.`);
            
            if (isEditing) {
                navigation.navigate('CaseDetail', { caseId: id });
            } else {
                navigation.navigate('CaseList');
            }
        } catch (e) {
            Alert.alert('Error', 'Failed to save the case.');
            console.error(e);
        }
    };

    const handleDeleteCase = () => {
        Alert.alert(
            'Delete Case',
            'Are you sure you want to permanently delete this case and all its evidence?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: async () => {
                    try {
                        // Delete evidence photos
                        for (const evi of caseData.evidence) {
                            if (evi.photoUri) { try { deletePhotoFile(evi.photoUri); } catch (err) { console.warn('Failed to delete photo', err); } }
                        }
                        await AsyncStorage.removeItem(`@case_${caseId}`);
                        Alert.alert('Deleted', 'The case has been deleted.');
                        navigation.navigate('CaseList');
                    } catch (e) {
                        Alert.alert('Error', 'Failed to delete the case.');
                        console.error(e);
                    }
                }},
            ]
        );
    };

    // Evidence Management
    const handleAddEvidence = () => {
        const newEvidence = {
            id: `ev_${Date.now()}`,
            number: (caseData.evidence.length + 1).toString(),
            title: '', 
            description: '', 
            photoUri: null
        };
        setCaseData(prev => ({ ...prev, evidence: [...prev.evidence, newEvidence] }));
    };

    const handleEvidenceChange = (id, field, value) => {
        setCaseData(prev => ({
            ...prev,
            evidence: prev.evidence.map(evi => evi.id === id ? { ...evi, [field]: value } : evi)
        }));
    };

    const handleDeleteEvidence = (id) => {
        const evidenceToDelete = caseData.evidence.find(e => e.id === id);
        Alert.alert('Delete Evidence', 'Are you sure?', [
            { text: 'Cancel' },
            { text: 'Delete', style: 'destructive', onPress: async () => {
                if (evidenceToDelete.photoUri) {
                    try { deletePhotoFile(evidenceToDelete.photoUri); } catch (err) { console.warn('Failed to delete photo', err); }
                }
                setCaseData(prev => ({ ...prev, evidence: prev.evidence.filter(e => e.id !== id) }));
            }}
        ]);
    };

    const handleTakePhoto = async (evidenceId) => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert('Permission Denied', 'Camera access is required to take photos.');
            return;
        }
        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (!result.canceled) {
            await savePhoto(evidenceId, result.assets[0].uri);
        }
    };

    const handleChooseFromLibrary = async (evidenceId) => {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.7 });
        if (!result.canceled) {
            await savePhoto(evidenceId, result.assets[0].uri);
        }
    };

    const savePhoto = async (evidenceId, tempUri) => {
        try {
            const destUri = savePhotoToAppDir(tempUri);
            if (!destUri) {
                Alert.alert('Not available', 'Saving photos is not supported in the web preview. Try it on your phone with Expo Go.');
                return;
            }
            handleEvidenceChange(evidenceId, 'photoUri', destUri);
        } catch (e) {
            Alert.alert('Error', 'Could not save photo: ' + (e.message || e));
            console.error(e);
        }
    };

    const renderTextInput = (label, field, placeholder, keyboardType = 'default', multiline = false) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text, fontSize: scaledFontSize(16) }]}>{label}</Text>
            <TextInput
                style={[
                    styles.input,
                    { color: colors.text, borderColor: errors[field] ? 'red' : colors.border, fontSize: scaledFontSize(16) },
                    multiline && { height: 100, textAlignVertical: 'top' }
                ]}
                value={caseData[field] || ''}
                onChangeText={(text) => handleInputChange(field, text)}
                placeholder={placeholder}
                placeholderTextColor={colors.border}
                keyboardType={keyboardType}
                multiline={multiline}
            />
            {errors[field] && <Text style={styles.errorText}>{errors[field]}</Text>}
        </View>
    );

    const renderPicker = (label, field, options) => (
        <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text, fontSize: scaledFontSize(16) }]}>{label}</Text>
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
                <Picker
                    selectedValue={caseData[field]}
                    onValueChange={(itemValue) => handleInputChange(field, itemValue)}
                    style={[styles.picker, { color: colors.text }]}
                    dropdownIconColor={colors.text}
                >
                    {options.map(opt => <Picker.Item key={opt} label={opt} value={opt} />)}
                </Picker>
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.contentContainer}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    {renderTextInput('Case Title', 'caseTitle', 'e.g., R v Smith')}
                    {renderTextInput('Case Number', 'caseNumber', 'e.g., CR-2026-0001')}
                    {renderPicker('Case Type', 'caseType', CASE_TYPES)}
                    {renderPicker('Status', 'status', STATUS_OPTIONS)}
                </View>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    {renderTextInput('Claimant / Prosecution', 'claimant', 'e.g., The Crown')}
                    {renderTextInput('Defendant', 'defendant', 'e.g., John Smith')}
                    {renderTextInput('Solicitor', 'solicitor', 'e.g., Goldsmith & Jones')}
                    {renderTextInput('Barrister', 'barrister', 'e.g., Ms. Eleanor Vance KC')}
                </View>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    {renderPicker('Court', 'court', COURT_OPTIONS)}
                    {renderTextInput('Judge', 'judge', 'e.g., HHJ Roberts')}
                    {renderTextInput('Court Date', 'courtDate', 'YYYY-MM-DD')}
                    {renderTextInput('Court Location', 'courtLocation', 'e.g., Snaresbrook Crown Court')}
                    {renderTextInput('Material Deadline', 'materialDeadline', 'YYYY-MM-DD')}
                    {renderTextInput('Claim Value (£)', 'claimValue', 'e.g., 75000', 'numeric')}
                </View>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    {renderTextInput('Notes', 'notes', 'Add any relevant notes here...', 'default', true)}
                </View>

                {/* Evidence Section */}
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.sectionTitle, { color: colors.text, fontSize: scaledFontSize(18) }]}>Evidence</Text>
                    {caseData.evidence.map((evi, index) => (
                        <View key={evi.id} style={[styles.evidenceCard, { borderColor: colors.border }]}>
                            <Text style={[styles.evidenceHeader, { color: colors.text, fontSize: scaledFontSize(16) }]}>Evidence #{index + 1}</Text>
                            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize: scaledFontSize(16) }]} value={evi.title} onChangeText={text => handleEvidenceChange(evi.id, 'title', text)} placeholder="Evidence Title (required)" />
                            <TextInput style={[styles.input, { color: colors.text, borderColor: colors.border, fontSize: scaledFontSize(16), height: 80, textAlignVertical: 'top' }]} value={evi.description} onChangeText={text => handleEvidenceChange(evi.id, 'description', text)} placeholder="Description (required)" multiline />
                            <View style={styles.evidenceButtons}>
                                <TouchableOpacity style={styles.photoButton} onPress={() => handleTakePhoto(evi.id)}><Ionicons name="camera" size={24} color={colors.primary} /><Text style={{color: colors.primary}}> Take Photo</Text></TouchableOpacity>
                                <TouchableOpacity style={styles.photoButton} onPress={() => handleChooseFromLibrary(evi.id)}><Ionicons name="images" size={24} color={colors.primary} /><Text style={{color: colors.primary}}> From Library</Text></TouchableOpacity>
                            </View>
                            {evi.photoUri && (
                                <View style={styles.thumbnailContainer}>
                                    <Image source={{ uri: evi.photoUri }} style={styles.thumbnail} />
                                    <TouchableOpacity onPress={() => handleEvidenceChange(evi.id, 'photoUri', null)} style={styles.removePhoto}> 
                                        <Ionicons name="close-circle" size={24} color="red" />
                                    </TouchableOpacity>
                                </View>
                            )}
                            <TouchableOpacity style={styles.deleteEvidenceButton} onPress={() => handleDeleteEvidence(evi.id)}>
                                <Ionicons name="trash-bin" size={20} color={'red'} />
                            </TouchableOpacity>
                        </View>
                    ))}
                    <TouchableOpacity style={[styles.addButton, { backgroundColor: colors.primary }]} onPress={handleAddEvidence}>
                        <Text style={[styles.addButtonText, { color: colors.card, fontSize: scaledFontSize(16) }]}>+ Add Evidence</Text>
                    </TouchableOpacity>
                </View>

                {isEditing && (
                    <View style={[styles.card, { backgroundColor: colors.card, borderColor: 'red', borderWidth: 1 }]}>
                        <Text style={[styles.sectionTitle, { color: 'red', fontSize: scaledFontSize(18) }]}>Danger Zone</Text>
                        <TouchableOpacity style={[styles.deleteButton, { backgroundColor: 'red' }]} onPress={handleDeleteCase}>
                            <Text style={[styles.addButtonText, { color: 'white', fontSize: scaledFontSize(16) }]}>Delete Case</Text>
                        </TouchableOpacity>
                    </View>
                )}

                <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSave}>
                    <Text style={[styles.saveButtonText, { color: colors.card, fontSize: scaledFontSize(18) }]}>Save Case</Text>
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    contentContainer: { padding: 15 },
    card: { borderRadius: 12, padding: 15, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
    inputGroup: { marginBottom: 15 },
    label: { fontWeight: '600', marginBottom: 5 },
    input: { borderWidth: 1, borderRadius: 8, padding: 10, height: 44 },
    errorText: { color: 'red', marginTop: 5 },
    pickerContainer: { borderWidth: 1, borderRadius: 8, height: 50, paddingHorizontal: 8, justifyContent: 'center', overflow: 'hidden' },
    picker: { height: 50 },
    sectionTitle: { fontWeight: 'bold', marginBottom: 10 },
    evidenceCard: { padding: 10, borderWidth: 1, borderRadius: 8, marginBottom: 10, position: 'relative' },
    evidenceHeader: { fontWeight: 'bold', marginBottom: 10 },
    evidenceButtons: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 10 },
    photoButton: { flexDirection: 'row', alignItems: 'center' },
    thumbnailContainer: { position: 'relative', alignSelf: 'center', marginTop: 10 },
    thumbnail: { width: 100, height: 100, borderRadius: 8 },
    removePhoto: { position: 'absolute', top: -10, right: -10 },
    deleteEvidenceButton: { position: 'absolute', top: 10, right: 10 },
    addButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    addButtonText: { fontWeight: 'bold' },
    deleteButton: { padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    saveButton: { padding: 15, borderRadius: 12, alignItems: 'center', marginTop: 10 },
    saveButtonText: { fontWeight: 'bold' },
});

export default EditCaseScreen;