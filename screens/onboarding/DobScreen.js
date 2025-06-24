import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Calendar } from 'react-native-calendars';

const DobScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [dob, setDob] = useState(null);
  const [showYearPicker, setShowYearPicker] = useState(false);

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
    navigation.navigate('Height', { ...route.params, dob });
  };
  
  const onDayPress = (day) => {
    setDob(day.dateString);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuándo naciste?</Text>
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          [dob]: { selected: true, marked: true, selectedColor: '#4CAF50' },
        }}
        theme={{
          todayTextColor: '#4CAF50',
          arrowColor: '#4CAF50',
        }}
        maxDate={new Date().toISOString().slice(0, 10)}
        onMonthChange={() => {}}
        onPressArrowLeft={substractMonth => substractMonth()}
        onPressArrowRight={addMonth => addMonth()}
        hideExtraDays={true}
        enableSwipeMonths={true}
      />
      <TouchableOpacity style={styles.button} onPress={handleNext}>
        <Text style={styles.buttonText}>→</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    justifyContent: 'space-between',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'black',
    textAlign: 'center',
    marginVertical: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

export default DobScreen; 