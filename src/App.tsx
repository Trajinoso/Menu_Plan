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
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab['id']>('weekly');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isGenerateAIModalOpen, setIsGenerateAIModalOpen] = useState(false);

  // Core Data States with localStorage persistence for static deployments (GitHub Pages)
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

  // Automatically sync to localStorage on changes
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

  // Bootstrap data on mount
  useEffect(() => {
    fetch('/api/data')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch data');
      })
      .then((data) => {
        if (data.recipes) setRecipes(data.recipes);
        if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
        if (data.monthPlan) setMonthPlan(data.monthPlan);
        if (data.history) setHistory(data.history);
        if (data.gitConfig) setGitConfig(data.gitConfig);
        if (data.aiSettings) setAiSettings(data.aiSettings);
      })
      .catch((err) => {
        console.warn('Using local bootstrap initial data:', err);
      });
  }, []);

  // Save new recipe
  const handleSaveNewRecipe = async (newRecipeData: Omit<Recipe, 'id' | 'createdAt'>) => {
    try {
      const res = await fetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRecipeData)
      });
      const saved = await res.json();
      setRecipes((prev) => [saved, ...prev]);
      setActiveTab('recipes');
      showToast(`¡Receta "${saved.name}" guardada con éxito!`);
    } catch (err) {
      // Fallback local save
      const fallback: Recipe = {
        ...newRecipeData,
        id: `rec-${Date.now()}`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setRecipes((prev) => [fallback, ...prev]);
      setActiveTab('recipes');
      showToast(`¡Receta "${fallback.name}" guardada con éxito!`);
    }
  };

  // Update weekly plan
  const handleUpdateWeeklyPlan = async (updated: WeeklyPlan) => {
    setWeeklyPlan(updated);
    try {
      await fetch('/api/plans/weekly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Error saving weekly plan:', err);
    }
  };

  // Update monthly plan
  const handleUpdateMonthPlan = async (updated: MonthPlan) => {
    setMonthPlan(updated);
    try {
      await fetch('/api/plans/monthly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
    } catch (err) {
      console.error('Error saving monthly plan:', err);
    }
  };

  // Assign recipe to plan
  const handleAssignRecipeToPlan = async (recipe: Recipe, dates: string[], mealType: MealType) => {
    const mealItem: MealItem = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      recipeId: recipe.id,
      name: recipe.name,
      timeMinutes: recipe.timeMinutes,
      calories: recipe.calories,
      imageUrl: recipe.imageUrl,
      category: recipe.category
    };

    const slotKey: 'lunch' | 'dinner' = mealType === 'Cena' ? 'dinner' : 'lunch';

    // Optimistic state updates
    setWeeklyPlan((prev) => {
      const newDays = { ...prev.days };
      dates.forEach((d) => {
        if (newDays[d]) {
          newDays[d] = {
            ...newDays[d],
            [slotKey]: [...(newDays[d][slotKey] || []), mealItem]
          };
        }
      });
      return { ...prev, days: newDays };
    });

    setMonthPlan((prev) => {
      const newDays = { ...prev.days };
      dates.forEach((d) => {
        const existing = newDays[d] || {
          date: d,
          dayName: 'Día',
          dayNumber: parseInt(d.split('-')[2] || '1', 10),
          breakfast: [],
          lunch: [],
          dinner: []
        };
        newDays[d] = {
          ...existing,
          [slotKey]: [...(existing[slotKey] || []), mealItem]
        };
      });
      return {
        ...prev,
        days: newDays,
        plannedMealsCount: (Object.values(newDays) as DayPlan[]).reduce(
          (acc, d) => acc + (d.lunch?.length || 0) + (d.dinner?.length || 0),
          0
        )
      };
    });

    showToast(`"${recipe.name}" añadido al ${mealType} de ${dates.length} día(s)`);

    try {
      const res = await fetch('/api/plans/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          recipeName: recipe.name,
          imageUrl: recipe.imageUrl,
          timeMinutes: recipe.timeMinutes,
          calories: recipe.calories,
          dates,
          mealType
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
        if (data.monthPlan) setMonthPlan(data.monthPlan);
      }
    } catch (err) {
      // Backend not running (e.g. GitHub Pages) - optimistic state is already applied
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
    try {
      const res = await fetch('/api/ai/autofill-empty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPlan: 'monthly',
          year: year || 2023,
          month: month || 10
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
    const targetYear = year || 2023;
    const targetMonth = month || 10;
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

  // AI Generated plan applied to current weekly plan
  const handleAIPlanGenerated = (aiPlan: any) => {
    if (!aiPlan || !aiPlan.days) return;

    const newDays: Record<string, any> = {};
    const baseDates = ['2023-10-12', '2023-10-13', '2023-10-14', '2023-10-15', '2023-10-16', '2023-10-17', '2023-10-18'];

    aiPlan.days.forEach((day: any, idx: number) => {
      const dateStr = baseDates[idx] || `2023-10-${12 + idx}`;
      newDays[dateStr] = {
        date: dateStr,
        dayName: day.dayName || 'Día',
        dayNumber: 12 + idx,
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
        return 'Nueva Receta';
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
          setActiveTab(tab);
          setMobileMenuOpen(false);
        }}
        onOpenNewMenu={() => setActiveTab('weekly')}
        onOpenGenerateAI={() => setIsGenerateAIModalOpen(true)}
        gitConnected={gitConfig.isConnected}
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
          onOpenNewRecipe={() => setActiveTab('add-recipe')}
          onOpenGenerateAI={() => setIsGenerateAIModalOpen(true)}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />

        {/* View Switcher Container */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'weekly' && (
            <WeeklyPlannerView
              plan={weeklyPlan}
              recipes={recipes}
              onUpdatePlan={handleUpdateWeeklyPlan}
              onOpenAddRecipe={() => setActiveTab('add-recipe')}
              onOpenGenerateAI={() => setIsGenerateAIModalOpen(true)}
              onNavigateToMonthly={() => setActiveTab('monthly')}
            />
          )}

          {activeTab === 'monthly' && (
            <MonthlyView
              monthPlan={monthPlan}
              recipes={recipes}
              onUpdateMonthPlan={handleUpdateMonthPlan}
              onAutofillEmpty={handleAutofillEmpty}
              isAutofilling={isAutofilling}
              onOpenAddRecipe={() => setActiveTab('add-recipe')}
            />
          )}

          {activeTab === 'recipes' && (
            <RecipesView
              recipes={recipes}
              onOpenAddRecipe={() => setActiveTab('add-recipe')}
              onAssignRecipeToPlan={handleAssignRecipeToPlan}
              onOpenGenerateAI={() => setIsGenerateAIModalOpen(true)}
            />
          )}

          {activeTab === 'add-recipe' && (
            <AddRecipeView
              onSaveRecipe={handleSaveNewRecipe}
              onCancel={() => setActiveTab('recipes')}
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
