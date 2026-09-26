import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { WeeklyPlannerView } from './components/WeeklyPlannerView';
import { MonthlyView } from './components/MonthlyView';
import { RecipesView } from './components/RecipesView';
import { AddRecipeView } from './components/AddRecipeView';
import { HistoryView } from './components/HistoryView';
import { SettingsView } from './components/SettingsView';
import { GeneratePlanModal } from './components/GeneratePlanModal';
import {
  Recipe,
  WeeklyPlan,
  MonthPlan,
  DayPlan,
  MealItem,
  HistoryArchiveItem,
  GitSyncConfig,
  AISettingsConfig,
  NavTab,
  MealType
} from './types';
import {
  INITIAL_RECIPES,
  INITIAL_WEEKLY_PLAN,
  INITIAL_MONTH_PLAN,
  INITIAL_HISTORY,
  INITIAL_GIT_CONFIG,
  INITIAL_AI_SETTINGS
} from './data/initialData';
import { getCurrentWeekDates, getDayNameFromISO } from './utils/dateHelpers';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import {
  auth,
  db,
  loginWithGoogle,
  logoutUser,
  testConnection,
  handleFirestoreError,
  OperationType
} from './lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';

// Limpieza automática de recetas y categorías de ejemplo previas
try {
  if (typeof window !== 'undefined' && !localStorage.getItem('mm_cleared_sample_data_v4')) {
    const savedRecs = localStorage.getItem('mm_recipes');
    if (savedRecs) {
      const parsed = JSON.parse(savedRecs);
      if (Array.isArray(parsed) && parsed.some((r: any) => /^rec-([1-9]|10)$/.test(r.id))) {
        localStorage.removeItem('mm_recipes');
        localStorage.removeItem('mm_weekly_plan');
        localStorage.removeItem('mm_month_plan');
        localStorage.removeItem('mm_history');
      }
    }
    const savedCats = localStorage.getItem('mm_categories');
    if (savedCats) {
      const parsedCats = JSON.parse(savedCats);
      if (Array.isArray(parsedCats) && (parsedCats.includes('Proteico') || parsedCats.includes('Vegetariano'))) {
        localStorage.removeItem('mm_categories');
      }
    }
    localStorage.setItem('mm_cleared_sample_data_v4', 'true');
  }
} catch (e) {}

