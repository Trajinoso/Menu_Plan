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
  Share2
} from 'lucide-react';
import { WeeklyPlan, DayPlan, MealItem, Recipe } from '../types';
import {
  SPANISH_MONTHS,
  getTodayISO,
  getCurrentWeekDates,
  formatWeekRange,
  parseISOLocal,
  addDaysToDate,
  getDayNameFromISO
} from '../utils/dateHelpers';

interface WeeklyPlannerViewProps {
  plan: WeeklyPlan;
  recipes: Recipe[];
  categories?: string[];
  monthDays?: Record<string, DayPlan>;
  onUpdatePlan: (updatedPlan: WeeklyPlan) => void;
  onOpenAddRecipe: () => void;
  onOpenGenerateAI: () => void;
  onNavigateToMonthly: () => void;
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

  const monthIdx = selectedDate ? (parseInt(selectedDate.split('-')[1], 10) - 1) : new Date().getMonth();
  const currentMonthName = SPANISH_MONTHS[monthIdx] || 'este mes';

  const modalCategories = useMemo(() => {
    const cats = Array.from(
      new Set([...(categories || []), ...recipes.map((r) => r.category).filter(Boolean)])
    );
    return ['Todas', ...cats];
  }, [recipes, categories]);

  const filteredModalRecipes = useMemo(() => {
    if (addModalCategoryFilter === 'Todas') return recipes;
    return recipes.filter((r) => r.category === addModalCategoryFilter);
  }, [recipes, addModalCategoryFilter]);

  // Obtener la información del día seleccionado
  const currentDay: DayPlan = plan.days[selectedDate] || monthDays?.[selectedDate] || {
    date: selectedDate,
    dayName: getDayNameFromISO(selectedDate),
    dayNumber: parseInt(selectedDate.split('-')[2] || '1', 10),
    breakfast: [],
    lunch: [],
    dinner: []
  };

