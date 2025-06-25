import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform, TouchableOpacity, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NUTRAX_API_KEY } from '@env';
import axios from 'axios';

const sexoOptions = [
  { label: 'Masculino', value: 'masculino' },
  { label: 'Femenino', value: 'femenino' },
  { label: 'Otro', value: 'otro' },
];

// Fórmula de Harris-Benedict
function calcularMetabolismoBasal({ sexo, edad, altura_cm, peso_kg }) {
  if (sexo === 'masculino') {
    return Math.round(88.36 + (13.4 * peso_kg) + (4.8 * altura_cm) - (5.7 * edad));
  } else if (sexo === 'femenino') {
    return Math.round(447.6 + (9.2 * peso_kg) + (3.1 * altura_cm) - (4.3 * edad));
  } else {
    // Media de ambas fórmulas
    const mbM = 88.36 + (13.4 * peso_kg) + (4.8 * altura_cm) - (5.7 * edad);
    const mbF = 447.6 + (9.2 * peso_kg) + (3.1 * altura_cm) - (4.3 * edad);
    return Math.round((mbM + mbF) / 2);
  }
}

// Simulación de IA para estimar calorías de la actividad
function estimateActivityCalories(texto) {
  // Simulación simple: busca palabras clave y asigna valores
  let kcal = 200;
  if (/pesas|gym|entrenamiento/i.test(texto)) kcal += 200;
  if (/pasos\s*(\d+k|\d+\s*mil|\d+\s*mil pasos)/i.test(texto)) {
    const match = texto.match(/(\d+)k/);
    if (match) kcal += parseInt(match[1]) * 40; // 40 kcal por cada 1k pasos
    else kcal += 180;
  } else if (/pasos|andar|caminar/i.test(texto)) kcal += 180;
  if (/correr|run/i.test(texto)) kcal += 250;
  if (/bici|bicicleta/i.test(texto)) kcal += 150;
  if (/nadar|swim/i.test(texto)) kcal += 220;
  return kcal;
}

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Prompt para la IA
function buildProfilePrompt({ sexo, edad, altura_cm, peso_kg, actividad_texto }) {
  return `Eres un nutricionista experto. Calcula lo siguiente para este usuario:
Sexo: ${sexo}
Edad: ${edad} años
Altura: ${altura_cm} cm
Peso: ${peso_kg} kg
Actividad física habitual: "${actividad_texto}"

Utiliza los datos de sexo, edad, peso y altura del usuario tanto para calcular el metabolismo basal (MB) como para estimar el gasto calórico de la actividad física.
Utiliza la fórmula de Mifflin-St Jeor para calcular el metabolismo basal (MB).

Devuelve un JSON con las siguientes claves:
- metabolismo_basal: (valor numérico en kcal/día, usando la fórmula de Mifflin-St Jeor)
- actividad_kcal_estimadas: (valor numérico en kcal/día, estimado a partir de la actividad física y los datos del usuario)
- tdee_base: (suma de metabolismo_basal y actividad_kcal_estimadas)
- detalle_actividad: (explica de forma precisa el cálculo realizado para la actividad física, mostrando el razonamiento y los datos usados)
NO EXPLIQUES NADA MÁS, SOLO EL JSON.`;
}

