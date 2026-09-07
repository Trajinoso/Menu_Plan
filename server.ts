import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import {
  INITIAL_RECIPES,
  INITIAL_WEEKLY_PLAN,
  INITIAL_MONTH_PLAN,
  INITIAL_HISTORY,
  INITIAL_GIT_CONFIG,
  INITIAL_AI_SETTINGS
} from "./src/data/initialData.ts";
import { Recipe, WeeklyPlan, MonthPlan, HistoryArchiveItem, GitSyncConfig, AISettingsConfig } from "./src/types.ts";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Server database path
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "db.json");
const EXPORT_DIR = path.join(DATA_DIR, "git-export");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(EXPORT_DIR)) {
  fs.mkdirSync(EXPORT_DIR, { recursive: true });
}

interface AppDatabase {
  recipes: Recipe[];
  weeklyPlan: WeeklyPlan;
  monthPlan: MonthPlan;
  history: HistoryArchiveItem[];
  gitConfig: GitSyncConfig;
  aiSettings: AISettingsConfig;
}

function loadDatabase(): AppDatabase {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("Error reading database file, using defaults:", err);
  }
  const defaultDb: AppDatabase = {
    recipes: INITIAL_RECIPES,
    weeklyPlan: INITIAL_WEEKLY_PLAN,
    monthPlan: INITIAL_MONTH_PLAN,
    history: INITIAL_HISTORY,
    gitConfig: INITIAL_GIT_CONFIG,
    aiSettings: INITIAL_AI_SETTINGS
  };
  saveDatabase(defaultDb);
  return defaultDb;
}

function saveDatabase(db: AppDatabase) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving database file:", err);
  }
}

let db = loadDatabase();

// Lazy Gemini client helper
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured in the environment.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// ---------------- API ROUTES ----------------

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Full state bootstrap
app.get("/api/data", (_req, res) => {
  res.json({
    ...db,
    aiSettings: {
      ...db.aiSettings,
      hasApiKey: Boolean(process.env.GEMINI_API_KEY)
    }
  });
});

// Recipes CRUD
app.get("/api/recipes", (_req, res) => {
  res.json(db.recipes);
});

app.post("/api/recipes", (req, res) => {
  const recipe: Recipe = {
    ...req.body,
    id: req.body.id || `rec-${Date.now()}`,
    createdAt: req.body.createdAt || new Date().toISOString().split("T")[0],
    tags: req.body.tags || (req.body.category ? [req.body.category] : ["Casero"]),
    ingredients: Array.isArray(req.body.ingredients) ? req.body.ingredients : [],
    instructions: Array.isArray(req.body.instructions) ? req.body.instructions : []
  };
  db.recipes.unshift(recipe);
  saveDatabase(db);
  res.status(201).json(recipe);
});

app.delete("/api/recipes/:id", (req, res) => {
  const { id } = req.params;
  db.recipes = db.recipes.filter(r => r.id !== id);
  saveDatabase(db);
  res.json({ success: true, id });
});

// Weekly Plan
app.get("/api/plans/weekly", (_req, res) => {
  res.json(db.weeklyPlan);
});

app.post("/api/plans/weekly", (req, res) => {
  db.weeklyPlan = req.body;
  saveDatabase(db);
  res.json(db.weeklyPlan);
});

// Monthly Plan
app.get("/api/plans/monthly", (_req, res) => {
  res.json(db.monthPlan);
});

app.post("/api/plans/monthly", (req, res) => {
  db.monthPlan = req.body;
  saveDatabase(db);
  res.json(db.monthPlan);
});

