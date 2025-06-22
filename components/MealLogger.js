import { NUTRAX_API_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Button, Image, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

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
  // Estados para texto
  const [textInput, setTextInput] = useState('');
  const [textAIResponse, setTextAIResponse] = useState('');
  const [textLoading, setTextLoading] = useState(false);

  // Estados para imagen
  const [image, setImage] = useState(null);
  const [imageAIResponse, setImageAIResponse] = useState('');
  const [imageLoading, setImageLoading] = useState(false);

  // Estado para logs
  const [logs, setLogs] = useState([]);

  // Función para agregar logs
  const addLog = (message) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Función para enviar texto a GPT-4o
  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setTextLoading(true);
    setTextAIResponse('');
    addLog('Iniciando envío de texto...');
    
    try {
      addLog(`API Key: ${NUTRAX_API_KEY ? 'Presente' : 'Ausente'}`);
      addLog(`Enviando texto: ${textInput}`);
      
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: "Eres un nutricionista preciso y conciso. Analiza la comida descrita y devuelve: 1) Calorías estimadas 2) Gramos aproximados de proteína, grasa y carbohidratos 3) Recomendación rápida de salud o ajuste. Devuelve todo en menos de 100 palabras, sin repetir ideas." },
            { role: 'user', content: textInput }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${NUTRAX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      addLog(`Respuesta recibida: ${response.status}`);
      const aiText = response.data.choices[0].message.content;
      setTextAIResponse(aiText);
      await saveMeal('texto', textInput, null, aiText);
      addLog('Comida guardada exitosamente');
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
    setTextLoading(false);
  };

  // Función para seleccionar imagen
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setImageAIResponse('');
    }
  };

  // Función para enviar imagen a GPT-4o
  const handleImageSubmit = async () => {
    if (!image) return;
    setImageLoading(true);
    setImageAIResponse('');
    try {
      // Leer imagen como base64
      const base64 = await FileSystem.readAsStringAsync(image, { encoding: FileSystem.EncodingType.Base64 });
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'Eres un asistente experto en nutrición. Analiza la comida de la imagen y da información nutricional y recomendaciones.' },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64}` }
                }
              ]
            }
          ]
        },
        {
          headers: {
            'Authorization': `Bearer ${NUTRAX_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      const aiText = response.data.choices[0].message.content;
      setImageAIResponse(aiText);
      await saveMeal('imagen', null, image, aiText);
    } catch (error) {
      Alert.alert('Error', 'No se pudo obtener respuesta de la IA.');
    }
    setImageLoading(false);
  };

  // Guardar en AsyncStorage
  const saveMeal = async (type, input, imageUri, aiOutput) => {
    try {
      const existingMeals = await loadMeals();
      const newMeal = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        type,
        input,
        imageUri,
        aiOutput
      };
      const updatedMeals = [...existingMeals, newMeal];
      await saveMeals(updatedMeals);
      Alert.alert('Éxito', 'Comida guardada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la comida');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Registrar comida</Text>
      
      {/* Sección texto */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Describir comida (texto)</Text>
        <TextInput
          style={styles.input}
          placeholder="Describe tu comida..."
          value={textInput}
          onChangeText={setTextInput}
          multiline
        />
        <Button title="Enviar" onPress={handleTextSubmit} disabled={textLoading} />
        {textLoading && <ActivityIndicator style={{ marginTop: 8 }} />}
        {textAIResponse ? (
          <View style={styles.responseBox}>
            <Text style={styles.responseTitle}>Respuesta IA:</Text>
            <TextInput
              style={styles.responseText}
              value={textAIResponse}
              editable={false}
              multiline
            />
          </View>
        ) : null}
      </View>

      {/* Sección imagen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analizar imagen de comida</Text>
        <Button title="Seleccionar imagen" onPress={pickImage} />
        {image && (
          <View style={styles.imageContainer}>
            <Image source={{ uri: image }} style={styles.image} />
            <Button title="Analizar imagen" onPress={handleImageSubmit} disabled={imageLoading} />
            {imageLoading && <ActivityIndicator style={{ marginTop: 8 }} />}
            {imageAIResponse ? (
              <View style={styles.responseBox}>
                <Text style={styles.responseTitle}>Respuesta IA:</Text>
                <TextInput
                  style={styles.responseText}
                  value={imageAIResponse}
                  editable={false}
                  multiline
                />
              </View>
            ) : null}
          </View>
        )}
      </View>

      {/* Logs */}
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
});

export default MealLogger; 