import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  Alert,
  Button
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute, useIsFocused } from '@react-navigation/native';
import Collapsible from 'react-native-collapsible';

const STORAGE_KEY = 'meals_data';
const CALORIES_TOTALS_KEY = 'meals_calories_totals';

// --- Funciones de fecha ---
const getWeekDays = (date) => {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Ajuste para que la semana empiece en lunes
  startOfWeek.setDate(diff);

  const week = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    week.push(day);
  }
  return week;
};

const formatDateToISO = (date) => date.toISOString().slice(0, 10);
const formatDateToDisplay = (dateStr) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};
const getDayName = (date) => {
  return date.toLocaleDateString('es-ES', { weekday: 'long' });
};

// Función para extraer calorías de un texto
function extractCalories(text) {
  if (!text) return 0;
  const totalLine = text.split('\n').find(line => /calor[ií]as totales/i.test(line));
  if (totalLine) {
    const match = totalLine.match(/([\d,.]+)\s*kcal/i);
    if (match) {
      return parseInt(match[1].replace(',', '.'));
    }
  }
  return 0;
}

// Extraer macros del texto de la IA
function extractMacros(text) {
  if (!text) return { proteinas: '', grasas: '', carbohidratos: '' };
  const prot = text.match(/prote[ií]nas:\s*~?([\d,.]+)\s*g/i);
  const grasas = text.match(/grasas:\s*~?([\d,.]+)\s*g/i);
  const carb = text.match(/carbohidratos:\s*~?([\d,.]+)\s*g/i);
  return {
    proteinas: prot ? prot[1] : '',
    grasas: grasas ? grasas[1] : '',
    carbohidratos: carb ? carb[1] : ''
  };
}

// Extraer nombre del texto de la IA
function extractName(meal, idx) {
  if (meal.name && meal.name.trim()) return meal.name;
  return `Comida ${idx + 1}`;
}

const MealHistoryScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const isFocused = useIsFocused();
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [meals, setMeals] = useState([]);
  const [groupedMeals, setGroupedMeals] = useState([]);
  const [activeSections, setActiveSections] = useState([]); // Para el acordeón
  const [caloriesTotals, setCaloriesTotals] = useState({});
  const [expandedMeals, setExpandedMeals] = useState({}); // { [mealId]: bool }

  // Cargar comidas
  const loadMeals = async () => {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEY);
      const mealsData = data ? JSON.parse(data) : [];
      setMeals(mealsData);
    } catch (error) {
      console.error('Error loading meals:', error);
      Alert.alert('Error', 'No se pudieron cargar las comidas');
    }
  };

  useEffect(() => {
    if (isFocused) {
      const selectedDate = route.params?.selectedDate;
      if (selectedDate) {
        setCurrentDate(new Date(selectedDate));
        navigation.setParams({ selectedDate: undefined });
      }
      loadMeals();
    }
  }, [isFocused, route.params?.selectedDate]);
  
  // Calcular y guardar totales de calorías por día
  useEffect(() => {
    const weekDays = getWeekDays(currentDate).map(formatDateToISO);
    const filtered = meals.filter(meal => weekDays.includes(formatDateToISO(new Date(meal.date))));
    const grouped = filtered.reduce((acc, meal) => {
      const dateKey = formatDateToISO(new Date(meal.date));
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(meal);
      return acc;
    }, {});
    // Calcular totales
    const totals = {};
    Object.entries(grouped).forEach(([date, mealsArr]) => {
      totals[date] = mealsArr.reduce((sum, meal) => sum + extractCalories(meal.aiOutput), 0);
    });
    setCaloriesTotals(totals);
    // Guardar en AsyncStorage
    AsyncStorage.setItem(CALORIES_TOTALS_KEY, JSON.stringify(totals));
    // Agrupar comidas por día para la semana actual
    const sections = weekDays.map(dateStr => ({
      title: `${getDayName(new Date(dateStr + 'T00:00:00'))}, ${formatDateToDisplay(dateStr)}`,
      dateKey: dateStr,
      data: grouped[dateStr] || []
    }));
    setGroupedMeals(sections);
  }, [meals, currentDate]);

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
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la comida');
            }
          }
        }
      ]
    );
  };

  const toggleSection = (dateKey) => {
    setActiveSections(prev =>
      prev.includes(dateKey) ? prev.filter(k => k !== dateKey) : [...prev, dateKey]
    );
  };

  // Renderizar cada comida como colapsable
  const renderMeal = ({ item, index, section }) => {
    const mealName = extractName(item, index);
    const hora = new Date(item.date).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const kcal = extractCalories(item.aiOutput);
    const macros = extractMacros(item.aiOutput);
    const expanded = expandedMeals[item.id];
    return (
      <View style={styles.mealCard}>
        <TouchableOpacity onPress={() => setExpandedMeals(prev => ({ ...prev, [item.id]: !expanded }))}>
          <View style={styles.mealHeaderRow}>
            <Text style={styles.mealName}>{mealName}</Text>
            <Text style={styles.mealTime}>{hora}</Text>
          </View>
          <View style={styles.mealSummaryRow}>
            <Text style={styles.kcalTotal}>{kcal > 0 ? `${kcal} kcal` : ''}</Text>
            <Text style={styles.macros}>{`P: ${macros.proteinas}g  G: ${macros.grasas}g  C: ${macros.carbohidratos}g`}</Text>
          </View>
        </TouchableOpacity>
        {expanded && (
          <View style={styles.mealDetailBox}>
            <Text style={styles.aiResponse}>{item.aiOutput}</Text>
            <TouchableOpacity onPress={() => deleteMeal(item.id)} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  const renderSectionHeader = ({ section: { title, data, dateKey } }) => {
    const isCollapsed = !activeSections.includes(dateKey);
    const isToday = title.includes(formatDateToDisplay(formatDateToISO(new Date())));
    const totalKcal = caloriesTotals[dateKey] || 0;
    return (
      <TouchableOpacity onPress={() => toggleSection(dateKey)}>
        <View style={[styles.sectionHeader, isToday && styles.todayHeader]}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.kcalTotal}>{totalKcal > 0 ? `${totalKcal} kcal` : ''}</Text>
          <Text style={styles.arrow}>{isCollapsed ? '▼' : '▲'}</Text>
        </View>
      </TouchableOpacity>
    );
  };
  
  // Modificar la estructura de datos para que cada comida tenga el título de su sección
  const sectionsWithItemTitles = groupedMeals.map(section => ({
    ...section,
    data: activeSections.includes(section.dateKey) ? section.data.map(item => ({...item, sectionTitle: section.title })) : []
  }));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Button title="<" onPress={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() - 7)))} />
        <Text style={styles.headerTitle}>Semana del {formatDateToDisplay(formatDateToISO(getWeekDays(currentDate)[0]))}</Text>
        <Button title=">" onPress={() => setCurrentDate(new Date(currentDate.setDate(currentDate.getDate() + 7)))} />
      </View>
      <Button title="Ir al Calendario" onPress={() => navigation.replace('Calendar')} />
      
      <SectionList
        sections={sectionsWithItemTitles}
        keyExtractor={(item) => item.id}
        renderItem={renderMeal}
        renderSectionHeader={renderSectionHeader}
        style={styles.sectionList}
        ListEmptyComponent={<Text style={styles.emptyText}>Cargando comidas...</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: 'white' },
  headerTitle: { fontSize: 16, fontWeight: 'bold' },
  sectionList: { paddingHorizontal: 16 },
  sectionHeader: { backgroundColor: '#e9e9e9', padding: 12, marginTop: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50' },
  noMealsText: { color: '#888', fontStyle: 'italic', marginTop: 4 },
  mealCard: { backgroundColor: 'white', padding: 12, marginVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#eee' },
  mealHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  mealName: { fontWeight: 'bold', fontSize: 16, color: '#4CAF50' },
  mealSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  mealTime: { fontWeight: 'bold', marginBottom: 6 },
  aiResponse: { color: '#333' },
  deleteButton: { alignSelf: 'flex-end', marginTop: 8 },
  deleteButtonText: { color: '#ff6b6b', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', marginTop: 40, color: '#888' },
  todayHeader: {
    backgroundColor: '#d4edda', // Verde claro para resaltar
    borderColor: '#4CAF50',
    borderWidth: 1,
  },
  arrow: {
    fontSize: 16,
    color: '#333',
  },
  kcalTotal: {
    fontWeight: 'bold',
    color: '#e67e22',
    marginLeft: 8,
    fontSize: 16,
  },
  macros: { fontSize: 13, color: '#888', marginLeft: 8 },
  mealDetailBox: { marginTop: 8 },
});

export default MealHistoryScreen;
