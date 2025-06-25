import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'meals_data';

function getTodayISO() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const DeficitHeader = () => {
  const [name, setName] = useState('');
  const [tdee, setTdee] = useState(null);
  const [kcalHoy, setKcalHoy] = useState(0);
  const [deficit, setDeficit] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      // Nombre
      const profileRaw = await AsyncStorage.getItem('userProfile');
      let userName = '';
      if (profileRaw) {
        const profile = JSON.parse(profileRaw);
        userName = profile.name || '';
        setName(userName);
      }
      // TDEE
      const historyRaw = await AsyncStorage.getItem('userProfileHistory');
      let tdeeValue = null;
      if (historyRaw) {
        const history = JSON.parse(historyRaw);
        if (history.length > 0) {
          tdeeValue = history[history.length - 1].tdee_base;
          setTdee(tdeeValue);
        }
      }
      // Calorías consumidas hoy
      const mealsRaw = await AsyncStorage.getItem(STORAGE_KEY);
      let kcal = 0;
      if (mealsRaw) {
        const meals = JSON.parse(mealsRaw);
        const today = getTodayISO();
        meals.forEach(meal => {
          if (meal.date && meal.aiOutput && meal.date.startsWith(today)) {
            const match = meal.aiOutput.match(/calor[ií]as totales:\s*~?(\d+)/i);
            if (match) kcal += parseInt(match[1]);
          }
        });
      }
      setKcalHoy(kcal);
      // Déficit
      if (tdeeValue !== null) {
        setDeficit(tdeeValue - kcal);
      }
    };
    fetchData();
    // Escuchar cambios en AsyncStorage (simple polling cada 2s)
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!name || tdee === null || deficit === null) return null;

  // Cálculo del porcentaje y color de la barra
  const pct = Math.min(kcalHoy / tdee, 1);
  let barColor = '#4CAF50';
  if (pct >= 1) barColor = '#e74c3c';
  else if (pct >= 0.8) barColor = '#f39c12';

  return (
    <View style={styles.headerBox}>
      <View style={styles.row}>
        <Text style={styles.name}>{name}</Text>
      </View>
      <View style={styles.barBg}>
        <View style={[styles.barFill, { width: `${pct * 100}%`, backgroundColor: barColor }]} />
      </View>
      <View style={styles.infoRow}>
        <Text style={styles.kcalText}>{kcalHoy} kcal</Text>
        <Text style={styles.deficitText}>Déficit: {deficit} kcal</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerBox: {
    width: '100%',
    backgroundColor: '#fff',
    paddingTop: Platform.OS === 'ios' ? 16 : 8, // reducido para acercar a la cabecera
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    zIndex: 100,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontWeight: 'bold',
    fontSize: 24,
    color: '#4CAF50',
    textAlign: 'left',
  },
  barBg: {
    width: '100%',
    height: 28,
    backgroundColor: '#e0e0e0',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 6,
  },
  barFill: {
    height: '100%',
    borderRadius: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  kcalText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#e67e22',
  },
  deficitText: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#2e7d32',
  },
});

export default DeficitHeader; 