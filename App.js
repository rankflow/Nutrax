import React, { useState, useEffect, useMemo, createContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar, View, ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MealLogger from './components/MealLogger';
import MealHistoryScreen from './screens/MealHistoryScreen';
import UserProfile from './components/UserProfile';
import UserProfileHistory from './components/UserProfileHistory';
import CalendarScreen from './screens/CalendarScreen';
import WelcomeScreen from './screens/onboarding/WelcomeScreen';
import NameScreen from './screens/onboarding/NameScreen';
import GenderScreen from './screens/onboarding/GenderScreen';
import DobScreen from './screens/onboarding/DobScreen';
import HeightScreen from './screens/onboarding/HeightScreen';
import WeightScreen from './screens/onboarding/WeightScreen';
import { AuthContext } from './context/AuthContext';

const OnboardingStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

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

const OnboardingFlow = () => (
  <OnboardingStack.Navigator>
    <OnboardingStack.Screen name="Welcome" component={WelcomeScreen} options={{ headerShown: false }} />
    <OnboardingStack.Screen name="Name" component={NameScreen} options={{ title: 'Nombre', headerBackTitle: 'Atrás', headerBackVisible: false }} />
    <OnboardingStack.Screen name="Gender" component={GenderScreen} options={{ title: 'Género', headerBackTitle: 'Atrás', headerBackVisible: false }} />
    <OnboardingStack.Screen name="Dob" component={DobScreen} options={{ title: 'Fecha de Nacimiento', headerBackTitle: 'Atrás', headerBackVisible: false }} />
    <OnboardingStack.Screen name="Height" component={HeightScreen} options={{ title: 'Altura', headerBackTitle: 'Atrás', headerBackVisible: false }} />
    <OnboardingStack.Screen name="Weight" component={WeightScreen} options={{ title: 'Peso', headerBackTitle: 'Atrás', headerBackVisible: false }} />
  </OnboardingStack.Navigator>
);

const MainAppFlow = () => (
  <MainStack.Navigator 
    initialRouteName="Home"
    screenOptions={{
      headerStyle: { backgroundColor: '#4CAF50' },
      headerTintColor: '#fff',
      headerTitleStyle: { fontWeight: 'bold' },
    }}
  >
    <MainStack.Screen name="Home" component={HomeScreen} options={{ title: 'Nutrax' }}/>
    <MainStack.Screen name="MealLogger" component={MealLogger} options={{ title: 'Registrar Comida' }} />
    <MainStack.Screen name="MealHistory" component={MealHistoryScreen} options={{ title: 'Historial Semanal' }} />
    <MainStack.Screen name="Calendar" component={CalendarScreen} options={{ title: 'Seleccionar Fecha' }} />
    <MainStack.Screen name="UserProfile" component={UserProfile} options={{ title: 'Perfil de Usuario' }} />
    <MainStack.Screen name="UserProfileHistory" component={UserProfileHistory} options={{ title: 'Histórico de Perfil' }} />
  </MainStack.Navigator>
);

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userProfile = await AsyncStorage.getItem('userProfile');
        setIsNewUser(userProfile === null);
      } catch (e) {
        // En caso de error, asumimos que es un nuevo usuario para evitar bloqueos
        setIsNewUser(true);
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, []);

  const authContext = useMemo(() => ({
    completeOnboarding: () => {
      setIsNewUser(false);
    },
  }), []);

  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {isNewUser ? (
            <RootStack.Screen name="Onboarding" component={OnboardingFlow} />
          ) : (
            <RootStack.Screen name="MainApp" component={MainAppFlow} />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
