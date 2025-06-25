import React from 'react';
import { View, StyleSheet, Button } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useNavigation } from '@react-navigation/native';
import DeficitHeader from '../components/DeficitHeader';

const CalendarScreen = () => {
  const navigation = useNavigation();

  const onDayPress = (day) => {
    navigation.replace('MealHistory', { selectedDate: day.dateString });
  };

  return (
    <View style={styles.container}>
      <DeficitHeader />
      <Calendar
        onDayPress={onDayPress}
        markedDates={{
          [new Date().toISOString().slice(0, 10)]: { selected: true, marked: true, selectedColor: '#4CAF50' },
        }}
        theme={{
          todayTextColor: '#4CAF50',
          arrowColor: '#4CAF50',
        }}
      />
      <Button title="Volver al historial" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    paddingTop: 20,
  },
});

export default CalendarScreen; 