// Assign recipe to date(s) / meal type
app.post("/api/plans/assign", (req, res) => {
  const { recipeId, recipeName, imageUrl, timeMinutes, calories, dates, mealType } = req.body;
  if (!dates || !Array.isArray(dates) || dates.length === 0 || !mealType) {
    res.status(400).json({ error: "Missing required fields (dates, mealType)" });
    return;
  }

  const slotKey = mealType.toLowerCase() === "almuerzo" ? "lunch" : mealType.toLowerCase() === "cena" ? "dinner" : "breakfast";

  dates.forEach((dateStr: string) => {
    // Update weekly plan if date falls within or exists
    if (db.weeklyPlan.days && db.weeklyPlan.days[dateStr]) {
      const targetDay = db.weeklyPlan.days[dateStr];
      const newMeal = {
        id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipeId,
        name: recipeName || "Comida",
        timeMinutes: Number(timeMinutes) || 20,
        calories: Number(calories) || 400,
        imageUrl
      };
      targetDay[slotKey] = [...(targetDay[slotKey] || []), newMeal];
    }

    // Update monthly plan
    if (!db.monthPlan.days) db.monthPlan.days = {};
    if (!db.monthPlan.days[dateStr]) {
      const dateObj = new Date(dateStr);
      db.monthPlan.days[dateStr] = {
        date: dateStr,
        dayName: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][dateObj.getDay()] || "Día",
        dayNumber: dateObj.getDate(),
        breakfast: [],
        lunch: [],
        dinner: []
      };
    }
    const monthDay = db.monthPlan.days[dateStr];
    monthDay[slotKey] = [
      ...(monthDay[slotKey] || []),
      {
        id: `m-item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        recipeId,
        name: recipeName || "Comida",
        timeMinutes: Number(timeMinutes) || 20,
        calories: Number(calories) || 400,
        imageUrl
      }
    ];
  });

  saveDatabase(db);
  res.json({ success: true, weeklyPlan: db.weeklyPlan, monthPlan: db.monthPlan });
});

// History & Archives
app.get("/api/history", (_req, res) => {
  res.json(db.history);
});

app.post("/api/history", (req, res) => {
  const newArchive: HistoryArchiveItem = {
    id: `hist-${Date.now()}`,
    title: req.body.title || `Plan de ${new Date().toLocaleDateString("es-ES")}`,
    startDate: req.body.startDate || "2023-10-12",
    endDate: req.body.endDate || "2023-10-18",
    tags: req.body.tags || ["Menú Semanal"],
    recipeCount: req.body.recipeCount || 10,
    totalDays: req.body.totalDays || 7,
    previewRecipes: req.body.previewRecipes || [],
    createdAt: new Date().toISOString().split("T")[0],
    planData: req.body.planData || db.weeklyPlan
  };
  db.history.unshift(newArchive);
  saveDatabase(db);
  res.status(201).json(newArchive);
});

app.post("/api/history/:id/load", (req, res) => {
  const { id } = req.params;
  const item = db.history.find(h => h.id === id);
  if (!item) {
    res.status(404).json({ error: "Archive item not found" });
    return;
  }
  db.weeklyPlan = JSON.parse(JSON.stringify(item.planData));
  saveDatabase(db);
  res.json({ success: true, weeklyPlan: db.weeklyPlan });
});

// Settings CRUD
app.get("/api/settings/ai", (_req, res) => {
  res.json({
    ...db.aiSettings,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY)
  });
});

app.post("/api/settings/git", (req, res) => {
  db.gitConfig = {
    ...db.gitConfig,
    ...req.body,
    isConnected: Boolean(req.body.repoUrl),
    statusText: req.body.repoUrl ? "Repositorio configurado" : "No configurado"
  };
  saveDatabase(db);
  res.json(db.gitConfig);
});

app.post("/api/settings/ai", (req, res) => {
  db.aiSettings = {
    ...db.aiSettings,
    ...req.body,
    hasApiKey: Boolean(process.env.GEMINI_API_KEY)
  };
  saveDatabase(db);
  res.json(db.aiSettings);
});

// Git Export & Local Serialization (exports local markdown/json)
app.post("/api/git/sync", (_req, res) => {
  const now = new Date();
  const timestampStr = now.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Generate serialized Markdown representation
  let markdown = `# MenuMaster - Sincronización de Plan de Comidas\n\n`;
  markdown += `*Última exportación:* ${timestampStr}\n`;
  if (db.gitConfig.repoUrl) {
    markdown += `*Repositorio de referencia:* \`${db.gitConfig.repoUrl}\` | *Rama:* \`${db.gitConfig.branch || "main"}\`\n\n`;
  }
  markdown += `## 📅 Plan Semanal Actual: ${db.weeklyPlan.title}\n`;
  markdown += `**Etiquetas:** ${db.weeklyPlan.tags.join(", ")}\n\n`;

  Object.values(db.weeklyPlan.days || {}).forEach(day => {
    markdown += `### ${day.dayName} (${day.date})\n`;
    if (day.breakfast.length > 0) {
      markdown += `- **Desayuno:** ` + day.breakfast.map(m => `${m.name} (${m.calories} kcal, ${m.timeMinutes} min)`).join(" + ") + `\n`;
    }
    if (day.lunch.length > 0) {
      markdown += `- **Almuerzo:** ` + day.lunch.map(m => `${m.name} (${m.calories} kcal, ${m.timeMinutes} min)`).join(" + ") + `\n`;
    } else {
      markdown += `- **Almuerzo:** *(Sin planificar)*\n`;
    }
    if (day.dinner.length > 0) {
      markdown += `- **Cena:** ` + day.dinner.map(m => `${m.name} (${m.calories} kcal, ${m.timeMinutes} min)`).join(" + ") + `\n`;
    } else {
      markdown += `- **Cena:** *(Sin planificar)*\n`;
    }
    markdown += `\n`;
  });

  markdown += `## 🍲 Recetario Guardado (${db.recipes.length} recetas)\n\n`;
  db.recipes.forEach(r => {
    markdown += `### ${r.name} [${r.category} | ${r.difficulty}]\n`;
    markdown += `- **Tiempo:** ${r.timeMinutes} min | **Calorías:** ${r.calories} kcal | **Porciones:** ${r.servings}\n`;
    markdown += `- **Ingredientes:**\n`;
    r.ingredients.forEach(ing => {
      markdown += `  - ${ing}\n`;
    });
    markdown += `- **Instrucciones:**\n`;
    r.instructions.forEach((inst, idx) => {
      markdown += `  ${idx + 1}. ${inst}\n`;
    });
    markdown += `\n`;
  });

  // Write files to export dir
  const mdFile = path.join(EXPORT_DIR, "menu_plan.md");
  const jsonFile = path.join(EXPORT_DIR, "menu_plan.json");
  fs.writeFileSync(mdFile, markdown, "utf-8");
  fs.writeFileSync(jsonFile, JSON.stringify(db, null, 2), "utf-8");

  db.gitConfig.lastSyncedAt = `Hoy, ${now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
  db.gitConfig.statusText = "Archivos locales exportados";
  saveDatabase(db);

  res.json({
    success: true,
    lastSyncedAt: db.gitConfig.lastSyncedAt,
    commitHash: Math.random().toString(36).substring(2, 9),
    filesExported: ["menu_plan.md", "menu_plan.json"],
    markdownPreview: markdown
  });
});

// ---------------- GEMINI AI ENDPOINTS ----------------

// AI Recipe Extractor from URL or Prompt
app.post("/api/ai/extract-recipe", async (req, res) => {
  try {
    const { url, rawText, recipeName } = req.body;
    const ai = getGeminiClient();

    const systemPrompt = `Eres el asistente culinario experto de MenuMaster.
Tu tarea es analizar URLs, textos de recetas, o nombres de platos e inferir o extraer una receta completa y balanceada en español.
${db.aiSettings.systemInstruction ? `Instrucciones del usuario: ${db.aiSettings.systemInstruction}` : ''}
Debes responder con un objeto JSON estricto que contenga:
- name: string (nombre claro y apetitoso del plato)
- description: string (resumen tentador de 1-2 frases)
- timeMinutes: number (tiempo total estimado en minutos)
- calories: number (calorías estimadas por porción)
- servings: number (número de porciones, ej: 2 o 4)
- category: string ("Proteico" | "Vegetariano" | "Rápido" | "Desayuno" | "Almuerzo" | "Cena" | "Gourmet")
- difficulty: string ("Fácil" | "Medio" | "Difícil")
- tags: array of strings (ej: ["Alto en Proteína", "Rápido", "Sin Gluten"])
- ingredients: array of strings (con cantidades exactas en gramos o medidas, ej: "200g Pechuga de pollo")
- instructions: array of strings (pasos numerados claros y concisos)`;

    const userPrompt = url
      ? `Por favor extrae y estructura la receta del siguiente enlace o plato: ${url}`
      : rawText
      ? `Por favor estructura la siguiente receta o idea en un formato profesional: ${rawText}`
      : `Genera una receta deliciosa y balanceada para: ${recipeName || "Plato saludable"}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            timeMinutes: { type: Type.NUMBER },
            calories: { type: Type.NUMBER },
            servings: { type: Type.NUMBER },
            category: { type: Type.STRING },
            difficulty: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "timeMinutes", "calories", "servings", "category", "difficulty", "ingredients", "instructions"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    // Assign a fallback appetizing image matching category if none provided
    const sampleImages = [
      "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80"
    ];
    parsed.imageUrl = parsed.imageUrl || sampleImages[Math.floor(Math.random() * sampleImages.length)];
    parsed.isAiGenerated = true;

    res.json(parsed);
  } catch (err: any) {
    console.error("AI recipe extraction error:", err);
    res.status(500).json({ error: err.message || "Error al procesar la receta con IA" });
  }
});

// AI Meal Plan Generator
app.post("/api/ai/generate-plan", async (req, res) => {
  try {
    const { duration = "week", dietType = "Equilibrada", targetCalories = 2000, specificPreferences = "" } = req.body;
    const ai = getGeminiClient();

    const prompt = `Genera un plan de comidas completo para una ${duration === "week" ? "semana (7 días: Lunes a Domingo)" : "semana"} con enfoque "${dietType}", calorías objetivo de ~${targetCalories} kcal diarias.
Preferencias adicionales: ${specificPreferences || "Comidas variadas, ricas en nutrientes y fáciles de preparar"}.
Para cada día, proporciona Desayuno, Almuerzo y Cena, con recetas reales, tiempo de preparación y calorías.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: `Eres MenuMaster AI Planner. Diseña planes semanales deliciosos y realistas en español. Devuelve un JSON estructurado.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            planTitle: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayName: { type: Type.STRING },
                  breakfast: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      timeMinutes: { type: Type.NUMBER },
                      calories: { type: Type.NUMBER }
                    },
                    required: ["name", "timeMinutes", "calories"]
                  },
                  lunch: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      timeMinutes: { type: Type.NUMBER },
                      calories: { type: Type.NUMBER }
                    },
                    required: ["name", "timeMinutes", "calories"]
                  },
                  dinner: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      timeMinutes: { type: Type.NUMBER },
                      calories: { type: Type.NUMBER }
                    },
                    required: ["name", "timeMinutes", "calories"]
                  }
                },
                required: ["dayName", "breakfast", "lunch", "dinner"]
              }
            }
          },
          required: ["planTitle", "tags", "days"]
        }
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json(parsed);
  } catch (err: any) {
    console.error("AI generate plan error:", err);
    res.status(500).json({ error: err.message || "Error al generar el plan con IA" });
  }
});

