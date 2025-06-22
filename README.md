# Nutrax v2 - Asistente Nutricional con IA

Una aplicación móvil desarrollada con React Native y Expo que utiliza inteligencia artificial para analizar comidas y proporcionar información nutricional detallada.

## 🚀 Características

- **📝 Registro de comidas por texto**: Describe tu comida y obtén análisis nutricional instantáneo
- **📷 Análisis de imágenes**: Toma una foto de tu comida para análisis automático
- **🤖 IA Nutricional**: Integración con OpenAI GPT-4o para análisis preciso
- **📊 Historial completo**: Visualiza y gestiona todo tu historial de comidas
- **💾 Almacenamiento local**: Datos persistentes en tu dispositivo
- **🎨 Interfaz moderna**: Diseño intuitivo y responsive

## 🛠️ Tecnologías

- **React Native** - Framework de desarrollo móvil
- **Expo** - Plataforma de desarrollo y herramientas
- **React Navigation** - Navegación entre pantallas
- **AsyncStorage** - Almacenamiento local de datos
- **OpenAI API** - Análisis nutricional con IA
- **Axios** - Cliente HTTP para APIs

## 📱 Pantallas

### 🏠 Pantalla de Inicio
- Navegación principal a todas las funcionalidades
- Diseño limpio y moderno

### 📝 Registrar Comida
- Entrada de texto para descripción de comidas
- Selección de imágenes desde la galería
- Análisis nutricional en tiempo real
- Logs detallados del proceso

### 📊 Historial de Comidas
- Lista completa de comidas registradas
- Información detallada de cada entrada
- Funciones de eliminación individual y masiva
- Pull-to-refresh para actualizar datos

## 🚀 Instalación

1. **Clona el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd nutrax-v2
   ```

2. **Instala las dependencias**
   ```bash
   npm install
   ```

3. **Configura las variables de entorno**
   ```bash
   cp .env.example .env
   ```
   
   Edita el archivo `.env` y agrega tu API key de OpenAI:
   ```
   NUTRAX_API_KEY=tu_api_key_aqui
   ```

4. **Inicia la aplicación**
   ```bash
   npm start
   ```

5. **Escanea el código QR** con Expo Go en tu dispositivo móvil

## 🔑 Configuración de API Key

1. Ve a [OpenAI Platform](https://platform.openai.com/api-keys)
2. Crea una nueva API key
3. Copia la clave en el archivo `.env`

## 📁 Estructura del Proyecto

```
nutrax-v2/
├── components/
│   └── MealLogger.js          # Componente principal de registro
├── screens/
│   ├── HomeScreen.js          # Pantalla de inicio
│   ├── MealHistoryScreen.js   # Historial de comidas
│   └── UserProfileScreen.js   # Perfil de usuario (placeholder)
├── App.js                     # Componente principal
├── babel.config.js           # Configuración de Babel
├── .env.example              # Variables de entorno de ejemplo
└── README.md                 # Documentación
```

## 🎯 Funcionalidades Principales

### Registro de Comidas
- **Texto**: Describe tu comida y obtén análisis nutricional
- **Imagen**: Toma una foto para análisis automático
- **IA**: Respuestas detalladas con calorías, macronutrientes y recomendaciones

### Gestión de Datos
- **Almacenamiento local**: Datos persistentes en el dispositivo
- **Historial completo**: Visualización de todas las comidas registradas
- **Eliminación**: Gestión individual y masiva de registros

## 🔧 Scripts Disponibles

- `npm start` - Inicia el servidor de desarrollo
- `npm run android` - Abre en emulador Android
- `npm run ios` - Abre en simulador iOS
- `npm run web` - Abre en navegador web

## 📋 Requisitos

- Node.js 16+
- npm o yarn
- Expo CLI
- Dispositivo móvil con Expo Go o emulador

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🆘 Soporte

Si tienes problemas o preguntas:

1. Revisa la documentación
2. Verifica que tu API key esté configurada correctamente
3. Asegúrate de tener todas las dependencias instaladas
4. Abre un issue en el repositorio

## 🎉 Estado del Proyecto

- ✅ **Completado**: Registro de comidas con IA
- ✅ **Completado**: Historial de comidas
- ✅ **Completado**: Navegación entre pantallas
- 🔄 **En desarrollo**: Perfil de usuario
- 🔄 **En desarrollo**: Estadísticas nutricionales
- 🔄 **En desarrollo**: Exportación de datos

---

**Desarrollado con ❤️ para mejorar la nutrición personal** 