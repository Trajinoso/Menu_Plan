export type Difficulty = 'Fácil' | 'Medio' | 'Difícil';

export type RecipeCategory = 
  | 'Proteico' 
  | 'Vegetariano' 
  | 'Rápido' 
  | 'Desayuno' 
  | 'Almuerzo' 
  | 'Cena' 
  | 'Postre' 
  | 'Snack'
  | 'Gourmet';

export type MealType = 'Desayuno' | 'Almuerzo' | 'Cena' | 'Snack';

export interface Recipe {
  id: string;
  name: string;
  description?: string;
  timeMinutes: number;
  calories: number;
  servings: number;
  category: RecipeCategory | string;
  difficulty: Difficulty;
  tags: string[];
  imageUrl: string;
  ingredients: string[];
  instructions: string[];
  sourceUrl?: string;
  isAiGenerated?: boolean;
  createdAt: string;
}

export interface MealItem {
  id: string;
  recipeId?: string;
  name: string;
  timeMinutes: number;
  calories: number;
  imageUrl?: string;
  category?: string;
  isSideDish?: boolean;
}

export interface DayPlan {
  date: string; // YYYY-MM-DD
  dayName: string; // Lunes, Martes, etc.
  dayNumber: number; // 1 to 31
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
  snacks?: MealItem[];
  targetCalories?: number;
  tags?: string[];
}

export interface WeeklyPlan {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  title: string;
  tags: string[];
  days: Record<string, DayPlan>; // keyed by date YYYY-MM-DD
}

export interface MonthPlan {
  monthKey: string; // YYYY-MM
  monthName: string; // e.g. "Octubre 2023"
  days: Record<string, DayPlan>; // keyed by YYYY-MM-DD
  plannedMealsCount: number;
  totalMealSlots: number;
  avgDailyKcal: number;
}

export interface HistoryArchiveItem {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  tags: string[];
  recipeCount: number;
  previewRecipes: {
    name: string;
    imageUrl: string;
  }[];
  totalDays: number;
  createdAt: string;
  planData: WeeklyPlan;
}

export interface GitSyncConfig {
  repoUrl: string;
  branch: string;
  token: string;
  isConnected: boolean;
  lastSyncedAt: string | null;
  statusText: string;
}

export interface AISettingsConfig {
  hasApiKey: boolean;
  systemInstruction: string;
  preferredDiet?: string;
  targetDailyCalories?: number;
}

export interface NavTab {
  id: 'weekly' | 'monthly' | 'recipes' | 'add-recipe' | 'history' | 'settings';
  label: string;
  icon: string;
}
