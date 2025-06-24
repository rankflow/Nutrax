import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const HeightScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [height, setHeight] = useState('');

  const handleNext = () => {
    const heightNum = parseInt(height);
    if (isNaN(heightNum) || heightNum <= 50 || heightNum > 250) {
      Alert.alert('Error', 'Por favor, introduce una altura válida en cm.');
      return;
    }
    navigation.navigate('Weight', { ...route.params, height: heightNum });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>¿Cuál es tu altura?</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="0"
          value={height}
          onChangeText={setHeight}
          keyboardType="number-pad"
        />
        <Text style={styles.unit}>cm</Text>
      </View>
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

export default HeightScreen; 