// AI Auto-Fill Empty slots in monthly or weekly calendar
app.post("/api/ai/autofill-empty", async (req, res) => {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const { targetPlan = "monthly", year = currentYear, month = currentMonth } = req.body;
    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: "Proporciona 15 combinaciones variadas de almuerzos y cenas saludables para autocompletar días vacíos de un calendario mensual de comidas.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              lunchName: { type: Type.STRING },
              lunchCalories: { type: Type.NUMBER },
              lunchTime: { type: Type.NUMBER },
              dinnerName: { type: Type.STRING },
              dinnerCalories: { type: Type.NUMBER },
              dinnerTime: { type: Type.NUMBER }
            },
            required: ["lunchName", "lunchCalories", "lunchTime", "dinnerName", "dinnerCalories", "dinnerTime"]
          }
        }
      }
    });

    const suggestions = JSON.parse(response.text || "[]");

    if (targetPlan === "monthly") {
      let sugIdx = 0;
      const targetYear = Number(year) || currentYear;
      const targetMonth = Number(month) || currentMonth;
      const totalDays = new Date(targetYear, targetMonth, 0).getDate();

      for (let i = 1; i <= totalDays; i++) {
        const dateStr = `${targetYear}-${targetMonth.toString().padStart(2, "0")}-${i.toString().padStart(2, "0")}`;
        const day = db.monthPlan.days[dateStr];
        const item = suggestions[sugIdx % suggestions.length];
        sugIdx++;

        if (!day) {
          const dateObj = new Date(dateStr);
          db.monthPlan.days[dateStr] = {
            date: dateStr,
            dayName: ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"][dateObj.getDay()] || "Día",
            dayNumber: i,
            breakfast: [],
            lunch: [{ id: `l-${i}`, name: item.lunchName, timeMinutes: item.lunchTime, calories: item.lunchCalories }],
            dinner: [{ id: `d-${i}`, name: item.dinnerName, timeMinutes: item.dinnerTime, calories: item.dinnerCalories }]
          };
        } else {
          if (day.lunch.length === 0) {
            day.lunch.push({ id: `l-${i}-${Date.now()}`, name: item.lunchName, timeMinutes: item.lunchTime, calories: item.lunchCalories });
          }
          if (day.dinner.length === 0) {
            day.dinner.push({ id: `d-${i}-${Date.now()}`, name: item.dinnerName, timeMinutes: item.dinnerTime, calories: item.dinnerCalories });
          }
        }
      }
      db.monthPlan.plannedMealsCount = Object.values(db.monthPlan.days).reduce(
        (acc, d) => acc + (d.lunch?.length || 0) + (d.dinner?.length || 0),
        0
      );
      saveDatabase(db);
    } else {
      // Weekly fill
      let sugIdx = 0;
      Object.values(db.weeklyPlan.days).forEach(day => {
        const item = suggestions[sugIdx % suggestions.length];
        sugIdx++;
        if (day.lunch.length === 0) {
          day.lunch.push({ id: `w-l-${day.date}`, name: item.lunchName, timeMinutes: item.lunchTime, calories: item.lunchCalories });
        }
        if (day.dinner.length === 0) {
          day.dinner.push({ id: `w-d-${day.date}`, name: item.dinnerName, timeMinutes: item.dinnerTime, calories: item.dinnerCalories });
        }
      });
      saveDatabase(db);
    }

    res.json({ success: true, monthPlan: db.monthPlan, weeklyPlan: db.weeklyPlan });
  } catch (err: any) {
    console.error("AI autofill error:", err);
    res.status(500).json({ error: err.message || "Error al autocompletar con IA" });
  }
});

// ---------------- VITE & STATIC SERVING ----------------

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MenuMaster server running on port ${PORT}`);
  });
}

startServer();
