import React, { useState, useEffect, useMemo } from 'react';
import {
  Sun,
  Moon,
  Plus,
  PlusCircle,
  Timer,
  Flame,
  Trash2,
  Sparkles,
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Share2,
  X,
  Search,
  FileDown,
  Printer,
  Check,
  CheckCircle2,
  Utensils,
  Eye,
  Users,
  Pencil
} from 'lucide-react';
import { WeeklyPlan, DayPlan, MealItem, Recipe, getRecipeCategories } from '../types';
import {
  SPANISH_MONTHS,
  getTodayISO,
  getCurrentWeekDates,
  formatWeekRange,
  parseISOLocal,
  addDaysToDate,
  getDayNameFromISO
} from '../utils/dateHelpers';
import { generateWeeklyMenuPdf } from '../utils/pdfExport';

interface WeeklyPlannerViewProps {
  plan: WeeklyPlan;
  recipes: Recipe[];
  categories?: string[];
  monthDays?: Record<string, DayPlan>;
  onUpdatePlan: (updatedPlan: WeeklyPlan) => void;
  onOpenAddRecipe: () => void;
  onOpenGenerateAI: () => void;
  onNavigateToMonthly: () => void;
  onEditRecipe?: (recipe: Recipe) => void;
}

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  plan,
  recipes,
  categories,
  monthDays,
  onUpdatePlan,
  onOpenAddRecipe,
  onOpenGenerateAI,
  onNavigateToMonthly,
  onEditRecipe,
}) => {
  // Fecha de referencia para la semana visualizada (por defecto la semana actual)
  const [weekRefDate, setWeekRefDate] = useState<Date>(() => {
    if (plan.startDate) {
      // Si proviene de la antigua semana fija de muestra (7 de septiembre), arrancar en la semana en curso
      if (plan.startDate === '2026-09-07') {
        return new Date();
      }
      return parseISOLocal(plan.startDate);
    }
    return new Date();
  });

  const weekDays = useMemo(() => getCurrentWeekDates(weekRefDate), [weekRefDate]);
  const weekStart = weekDays[0]?.date || getTodayISO();
  const weekEnd = weekDays[6]?.date || getTodayISO();
  const currentWeekTitle = `Semana del ${formatWeekRange(weekStart, weekEnd)}`;

  // Día seleccionado dentro de la semana
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayInWeek = weekDays.find((w) => w.isToday);
    return todayInWeek ? todayInWeek.date : weekDays[0]?.date || getTodayISO();
  });

  // Al cambiar de semana, sincronizar el día seleccionado
  useEffect(() => {
    const isSelectedInWeek = weekDays.some((w) => w.date === selectedDate);
    if (!isSelectedInWeek) {
      const todayInWeek = weekDays.find((w) => w.isToday);
      setSelectedDate(todayInWeek ? todayInWeek.date : weekDays[0]?.date || getTodayISO());
    }
  }, [weekDays, selectedDate]);

  const [quickAddModal, setQuickAddModal] = useState<{ open: boolean; slot: 'lunch' | 'dinner' } | null>(null);
  const [addModalCategoryFilter, setAddModalCategoryFilter] = useState<string>('Todas');
  const [modalSearchTerm, setModalSearchTerm] = useState<string>('');

  // Export to PDF / Print state
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [pdfSuccess, setPdfSuccess] = useState(false);

  // Full Recipe Detail Modal state
  const [selectedDetailMeal, setSelectedDetailMeal] = useState<{
    recipe: Recipe;
    slot: 'lunch' | 'dinner';
    mealId: string;
  } | null>(null);

  const handleOpenMealDetail = (meal: MealItem, slot: 'lunch' | 'dinner') => {
    // Look up the full recipe by recipeId or name in the user's recipes
    const found = recipes.find(
      (r) => (meal.recipeId && r.id === meal.recipeId) || r.name.toLowerCase() === meal.name.toLowerCase()
    );

    if (found) {
      setSelectedDetailMeal({
        recipe: found,
        slot,
        mealId: meal.id
      });
    } else {
      const fallbackRecipe: Recipe = {
        id: meal.recipeId || meal.id,
        name: meal.name,
        description: 'Receta registrada en el plan semanal.',
        category: meal.category || 'General',
        categories: meal.category ? [meal.category] : ['General'],
        timeMinutes: meal.timeMinutes || 20,
        calories: meal.calories || 350,
        servings: 1,
        difficulty: 'Fácil',
        tags: [],
        imageUrl: meal.imageUrl || '',
        ingredients: [],
        instructions: [],
        createdAt: new Date().toISOString()
      };
      setSelectedDetailMeal({
        recipe: fallbackRecipe,
        slot,
        mealId: meal.id
      });
    }
  };

  const handleOpenQuickAdd = (slot: 'lunch' | 'dinner') => {
    setAddModalCategoryFilter('Todas');
    setModalSearchTerm('');
    setQuickAddModal({ open: true, slot });
  };

  const monthIdx = selectedDate ? (parseInt(selectedDate.split('-')[1], 10) - 1) : new Date().getMonth();
  const currentMonthName = SPANISH_MONTHS[monthIdx] || 'este mes';

  const modalCategories = useMemo(() => {
    const set = new Set<string>();
    (categories || []).forEach((c) => {
      if (c && c.trim()) set.add(c.trim());
    });
    recipes.forEach((r) => {
      getRecipeCategories(r).forEach((c) => {
        if (c && c.trim()) set.add(c.trim());
      });
    });
    return ['Todas', ...Array.from(set)];
  }, [recipes, categories]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { Todas: recipes.length };
    recipes.forEach((r) => {
      const cats = getRecipeCategories(r);
      cats.forEach((cat) => {
        const trimmed = cat.trim();
        if (trimmed) {
          counts[trimmed] = (counts[trimmed] || 0) + 1;
        }
      });
    });
    return counts;
  }, [recipes]);

  const filteredModalRecipes = useMemo(() => {
    let result = recipes;
    if (addModalCategoryFilter && addModalCategoryFilter !== 'Todas') {
      const target = addModalCategoryFilter.trim().toLowerCase();
      result = result.filter((r) => {
        const cats = getRecipeCategories(r).map((c) => c.toLowerCase());
        return cats.includes(target);
      });
    }
    if (modalSearchTerm.trim()) {
      const q = modalSearchTerm.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          (r.description && r.description.toLowerCase().includes(q)) ||
          getRecipeCategories(r).some((c) => c.toLowerCase().includes(q)) ||
          r.ingredients?.some((ing) => ing.toLowerCase().includes(q))
      );
    }
    return result;
  }, [recipes, addModalCategoryFilter, modalSearchTerm]);

  // Obtener la información del día seleccionado
  const currentDay: DayPlan = plan.days[selectedDate] || monthDays?.[selectedDate] || {
    date: selectedDate,
    dayName: getDayNameFromISO(selectedDate),
    dayNumber: parseInt(selectedDate.split('-')[2] || '1', 10),
    breakfast: [],
    lunch: [],
    dinner: []
  };

  // Sincronizar fecha de referencia cuando plan.startDate cambia externamente
  useEffect(() => {
    if (plan.startDate && plan.startDate !== '2026-09-07') {
      const parsed = parseISOLocal(plan.startDate);
      setWeekRefDate((prev) => {
        const prevStart = getCurrentWeekDates(prev)[0]?.date;
        if (prevStart !== plan.startDate) {
          return parsed;
        }
        return prev;
      });
    }
  }, [plan.startDate]);

  const changeWeek = (newRef: Date, targetDateStr?: string) => {
    setWeekRefDate(newRef);
    const newWeekDays = getCurrentWeekDates(newRef);
    const newStart = newWeekDays[0]?.date || getTodayISO();
    const newEnd = newWeekDays[6]?.date || getTodayISO();
    const newTitle = `Semana del ${formatWeekRange(newStart, newEnd)}`;

    let newSelected = targetDateStr;
    if (!newSelected || !newWeekDays.some((w) => w.date === newSelected)) {
      const todayInWeek = newWeekDays.find((w) => w.isToday);
      newSelected = todayInWeek ? todayInWeek.date : newWeekDays[0]?.date || getTodayISO();
    }
    setSelectedDate(newSelected);

    const newDays = { ...plan.days };
    newWeekDays.forEach((d) => {
      if (!newDays[d.date]) {
        newDays[d.date] = {
          date: d.date,
          dayName: d.dayName,
          dayNumber: d.dayNumber,
          breakfast: [],
          lunch: [],
          dinner: []
        };
      }
    });

    onUpdatePlan({
      ...plan,
      startDate: newStart,
      endDate: newEnd,
      title: newTitle,
      days: newDays
    });
  };

  const handlePrevWeek = () => {
    changeWeek(addDaysToDate(weekRefDate, -7));
  };

  const handleNextWeek = () => {
    changeWeek(addDaysToDate(weekRefDate, 7));
  };

  const handleCurrentWeek = () => {
    changeWeek(new Date());
  };

  const handleDatePicked = (dateStr: string) => {
    if (!dateStr) return;
    const parsed = parseISOLocal(dateStr);
    changeWeek(parsed, dateStr);
  };

  const handleAddMealToSlot = (slot: 'lunch' | 'dinner', recipe: Recipe) => {
    const newMeal: MealItem = {
      id: `meal-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      recipeId: recipe.id,
      name: recipe.name,
      timeMinutes: recipe.timeMinutes,
      calories: recipe.calories,
      imageUrl: recipe.imageUrl,
      category: recipe.category
    };

    const updatedDays = {
      ...plan.days,
      [selectedDate]: {
        ...currentDay,
        [slot]: [...(currentDay[slot] || []), newMeal]
      }
    };

    onUpdatePlan({
      ...plan,
      startDate: weekStart,
      endDate: weekEnd,
      title: currentWeekTitle,
      days: updatedDays
    });
    setQuickAddModal(null);
  };

  const handleRemoveMeal = (slot: 'lunch' | 'dinner', mealId: string) => {
    const updatedDays = {
      ...plan.days,
      [selectedDate]: {
        ...currentDay,
        [slot]: (currentDay[slot] || []).filter((m) => m.id !== mealId)
      }
    };
    onUpdatePlan({
      ...plan,
      startDate: weekStart,
      endDate: weekEnd,
      title: currentWeekTitle,
      days: updatedDays
    });
  };

  const dayAbbrevMap: Record<string, string> = {
    Lunes: 'LUN',
    Martes: 'MAR',
    Miércoles: 'MIÉ',
    Jueves: 'JUE',
    Viernes: 'VIE',
    Sábado: 'SÁB',
    Domingo: 'DOM'
  };

  // Weekly stats for PDF export and printable summary
  const weeklyStats = useMemo(() => {
    let totalMeals = 0;
    let totalCaloriesAll = 0;
    let plannedDaysCount = 0;
    const uniqueMealsMap = new Map<string, { meal: MealItem; count: number }>();

    weekDays.forEach((wd) => {
      const d = plan.days[wd.date] || monthDays?.[wd.date];
      const dayMeals = [...(d?.breakfast || []), ...(d?.lunch || []), ...(d?.dinner || [])];
      if (dayMeals.length > 0) plannedDaysCount++;
      totalMeals += dayMeals.length;

      dayMeals.forEach((m) => {
        totalCaloriesAll += m.calories || 0;
        const existing = uniqueMealsMap.get(m.name);
        if (existing) {
          existing.count += 1;
        } else {
          uniqueMealsMap.set(m.name, { meal: m, count: 1 });
        }
      });
    });

    const avgDailyKcal = plannedDaysCount > 0 ? Math.round(totalCaloriesAll / plannedDaysCount) : 0;
    const uniqueMeals = Array.from(uniqueMealsMap.values());
    return { totalMeals, plannedDaysCount, avgDailyKcal, totalCaloriesAll, uniqueMeals };
  }, [weekDays, plan.days, monthDays]);

  const handleExportDirectPdf = () => {
    setIsGeneratingPdf(true);
    try {
      generateWeeklyMenuPdf({
        weekTitle: currentWeekTitle,
        weekStart,
        weekEnd,
        weekDays,
        planDays: plan.days
      });
      setPdfSuccess(true);
      setTimeout(() => setPdfSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrintSheet = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Day Scroller / Grid Header with Week Chooser & Navigation */}
      <div className="bg-white rounded-2xl p-4 md:p-5 shadow-xs border border-[#e1e3e4] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#0f5238]/10 text-[#0f5238]">
                <Calendar className="w-4 h-4" />
              </span>
              <h3 className="text-base md:text-lg font-bold text-[#191c1d] font-heading">
                {currentWeekTitle}
              </h3>
            </div>
            <p className="text-xs text-[#707973] mt-0.5">
              Organiza el almuerzo y la cena de cada día de la semana
            </p>
          </div>

          {/* Week Navigation Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-[#f3f4f5] rounded-xl p-0.5 border border-[#e1e3e4]">
              <button
                type="button"
                onClick={handlePrevWeek}
                title="Semana anterior"
                aria-label="Semana anterior"
                className="p-1.5 rounded-lg hover:bg-white text-[#191c1d] transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleCurrentWeek}
                className="px-2.5 py-1 text-xs font-semibold text-[#0f5238] hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Esta semana
              </button>
              <button
                type="button"
                onClick={handleNextWeek}
                title="Semana siguiente"
                aria-label="Semana siguiente"
                className="p-1.5 rounded-lg hover:bg-white text-[#191c1d] transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Week / Date Chooser */}
            <div className="flex items-center gap-1.5 bg-[#f3f4f5] px-2.5 py-1 rounded-xl border border-[#e1e3e4]">
              <label htmlFor="weekly-date-picker" className="text-[11px] font-bold text-[#404943] uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#0f5238]" />
                <span className="hidden sm:inline">Elegir semana:</span>
              </label>
              <input
                type="date"
                id="weekly-date-picker"
                value={selectedDate}
                onChange={(e) => handleDatePicked(e.target.value)}
                className="text-xs font-semibold text-[#191c1d] bg-transparent cursor-pointer focus:outline-none"
                title="Elegir fecha o semana específica"
              />
            </div>

            <button
              type="button"
              onClick={onNavigateToMonthly}
              className="text-xs font-semibold text-[#0f5238] bg-[#f3f4f5] hover:bg-[#e7e8e9] px-3 py-1.5 rounded-xl border border-[#e1e3e4] transition-colors flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Mes Completo</span>
              <span className="sm:hidden">Mes</span>
            </button>

            {/* Exportar a PDF Button */}
            <button
              type="button"
              onClick={() => setIsExportPdfModalOpen(true)}
              className="text-xs font-semibold text-white bg-[#0f5238] hover:bg-[#2d6a4f] px-3.5 py-1.5 rounded-xl border border-[#0f5238] transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-98"
              title="Exportar menú de la semana a PDF limpio para imprimir"
            >
              <FileDown className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Exportar a PDF</span>
            </button>
          </div>
        </div>

        {/* Horizontal Days Bar */}
        <div className="flex gap-2.5 md:gap-3 overflow-x-auto pb-1 custom-scrollbar">
          {weekDays.map((dayInfo) => {
            const dateKey = dayInfo.date;
            const dayData = plan.days[dateKey] || monthDays?.[dateKey] || {
              date: dateKey,
              dayName: dayInfo.dayName,
              dayNumber: dayInfo.dayNumber,
              breakfast: [],
              lunch: [],
              dinner: []
            };
            const isSelected = selectedDate === dateKey;
            const hasMeals = (dayData.lunch?.length > 0) || (dayData.dinner?.length > 0);

            return (
              <button
                key={dateKey}
                type="button"
                onClick={() => setSelectedDate(dateKey)}
                className={`flex-shrink-0 w-20 md:w-24 flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-[#0f5238] text-white shadow-md scale-102 ring-2 ring-[#0f5238] ring-offset-2'
                    : hasMeals
                    ? 'bg-[#f8f9fa] text-[#191c1d] border border-[#bfc9c1] hover:bg-[#edeeef]'
                    : 'bg-[#ffffff] text-[#707973] border border-dashed border-[#bfc9c1] hover:border-[#0f5238]'
                }`}
              >
                {dayInfo.isToday && (
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded-full mb-1 tracking-wider ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-[#0f5238]/15 text-[#0f5238]'
                  }`}>
                    Hoy
                  </span>
                )}
                <span className={`text-[11px] font-semibold uppercase tracking-wider mb-0.5 ${isSelected ? 'text-[#b1f0ce]' : 'text-[#707973]'}`}>
                  {dayAbbrevMap[dayInfo.dayName] || dayInfo.dayName.substring(0, 3)}
                </span>
                <span className="text-xl md:text-2xl font-bold font-heading">
                  {dayInfo.dayNumber}
                </span>
                {hasMeals && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f5238] mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meals Grid (Lunch & Dinner Columns - No Breakfast) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[520px]">
        {/* Lunch Column (Almuerzo) */}
        <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl shadow-xs border border-[#e1e3e4]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e1e3e4]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#fc8a40]/15 text-[#9b4500]">
                <Sun className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                  Almuerzo
                </h3>
                <span className="text-xs text-[#707973]">
                  {currentDay.dayName}, {currentDay.dayNumber} de {currentMonthName}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenQuickAdd('lunch')}
              className="text-xs font-semibold text-[#0f5238] hover:bg-[#b1f0ce]/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </div>

          {/* Meals list */}
          <div className="space-y-3 flex-1 flex flex-col justify-start">
            {currentDay.lunch && currentDay.lunch.length > 0 ? (
              currentDay.lunch.map((meal) => (
                <div
                  key={meal.id}
                  onClick={() => handleOpenMealDetail(meal, 'lunch')}
                  className="group relative bg-[#f8f9fa] hover:bg-white rounded-xl border border-[#e1e3e4] hover:border-[#0f5238] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMeal('lunch', meal.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/95 hover:bg-[#ffdad6] text-[#ba1a1a] shadow-xs hover:shadow-sm border border-[#e1e3e4] transition-all cursor-pointer flex items-center justify-center"
                    title="Eliminar plato de este día"
                    aria-label="Eliminar plato de este día"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {meal.imageUrl && (
                    <div className="relative w-full h-28 sm:h-36 overflow-hidden bg-[#e1e3e4]">
                      <div
                        className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-300"
                        style={{ backgroundImage: `url(${meal.imageUrl})` }}
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-semibold backdrop-blur-xs shadow-md">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver receta completa</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-extrabold text-base sm:text-sm text-[#191c1d] group-hover:text-[#0f5238] transition-colors truncate tracking-tight"
                        title={meal.name}
                      >
                        {meal.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[#707973] mt-1">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-[#0f5238]" />
                          {meal.timeMinutes}m
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-[#9b4500]" />
                          {meal.calories} kcal
                        </span>
                        {meal.category && (
                          <>
                            <span>•</span>
                            <span className="text-[#0f5238] font-medium">{meal.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMealDetail(meal, 'lunch');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0f5238]/10 hover:bg-[#0f5238] text-[#0f5238] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                        title="Ver receta completa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver receta</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMeal('lunch', meal.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#ffdad6] text-[#ba1a1a] transition-all cursor-pointer"
                        title="Eliminar plato"
                        aria-label="Eliminar plato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Empty Slot Dropzone */
              <button
                type="button"
                onClick={() => handleOpenQuickAdd('lunch')}
                className="flex-1 min-h-[180px] border-2 border-dashed border-[#bfc9c1] hover:border-[#0f5238] rounded-xl flex flex-col items-center justify-center text-[#707973] hover:text-[#0f5238] bg-[#f8f9fa]/60 hover:bg-[#b1f0ce]/10 transition-all cursor-pointer p-6 group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-6 h-6 text-[#0f5238]" />
                </div>
                <span className="font-semibold text-sm">Añadir Receta al Almuerzo</span>
                <span className="text-xs text-[#707973] mt-0.5">Elige del recetario o crea una con IA</span>
              </button>
            )}
          </div>
        </div>

        {/* Dinner Column (Cena) */}
        <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl shadow-xs border border-[#e1e3e4]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e1e3e4]">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-[#2d6a4f]/15 text-[#0f5238]">
                <Moon className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                  Cena
                </h3>
                <span className="text-xs text-[#707973]">
                  {currentDay.dayName}, {currentDay.dayNumber} de {currentMonthName}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleOpenQuickAdd('dinner')}
              className="text-xs font-semibold text-[#0f5238] hover:bg-[#b1f0ce]/30 px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </div>

          {/* Meals list */}
          <div className="space-y-3 flex-1 flex flex-col justify-start">
            {currentDay.dinner && currentDay.dinner.length > 0 ? (
              currentDay.dinner.map((meal) => (
                <div
                  key={meal.id}
                  onClick={() => handleOpenMealDetail(meal, 'dinner')}
                  className="group relative bg-[#f8f9fa] hover:bg-white rounded-xl border border-[#e1e3e4] hover:border-[#0f5238] overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMeal('dinner', meal.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/95 hover:bg-[#ffdad6] text-[#ba1a1a] shadow-xs hover:shadow-sm border border-[#e1e3e4] transition-all cursor-pointer flex items-center justify-center"
                    title="Eliminar plato de este día"
                    aria-label="Eliminar plato de este día"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {meal.imageUrl && (
                    <div className="relative w-full h-28 sm:h-36 overflow-hidden bg-[#e1e3e4]">
                      <div
                        className="bg-cover bg-center w-full h-full group-hover:scale-105 transition-transform duration-300"
                        style={{ backgroundImage: `url(${meal.imageUrl})` }}
                      />
                      <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 text-white text-xs font-semibold backdrop-blur-xs shadow-md">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver receta completa</span>
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4
                        className="font-extrabold text-base sm:text-sm text-[#191c1d] group-hover:text-[#0f5238] transition-colors truncate tracking-tight"
                        title={meal.name}
                      >
                        {meal.name}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-[#707973] mt-1">
                        <span className="flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-[#0f5238]" />
                          {meal.timeMinutes}m
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-[#9b4500]" />
                          {meal.calories} kcal
                        </span>
                        {meal.category && (
                          <>
                            <span>•</span>
                            <span className="text-[#0f5238] font-medium">{meal.category}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenMealDetail(meal, 'dinner');
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-[#0f5238]/10 hover:bg-[#0f5238] text-[#0f5238] hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
                        title="Ver receta completa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Ver receta</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMeal('dinner', meal.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-[#ffdad6] text-[#ba1a1a] transition-all cursor-pointer"
                        title="Eliminar plato"
                        aria-label="Eliminar plato"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Empty Slot Dropzone */
              <button
                type="button"
                onClick={() => handleOpenQuickAdd('dinner')}
                className="flex-1 min-h-[180px] border-2 border-dashed border-[#bfc9c1] hover:border-[#0f5238] rounded-xl flex flex-col items-center justify-center text-[#707973] hover:text-[#0f5238] bg-[#f8f9fa]/60 hover:bg-[#b1f0ce]/10 transition-all cursor-pointer p-6 group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-6 h-6 text-[#0f5238]" />
                </div>
                <span className="font-semibold text-sm">Añadir Receta a la Cena</span>
                <span className="text-xs text-[#707973] mt-0.5">Plato ligero, nutritivo o reconfortante</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Add Meal Modal - Responsive and optimized for Mobile */}
      {quickAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl border border-[#e1e3e4] flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3e4] gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg">
                    {quickAddModal.slot === 'lunch' ? '☀️' : '🌙'}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-[#191c1d] font-heading truncate">
                    Añadir al {quickAddModal.slot === 'lunch' ? 'Almuerzo' : 'Cena'}
                  </h3>
                </div>
                <p className="text-xs text-[#707973] truncate mt-0.5 capitalize">
                  {currentDay.dayName}, {currentDay.dayNumber} de {currentMonthName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddModal(null)}
                className="w-8 h-8 rounded-full bg-[#f3f4f5] hover:bg-[#e7e8e9] text-[#707973] hover:text-[#191c1d] flex items-center justify-center shrink-0 cursor-pointer transition-colors"
                aria-label="Cerrar ventana"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Actions (Create or AI) */}
            <div className="grid grid-cols-2 gap-2 pt-3 pb-2">
              <button
                type="button"
                onClick={() => {
                  setQuickAddModal(null);
                  onOpenAddRecipe();
                }}
                className="py-2 px-2.5 rounded-xl bg-[#f3f4f5] hover:bg-[#e7e8e9] text-xs font-semibold text-[#0f5238] flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
              >
                <Plus className="w-4 h-4 shrink-0" />
                <span className="truncate">Nueva Receta</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickAddModal(null);
                  onOpenGenerateAI();
                }}
                className="py-2 px-2.5 rounded-xl bg-[#ffdbc9]/60 hover:bg-[#ffdbc9] text-xs font-semibold text-[#9b4500] flex items-center justify-center gap-1.5 transition-colors cursor-pointer truncate"
              >
                <Sparkles className="w-4 h-4 shrink-0 text-[#fc8a40]" />
                <span className="truncate">Sugerir con IA</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="relative pt-1 pb-2">
              <Search className="w-4 h-4 text-[#707973] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={modalSearchTerm}
                onChange={(e) => setModalSearchTerm(e.target.value)}
                placeholder="Buscar en el recetario..."
                className="w-full pl-9 pr-8 py-2 text-xs bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238] focus:ring-1 focus:ring-[#0f5238]"
              />
              {modalSearchTerm && (
                <button
                  type="button"
                  onClick={() => setModalSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#707973] hover:text-[#191c1d]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Category Navigation Bar */}
            <div className="pt-1 pb-2">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[11px] font-bold text-[#404943] uppercase tracking-wider">
                  Categorías:
                </span>
                <span className="text-[11px] text-[#707973]">
                  {filteredModalRecipes.length} {filteredModalRecipes.length === 1 ? 'receta' : 'recetas'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 no-scrollbar touch-pan-x w-full">
                {modalCategories.map((cat) => {
                  const isSelected = addModalCategoryFilter === cat;
                  const count = categoryCounts[cat] ?? 0;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setAddModalCategoryFilter(cat)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-[#0f5238] text-white shadow-2xs'
                          : 'bg-[#f3f4f5] text-[#404943] hover:bg-[#e7e8e9] hover:text-[#191c1d]'
                      }`}
                    >
                      <span>{cat}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-[#e1e3e4] text-[#707973]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recipes Quick List */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1 custom-scrollbar min-h-0 pt-1">
              {filteredModalRecipes.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#707973] space-y-1">
                  <p className="font-semibold text-[#191c1d]">No se encontraron recetas</p>
                  <p className="text-[11px]">
                    {modalSearchTerm
                      ? `Ninguna receta coincide con "${modalSearchTerm}".`
                      : `No hay recetas en la categoría "${addModalCategoryFilter}".`}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAddModalCategoryFilter('Todas');
                      setModalSearchTerm('');
                    }}
                    className="mt-2 text-xs text-[#0f5238] font-bold hover:underline cursor-pointer"
                  >
                    Mostrar todas las recetas
                  </button>
                </div>
              ) : (
                filteredModalRecipes.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => handleAddMealToSlot(quickAddModal.slot, rec)}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#e1e3e4] hover:border-[#0f5238] hover:bg-[#b1f0ce]/10 cursor-pointer transition-all active:scale-[0.99] group"
                  >
                    <img
                      src={rec.imageUrl}
                      alt={rec.name}
                      className="w-12 h-12 sm:w-14 sm:h-14 rounded-lg object-cover border border-[#e1e3e4] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-[#191c1d] group-hover:text-[#0f5238] truncate transition-colors">
                        {rec.name}
                      </h4>
                      <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#707973] mt-0.5">
                        <span className="font-medium text-[#0f5238] truncate max-w-[140px]" title={getRecipeCategories(rec).join(', ')}>
                          {getRecipeCategories(rec).join(', ') || rec.category || 'General'}
                        </span>
                        <span>•</span>
                        <span>{rec.timeMinutes}m</span>
                        <span>•</span>
                        <span className="text-[#9b4500] font-medium">{rec.calories} kcal</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#0f5238] group-hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer shadow-2xs"
                    >
                      Elegir
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Clean Printable Sheet for window.print() and A4 Landscape printing */}
      <div id="printable-weekly-menu" className="hidden print:block p-6 bg-white text-[#191c1d]">
        <div className="border-b-2 border-[#0f5238] pb-4 mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-[#0f5238]">MENUMASTER</span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#707973] border-l border-[#bfc9c1] pl-2">
                Plan Semanal de Comidas
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#191c1d] mt-1">{currentWeekTitle}</h1>
          </div>
          <div className="text-right text-xs text-[#707973]">
            <p className="font-semibold text-[#0f5238]">
              {weeklyStats.totalMeals} platos planificados • {weeklyStats.avgDailyKcal > 0 ? `~${weeklyStats.avgDailyKcal} kcal/día` : 'N/A'}
            </p>
            <p className="mt-0.5">Impreso: {new Date().toLocaleDateString('es-ES')}</p>
          </div>
        </div>

        {/* 7-Day Matrix Table */}
        <table className="w-full border-collapse border border-[#bfc9c1] text-xs">
          <thead>
            <tr className="bg-[#0f5238] text-white">
              <th className="p-2 border border-[#bfc9c1] text-center w-24">Comida</th>
              {weekDays.map((wd) => (
                <th key={wd.date} className="p-2 border border-[#bfc9c1] text-center">
                  <span className="block font-bold uppercase">{wd.dayName}</span>
                  <span className="text-[11px] font-normal opacity-90">{wd.dayNumber}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Almuerzo */}
            <tr className="border-b border-[#bfc9c1]">
              <td className="p-2 font-bold bg-[#f8f9fa] border border-[#bfc9c1] text-center text-[#0f5238]">
                Almuerzo
              </td>
              {weekDays.map((wd) => {
                const d = plan.days[wd.date] || monthDays?.[wd.date];
                const meals = d?.lunch || [];
                return (
                  <td key={wd.date} className="p-2 border border-[#bfc9c1] align-top">
                    {meals.length === 0 ? (
                      <span className="text-[#707973] italic text-[11px]">—</span>
                    ) : (
                      <div className="space-y-1.5">
                        {meals.map((m) => (
                          <div key={m.id} className="leading-tight">
                            <p className="font-bold text-[#191c1d]">{m.name}</p>
                            <p className="text-[10px] text-[#707973]">
                              {m.calories ? `${m.calories} kcal` : ''} {m.timeMinutes ? `• ${m.timeMinutes}m` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Cena */}
            <tr className="border-b border-[#bfc9c1]">
              <td className="p-2 font-bold bg-[#f8f9fa] border border-[#bfc9c1] text-center text-[#0f5238]">
                Cena
              </td>
              {weekDays.map((wd) => {
                const d = plan.days[wd.date] || monthDays?.[wd.date];
                const meals = d?.dinner || [];
                return (
                  <td key={wd.date} className="p-2 border border-[#bfc9c1] align-top">
                    {meals.length === 0 ? (
                      <span className="text-[#707973] italic text-[11px]">—</span>
                    ) : (
                      <div className="space-y-1.5">
                        {meals.map((m) => (
                          <div key={m.id} className="leading-tight">
                            <p className="font-bold text-[#191c1d]">{m.name}</p>
                            <p className="text-[10px] text-[#707973]">
                              {m.calories ? `${m.calories} kcal` : ''} {m.timeMinutes ? `• ${m.timeMinutes}m` : ''}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>

            {/* Total Kcal */}
            <tr className="bg-[#b1f0ce]/20 font-bold">
              <td className="p-2 border border-[#bfc9c1] text-center text-[#0f5238]">
                Total Kcal
              </td>
              {weekDays.map((wd) => {
                const d = plan.days[wd.date] || monthDays?.[wd.date];
                const dayKcal =
                  (d?.breakfast || []).reduce((acc, m) => acc + (m.calories || 0), 0) +
                  (d?.lunch || []).reduce((acc, m) => acc + (m.calories || 0), 0) +
                  (d?.dinner || []).reduce((acc, m) => acc + (m.calories || 0), 0);
                return (
                  <td key={wd.date} className="p-2 border border-[#bfc9c1] text-center text-[#9b4500]">
                    {dayKcal > 0 ? `${dayKcal} kcal` : '—'}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>

        <div className="mt-4 pt-3 border-t border-[#bfc9c1] flex items-center justify-between text-[10px] text-[#707973]">
          <span>MenuMaster • Diseñado para una alimentación sana, organizada y variada.</span>
          <span>Impresión directa de alta calidad</span>
        </div>
      </div>

      {/* Export to PDF / Print Preview Modal */}
      {isExportPdfModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 no-print">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-[#e1e3e4] flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-[#0f5238]/10 text-[#0f5238]">
                  <FileDown className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-[#191c1d] font-heading">
                    Exportar Menú Semanal a PDF
                  </h3>
                  <p className="text-xs text-[#707973]">
                    {currentWeekTitle} • Formato limpio y organizado listo para imprimir
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExportPdfModalOpen(false)}
                className="p-1.5 rounded-lg text-[#707973] hover:text-[#191c1d] hover:bg-[#edeeef] cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Preview Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar bg-[#f8f9fa]">
              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="p-3 bg-white rounded-xl border border-[#e1e3e4] text-center">
                  <span className="text-[10px] font-bold text-[#707973] uppercase tracking-wider block">
                    Platos Planificados
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#0f5238]">
                    {weeklyStats.totalMeals} comidas
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#e1e3e4] text-center">
                  <span className="text-[10px] font-bold text-[#707973] uppercase tracking-wider block">
                    Días con Menú
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#191c1d]">
                    {weeklyStats.plannedDaysCount} de 7 días
                  </span>
                </div>
                <div className="p-3 bg-white rounded-xl border border-[#e1e3e4] text-center">
                  <span className="text-[10px] font-bold text-[#707973] uppercase tracking-wider block">
                    Promedio Diario
                  </span>
                  <span className="text-base sm:text-lg font-bold text-[#9b4500]">
                    {weeklyStats.avgDailyKcal > 0 ? `${weeklyStats.avgDailyKcal} kcal` : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Visual Sheet Preview Box */}
              <div className="bg-white p-4 sm:p-5 rounded-xl border border-[#bfc9c1] shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-[#e1e3e4] pb-2.5">
                  <span className="text-xs font-bold text-[#0f5238] uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="w-4 h-4" />
                    Vista Previa de la Plantilla de Impresión
                  </span>
                  <span className="text-[11px] text-[#707973] hidden sm:inline">
                    Hoja A4 Horizontal organizada
                  </span>
                </div>

                <div className="overflow-x-auto pb-2 custom-scrollbar">
                  <div className="min-w-[640px] grid grid-cols-7 gap-2">
                    {weekDays.map((wd) => {
                      const d = plan.days[wd.date] || monthDays?.[wd.date];
                      const lunches = d?.lunch || [];
                      const dinners = d?.dinner || [];
                      const dayKcal =
                        (d?.breakfast || []).reduce((acc, m) => acc + (m.calories || 0), 0) +
                        lunches.reduce((acc, m) => acc + (m.calories || 0), 0) +
                        dinners.reduce((acc, m) => acc + (m.calories || 0), 0);

                      return (
                        <div
                          key={wd.date}
                          className="bg-[#f8f9fa] rounded-xl border border-[#e1e3e4] p-2.5 flex flex-col justify-between space-y-2"
                        >
                          {/* Day Header */}
                          <div className="text-center pb-1.5 border-b border-[#e1e3e4]">
                            <span className="text-xs font-extrabold text-[#0f5238] block uppercase">
                              {wd.dayName}
                            </span>
                            <span className="text-[11px] text-[#707973] font-semibold">
                              {wd.dayNumber}
                            </span>
                          </div>

                          {/* Almuerzo */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#0f5238] uppercase tracking-wider block">
                              Almuerzo
                            </span>
                            {lunches.length === 0 ? (
                              <p className="text-[11px] text-[#707973] italic">Sin planificar</p>
                            ) : (
                              lunches.map((m) => (
                                <div key={m.id} className="bg-white p-1.5 rounded-lg border border-[#e1e3e4] text-[11px]">
                                  <p className="font-bold text-[#191c1d] leading-tight line-clamp-2">{m.name}</p>
                                  <p className="text-[10px] text-[#9b4500] font-medium mt-0.5">{m.calories} kcal</p>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Cena */}
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-[#0f5238] uppercase tracking-wider block">
                              Cena
                            </span>
                            {dinners.length === 0 ? (
                              <p className="text-[11px] text-[#707973] italic">Sin planificar</p>
                            ) : (
                              dinners.map((m) => (
                                <div key={m.id} className="bg-white p-1.5 rounded-lg border border-[#e1e3e4] text-[11px]">
                                  <p className="font-bold text-[#191c1d] leading-tight line-clamp-2">{m.name}</p>
                                  <p className="text-[10px] text-[#9b4500] font-medium mt-0.5">{m.calories} kcal</p>
                                </div>
                              ))
                            )}
                          </div>

                          {/* Total Day Kcal */}
                          <div className="pt-1.5 border-t border-[#e1e3e4] text-center">
                            <span className="text-[10px] font-bold text-[#707973]">
                              Total: <strong className="text-[#9b4500]">{dayKcal > 0 ? `${dayKcal} kcal` : '—'}</strong>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Unique Dishes Summary for the week */}
              {weeklyStats.uniqueMeals.length > 0 && (
                <div className="p-3.5 bg-white rounded-xl border border-[#e1e3e4] space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#191c1d]">
                    <Utensils className="w-3.5 h-3.5 text-[#0f5238]" />
                    <span>Recetas programadas esta semana ({weeklyStats.uniqueMeals.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {weeklyStats.uniqueMeals.map(({ meal, count }) => (
                      <span
                        key={meal.name}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-[#f8f9fa] border border-[#bfc9c1] text-[#191c1d]"
                      >
                        <span className="font-medium">{meal.name}</span>
                        {count > 1 && (
                          <span className="px-1 py-0.2 rounded bg-[#0f5238] text-white text-[10px] font-bold">
                            x{count}
                          </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback Success Message */}
              {pdfSuccess && (
                <div className="p-3 bg-[#b1f0ce]/40 border border-[#0f5238]/30 rounded-xl text-xs font-semibold text-[#0f5238] flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#0f5238]" />
                  <span>¡PDF generado y descargado correctamente en tu dispositivo!</span>
                </div>
              )}
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 sm:p-5 border-t border-[#e1e3e4] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              <span className="text-[11px] text-[#707973] text-center sm:text-left">
                Elige descargar el archivo PDF directo o usar el cuadro de diálogo para imprimir en papel.
              </span>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsExportPdfModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#707973] hover:text-[#191c1d] hover:bg-[#edeeef] transition-colors cursor-pointer"
                >
                  Cerrar
                </button>

                <button
                  type="button"
                  onClick={handlePrintSheet}
                  className="px-4 py-2.5 bg-white hover:bg-[#f3f4f5] text-[#191c1d] border border-[#bfc9c1] rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition-all active:scale-98"
                  title="Abrir ventana de impresión del navegador"
                >
                  <Printer className="w-4 h-4 text-[#404943]" />
                  <span>Imprimir</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportDirectPdf}
                  disabled={isGeneratingPdf}
                  className="px-5 py-2.5 bg-[#0f5238] hover:bg-[#2d6a4f] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-all active:scale-98 disabled:opacity-60"
                  title="Descargar archivo PDF estructurado"
                >
                  {isGeneratingPdf ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Generando PDF...</span>
                    </>
                  ) : (
                    <>
                      <FileDown className="w-4 h-4 stroke-[2.5]" />
                      <span>Descargar PDF</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Recipe Detail Modal */}
      {selectedDetailMeal && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150 no-print"
          onClick={() => setSelectedDetailMeal(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-[#e1e3e4] overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Image or Banner */}
            <div className="relative shrink-0">
              {selectedDetailMeal.recipe.imageUrl ? (
                <div className="relative h-48 sm:h-60 w-full overflow-hidden bg-[#e1e3e4]">
                  <img
                    src={selectedDetailMeal.recipe.imageUrl}
                    alt={selectedDetailMeal.recipe.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/25 to-transparent" />
                </div>
              ) : (
                <div className="h-28 sm:h-32 bg-linear-to-br from-[#0f5238] to-[#1e4d3b] p-6 relative flex items-center">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                    <Utensils className="w-6 h-6" />
                  </div>
                </div>
              )}

              {/* Meal Slot Badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/95 backdrop-blur-xs text-[#0f5238] font-bold text-xs shadow-md border border-[#e1e3e4]">
                {selectedDetailMeal.slot === 'lunch' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#9b4500]" />
                    <span>Almuerzo</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#0f5238]" />
                    <span>Cena</span>
                  </>
                )}
                <span className="text-[#707973] font-normal">• {currentDay.dayName} {currentDay.dayNumber}</span>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setSelectedDetailMeal(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-[#191c1d] flex items-center justify-center shadow-md transition-colors cursor-pointer"
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Recipe Title & Categories (on overlay if image) */}
              {selectedDetailMeal.recipe.imageUrl && (
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {getRecipeCategories(selectedDetailMeal.recipe).map((cat) => (
                      <span
                        key={cat}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/20 backdrop-blur-xs text-white border border-white/30"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold font-heading leading-tight drop-shadow-xs">
                    {selectedDetailMeal.recipe.name}
                  </h2>
                </div>
              )}
            </div>

            {/* Scrollable Content */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              {/* If no image, show title & categories here */}
              {!selectedDetailMeal.recipe.imageUrl && (
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {getRecipeCategories(selectedDetailMeal.recipe).map((cat) => (
                      <span
                        key={cat}
                        className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#b1f0ce]/40 text-[#0f5238] border border-[#0f5238]/20"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-heading text-[#191c1d]">
                    {selectedDetailMeal.recipe.name}
                  </h2>
                </div>
              )}

              {/* Description if present */}
              {selectedDetailMeal.recipe.description && (
                <p className="text-xs sm:text-sm text-[#404943] leading-relaxed italic bg-[#f8f9fa] p-3 rounded-xl border border-[#e1e3e4]">
                  "{selectedDetailMeal.recipe.description}"
                </p>
              )}

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#b1f0ce]/40 flex items-center justify-center text-[#0f5238] shrink-0">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#707973] block truncate">Tiempo</span>
                    <span className="text-xs font-bold text-[#191c1d] truncate block">{selectedDetailMeal.recipe.timeMinutes} min</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#ffdad6]/40 flex items-center justify-center text-[#9b4500] shrink-0">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#707973] block truncate">Calorías</span>
                    <span className="text-xs font-bold text-[#191c1d] truncate block">{selectedDetailMeal.recipe.calories} kcal</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#f3f4f5] flex items-center justify-center text-[#404943] shrink-0">
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#707973] block truncate">Porciones</span>
                    <span className="text-xs font-bold text-[#191c1d] truncate block">{selectedDetailMeal.recipe.servings || 1} rac.</span>
                  </div>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#e1e3e4]/60 flex items-center justify-center text-[#0f5238] shrink-0">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-[#707973] block truncate">Dificultad</span>
                    <span className="text-xs font-bold text-[#191c1d] truncate block">{selectedDetailMeal.recipe.difficulty || 'Fácil'}</span>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#0f5238]" />
                  <span>Ingredientes ({selectedDetailMeal.recipe.ingredients?.length || 0})</span>
                </h3>
                {selectedDetailMeal.recipe.ingredients && selectedDetailMeal.recipe.ingredients.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#191c1d]">
                    {selectedDetailMeal.recipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-[#f8f9fa] p-2.5 rounded-lg border border-[#e1e3e4]/70">
                        <Check className="w-3.5 h-3.5 text-[#0f5238] mt-0.5 shrink-0" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#707973] italic bg-[#f8f9fa] p-3 rounded-lg border border-[#e1e3e4]/60">
                    No hay lista detallada de ingredientes para esta receta.
                  </p>
                )}
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#0f5238]" />
                  <span>Pasos de Preparación</span>
                </h3>
                {selectedDetailMeal.recipe.instructions && selectedDetailMeal.recipe.instructions.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedDetailMeal.recipe.instructions.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]/70">
                        <span className="w-5 h-5 rounded-full bg-[#0f5238] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs sm:text-sm text-[#191c1d] leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#707973] italic bg-[#f8f9fa] p-3 rounded-lg border border-[#e1e3e4]/60">
                    No hay pasos de preparación detallados registrados.
                  </p>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-[#f8f9fa] border-t border-[#e1e3e4] flex items-center justify-between gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const mealId = selectedDetailMeal.mealId;
                  const slot = selectedDetailMeal.slot;
                  setSelectedDetailMeal(null);
                  handleRemoveMeal(slot, mealId);
                }}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-[#ba1a1a] hover:bg-[#ffdad6]/60 transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Quitar receta del menú de este día"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Quitar de este día</span>
              </button>

              <div className="flex items-center gap-2">
                {onEditRecipe && (
                  <button
                    type="button"
                    onClick={() => {
                      const rec = selectedDetailMeal.recipe;
                      setSelectedDetailMeal(null);
                      onEditRecipe(rec);
                    }}
                    className="px-3.5 py-2 bg-white hover:bg-[#b1f0ce]/30 text-[#0f5238] border border-[#bfc9c1] hover:border-[#0f5238] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar receta</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSelectedDetailMeal(null)}
                  className="px-5 py-2 bg-[#0f5238] hover:bg-[#2d6a4f] text-white rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-98"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
