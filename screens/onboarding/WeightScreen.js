import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../context/AuthContext';

const WeightScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { completeOnboarding } = useContext(AuthContext);
  const [weight, setWeight] = useState('');

  const handleFinish = async () => {
    const weightNum = parseFloat(weight.replace(',', '.'));
    if (isNaN(weightNum) || weightNum <= 20 || weightNum > 300) {
      Alert.alert('Error', 'Por favor, introduce un peso válido en kg.');
      return;
    }

    const finalProfile = {
      ...route.params,
      weight: weightNum,
      createdAt: new Date().toISOString(),
    };

    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(finalProfile));
      completeOnboarding();
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el perfil.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuál es tu peso actual?</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="0.0"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
        <Text style={styles.unit}>kg</Text>
      </View>
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleBack}>
          <Text style={styles.buttonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleFinish}>
          <Text style={styles.buttonText}>Finalizar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: 'black',
        textAlign: 'center',
        marginBottom: 24,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        borderBottomWidth: 2,
        borderColor: '#4CAF50',
        marginBottom: 40,
    },
    input: {
        padding: 10,
        fontSize: 32,
        textAlign: 'center',
        minWidth: 80,
    },
    unit: {
        fontSize: 20,
        color: '#333',
        marginLeft: 8,
    },
    button: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 40,
        paddingVertical: 15,
        borderRadius: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 24,
        marginTop: 8,
    },
});

export default WeightScreen; 