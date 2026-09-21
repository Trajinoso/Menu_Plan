import { Recipe, WeeklyPlan, MonthPlan, HistoryArchiveItem, GitSyncConfig, AISettingsConfig, DayPlan } from '../types';
import { getCurrentWeekDates, formatMonthYear, formatWeekRange, getTodayISO } from '../utils/dateHelpers';

export const INITIAL_RECIPES: Recipe[] = [];

const currentWeek = getCurrentWeekDates();
const weekStart = currentWeek[0]?.date || '2026-09-07';
const weekEnd = currentWeek[6]?.date || '2026-09-13';
const weekTitle = `Semana del ${formatWeekRange(weekStart, weekEnd)}`;

const initialDays: Record<string, DayPlan> = {};
currentWeek.forEach((cw) => {
  initialDays[cw.date] = {
    date: cw.date,
    dayName: cw.dayName,
    dayNumber: cw.dayNumber,
    breakfast: [],
    lunch: [],
    dinner: []
  };
});

export const INITIAL_WEEKLY_PLAN: WeeklyPlan = {
  id: 'week-current',
  startDate: weekStart,
  endDate: weekEnd,
  title: weekTitle,
  tags: ['Menú Semanal'],
  days: initialDays
};

const now = new Date();
const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
const currentMonthName = formatMonthYear(now);

// Sembrar los días de la semana actual vacíos en el plan mensual
const initialMonthDays: Record<string, DayPlan> = {};
currentWeek.forEach((cw) => {
  initialMonthDays[cw.date] = {
    date: cw.date,
    dayName: cw.dayName,
    dayNumber: cw.dayNumber,
    breakfast: [],
    lunch: [],
    dinner: []
  };
});

export const INITIAL_MONTH_PLAN: MonthPlan = {
  monthKey: currentMonthKey,
  monthName: currentMonthName,
  plannedMealsCount: 0,
  totalMealSlots: 60,
  avgDailyKcal: 2000,
  days: initialMonthDays
};

export const INITIAL_HISTORY: HistoryArchiveItem[] = [];

export const INITIAL_GIT_CONFIG: GitSyncConfig = {
  repoUrl: '',
  branch: 'main',
  token: '',
  isConnected: false,
  lastSyncedAt: null,
  statusText: 'No sincronizado'
};

export const INITIAL_AI_SETTINGS: AISettingsConfig = {
  hasApiKey: false,
  systemInstruction: 'Extraer solo los datos reales, calcular calorías estimadas precisas y formatear ingredientes con medidas exactas en español.',
  preferredDiet: 'Equilibrada con alto contenido proteico',
  targetDailyCalories: 2200
};