const DEFAULT_CATEGORIES: string[] = [];

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab['id']>('weekly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isGenerateAIModalOpen, setIsGenerateAIModalOpen] = useState(false);

  // Core Data States with localStorage persistence for static deployments (GitHub Pages)
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    try {
      const saved = localStorage.getItem('mm_recipes');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_RECIPES;
  });

  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(() => {
    try {
      const saved = localStorage.getItem('mm_weekly_plan');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_WEEKLY_PLAN;
  });

  const [monthPlan, setMonthPlan] = useState<MonthPlan>(() => {
    try {
      const saved = localStorage.getItem('mm_month_plan');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_MONTH_PLAN;
  });

  const [history, setHistory] = useState<HistoryArchiveItem[]>(() => {
    try {
      const saved = localStorage.getItem('mm_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_HISTORY;
  });

  const [gitConfig, setGitConfig] = useState<GitSyncConfig>(() => {
    try {
      const saved = localStorage.getItem('mm_git_config');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_GIT_CONFIG;
  });

  const [aiSettings, setAiSettings] = useState<AISettingsConfig>(() => {
    try {
      const saved = localStorage.getItem('mm_ai_settings');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_AI_SETTINGS;
  });

  const [categories, setCategories] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mm_categories');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_CATEGORIES;
  });

  // Automatically sync to localStorage on changes
  useEffect(() => {
    try { localStorage.setItem('mm_categories', JSON.stringify(categories)); } catch (e) {}
  }, [categories]);

  const handleAddCategory = (newCat: string) => {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    if (!categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      showToast(`Categoría "${trimmed}" añadida.`);
      fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: trimmed })
      }).catch(() => {});
    }
  };

  const handleDeleteCategory = (catToDelete: string) => {
    const updated = categories.filter((c) => c.toLowerCase() !== catToDelete.toLowerCase());
    setCategories(updated);
    showToast(`Categoría "${catToDelete}" eliminada.`);
    fetch(`/api/categories/${encodeURIComponent(catToDelete)}`, {
      method: 'DELETE'
    }).catch(() => {});
  };
  useEffect(() => {
    try { localStorage.setItem('mm_recipes', JSON.stringify(recipes)); } catch (e) {}
  }, [recipes]);

  useEffect(() => {
    try { localStorage.setItem('mm_weekly_plan', JSON.stringify(weeklyPlan)); } catch (e) {}
  }, [weeklyPlan]);

  useEffect(() => {
    try { localStorage.setItem('mm_month_plan', JSON.stringify(monthPlan)); } catch (e) {}
  }, [monthPlan]);

  useEffect(() => {
    try { localStorage.setItem('mm_history', JSON.stringify(history)); } catch (e) {}
  }, [history]);

  useEffect(() => {
    try { localStorage.setItem('mm_git_config', JSON.stringify(gitConfig)); } catch (e) {}
  }, [gitConfig]);

  useEffect(() => {
    try { localStorage.setItem('mm_ai_settings', JSON.stringify(aiSettings)); } catch (e) {}
  }, [aiSettings]);

  // UI status states
  const [isSyncing, setIsSyncing] = useState(false);
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage((current) => (current?.text === text ? null : current));
    }, 3500);
  };

  // Bootstrap data on mount & listen to Firebase Auth
  useEffect(() => {
    testConnection();

    // 1. Fetch initial local/server data
    fetch('/api/data')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch data');
      })
      .then((data) => {
        if (data.recipes && Array.isArray(data.recipes) && data.recipes.length > 0) {
          setRecipes(data.recipes);
        } else {
          try {
            const localSaved = localStorage.getItem('mm_recipes');
            if (localSaved) {
              const parsed = JSON.parse(localSaved);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setRecipes(parsed);
              }
            }
          } catch (e) {}
        }
        if (data.weeklyPlan && data.weeklyPlan.days && Object.keys(data.weeklyPlan.days).length > 0) {
          setWeeklyPlan(data.weeklyPlan);
        }
        if (data.monthPlan) setMonthPlan(data.monthPlan);
        if (data.history && data.history.length > 0) setHistory(data.history);
        if (data.gitConfig) setGitConfig(data.gitConfig);
        if (data.aiSettings) setAiSettings(data.aiSettings);
        if (Array.isArray(data.categories) && data.categories.length > 0) setCategories(data.categories);
      })
      .catch((err) => {
        console.warn('Using local bootstrap initial data:', err);
      });

    // 2. Listen to Firebase Auth state & sync with Firestore
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const [recipeSnap, stateSnap] = await Promise.all([
            getDocs(collection(db, 'recipes')),
            getDoc(doc(db, 'app_state', 'main'))
          ]);

          let hasCloudData = false;
          if (recipeSnap.docs.length > 0) {
            const cloudRecipes = recipeSnap.docs.map((d) => d.data() as Recipe);
            setRecipes(cloudRecipes);
            hasCloudData = true;
          }
          if (stateSnap.exists()) {
            const data = stateSnap.data();
            if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
            if (data.monthPlan) setMonthPlan(data.monthPlan);
            if (Array.isArray(data.categories)) setCategories(data.categories);
            if (Array.isArray(data.history)) setHistory(data.history);
            hasCloudData = true;
          }

          if (hasCloudData) {
            showToast(`¡Conectado como ${user.displayName || user.email}! Sincronizado con Firebase.`);
          }
        } catch (err) {
          console.warn('Error reading from Firestore on auth change:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Firebase Auth Handlers
  const handleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      if (user) {
        showToast(`¡Bienvenido ${user.displayName || user.email}! Conectado a Firebase Firestore.`);
      }
    } catch (err: any) {
      console.error('Login error:', err);
      showToast('No se pudo iniciar sesión con Google: ' + (err?.message || 'Error'), 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentUser(null);
      showToast('Has cerrado sesión en Firebase.');
    } catch (err: any) {
      showToast('Error al cerrar sesión', 'error');
    }
  };

  // Cloud Sync Handlers (Manual triggers)
  const handleSyncToFirebase = async () => {
    try {
      // 1. Save all recipes to collection
      for (const r of recipes) {
        try {
          await setDoc(doc(db, 'recipes', r.id), r);
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, `recipes/${r.id}`);
        }
      }
      // 2. Save app_state document
      try {
        await setDoc(doc(db, 'app_state', 'main'), {
          id: 'main',
          weeklyPlan,
          monthPlan,
          categories,
          history,
          userId: currentUser?.uid || 'anonymous',
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'app_state/main');
      }
      showToast('¡Todos los datos se han guardado con éxito en Firebase Firestore!');
    } catch (err: any) {
      console.error('Firebase sync error:', err);
      throw err;
    }
  };

  const handleRestoreFromFirebase = async () => {
    try {
      const [recipeSnap, stateSnap] = await Promise.all([
        getDocs(collection(db, 'recipes')),
        getDoc(doc(db, 'app_state', 'main'))
      ]);

      if (recipeSnap.docs.length > 0) {
        const cloudRecipes = recipeSnap.docs.map((d) => d.data() as Recipe);
        setRecipes(cloudRecipes);
      }
      if (stateSnap.exists()) {
        const data = stateSnap.data();
        if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
        if (data.monthPlan) setMonthPlan(data.monthPlan);
        if (Array.isArray(data.categories)) setCategories(data.categories);
        if (Array.isArray(data.history)) setHistory(data.history);
      }
      showToast('¡Datos recuperados desde Firebase Firestore!');
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'app_state/main');
    }
  };

  // JSON File Backup and Restore Handlers
  const handleExportJsonBackup = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      recipes,
      categories,
      weeklyPlan,
      monthPlan,
      history
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `menumaster_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Copia de seguridad JSON descargada correctamente');
  };

  const handleImportJsonBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.recipes)) setRecipes(parsed.recipes);
      if (Array.isArray(parsed.categories)) setCategories(parsed.categories);
      if (parsed.weeklyPlan) setWeeklyPlan(parsed.weeklyPlan);
      if (parsed.monthPlan) setMonthPlan(parsed.monthPlan);
      if (Array.isArray(parsed.history)) setHistory(parsed.history);

      // Restore to server
      fetch('/api/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      }).catch(() => {});

      // If user is logged in, also sync to Firebase
      if (currentUser) {
        for (const r of (parsed.recipes || [])) {
          setDoc(doc(db, 'recipes', r.id), r).catch(() => {});
        }
        setDoc(doc(db, 'app_state', 'main'), {
          id: 'main',
          weeklyPlan: parsed.weeklyPlan || weeklyPlan,
          monthPlan: parsed.monthPlan || monthPlan,
          categories: parsed.categories || categories,
          history: parsed.history || history,
          userId: currentUser.uid,
          updatedAt: new Date().toISOString()
        }).catch(() => {});
      }

      showToast(`¡Copia importada con éxito! (${(parsed.recipes || []).length} recetas)`);
    } catch (err: any) {
      showToast('Error al importar archivo JSON: Formato no válido', 'error');
    }
  };

  // Save new recipe
  const handleSaveNewRecipe = async (newRecipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
    const categories = Array.isArray(newRecipeData.categories) && newRecipeData.categories.length > 0
      ? newRecipeData.categories
      : newRecipeData.category ? [newRecipeData.category] : ['General'];
    const primaryCategory = categories[0] || newRecipeData.category || 'General';

    const fullRecipeData = {
      ...newRecipeData,
      category: primaryCategory,
      categories,
      difficulty: newRecipeData.difficulty || 'Fácil',
      timeMinutes: newRecipeData.timeMinutes || 20,
      calories: newRecipeData.calories || 350,
      servings: newRecipeData.servings || 1
    };

    let savedRecipe: Recipe;
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullRecipeData)
      });
      if (res.ok) {
        savedRecipe = await res.json();
      } else {
        throw new Error('Server error');
      }
    } catch (err) {
      savedRecipe = {
        ...fullRecipeData,
        id: `rec-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0]
      };
    }

    setRecipes((prev) => {
      const updated = [savedRecipe, ...prev];
      try {
        localStorage.setItem('mm_recipes', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
    setActiveTab('recipes');
    showToast(`¡Receta "${savedRecipe.name}" guardada con éxito!`);

    // Sync to Firestore if authenticated
    if (currentUser) {
      setDoc(doc(db, 'recipes', savedRecipe.id), savedRecipe).catch((e) =>
        console.warn('Firestore sync recipe:', e)
      );
    }
  };

  // Open add recipe view cleanly
  const handleOpenAddRecipe = () => {
    setEditingRecipe(null);
    setActiveTab('add-recipe');
  };

  // Open recipe to edit
  const handleEditRecipe = (recipe: Recipe) => {
    setEditingRecipe(recipe);
    setActiveTab('add-recipe');
  };

  // Save updated recipe
  const handleUpdateRecipe = async (updated: Recipe) => {
    const categories = Array.isArray(updated.categories) && updated.categories.length > 0
      ? updated.categories
      : updated.category ? [updated.category] : ['General'];
    const primaryCategory = categories[0] || updated.category || 'General';
    const normalizedUpdated: Recipe = {
      ...updated,
      category: primaryCategory,
      categories
    };

    try {
      const res = await fetch(`/api/recipes/${normalizedUpdated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(normalizedUpdated)
      });
      if (res.ok) {
        const saved = await res.json();
        setRecipes((prev) => prev.map((r) => (r.id === saved.id ? saved : r)));
      } else {
        setRecipes((prev) => prev.map((r) => (r.id === normalizedUpdated.id ? normalizedUpdated : r)));
      }
    } catch (err) {
      setRecipes((prev) => prev.map((r) => (r.id === normalizedUpdated.id ? normalizedUpdated : r)));
    }

    // Propagate updated recipe info to any meals in plans
    const updateMealItem = (m: MealItem): MealItem => {
      if (m.recipeId === normalizedUpdated.id) {
        return {
          ...m,
          name: normalizedUpdated.name,
          timeMinutes: normalizedUpdated.timeMinutes,
          calories: normalizedUpdated.calories,
          imageUrl: normalizedUpdated.imageUrl,
          category: primaryCategory
        };
      }
      return m;
    };

    setWeeklyPlan((prev) => ({
      ...prev,
      days: Object.fromEntries(
        Object.entries(prev.days).map(([k, d]) => [
          k,
          {
            ...d,
            breakfast: (d.breakfast || []).map(updateMealItem),
            lunch: (d.lunch || []).map(updateMealItem),
            dinner: (d.dinner || []).map(updateMealItem)
          }
        ])
      )
    }));

    setMonthPlan((prev) => ({
      ...prev,
      days: Object.fromEntries(
        Object.entries(prev.days).map(([k, d]) => [
          k,
          {
            ...d,
            breakfast: (d.breakfast || []).map(updateMealItem),
            lunch: (d.lunch || []).map(updateMealItem),
            dinner: (d.dinner || []).map(updateMealItem)
          }
        ])
      )
    }));

    setEditingRecipe(null);
    setActiveTab('recipes');
    showToast(`¡Receta "${updated.name}" actualizada con éxito!`);

    // Sync updated recipe to Firestore if authenticated
    if (currentUser) {
      setDoc(doc(db, 'recipes', updated.id), updated).catch((e) =>
        console.warn('Firestore sync updated recipe:', e)
      );
    }
  };

  // Update weekly plan with bidirectional sync to monthly plan
  const handleUpdateWeeklyPlan = async (updated: WeeklyPlan) => {
    setWeeklyPlan(updated);

    // Sincronizar automáticamente cada día de la semana con la vista mensual
    setMonthPlan((prevMonth) => {
      const newMonthDays = { ...prevMonth.days };
      Object.entries(updated.days).forEach(([dateStr, dayPlan]) => {
        newMonthDays[dateStr] = {
          ...dayPlan,
          dayName: dayPlan.dayName || 'Día',
          dayNumber: parseInt(dateStr.split('-')[2] || '1', 10),
        };
      });
      const plannedMealsCount = (Object.values(newMonthDays) as DayPlan[]).reduce(
        (acc, d) => acc + (d.breakfast?.length || 0) + (d.lunch?.length || 0) + (d.dinner?.length || 0),
        0
      );
      return {
        ...prevMonth,
        days: newMonthDays,
        plannedMealsCount
      };
    });

    try {
      await fetch('/api/plans/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Error saving weekly plan:', err);
    }

    // Sync to Firestore if authenticated
    if (currentUser) {
      setDoc(
        doc(db, 'app_state', 'main'),
        {
          id: 'main',
          weeklyPlan: updated,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      ).catch((e) => console.warn('Firestore update weekly plan:', e));
    }
  };

  // Update monthly plan with bidirectional sync to weekly plan
  const handleUpdateMonthPlan = async (updated: MonthPlan) => {
    setMonthPlan(updated);

    // Sincronizar automáticamente cualquier día del mes que esté en la semana activa
    setWeeklyPlan((prevWeek) => {
      const newWeeklyDays = { ...prevWeek.days };
      let changed = false;
      Object.keys(newWeeklyDays).forEach((dateStr) => {
        if (updated.days && updated.days[dateStr]) {
          newWeeklyDays[dateStr] = {
            ...newWeeklyDays[dateStr],
            breakfast: updated.days[dateStr].breakfast || [],
            lunch: updated.days[dateStr].lunch || [],
            dinner: updated.days[dateStr].dinner || [],
          };
          changed = true;
        }
      });
      return changed ? { ...prevWeek, days: newWeeklyDays } : prevWeek;
    });

    try {
      await fetch('/api/plans/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Error saving monthly plan:', err);
    }

    // Sync to Firestore if authenticated
    if (currentUser) {
      setDoc(
        doc(db, 'app_state', 'main'),
        {
          id: 'main',
          monthPlan: updated,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      ).catch((e) => console.warn('Firestore update month plan:', e));
    }
  };

  // Assign recipe to plan
  const handleAssignRecipeToPlan = async (recipe: Recipe, dates: string[], mealType: MealType) => {
    const uniqueDates = Array.from(new Set(dates));
    if (uniqueDates.length === 0) return;

    let slotKey: 'breakfast' | 'lunch' | 'dinner' = 'lunch';
    if (mealType === 'Desayuno') {
      slotKey = 'breakfast';
    } else if (mealType === 'Cena') {
      slotKey = 'dinner';
    } else {
      slotKey = 'lunch';
    }

    const mealItemId = `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const mealItem: MealItem = {
      id: mealItemId,
      recipeId: recipe.id,
      name: recipe.name,
      timeMinutes: recipe.timeMinutes,
      calories: recipe.calories,
      imageUrl: recipe.imageUrl,
      category: recipe.category
    };

    // 1. Calculate updated weekly plan
    const updatedWeeklyDays = { ...weeklyPlan.days };
    uniqueDates.forEach((d) => {
      const existing = updatedWeeklyDays[d] || {
        date: d,
        dayName: getDayNameFromISO(d),
        dayNumber: parseInt(d.split('-')[2] || '1', 10),
        breakfast: [],
        lunch: [],
        dinner: []
      };
      updatedWeeklyDays[d] = {
        ...existing,
        [slotKey]: [...(existing[slotKey] || []), mealItem]
      };
    });

    const updatedWeeklyPlan: WeeklyPlan = {
      ...weeklyPlan,
      days: updatedWeeklyDays
    };
    setWeeklyPlan(updatedWeeklyPlan);

    // 2. Calculate updated month plan
    const updatedMonthDays = { ...monthPlan.days };
    uniqueDates.forEach((d) => {
      const existing = updatedMonthDays[d] || {
        date: d,
        dayName: getDayNameFromISO(d),
        dayNumber: parseInt(d.split('-')[2] || '1', 10),
        breakfast: [],
        lunch: [],
        dinner: []
      };
      updatedMonthDays[d] = {
        ...existing,
        [slotKey]: [...(existing[slotKey] || []), mealItem]
      };
    });

    const plannedMealsCount = (Object.values(updatedMonthDays) as DayPlan[]).reduce(
      (acc, d) => acc + (d.breakfast?.length || 0) + (d.lunch?.length || 0) + (d.dinner?.length || 0),
      0
    );

    const updatedMonthPlan: MonthPlan = {
      ...monthPlan,
      days: updatedMonthDays,
      plannedMealsCount
    };
    setMonthPlan(updatedMonthPlan);

    showToast(`"${recipe.name}" añadido al ${mealType} de ${uniqueDates.length} día(s)`);

    // 3. Persist to server
    try {
      await Promise.all([
        fetch('/api/plans/weekly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedWeeklyPlan)
        }),
        fetch('/api/plans/monthly', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedMonthPlan)
        })
      ]);
    } catch (err) {
      console.warn('Backend sync error:', err);
    }

    // 4. Persist to Firestore if authenticated
    if (currentUser) {
      setDoc(
        doc(db, 'app_state', 'main'),
        {
          id: 'main',
          weeklyPlan: updatedWeeklyPlan,
          monthPlan: updatedMonthPlan,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      ).catch((e) => console.warn('Firestore update plans:', e));
    }
  };

  // Git Sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    const nowIso = new Date().toISOString();
    try {
      const res = await fetch('/api/git/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setGitConfig((prev) => ({
          ...prev,
          lastSyncedAt: data.lastSyncedAt || nowIso,
          isConnected: true
        }));
        showToast('¡Plan de comidas sincronizado y serializado en Git!', 'success');
        return data;
      }
    } catch (err: any) {
      // Fallback below
    } finally {
      setIsSyncing(false);
    }
    // Fallback for static GitHub Pages execution
    setGitConfig((prev) => ({
      ...prev,
      lastSyncedAt: nowIso,
      isConnected: true
    }));
    showToast('¡Plan de comidas respaldado localmente!', 'success');
    return { success: true, lastSyncedAt: nowIso };
  };

  // Autofill empty slots with AI (or local catalog fallback if offline)
  const handleAutofillEmpty = async (year?: number, month?: number) => {
    setIsAutofilling(true);
    const now = new Date();
    const currentYear = year || now.getFullYear();
    const currentMonth = month || (now.getMonth() + 1);

    try {
      const res = await fetch('/api/ai/autofill-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlan: 'monthly',
          year: currentYear,
          month: currentMonth
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          if (data.monthPlan) setMonthPlan(data.monthPlan);
          if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
          showToast('¡Días vacíos autocompletados con platos balanceados por Gemini!', 'success');
          return;
        }
      }
    } catch (err) {
      // Fallback to local catalog below
    } finally {
      setIsAutofilling(false);
    }

    // Client-side fallback if backend is offline or on GitHub Pages
    const targetYear = currentYear;
    const targetMonth = currentMonth;
    const daysInM = new Date(targetYear, targetMonth, 0).getDate();
    const prefix = `${targetYear}-${targetMonth.toString().padStart(2, '0')}`;

    setMonthPlan((prev) => {
      const newDays = { ...prev.days };
      let recIdx = 0;
      for (let i = 1; i <= daysInM; i++) {
        const dateStr = `${prefix}-${i.toString().padStart(2, '0')}`;
        const day = newDays[dateStr];
        const r1 = recipes[recIdx % recipes.length];
        const r2 = recipes[(recIdx + 1) % recipes.length];
        recIdx += 2;

        if (!day) {
          const dayDate = new Date(targetYear, targetMonth - 1, i);
          const dayName = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][dayDate.getDay()];
          newDays[dateStr] = {
            date: dateStr,
            dayName,
            dayNumber: i,
            breakfast: [],
            lunch: [{ id: `l-${dateStr}`, name: r1.name, timeMinutes: r1.timeMinutes, calories: r1.calories, imageUrl: r1.imageUrl, category: r1.category }],
            dinner: [{ id: `d-${dateStr}`, name: r2.name, timeMinutes: r2.timeMinutes, calories: r2.calories, imageUrl: r2.imageUrl, category: r2.category }]
          };
        } else {
          if (!day.lunch || day.lunch.length === 0) {
            day.lunch = [{ id: `l-${dateStr}`, name: r1.name, timeMinutes: r1.timeMinutes, calories: r1.calories, imageUrl: r1.imageUrl, category: r1.category }];
          }
          if (!day.dinner || day.dinner.length === 0) {
            day.dinner = [{ id: `d-${dateStr}`, name: r2.name, timeMinutes: r2.timeMinutes, calories: r2.calories, imageUrl: r2.imageUrl, category: r2.category }];
          }
        }
      }
      return {
        ...prev,
        days: newDays,
        plannedMealsCount: (Object.values(newDays) as DayPlan[]).reduce((acc, d) => acc + (d.lunch?.length || 0) + (d.dinner?.length || 0), 0)
      };
    });
    showToast('¡Días vacíos autocompletados desde el recetario local!', 'success');
  };

  // Archive current weekly plan to history
  const handleArchiveCurrentPlan = async () => {
    const allDays = Object.values(weeklyPlan.days) as DayPlan[];
    const previewRecipes = allDays
      .flatMap(d => [...(d.lunch || []), ...(d.dinner || [])])
      .slice(0, 4)
      .map(m => ({ name: m.name, imageUrl: m.imageUrl || '' }));

    const newItem: HistoryArchiveItem = {
      id: `hist-${Date.now()}`,
      title: weeklyPlan.title || `Plan del ${weeklyPlan.startDate}`,
      startDate: weeklyPlan.startDate,
      endDate: weeklyPlan.endDate,
      tags: weeklyPlan.tags || ['Menú Semanal'],
      recipeCount: allDays.reduce((acc, d) => acc + (d.lunch?.length || 0) + (d.dinner?.length || 0), 0),
      previewRecipes,
      totalDays: allDays.length || 7,
      createdAt: new Date().toISOString().split('T')[0],
      planData: weeklyPlan
    };
    setHistory((prev) => [newItem, ...prev]);
    showToast('¡Plan semanal archivado en el historial!', 'success');

    try {
      await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem)
      });
    } catch (err) {
      // Offline fallback already applied
    }
  };

  // Load plan from history
  const handleLoadPlan = async (archiveId: string) => {
    const target = history.find(h => h.id === archiveId);
    if (target?.planData) {
      setWeeklyPlan(target.planData);
      showToast('¡Plan histórico restaurado en el Planificador Semanal!', 'success');
    }
    try {
      const res = await fetch(`/api/history/${archiveId}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
      }
    } catch (err) {
      // Offline fallback already applied
    }
  };

  // Save Git Config
  const handleSaveGitConfig = async (config: Partial<GitSyncConfig>) => {
    try {
      const res = await fetch('/api/settings/git', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      setGitConfig(data);
      showToast('Configuración de repositorio Git guardada');
    } catch (err) {
      console.error(err);
    }
  };

  // Save AI Settings
  const handleSaveAISettings = async (settings: Partial<AISettingsConfig>) => {
    try {
      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      setAiSettings(data);
      showToast('Preferencias de Gemini AI actualizadas');
    } catch (err) {
      console.error(err);
    }
  };

  // Delete recipe from catalog
  const handleDeleteRecipe = async (id: string) => {
    setRecipes((prev) => prev.filter((r) => r.id !== id));
    showToast('Receta eliminada del recetario', 'info');

    try {
      await fetch(`/api/recipes/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      // Backend offline or GitHub Pages: state persisted in localStorage
    }

    if (currentUser) {
      deleteDoc(doc(db, 'recipes', id)).catch((e) =>
        console.warn('Firestore delete recipe:', e)
      );
    }
  };

  // AI Generated plan applied to current weekly plan
  const handleAIPlanGenerated = (aiPlan: any) => {
    if (!aiPlan || !aiPlan.days) return;

    const newDays: Record<string, any> = {};
    const currentWeek = getCurrentWeekDates();

    aiPlan.days.forEach((day: any, idx: number) => {
      const weekDay = currentWeek[idx] || currentWeek[0];
      const dateStr = weekDay.date;
      newDays[dateStr] = {
        date: dateStr,
        dayName: day.dayName || weekDay.dayName,
        dayNumber: weekDay.dayNumber,
        breakfast: day.breakfast ? [{
          id: `ai-b-${idx}`,
          name: day.breakfast.name,
          timeMinutes: day.breakfast.timeMinutes,
          calories: day.breakfast.calories,
          imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80'
        }] : [],
        lunch: day.lunch ? [{
          id: `ai-l-${idx}`,
          name: day.lunch.name,
          timeMinutes: day.lunch.timeMinutes,
          calories: day.lunch.calories,
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80'
        }] : [],
        dinner: day.dinner ? [{
          id: `ai-d-${idx}`,
          name: day.dinner.name,
          timeMinutes: day.dinner.timeMinutes,
          calories: day.dinner.calories,
          imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800&auto=format&fit=crop&q=80'
        }] : []
      };
    });

    const updated: WeeklyPlan = {
      ...weeklyPlan,
      title: aiPlan.planTitle || 'Menú Semanal Personalizado IA',
      tags: aiPlan.tags || ['Plan IA', 'Equilibrado'],
      days: newDays
    };

    handleUpdateWeeklyPlan(updated);
    setActiveTab('weekly');
    showToast('¡Plan semanal diseñado por Gemini cargado exitosamente!');
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'weekly':
        return 'Planificador Semanal';
      case 'monthly':
        return 'Vista Mensual';
      case 'recipes':
        return 'Recetario';
      case 'add-recipe':
        return editingRecipe ? 'Editar Receta' : 'Nueva Receta';
      case 'history':
        return 'Historial';
      case 'settings':
        return 'Configuración';
      default:
        return 'MenuMaster';
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f8f9fa] text-[#191c1d]">
      {/* Desktop Left Sidebar */}
      <Sidebar
        currentTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'add-recipe') {
            handleOpenAddRecipe();
          } else {
            setActiveTab(tab);
          }
          setMobileMenuOpen(false);
        }}
        onOpenNewMenu={() => setActiveTab('weekly')}
        onOpenGenerateAI={() => setIsGenerateAIModalOpen(true)}
        gitConnected={gitConfig.isConnected}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
      />

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden bg-black/40 backdrop-blur-xs flex">
          <div className="w-72 bg-white h-full shadow-2xl p-5 flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex justify-between items-center pb-3 border-b border-[#e1e3e4]">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#0f5238] flex items-center justify-center text-white font-bold text-sm font-heading">
                    M
                  </div>
                  <span className="font-bold text-lg text-[#0f5238] font-heading">
                    MenuMaster
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1 rounded-lg text-[#707973] hover:text-[#191c1d]"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-1">
                {[
                  { id: 'weekly' as const, label: 'Planificador Semanal' },
                  { id: 'monthly' as const, label: 'Vista Mensual' },
                  { id: 'recipes' as const, label: 'Recetario' },
                  { id: 'history' as const, label: 'Historial' },
                  { id: 'settings' as const, label: 'Configuración' }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      activeTab === item.id
                        ? 'bg-[#e7e8e9] text-[#0f5238] font-bold border-l-4 border-[#0f5238]'
                        : 'text-[#404943] hover:bg-[#f3f4f5]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsGenerateAIModalOpen(true);
              }}
              className="w-full py-2.5 bg-[#9b4500] text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 shadow-xs"
            >
              <span>Generar Plan con IA</span>
            </button>
          </div>
          <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 h-screen overflow-hidden">
        {/* Header Bar */}
        <Header
          title={getHeaderTitle()}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onSyncGit={handleForceSync}
          isSyncing={isSyncing}
          onOpenNewRecipe={handleOpenAddRecipe}
          onOpenGenerateAI={() => setIsGenerateAIModalOpen(true)}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'add-recipe') {
              handleOpenAddRecipe();
            } else {
              setActiveTab(tab);
            }
          }}
          currentUser={currentUser}
          onLogin={handleLogin}
          onLogout={handleLogout}
          firebaseConnected={true}
        />

        {/* View Switcher Container */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'weekly' && (
            <WeeklyPlannerView
              plan={weeklyPlan}
              recipes={recipes}
              categories={categories}
              monthDays={monthPlan.days}
              onUpdatePlan={handleUpdateWeeklyPlan}
              onOpenAddRecipe={handleOpenAddRecipe}
              onOpenGenerateAI={() => setIsGenerateAIModalOpen(true)}
              onNavigateToMonthly={() => setActiveTab('monthly')}
              onEditRecipe={handleEditRecipe}
            />
          )}

          {activeTab === 'monthly' && (
            <MonthlyView
              monthPlan={monthPlan}
              recipes={recipes}
              categories={categories}
              onUpdateMonthPlan={handleUpdateMonthPlan}
              onAutofillEmpty={handleAutofillEmpty}
              isAutofilling={isAutofilling}
              onOpenAddRecipe={handleOpenAddRecipe}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipesView
              recipes={recipes}
              categories={categories}
              onOpenAddRecipe={handleOpenAddRecipe}
              onAssignRecipeToPlan={handleAssignRecipeToPlan}
              onOpenGenerateAI={() => setIsGenerateAIModalOpen(true)}
              onDeleteRecipe={handleDeleteRecipe}
              onEditRecipe={handleEditRecipe}
            />
          )}

          {activeTab === 'add-recipe' && (
            <AddRecipeView
              recipeToEdit={editingRecipe}
              onSaveRecipe={handleSaveNewRecipe}
              onUpdateRecipe={handleUpdateRecipe}
              onCancel={() => {
                setEditingRecipe(null);
                setActiveTab('recipes');
              }}
              categories={categories}
              onAddCategory={handleAddCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              history={history}
              currentPlan={weeklyPlan}
              onLoadPlan={handleLoadPlan}
              onArchiveCurrentPlan={handleArchiveCurrentPlan}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              gitConfig={gitConfig}
              aiSettings={aiSettings}
              onSaveGitConfig={handleSaveGitConfig}
              onSaveAISettings={handleSaveAISettings}
              onForceSync={handleForceSync}
              isSyncing={isSyncing}
              currentUser={currentUser}
              onLoginWithGoogle={handleLogin}
              onLogoutGoogle={handleLogout}
              onSyncToFirebase={handleSyncToFirebase}
              onRestoreFromFirebase={handleRestoreFromFirebase}
              onExportJsonBackup={handleExportJsonBackup}
              onImportJsonBackup={handleImportJsonBackup}
            />
          )}
        </main>
      </div>

      {/* AI Meal Plan Generator Modal */}
      <GeneratePlanModal
        isOpen={isGenerateAIModalOpen}
        onClose={() => setIsGenerateAIModalOpen(false)}
        onPlanGenerated={handleAIPlanGenerated}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white border border-[#e1e3e4] text-[#191c1d] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-[#0f5238] shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-[#ba1a1a] shrink-0" />
          )}
          <p className="text-xs md:text-sm font-medium flex-1">{toastMessage.text}</p>
          <button
            onClick={() => setToastMessage(null)}
            className="text-[#707973] hover:text-[#191c1d] p-1"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
