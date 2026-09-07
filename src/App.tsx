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

  // Core Data States
  const [recipes, setRecipes] = useState<Recipe[]>(INITIAL_RECIPES);
  const [weeklyPlan, setWeeklyPlan] = useState<WeeklyPlan>(INITIAL_WEEKLY_PLAN);
  const [monthPlan, setMonthPlan] = useState<MonthPlan>(INITIAL_MONTH_PLAN);
  const [history, setHistory] = useState<HistoryArchiveItem[]>(INITIAL_HISTORY);
  const [gitConfig, setGitConfig] = useState<GitSyncConfig>(INITIAL_GIT_CONFIG);
  const [aiSettings, setAiSettings] = useState<AISettingsConfig>(INITIAL_AI_SETTINGS);

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
      showToast(`"${recipe.name}" añadido al ${mealType} de ${dates.length} día(s)`);
    } catch (err) {
      console.error('Error assigning recipe:', err);
    }
  };

  // Git Sync
  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/git/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        setGitConfig((prev) => ({
          ...prev,
          lastSyncedAt: data.lastSyncedAt,
          isConnected: true
        }));
        showToast('¡Plan de comidas sincronizado y serializado en Git!', 'success');
        return data;
      }
      throw new Error('Error al sincronizar');
    } catch (err: any) {
      showToast('No se pudo completar la sincronización con Git', 'error');
      return { success: false };
    } finally {
      setIsSyncing(false);
    }
  };

  // Autofill empty slots with AI
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
      const data = await res.json();
      if (data.success) {
        if (data.monthPlan) setMonthPlan(data.monthPlan);
        if (data.weeklyPlan) setWeeklyPlan(data.weeklyPlan);
        showToast('¡Días vacíos autocompletados con platos balanceados por Gemini!', 'success');
      }
    } catch (err) {
      showToast('Error al autocompletar con IA', 'error');
    } finally {
      setIsAutofilling(false);
    }
  };

  // Archive current weekly plan to history
  const handleArchiveCurrentPlan = async () => {
    try {
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: weeklyPlan.title || `Plan del ${weeklyPlan.startDate}`,
          startDate: weeklyPlan.startDate,
          endDate: weeklyPlan.endDate,
          tags: weeklyPlan.tags || ['Menú Semanal'],
          recipeCount: Object.values(weeklyPlan.days).reduce((acc, d) => acc + (d.lunch?.length || 0) + (d.dinner?.length || 0), 0),
          planData: weeklyPlan
        })
      });
      const data = await res.json();
      setHistory((prev) => [data, ...prev]);
      showToast('¡Plan semanal archivado en el historial!', 'success');
    } catch (err) {
      showToast('Error al archivar el plan', 'error');
    }
  };

  // Load plan from history
  const handleLoadPlan = async (archiveId: string) => {
    try {
      const res = await fetch(`/api/history/${archiveId}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.weeklyPlan) {
        setWeeklyPlan(data.weeklyPlan);
        showToast('¡Plan histórico restaurado en el Planificador Semanal!', 'success');
      }
    } catch (err) {
      showToast('Error al cargar plan histórico', 'error');
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
