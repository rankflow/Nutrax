import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'meals_data';

const MealHistoryScreen = () => {
  const [meals, setMeals] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Función para cargar comidas
  const loadMeals = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const mealsData = data ? JSON.parse(data) : [];
      setMeals(mealsData.reverse()); // Mostrar las más recientes primero
    } catch (error) {
      console.error('Error loading meals:', error);
      Alert.alert('Error', 'No se pudieron cargar las comidas');
    }
  };

  // Función para eliminar una comida
  const deleteMeal = async (mealId) => {
    Alert.alert(
      'Confirmar eliminación',
      '¿Estás seguro de que quieres eliminar esta comida?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedMeals = meals.filter(meal => meal.id !== mealId);
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMeals));
              setMeals(updatedMeals);
              Alert.alert('Éxito', 'Comida eliminada correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la comida');
            }
          }
        }
      ]
    );
  };

  // Función para limpiar todo el historial
  const clearAllMeals = () => {
    Alert.alert(
      'Confirmar limpieza',
      '¿Estás seguro de que quieres eliminar todo el historial? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar todo',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(STORAGE_KEY);
              setMeals([]);
              Alert.alert('Éxito', 'Historial limpiado correctamente');
            } catch (error) {
              Alert.alert('Error', 'No se pudo limpiar el historial');
            }
          }
        }
      ]
    );
  };

  // Función para refrescar
  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeals();
    setRefreshing(false);
  };

  // Cargar comidas al montar el componente
  useEffect(() => {
    loadMeals();
  }, []);

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial de Comidas</Text>
        {meals.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={clearAllMeals}>
            <Text style={styles.clearButtonText}>Limpiar todo</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {meals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No hay comidas registradas</Text>
            <Text style={styles.emptySubtext}>
              Ve a "Registrar Comida" para agregar tu primera comida
            </Text>
          </View>
        ) : (
          meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.mealHeader}>
                <Text style={styles.mealDate}>{formatDate(meal.date)}</Text>
                <Text style={styles.mealType}>
                  {meal.type === 'texto' ? '📝 Texto' : '📷 Imagen'}
                </Text>
              </View>

              {meal.input && (
                <View style={styles.mealSection}>
                  <Text style={styles.sectionTitle}>Descripción:</Text>
                  <Text style={styles.mealInput}>{meal.input}</Text>
                </View>
              )}

              {meal.imageUri && (
                <View style={styles.mealSection}>
                  <Text style={styles.sectionTitle}>Imagen:</Text>
                  <Text style={styles.imageText}>📷 Imagen adjunta</Text>
                </View>
              )}

              <View style={styles.mealSection}>
                <Text style={styles.sectionTitle}>Análisis IA:</Text>
                <Text style={styles.aiResponse}>{meal.aiOutput}</Text>
              </View>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => deleteMeal(meal.id)}
              >
                <Text style={styles.deleteButtonText}>🗑️ Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  clearButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  mealCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  mealType: {
    fontSize: 12,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  mealSection: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  mealInput: {
    fontSize: 14,
    color: '#555',
    backgroundColor: '#f9f9f9',
    padding: 8,
    borderRadius: 6,
  },
  imageText: {
    fontSize: 14,
    color: '#555',
    fontStyle: 'italic',
  },
  aiResponse: {
    fontSize: 14,
    color: '#333',
    backgroundColor: '#e8f5e8',
    padding: 12,
    borderRadius: 8,
    lineHeight: 20,
  },
  deleteButton: {
    alignSelf: 'flex-end',
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default MealHistoryScreen;