  const handlePrevWeek = () => {
    setWeekRefDate((prev) => addDaysToDate(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekRefDate((prev) => addDaysToDate(prev, 7));
  };

  const handleCurrentWeek = () => {
    setWeekRefDate(new Date());
  };

  const handleDatePicked = (dateStr: string) => {
    if (!dateStr) return;
    const parsed = parseISOLocal(dateStr);
    setWeekRefDate(parsed);
    setSelectedDate(dateStr);
  };

  const handleAddMealToSlot = (slot: 'lunch' | 'dinner', recipe: Recipe) => {
    const newMeal: MealItem = {
      id: `meal-${Date.now()}`,
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
            <div className="flex items-center">
              <input
                type="date"
                id="weekly-date-picker"
                value={selectedDate}
                onChange={(e) => handleDatePicked(e.target.value)}
                className="text-xs font-medium text-[#191c1d] bg-[#f3f4f5] hover:bg-[#e7e8e9] border border-[#e1e3e4] rounded-xl px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#0f5238]"
                title="Elegir fecha o semana específica"
              />
            </div>

            <button
              type="button"
              onClick={onNavigateToMonthly}
              className="text-xs font-semibold text-[#0f5238] bg-[#f3f4f5] hover:bg-[#e7e8e9] px-3 py-1.5 rounded-xl border border-[#e1e3e4] transition-colors flex items-center gap-1.5 cursor-pointer ml-auto md:ml-0"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Ver Mes Completo</span>
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
              onClick={() => {
                setAddModalCategoryFilter('Todas');
                setQuickAddModal({ open: true, slot: 'lunch' });
              }}
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
                  className="group relative bg-[#f8f9fa] rounded-xl border border-[#e1e3e4] overflow-hidden shadow-2xs hover:shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMeal('lunch', meal.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/95 hover:bg-white text-[#ba1a1a] shadow-xs hover:shadow-sm border border-[#e1e3e4] transition-all cursor-pointer flex items-center justify-center"
                    title="Eliminar plato"
                    aria-label="Eliminar plato"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {meal.imageUrl && (
                    <div
                      className="bg-cover bg-center w-full h-36"
                      style={{ backgroundImage: `url(${meal.imageUrl})` }}
                    />
                  )}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-[#191c1d] truncate" title={meal.name}>
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
                    <button
                      type="button"
                      onClick={() => handleRemoveMeal('lunch', meal.id)}
                      className="shrink-0 p-1.5 rounded-md hover:bg-[#ffdad6] text-[#ba1a1a] transition-all cursor-pointer"
                      title="Eliminar plato"
                      aria-label="Eliminar plato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Empty Slot Dropzone */
              <button
                type="button"
                onClick={() => {
                  setAddModalCategoryFilter('Todas');
                  setQuickAddModal({ open: true, slot: 'lunch' });
                }}
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
              onClick={() => {
                setAddModalCategoryFilter('Todas');
                setQuickAddModal({ open: true, slot: 'dinner' });
              }}
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
                  className="group relative bg-[#f8f9fa] rounded-xl border border-[#e1e3e4] overflow-hidden shadow-2xs hover:shadow-sm transition-all"
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveMeal('dinner', meal.id);
                    }}
                    className="absolute top-2 right-2 z-10 p-1.5 rounded-lg bg-white/95 hover:bg-white text-[#ba1a1a] shadow-xs hover:shadow-sm border border-[#e1e3e4] transition-all cursor-pointer flex items-center justify-center"
                    title="Eliminar plato"
                    aria-label="Eliminar plato"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {meal.imageUrl && (
                    <div
                      className="bg-cover bg-center w-full h-36"
                      style={{ backgroundImage: `url(${meal.imageUrl})` }}
                    />
                  )}
                  <div className="p-3.5 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm text-[#191c1d] truncate" title={meal.name}>
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
                    <button
                      type="button"
                      onClick={() => handleRemoveMeal('dinner', meal.id)}
                      className="shrink-0 p-1.5 rounded-md hover:bg-[#ffdad6] text-[#ba1a1a] transition-all cursor-pointer"
                      title="Eliminar plato"
                      aria-label="Eliminar plato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Empty Slot Dropzone */
              <button
                type="button"
                onClick={() => {
                  setAddModalCategoryFilter('Todas');
                  setQuickAddModal({ open: true, slot: 'dinner' });
                }}
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

      {/* Quick Add Meal Modal */}
      {quickAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#e1e3e4] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-[#e1e3e4]">
              <div>
                <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                  Añadir al {quickAddModal.slot === 'lunch' ? 'Almuerzo' : 'Cena'}
                </h3>
                <p className="text-xs text-[#707973]">
                  {currentDay.dayName}, {currentDay.dayNumber} de {currentMonthName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQuickAddModal(null)}
                className="text-[#707973] hover:text-[#191c1d] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setQuickAddModal(null);
                  onOpenAddRecipe();
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-[#f3f4f5] hover:bg-[#e7e8e9] text-xs font-semibold text-[#0f5238] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Nueva Receta</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setQuickAddModal(null);
                  onOpenGenerateAI();
                }}
                className="flex-1 py-2 px-3 rounded-lg bg-[#ffdbc9] hover:bg-[#fc8a40] hover:text-white text-xs font-semibold text-[#9b4500] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Sugerir con IA</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-xs font-bold text-[#404943] uppercase tracking-wider">
                Filtrar por Categoría:
              </p>
              <span className="text-[11px] text-[#707973]">
                {filteredModalRecipes.length} {filteredModalRecipes.length === 1 ? 'receta' : 'recetas'}
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 custom-scrollbar">
              {modalCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setAddModalCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    addModalCategoryFilter === cat
                      ? 'bg-[#0f5238] text-white shadow-2xs'
                      : 'bg-[#f3f4f5] text-[#404943] hover:bg-[#e7e8e9]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Recipes Quick List */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1 custom-scrollbar">
              {filteredModalRecipes.length === 0 ? (
                <div className="text-center py-8 text-xs text-[#707973] italic">
                  No hay recetas disponibles en la categoría "{addModalCategoryFilter}".
                </div>
              ) : (
                filteredModalRecipes.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => handleAddMealToSlot(quickAddModal.slot, rec)}
                    className="flex items-center gap-3 p-2.5 rounded-xl border border-[#e1e3e4] hover:border-[#0f5238] hover:bg-[#b1f0ce]/10 cursor-pointer transition-all"
                  >
                    <img
                      src={rec.imageUrl}
                      alt={rec.name}
                      className="w-14 h-14 rounded-lg object-cover border border-[#e1e3e4] shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-[#191c1d] truncate">
                        {rec.name}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-[#707973]">
                        <span className="font-medium text-[#0f5238]">{rec.category}</span>
                        <span>•</span>
                        <span>{rec.timeMinutes}m</span>
                        <span>•</span>
                        <span className="text-[#9b4500] font-medium">{rec.calories} kcal</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1.5 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
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
    </div>
  );
};
