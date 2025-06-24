import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

const DobScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [dob, setDob] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleNext = () => {
    if (!dob) {
      Alert.alert('Error', 'Por favor, selecciona tu fecha de nacimiento.');
      return;
    }
    // Validar que no sea una fecha futura
    const today = new Date();
    const selectedDate = new Date(dob);
    if (selectedDate > today) {
      Alert.alert('Error', 'No puedes seleccionar una fecha futura.');
      return;
    }
    navigation.navigate('Height', { ...route.params, dob: dob.toISOString().slice(0, 10) });
  };

  const showDatePicker = () => setShowPicker(true);
  const onChange = (event, selectedDate) => {
    setShowPicker(Platform.OS === 'ios');
    if (selectedDate) setDob(selectedDate);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuándo naciste?</Text>
      <TouchableOpacity style={styles.dateButton} onPress={showDatePicker}>
        <Text style={styles.dateButtonText}>
          {dob ? dob.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Selecciona tu fecha de nacimiento'}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={dob || new Date(2000, 0, 1)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
          maximumDate={new Date()}
        />
      )}
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>→</Text>
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
  dateButton: {
    backgroundColor: '#f0f0f0',
    padding: 16,
    borderRadius: 8,
    marginBottom: 40,
  },
  dateButtonText: {
    fontSize: 20,
    color: '#333',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    marginTop: 8,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 50,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default DobScreen; 