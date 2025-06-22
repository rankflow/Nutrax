import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import MealLogger from './components/MealLogger';
import MealHistoryScreen from './screens/MealHistoryScreen';

const Stack = createNativeStackNavigator();

// Pantalla de inicio
function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nutrax</Text>
      <Text style={styles.subtitle}>Tu asistente nutricional</Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('MealLogger')}
      >
        <Text style={styles.buttonText}>Registrar Comida</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('MealHistory')}
      >
        <Text style={styles.buttonText}>Historial de Comidas</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('UserProfile')}
      >
        <Text style={styles.buttonText}>Perfil de Usuario</Text>
      </TouchableOpacity>
      
      <StatusBar style="auto" />
    </View>
  );
}

// Pantalla de perfil (placeholder)
function UserProfileScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil de Usuario</Text>
      <Text style={styles.subtitle}>Próximamente...</Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4CAF50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Nutrax' }}
        />
        <Stack.Screen 
          name="MealLogger" 
          component={MealLogger} 
          options={{ title: 'Registrar Comida' }}
        />
        <Stack.Screen 
          name="MealHistory" 
          component={MealHistoryScreen} 
          options={{ title: 'Historial' }}
        />
        <Stack.Screen 
          name="UserProfile" 
          component={UserProfileScreen} 
          options={{ title: 'Perfil' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    width: '80%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
