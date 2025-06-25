import { NUTRAX_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { useNavigation } from '@react-navigation/native';
import Modal from 'react-native-modal';

const STORAGE_KEY = 'meals_data';

// Función para cargar datos guardados
const loadMeals = async () => {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading meals:', error);
    return [];
  }
};

// Función para guardar datos
const saveMeals = async (meals) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(meals));
  } catch (error) {
    console.error('Error saving meals:', error);
  }
};

const MealLogger = () => {
  // Estados para texto e imagen
  const [textInput, setTextInput] = useState('');
  const [aiResponse, setAIResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [image, setImage] = useState(null);
  const [logs, setLogs] = useState([]);
  
  // Estados para grabación de voz
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [permissionResponse, requestPermission] = Audio.usePermissions();

  const navigation = useNavigation();
  const [modalVisible, setModalVisible] = useState(false);
  const [pendingMeal, setPendingMeal] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Seleccionar imagen
  const pickImage = async () => {
    setImageLoading(true);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
    setImageLoading(false);
  };

  // --- Lógica de grabación de voz ---
  
  const startRecording = async () => {
    try {
      if (permissionResponse.status !== 'granted') {
        await requestPermission();
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
      addLog('Grabación iniciada...');
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Error', 'No se pudo iniciar la grabación.');
    }
  };

  const stopRecordingAndTranscribe = async () => {
    setIsRecording(false);
    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    addLog(`Grabación detenida. Audio en: ${uri}`);
    
    // Transcribir el audio
    setLoading(true);
    addLog('Transcribiendo audio...');
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: 'audio.m4a',
        type: 'audio/m4a',
      });
      formData.append('model', 'whisper-1');
      
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${NUTRAX_API_KEY}`,
          'Content-Type': 'multipart/form-data',
        },
      });
      const transcribedText = response.data.text;
      setTextInput(prev => (prev ? `${prev} ${transcribedText}` : transcribedText).trim());
      addLog('Transcripción completada.');
    } catch (error) {
      console.error('Error transcribing audio:', error.response?.data || error.message);
      Alert.alert('Error', 'No se pudo transcribir el audio.');
      addLog(`Error de transcripción: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleVoicePress = () => {
    if (isRecording) {
      stopRecordingAndTranscribe();
    } else {
      startRecording();
    }
  };

  // --- Fin de lógica de voz ---

  // Enviar a la IA (texto, imagen o ambos)
  const handleSubmit = async () => {
    if (!textInput.trim() && !image) {
      Alert.alert('Error', 'Debes escribir una descripción, adjuntar una imagen o ambas cosas.');
      return;
    }
    setLoading(true);
    setAIResponse('');
    addLog('Iniciando análisis...');
    try {
      let messages = [];
      // Prompt para texto e imagen
      if (textInput.trim() && image) {
        messages = [
          { role: 'system', content: 'Eres un nutricionista experto. Analiza la comida descrita y/o mostrada en la imagen y devuelve SOLO la siguiente información en formato claro y fácil de leer para móvil:\n\n1. Una línea al principio con el tipo de comida del día, usando este formato: Nombre: desayuno, comida, merienda, cena, preentreno, postentreno, etc. Si el usuario no lo especifica, pon Nombre: Comida N (donde N es el número de comida del día, empezando por 1).\n2. Lista de ingredientes, cada uno en una línea, con este formato:\n   - Ingrediente: cantidad estimada (~calorías aproximadas)\n   Ejemplo: Queso: 50 g (~160 kcal)\n\n3. Un resumen final con los totales estimados:\n   - Calorías totales: ~kcal\n   - Proteínas: ~g\n   - Grasas: ~g\n   - Carbohidratos: ~g\n\nNo añadas explicaciones, recomendaciones ni texto adicional. No uses tablas ni Markdown, solo listas simples.' },
          { role: 'user', content: textInput },
          { role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 })}` } }
          ]}
        ];
      } else if (image) {
        messages = [
          { role: 'system', content: 'Eres un nutricionista experto. Analiza la comida de la imagen y devuelve SOLO la siguiente información en formato claro y fácil de leer para móvil:\n\n1. Una línea al principio con el tipo de comida del día, usando este formato: Nombre: desayuno, comida, merienda, cena, preentreno, postentreno, etc. Si el usuario no lo especifica, pon Nombre: Comida N (donde N es el número de comida del día, empezando por 1).\n2. Lista de ingredientes, cada uno en una línea, con este formato:\n   - Ingrediente: cantidad estimada (~calorías aproximadas)\n   Ejemplo: Queso: 50 g (~160 kcal)\n\n3. Un resumen final con los totales estimados:\n   - Calorías totales: ~kcal\n   - Proteínas: ~g\n   - Grasas: ~g\n   - Carbohidratos: ~g\n\nNo añadas explicaciones, recomendaciones ni texto adicional. No uses tablas ni Markdown, solo listas simples.' },
          { role: 'user', content: [
            { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 })}` } }
          ]}
        ];
      } else {
        messages = [
          { role: 'system', content: 'Eres un nutricionista preciso y conciso. Analiza la comida descrita y devuelve:\n1. Una línea al principio con el tipo de comida del día, usando este formato: Nombre: desayuno, comida, merienda, cena, preentreno, postentreno, etc. Si el usuario no lo especifica, pon Nombre: Comida N (donde N es el número de comida del día, empezando por 1).\n2) Lista de ingredientes con cantidad (~kcal)\n3) Calorías totales\n4) Macronutrientes totales (proteínas, grasas, carbohidratos en gramos). Usa listas simples, sin explicaciones.' },
          { role: 'user', content: textInput }
        ];
      }
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages,
        },
        {
          headers: {
            'Authorization': `Bearer ${NUTRAX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const aiText = response.data.choices[0].message.content;
      // Validar respuesta IA
      if (!aiText || /no puedo ayudar|no puedo analizar|no puedo identificar|no puedo procesar|no puedo responder/i.test(aiText.trim())) {
        Alert.alert('Error', 'La IA no pudo analizar la comida. Intenta describirla de manera más clara, revisa la calidad de la imagen o prueba con otra.');
        setLoading(false);
        return;
      }
      setAIResponse(aiText);
      setPendingMeal({
        type: 'mixto',
        input: textInput.trim() ? textInput : null,
        imageUri: image,
        aiOutput: aiText
      });
      setModalVisible(true);
      addLog('Vista previa lista para confirmar');
    } catch (error) {
      addLog(`Error: ${error.message}`);
      addLog(`Status: ${error.response?.status}`);
      addLog(`Data: ${JSON.stringify(error.response?.data)}`);
      let errorMessage = 'No se pudo obtener respuesta de la IA.';
      if (error.response?.status === 401) {
        errorMessage = 'Error de autenticación. Verifica tu API Key.';
      } else if (error.response?.status === 429) {
        errorMessage = 'Límite de uso excedido. Intenta más tarde.';
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      }
      Alert.alert('Error', errorMessage);
    }
    setLoading(false);
  };

  // Confirmar y guardar comida
  const handleConfirm = async () => {
    if (!pendingMeal) return;
    await saveMeal(pendingMeal.type, pendingMeal.input, pendingMeal.imageUri, pendingMeal.aiOutput);
    setModalVisible(false);
    setPendingMeal(null);
    setTextInput('');
    setImage(null);
    setAIResponse('');
    navigation.navigate('Home');
  };

  // Cancelar modal
  const handleCancel = () => {
    setModalVisible(false);
    setPendingMeal(null);
  };

  // Guardar en AsyncStorage
  const saveMeal = async (type, input, imageUri, aiOutput) => {
    try {
      const existingMeals = await loadMeals();
      // Extraer el nombre de la comida de la respuesta de la IA
      let name = '';
      const nameMatch = aiOutput.match(/^Nombre:\s*(.+)$/m);
      if (nameMatch) {
        name = nameMatch[1].trim();
      }
      const newMeal = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type,
        input,
        imageUri,
        aiOutput,
        name
      };
      const updatedMeals = [...existingMeals, newMeal];
      await saveMeals(updatedMeals);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la comida');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar comida</Text>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Describe tu comida y/o adjunta una imagen</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe tu comida..."
          value={textInput}
          onChangeText={setTextInput}
          multiline
        />
        <View style={styles.buttonRow}>
          <Button title={image ? 'Cambiar imagen' : 'Adjuntar imagen'} onPress={pickImage} />
          <TouchableOpacity onPress={handleVoicePress} style={styles.micButton}>
            <Text style={styles.micButtonText}>{isRecording ? '⏹️ Detener' : '🎤 Grabar'}</Text>
          </TouchableOpacity>
        </View>
        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
          </View>
        )}
        <Button
          title={loading ? 'Analizando...' : 'Enviar'}
          onPress={handleSubmit}
          disabled={
            loading || isRecording || imageLoading || (!textInput.trim() && !image)
          }
          color={(!textInput.trim() && !image) || imageLoading ? '#ccc' : '#4CAF50'}
        />
        {loading && <ActivityIndicator style={{ marginTop: 8 }} />}
        {/* Modal de confirmación */}
        <Modal isVisible={modalVisible} onBackdropPress={handleCancel}>
          <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10 }}>Confirma tu comida</Text>
            {pendingMeal && (
              <ScrollView style={{ maxHeight: 300 }}>
                <Text style={{ color: '#333', marginBottom: 10 }}>{pendingMeal.aiOutput}</Text>
              </ScrollView>
            )}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
              <Button title="Cancelar" onPress={handleCancel} color="#888" />
              <Button title="Confirmar" onPress={handleConfirm} color="#4CAF50" />
            </View>
          </View>
        </Modal>
      </View>
      {logs.length > 0 && (
        <View style={styles.logsContainer}>
          <Text style={styles.logsTitle}>Logs de actividad:</Text>
          <ScrollView style={styles.logsScroll}>
            {logs.map((log, index) => (
              <Text key={index} style={styles.logText}>{log}</Text>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    color: '#4CAF50',
  },
  section: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  responseBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
  },
  responseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#2e7d32',
  },
  responseText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  imageContainer: {
    marginTop: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  logsContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  logsScroll: {
    maxHeight: 150,
  },
  logText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 12,
  },
  micButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  micButtonText: {
    fontSize: 16,
  },
});

export default MealLogger; 