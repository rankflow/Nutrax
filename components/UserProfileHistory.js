import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

const UserProfileHistory = () => {
  const [history, setHistory] = useState([]);
  const navigation = useNavigation();

  useEffect(() => {
    cargarHistorial();
  }, []);

  const cargarHistorial = async () => {
    const historyRaw = await AsyncStorage.getItem('userProfileHistory');
    if (historyRaw) {
      const arr = JSON.parse(historyRaw);
      // Ordenar por fecha descendente
      arr.sort((a, b) => b.fecha_actualizacion.localeCompare(a.fecha_actualizacion));
      setHistory(arr);
    } else {
      setHistory([]);
    }
  };

  const eliminarRegistro = (fecha) => {
    Alert.alert(
      'Eliminar registro',
      '¿Seguro que quieres eliminar este registro del histórico?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar', style: 'destructive', onPress: async () => {
            const nuevaLista = history.filter(item => item.fecha_actualizacion !== fecha);
            await AsyncStorage.setItem('userProfileHistory', JSON.stringify(nuevaLista));
            setHistory(nuevaLista);
          }
        }
      ]
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.date}>{item.fecha_actualizacion}</Text>
        <TouchableOpacity onPress={() => eliminarRegistro(item.fecha_actualizacion)}>
          <Text style={styles.delete}>🗑️</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.info}>Sexo: {item.sexo}</Text>
      <Text style={styles.info}>Edad: {item.edad} años</Text>
      <Text style={styles.info}>Altura: {item.altura_cm} cm</Text>
      <Text style={styles.info}>Peso: {item.peso_kg} kg</Text>
      <Text style={styles.info}>MB: {item.metabolismo_basal} kcal</Text>
      <Text style={styles.info}>Actividad: {item.actividad_texto}</Text>
      <Text style={styles.info}>Actividad kcal: {item.actividad_kcal_estimadas} kcal</Text>
      <Text style={styles.info}>TDEE: {item.tdee_base} kcal</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Histórico de Perfil</Text>
        <Button title="Volver" onPress={() => navigation.goBack()} />
      </View>
      {history.length === 0 ? (
        <Text style={styles.empty}>No hay registros en el histórico.</Text>
      ) : (
        <FlatList
          data={history}
          keyExtractor={item => item.fecha_actualizacion}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  date: {
    fontWeight: 'bold',
    color: '#333',
  },
  delete: {
    color: '#ff6b6b',
    fontSize: 18,
  },
  info: {
    fontSize: 15,
    color: '#444',
    marginBottom: 2,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
});

export default UserProfileHistory; 