# Telepatía AI Frontend

Una aplicación web moderna construida con Next.js que proporciona una interfaz de chat inteligente con capacidades de procesamiento de texto y audio usando inteligencia artificial.

## 🚀 Características

- **Chat Interactivo**: Interfaz de chat moderna y responsiva
- **Procesamiento de Texto**: Envío y procesamiento de mensajes de texto
- **Grabación de Audio**: Capacidad de grabar y enviar mensajes de voz
- **Transcripción Automática**: Los mensajes de voz se transcriben automáticamente
- **Respuestas IA**: Generación de respuestas inteligentes usando IA
- **Interfaz Moderna**: Diseño limpio y profesional con CSS Modules
- **Tiempo Real**: Indicadores de carga y estados en tiempo real

## 🛠️ Tecnologías Utilizadas

- **Next.js 14.2.33** - Framework de React para aplicaciones web
- **React 18.3.1** - Biblioteca de interfaz de usuario
- **CSS Modules** - Estilos modulares y encapsulados
- **MediaRecorder API** - Grabación de audio en el navegador
- **Fetch API** - Comunicación con el backend

## 📋 Requisitos Previos

Antes de instalar el proyecto, asegúrate de tener instalado:

- **Node.js** (versión 18 o superior)
- **npm** o **yarn**
- **Backend de Telepatía AI** ejecutándose en `http://0.0.0.0:8000`

## 🔧 Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd telepatia_ai_frontend_api
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar el entorno

El proyecto está configurado para conectarse con el backend en `http://0.0.0.0:8000`. Si tu backend está ejecutándose en una URL diferente, modifica las URLs en el archivo `components/chat/Chat.js`:

```javascript
// Líneas 34, 45, 58 en Chat.js
const API_BASE_URL = 'http://tu-backend-url:puerto';
```

### 4. Ejecutar el proyecto

#### Modo de desarrollo
```bash
npm run dev
```

#### Modo de producción
```bash
npm run build
npm start
```

### 5. Acceder a la aplicación

Abre tu navegador y ve a [http://localhost:3000](http://localhost:3000)

## 📁 Estructura del Proyecto

```
telepatia_ai_frontend_api/
├── app/                    # Directorio principal de la aplicación
│   ├── globals.css         # Estilos globales
│   ├── layout.js          # Layout principal
│   ├── page.js            # Página de inicio
│   └── page.module.css    # Estilos de la página principal
├── components/            # Componentes reutilizables
│   └── chat/              # Componente de chat
│       ├── Chat.js        # Lógica del chat
│       └── Chat.module.css # Estilos del chat
├── public/               # Archivos estáticos
│   └── images/           # Imágenes del proyecto
├── package.json          # Configuración del proyecto y dependencias
├── next.config.js        # Configuración de Next.js
└── README.md            # Este archivo
```

## 🎯 Funcionalidades Principales

### Chat de Texto
- Envío de mensajes de texto
- Procesamiento y validación de texto
- Generación de respuestas usando IA
- Interfaz de chat en tiempo real

### Chat de Voz
- Grabación de mensajes de voz
- Transcripción automática de audio
- Reproducción de mensajes grabados
- Indicadores visuales de grabación

### Interfaz de Usuario
- Diseño responsivo y moderno
- Indicadores de carga
- Timestamps en mensajes
- Estados de grabación en tiempo real

## 🔌 API Endpoints

El frontend se conecta con los siguientes endpoints del backend:

- `POST /message/validate-process-text` - Validación de texto
- `POST /message/generate-text` - Generación de respuestas de texto
- `POST /message/validate-process-audio` - Validación y transcripción de audio

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Producción
npm run build        # Construye la aplicación para producción
npm start           # Inicia el servidor de producción

# Calidad de código
npm run lint        # Ejecuta ESLint
npm run format      # Formatea el código con Prettier
npm run format:check # Verifica el formato del código
```

## 🌐 Configuración del Backend

Asegúrate de que el backend de Telepatía AI esté ejecutándose y accesible en `http://0.0.0.0:8000`. El frontend realizará las siguientes llamadas:

1. **Validación de texto**: `POST /message/validate-process-text`
2. **Generación de texto**: `POST /message/generate-text`
3. **Validación de audio**: `POST /message/validate-process-audio`

## 🔧 Personalización

### Cambiar la URL del Backend

Para cambiar la URL del backend, modifica las siguientes líneas en `components/chat/Chat.js`:

```javascript
// Línea 34
const response = await fetch('http://tu-nueva-url:puerto/message/validate-process-text', {

// Línea 45
const response = await fetch('http://tu-nueva-url:puerto/message/generate-text', {

// Línea 58
const response = await fetch('http://tu-nueva-url:puerto/message/validate-process-audio', {
```

### Personalizar Estilos

Los estilos están organizados en CSS Modules:
- `app/globals.css` - Estilos globales
- `app/page.module.css` - Estilos de la página principal
- `components/chat/Chat.module.css` - Estilos del componente de chat

## 🐛 Solución de Problemas

### Error de Conexión con el Backend
- Verifica que el backend esté ejecutándose
- Confirma que la URL del backend sea correcta
- Revisa la consola del navegador para errores de CORS

### Problemas con la Grabación de Audio
- Asegúrate de que el navegador tenga permisos de micrófono
- Verifica que estés usando HTTPS en producción
- Algunos navegadores requieren interacción del usuario antes de permitir grabación

### Problemas de Build
- Ejecuta `npm run lint` para verificar errores de código
- Usa `npm run format` para corregir problemas de formato
- Verifica que todas las dependencias estén instaladas correctamente

## 📝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit tus cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado y está bajo la licencia de Telepatía AI.

## 📞 Soporte

Para soporte técnico o preguntas sobre el proyecto, contacta al equipo de desarrollo de Telepatía AI.

---

**Desarrollado con ❤️ por el equipo de Telepatía AI**
