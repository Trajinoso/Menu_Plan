# MenuMaster 🍳🥗

**MenuMaster** es una aplicación web moderna y completa para la planificación de menús nutricionales (semanal y mensual), gestión inteligente de recetarios y organización culinaria, potenciada con **Gemini AI** y sincronización descentralizada en repositorios **Git**.

---

## 📋 Tabla de Contenido

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación y Ejecución Local](#-instalación-y-ejecución-local)
- [Variables de Entorno](#-variables-de-entorno)
- [Endpoints de la API Backend](#-endpoints-de-la-api-backend)
- [Sincronización Git y Formato Markdown](#-sincronización-git-y-formato-markdown)
- [Scripts Disponibles](#-scripts-disponibles)
- [Licencia](#-licencia)

---

## 🌟 Descripción General

MenuMaster elimina la fricción de pensar qué cocinar cada día mediante una interfaz limpia y fluida, diseñada con altos estándares de accesibilidad y contraste:
- Organiza tus comidas diarias (**Desayuno, Almuerzo y Cena**) de manera semanal o en una vista panorámica mensual.
- Integra inteligencia artificial con **Gemini 3.7 Flash** para extraer ingredientes/pasos de recetas a partir de URLs o notas sueltas, generar menús completos ajustados a objetivos calóricos y autocompletar huecos vacíos en el calendario.
- Permite respaldar tu plan de comidas en un repositorio Git propio, serializando los datos en archivos **Markdown** legibles y estructurados.

---

## ✨ Características Principales

### 1. 📅 Planificador Semanal Interactivo
- Vista horizontal por días (Lunes a Domingo) con desglose de franjas horarias: **Desayuno**, **Almuerzo** y **Cena** (con soporte para platos principales y acompañamientos).
- Métricas nutricionales en tiempo real: tiempo de preparación, calorías estimadas e imágenes descriptivas.
- **Gestión y borrado accesible:** Botón directo de eliminación en cada plato con protección contra desbordamientos para títulos largos de recetas.
- **Añadido rápido con filtro por categoría:** Modal interactivo para seleccionar recetas del recetario con píldoras de filtrado por categoría (*Todas*, *Proteico*, *Vegetariano*, *Rápido*, etc.) y contador de platos disponibles.

### 2. 🗓️ Vista Mensual y Navegación Dinámica
- Matriz de calendario mensual con soporte para comidas principales (**Almuerzo** y **Cena**).
- **Navegación intermensual:** Controles intuitivos (`<`, `Hoy`, `>`) para desplazarse a cualquier mes y año en tiempo real.
- Marcadores de estado visuales en cada celda para verificar días planificados o pendientes.
- Modal detallado por día para añadir, previsualizar o remover recetas con **filtro instantáneo por categorías**.
- Botón de **Autocompletar Vacíos con IA** para rellenar automáticamente los días sin planificar del mes en curso.

### 3. 📖 Recetario Inteligente y Gestión de Categorías
- Catálogo interactivo con buscador instantáneo por nombre o ingrediente.
- **Gestión dinámica de categorías:** Añade nuevas categorías personalizadas o elimina categorías existentes en 1 clic directamente desde el formulario de recetas, con persistencia automática en `localStorage`.
- Modal **"Añadir al Plan"**: programa una receta seleccionando uno o múltiples días del calendario en un solo paso.
- **Formulario de receta limpio por defecto:** Registro desde cero sin datos de ejemplo precargados, con previsualización reactiva de imagen y selector de presets.

### 4. 🪄 Integración con Gemini AI (`@google/genai`)
- **Extractor de Recetas:** Analiza enlaces web o texto libre y extrae automáticamente título, tiempo, porciones, calorías, categoría, lista de ingredientes cuantificados e instrucciones paso a paso.
- **Generador de Planes Semanales:** Crea propuestas de menús personalizadas según el tipo de dieta (Equilibrada, Alta en Proteína, Vegetariana, Keto, Sabores de Temporada) y el rango calórico objetivo diario.
- **Relleno Automático Inteligente:** Identifica huecos en el calendario y sugiere platos saludables que evitan la monotonía culinaria.

### 5. 🗃️ Historial y Archivado de Menús
- Guarda instantáneas de planes semanales exitosos.
- Búsqueda en el historial por etiquetas y fechas.
- **Carga en 1 clic:** Restaura cualquier plan anterior directamente en el planificador activo.
- Exportación de menús históricos en formato JSON.

### 6. 🔄 Sincronización y Respaldo en Git
- Configuración para conectar repositorios Git remotos mediante Personal Access Token (PAT).
- Exportación y serialización de los planes activos en archivos `menu_plan.md` listos para versionado de código.
- Visor integrado de Markdown con sintaxis limpia.

---

## 🛠️ Stack Tecnológico

### Frontend
- **React 19** con TypeScript
- **Vite 6** (Empaquetador ultrarrápido)
- **Tailwind CSS v4** (Diseño y utilidades CSS modernas)
- **Lucide React** (Iconografía limpia y consistente)
- **Motion** (Transiciones e interacciones fluidas)

### Backend
- **Node.js** con **Express 4**
- **TypeScript** ejecutado en desarrollo con **tsx**
- **esbuild** (Compilación y bundling para producción)
- **Google Gen AI SDK (`@google/genai`)** (Gemini 3.7 Flash)
- **dotenv** (Gestión de variables de entorno)

---

## 📂 Estructura del Proyecto

```text
.
├── .env.example              # Plantilla de variables de entorno requeridas
├── metadata.json             # Metadatos, permisos y capacidades de la app
├── package.json              # Dependencias y scripts de construcción
├── server.ts                 # Servidor Express, API REST e integración con Gemini AI
├── tsconfig.json             # Configuración de TypeScript
├── vite.config.ts            # Configuración del plugin de Vite y Tailwind
├── public/                   # Archivos públicos y estáticos
└── src/
    ├── main.tsx              # Punto de entrada de React
    ├── App.tsx               # Componente raíz, orquestación de estado y navegación
    ├── index.css             # Configuración global de Tailwind CSS
    ├── types.ts              # Definición de interfaces TypeScript
    ├── data/
    │   └── initialData.ts    # Datos semilla para recetas, planes y configuración
    └── components/
        ├── AddRecipeView.tsx      # Formulario y extractor con IA de nuevas recetas
        ├── GeneratePlanModal.tsx  # Modal para generación de planes con Gemini
        ├── Header.tsx             # Barra superior con accesos rápidos y sincronización
        ├── HistoryView.tsx        # Historial de planes archivados y restauración
        ├── MonthlyView.tsx        # Calendario mensual (Almuerzo y Cena) con selector de meses
        ├── RecipesView.tsx        # Catálogo de recetas y asignador multi-día
        ├── SettingsView.tsx       # Configuración de Git, tokens y preferencias de IA
        ├── Sidebar.tsx            # Menú de navegación lateral
        └── WeeklyPlannerView.tsx  # Vista de planificación semanal por turnos
```

---

## ⚙️ Requisitos Previos

- **Node.js**: Versión 18.0.0 o superior (recomendado Node 20 LTS o 22 LTS).
- **npm** o gestor de paquetes compatible.
- **Clave de API de Google Gemini**: Necesaria para las funciones de extracción y generación inteligente. Puedes obtenerla de manera gratuita en [Google AI Studio](https://aistudio.google.com/).

---

## 🚀 Instalación y Ejecución Local

1. **Clonar el repositorio:**
   ```bash
   git clone <URL_DEL_REPOSITORIO>
   cd menumaster
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Configurar las variables de entorno:**
   Copia la plantilla `.env.example` a un archivo `.env`:
   ```bash
   cp .env.example .env
   ```
   Abre el archivo `.env` y define tu clave de Gemini:
   ```env
   GEMINI_API_KEY="tu_clave_de_gemini_aqui"
   ```

4. **Iniciar el entorno de desarrollo:**
   ```bash
   npm run dev
   ```
   El servidor arrancará en `http://localhost:3000` sirviendo tanto la API en `/api/*` como el cliente React mediante Vite.

5. **Compilar para producción:**
   ```bash
   npm run build
   ```
   Inicia la versión compilada:
   ```bash
   npm start
   ```

---

## 🔐 Variables de Entorno

| Variable | Requerida | Descripción |
| :--- | :---: | :--- |
| `GEMINI_API_KEY` | **Sí** (para IA) | Clave API de Google AI Studio para llamadas al modelo Gemini 3.7 Flash. |
| `APP_URL` | Opcional | URL base de despliegue de la aplicación (inyectada automáticamente en Cloud Run). |
| `PORT` | Opcional | Puerto donde corre el servidor Express (por defecto `3000`). |

---

## 📡 Endpoints de la API Backend

El servidor Express expone los siguientes endpoints REST:

### Datos y Recetas
- `GET /api/data`: Obtiene todo el estado consolidado de la aplicación (recetas, planes activos, historial y configuración).
- `GET /api/recipes`: Lista todas las recetas almacenadas.
- `POST /api/recipes`: Crea y persiste una nueva receta en el catálogo.

### Planes y Asignaciones
- `POST /api/plans/weekly`: Actualiza la estructura del menú semanal.
- `POST /api/plans/monthly`: Actualiza la cuadrícula de comidas del mes.
- `POST /api/plans/assign`: Asigna una receta a uno o varios días específicos dentro del turno de almuerzo o cena.

### Historial
- `POST /api/history`: Archiva el menú semanal activo en el historial.
- `POST /api/history/:id/load`: Restaura una versión archivada como el plan semanal actual.

### Git y Respaldo
- `POST /api/settings/git`: Guarda los parámetros del repositorio Git (URL, rama, token PAT).
- `POST /api/git/sync`: Serializa los planes en archivos Markdown y JSON simulando la sincronización Git.

### Servicios con Gemini AI
- `POST /api/ai/extract-recipe`: Procesa URLs o descripciones de texto plano y devuelve una receta estructurada en JSON.
- `POST /api/ai/generate-plan`: Diseña un menú semanal completo considerando preferencias y calorías objetivo.
- `POST /api/ai/autofill-empty`: Rellena de forma inteligente los días sin comidas programadas del mes seleccionado.

---

## 📄 Sincronización Git y Formato Markdown

Al ejecutar la sincronización o exportación, MenuMaster genera una representación en Markdown limpia y legible de tu plan de comidas:

```markdown
# Menú Semanal - Octubre 2023

## Lunes (2023-10-12)
- **Almuerzo**: Salmón a la Plancha con Espárragos (520 kcal, 25 min)
- **Cena**: Crema de Calabaza Asada y Semillas (320 kcal, 30 min)

## Martes (2023-10-13)
- **Almuerzo**: Bowl de Quinoa, Aguacate y Garbanzos (480 kcal, 20 min)
- **Cena**: Pechuga de Pollo al Limón con Brócoli (450 kcal, 25 min)
...
```

Este formato permite versionar menús en Git, compartirlos en repositorios personales o integrarlos en aplicaciones de notas como Obsidian o Notion.

---

## 🚀 Despliegue en GitHub Pages

MenuMaster está completamente optimizado para desplegarse como aplicación web estática en **GitHub Pages** (con soporte de persistencia local offline vía `localStorage`):

### Opción 1: Despliegue Automático con GitHub Actions (Recomendado)
El proyecto incluye el flujo de trabajo preconfigurado en `.github/workflows/deploy.yml`:
1. Sube tu repositorio a GitHub (`git push origin main`).
2. En GitHub, dirígete a **Settings** > **Pages**.
3. En **Build and deployment** > **Source**, selecciona **GitHub Actions**.
4. ¡Listo! Cada vez que hagas `push` a la rama `main` o `master`, GitHub compilará la app y la publicará automáticamente en tu URL de Pages sin configuraciones adicionales.

### Opción 2: Despliegue Manual
1. Genera los archivos estáticos de producción:
   ```bash
   npm run build
   ```
2. El directorio `dist/` contendrá todo el sitio listo para producción con rutas relativas (`./assets/...`), asegurando que no haya errores 404 de recursos independientemente del subdirectorio del repositorio en GitHub Pages.

---

## 💻 Scripts Disponibles

- `npm run dev`: Inicia el servidor de desarrollo combinado (Express + Vite) con TypeScript.
- `npm run build`: Compila los componentes estáticos con Vite y empaqueta el servidor con esbuild hacia `dist/`.
- `npm run start`: Ejecuta la versión empaquetada de producción (`dist/server.cjs`).
- `npm run lint`: Realiza el chequeo de tipos TypeScript (`tsc --noEmit`).

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Consulta el archivo de licencia para más detalles.