const getAge = (dobString) => {
  if (!dobString) return 0;
  const today = new Date();
  const birthDate = new Date(dobString);
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const UserProfile = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  const [profile, setProfile] = useState(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityText, setActivityText] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [tdeeResult, setTdeeResult] = useState(null);
  const [originalProfile, setOriginalProfile] = useState(null);
  const [originalActivity, setOriginalActivity] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const profileRaw = await AsyncStorage.getItem('userProfile');
      if (profileRaw) {
        const parsedProfile = JSON.parse(profileRaw);
        setProfile(parsedProfile);
        setHeight(parsedProfile.height.toString());
        setWeight(parsedProfile.weight.toString());
        // Guardar valores originales
        setOriginalProfile({
          height: parsedProfile.height.toString(),
          weight: parsedProfile.weight.toString(),
          gender: parsedProfile.gender,
          dob: parsedProfile.dob
        });
        // Cargar última actividad si existe en el histórico
        const historyRaw = await AsyncStorage.getItem('userProfileHistory');
        if (historyRaw) {
          const history = JSON.parse(historyRaw);
          if (history.length > 0) {
            const lastEntry = history[history.length - 1];
            setActivityText(lastEntry.actividad_texto || '');
            setOriginalActivity(lastEntry.actividad_texto || '');
            setTdeeResult({
              mb: lastEntry.metabolismo_basal,
              activity: lastEntry.actividad_kcal_estimadas,
              tdee: lastEntry.tdee_base
            });
          }
        }
      }
    };
    if (isFocused) {
      loadProfile();
    }
  }, [isFocused]);
  
  const handleUpdateProfile = async () => {
    const heightNum = parseInt(height);
    const weightNum = parseFloat(weight.replace(',', '.'));
    if (isNaN(heightNum) || isNaN(weightNum) || !activityText) {
      Alert.alert('Error', 'Por favor, introduce valores válidos.');
      return;
    }
    setLoading(true);

    try {
      const age = getAge(profile.dob);
      const prompt = buildProfilePrompt({
        sexo: profile.gender,
        edad: age,
        altura_cm: heightNum,
        peso_kg: weightNum,
        actividad_texto: activityText,
      });

      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [{ role: 'system', content: 'Eres un nutricionista experto.' }, { role: 'user', content: prompt }],
          temperature: 0,
        },
        { headers: { 'Authorization': `Bearer ${NUTRAX_API_KEY}` } }
      );

      const json = JSON.parse(response.data.choices[0].message.content.match(/\{[\s\S]*\}/)[0]);
      setTdeeResult({ mb: json.metabolismo_basal, activity: json.actividad_kcal_estimadas, tdee: json.tdee_base });

      // Actualizar perfil de usuario
      const updatedProfile = { ...profile, height: heightNum, weight: weightNum };
      await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      // Actualizar valores originales tras guardar
      setOriginalProfile({
        height: heightNum.toString(),
        weight: weightNum.toString(),
        gender: profile.gender,
        dob: profile.dob
      });
      setOriginalActivity(activityText);

      // Guardar en histórico (solo uno por día)
      const fecha = getTodayISO();
      const nuevoHistorico = {
        sexo: profile.gender,
        edad: age,
        altura_cm: heightNum,
        peso_kg: weightNum,
        metabolismo_basal: json.metabolismo_basal,
        actividad_texto: activityText,
        actividad_kcal_estimadas: json.actividad_kcal_estimadas,
        tdee_base: json.tdee_base,
        fecha_actualizacion: fecha,
      };
      
      const historyRaw = await AsyncStorage.getItem('userProfileHistory');
      let history = historyRaw ? JSON.parse(historyRaw) : [];
      history = history.filter(p => p.fecha_actualizacion !== fecha);
      history.push(nuevoHistorico);
      await AsyncStorage.setItem('userProfileHistory', JSON.stringify(history));
      
      Alert.alert('Perfil actualizado', `Tus datos y cálculo de TDEE han sido actualizados.`);

    } catch (error) {
      Alert.alert('Error', 'No se pudo actualizar el perfil.');
    } finally {
      setLoading(false);
    }
  };

  // Comprobar si hay cambios
  const hasChanges = () => {
    if (!originalProfile) return false;
    return (
      height !== originalProfile.height ||
      weight !== originalProfile.weight ||
      activityText !== originalActivity
    );
  };

  if (!profile) {
    return <View><Text>Cargando perfil...</Text></View>;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* <DeficitHeader /> */}
      {/* <Text style={styles.title}>{profile.name}</Text> */}
      
      <View style={styles.staticInfoBox}>
        <Text style={styles.staticInfo}>Género: {profile.gender}</Text>
        <Text style={styles.staticInfo}>Edad: {getAge(profile.dob)} años</Text>
      </View>

      <Text style={styles.label}>Altura (cm)</Text>
      <TextInput style={styles.input} value={height} onChangeText={setHeight} keyboardType="numeric" />

      <Text style={styles.label}>Peso (kg)</Text>
      <TextInput style={styles.input} value={weight} onChangeText={setWeight} keyboardType="numeric" />

      <Text style={styles.label}>Actividad física habitual</Text>
      <TextInput style={styles.input} value={activityText} onChangeText={setActivityText} multiline />

      <Button title={loading ? 'Actualizando...' : 'Actualizar y Calcular TDEE'} onPress={handleUpdateProfile} disabled={loading || !hasChanges()} />
      
      <View style={{ marginVertical: 16 }}>
        <TouchableOpacity style={styles.historyButton} onPress={() => navigation.navigate('UserProfileHistory')}>
          <Text style={styles.historyButtonText}>Ver histórico de perfil</Text>
        </TouchableOpacity>
      </View>
      {tdeeResult && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>MB: {tdeeResult.mb} kcal/día</Text>
          <Text style={styles.resultText}>Actividad: {tdeeResult.activity} kcal/día</Text>
          <Text style={styles.resultText}>TDEE: {tdeeResult.tdee} kcal/día</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#4CAF50',
    textAlign: 'center',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
    color: '#333',
  },
  input: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 8,
  },
  pickerContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 8,
  },
  historyButton: {
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  historyButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  resultBox: {
    marginTop: 16,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  staticInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  staticInfo: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default UserProfile; 