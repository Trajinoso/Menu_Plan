import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Coffee,
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
import { SPANISH_MONTHS, getTodayISO } from '../utils/dateHelpers';

interface WeeklyPlannerViewProps {
  plan: WeeklyPlan;
  recipes: Recipe[];
  onUpdatePlan: (updatedPlan: WeeklyPlan) => void;
  onOpenAddRecipe: () => void;
  onOpenGenerateAI: () => void;
  onNavigateToMonthly: () => void;
}

export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  plan,
  recipes,
  onUpdatePlan,
  onOpenAddRecipe,
  onOpenGenerateAI,
  onNavigateToMonthly,
}) => {
  const dayKeys = Object.keys(plan.days || {});
  const [selectedDate, setSelectedDate] = useState<string>(() => dayKeys[0] || getTodayISO());
  const [quickAddModal, setQuickAddModal] = useState<{ open: boolean; slot: 'lunch' | 'dinner' | 'breakfast' } | null>(null);

  const monthIdx = selectedDate ? (parseInt(selectedDate.split('-')[1], 10) - 1) : new Date().getMonth();
  const currentMonthName = SPANISH_MONTHS[monthIdx] || 'este mes';

  const currentDay: DayPlan = plan.days[selectedDate] || {
    date: selectedDate,
    dayName: 'Lunes',
    dayNumber: 12,
    breakfast: [],
    lunch: [],
    dinner: []
  };

  const handleAddMealToSlot = (slot: 'lunch' | 'dinner' | 'breakfast', recipe: Recipe) => {
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
      days: updatedDays
    });
    setQuickAddModal(null);
  };

  const handleRemoveMeal = (slot: 'lunch' | 'dinner' | 'breakfast', mealId: string) => {
    const updatedDays = {
      ...plan.days,
      [selectedDate]: {
        ...currentDay,
        [slot]: currentDay[slot].filter(m => m.id !== mealId)
      }
    };
    onUpdatePlan({
      ...plan,
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
      {/* Day Scroller / Grid Header */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-[#e1e3e4]">
        <div className="flex items-center justify-between mb-3 px-1">
          <div>
            <h3 className="text-base font-bold text-[#191c1d] font-heading">
              {plan.title || 'Planificador Semanal'}
            </h3>
            <p className="text-xs text-[#707973]">
              Selecciona un día para organizar el almuerzo y la cena
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToMonthly}
              className="text-xs font-semibold text-[#0f5238] bg-[#f3f4f5] hover:bg-[#e7e8e9] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Ver Mes Completo</span>
            </button>
          </div>
        </div>

        {/* Horizontal Days Bar */}
        <div className="flex gap-2.5 md:gap-4 overflow-x-auto pb-2 custom-scrollbar">
          {dayKeys.map((dateKey) => {
            const day = plan.days[dateKey];
            const isSelected = selectedDate === dateKey;
            const hasMeals = (day.breakfast?.length > 0) || (day.lunch?.length > 0) || (day.dinner?.length > 0);

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`flex-shrink-0 w-20 md:w-24 flex flex-col items-center justify-center p-3 rounded-xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#0f5238] text-white shadow-md scale-102 ring-2 ring-[#0f5238] ring-offset-2'
                    : hasMeals
                    ? 'bg-[#f8f9fa] text-[#191c1d] border border-[#bfc9c1] hover:bg-[#edeeef]'
                    : 'bg-[#ffffff] text-[#707973] border border-dashed border-[#bfc9c1] hover:border-[#0f5238]'
                }`}
              >
                <span className={`text-[11px] font-semibold uppercase tracking-wider mb-1 ${isSelected ? 'text-[#b1f0ce]' : 'text-[#707973]'}`}>
                  {dayAbbrevMap[day.dayName] || day.dayName.substring(0, 3)}
                </span>
                <span className="text-xl md:text-2xl font-bold font-heading">
                  {day.dayNumber}
                </span>
                {hasMeals && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0f5238] mt-1" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Meals Grid (Breakfast, Lunch & Dinner Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[520px]">
        {/* Breakfast Column (Desayuno) */}
        <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl shadow-xs border border-[#e1e3e4]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e1e3e4]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#f9a825]/15 text-[#b26a00]">
                <Coffee className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                  Desayuno
                </h3>
                <span className="text-xs text-[#707973]">
                  {currentDay.dayName}, {currentDay.dayNumber} de {currentMonthName}
                </span>
              </div>
            </div>
            <button
              onClick={() => setQuickAddModal({ open: true, slot: 'breakfast' })}
              className="text-xs font-semibold text-[#0f5238] hover:bg-[#b1f0ce]/30 p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </div>

          {/* Meals list */}
          <div className="space-y-3 flex-1 flex flex-col justify-start">
            {currentDay.breakfast && currentDay.breakfast.length > 0 ? (
              currentDay.breakfast.map((meal) => (
                <div
                  key={meal.id}
                  className="group relative bg-[#f8f9fa] rounded-xl border border-[#e1e3e4] overflow-hidden shadow-2xs hover:shadow-sm transition-all"
                >
                  {meal.imageUrl && (
                    <div
                      className="bg-cover bg-center w-full h-32"
                      style={{ backgroundImage: `url(${meal.imageUrl})` }}
                    />
                  )}
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-[#191c1d] truncate">
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
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMeal('breakfast', meal.id)}
                      className="opacity-60 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#ffdad6] text-[#ba1a1a] transition-all cursor-pointer"
                      title="Eliminar plato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Empty Slot Dropzone */
              <button
                onClick={() => setQuickAddModal({ open: true, slot: 'breakfast' })}
                className="flex-1 min-h-[160px] border-2 border-dashed border-[#bfc9c1] hover:border-[#0f5238] rounded-xl flex flex-col items-center justify-center text-[#707973] hover:text-[#0f5238] bg-[#f8f9fa]/60 hover:bg-[#b1f0ce]/10 transition-all cursor-pointer p-6 group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-6 h-6 text-[#0f5238]" />
                </div>
                <span className="font-semibold text-sm">Añadir Receta al Desayuno</span>
                <span className="text-xs text-[#707973] mt-0.5">Café, tostadas, bowls, fruta...</span>
              </button>
            )}
          </div>
        </div>

        {/* Lunch Column (Almuerzo) */}
        <div className="flex flex-col gap-3 bg-white p-5 rounded-2xl shadow-xs border border-[#e1e3e4]">
          <div className="flex items-center justify-between pb-3 border-b border-[#e1e3e4]">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#fc8a40]/15 text-[#9b4500]">
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
              onClick={() => setQuickAddModal({ open: true, slot: 'lunch' })}
              className="text-xs font-semibold text-[#0f5238] hover:bg-[#b1f0ce]/30 p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
                  {meal.imageUrl && (
                    <div
                      className="bg-cover bg-center w-full h-32"
                      style={{ backgroundImage: `url(${meal.imageUrl})` }}
                    />
                  )}
                  <div className="p-3.5 flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-sm text-[#191c1d] truncate">
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
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveMeal('lunch', meal.id)}
                      className="opacity-60 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#ffdad6] text-[#ba1a1a] transition-all cursor-pointer"
                      title="Eliminar plato"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            ) : (
              /* Empty Slot Dropzone */
              <button
                onClick={() => setQuickAddModal({ open: true, slot: 'lunch' })}
                className="flex-1 min-h-[160px] border-2 border-dashed border-[#bfc9c1] hover:border-[#0f5238] rounded-xl flex flex-col items-center justify-center text-[#707973] hover:text-[#0f5238] bg-[#f8f9fa]/60 hover:bg-[#b1f0ce]/10 transition-all cursor-pointer p-6 group"
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
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[#2d6a4f]/15 text-[#0f5238]">
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
              onClick={() => setQuickAddModal({ open: true, slot: 'dinner' })}
              className="text-xs font-semibold text-[#0f5238] hover:bg-[#b1f0ce]/30 p-1.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
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
                  {meal.isSideDish ? (
                    // Compact side dish style
                    <div className="p-3 flex items-center gap-3">
                      {meal.imageUrl && (
                        <div
                          className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0 border border-[#e1e3e4]"
                          style={{ backgroundImage: `url(${meal.imageUrl})` }}
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] uppercase font-bold text-[#0f5238] tracking-wider">
                          Acompañamiento
                        </span>
                        <h4 className="font-semibold text-sm text-[#191c1d] truncate">
                          {meal.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-[#707973] mt-0.5">
                          <span>{meal.timeMinutes}m</span>
                          <span>•</span>
                          <span>{meal.calories} kcal</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveMeal('dinner', meal.id)}
                        className="opacity-60 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#ffdad6] text-[#ba1a1a] transition-all cursor-pointer"
                        title="Eliminar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    // Main dish large card style
                    <>
                      {meal.imageUrl && (
                        <div
                          className="bg-cover bg-center w-full h-36"
                          style={{ backgroundImage: `url(${meal.imageUrl})` }}
                        />
                      )}
                      <div className="p-3.5 flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-sm text-[#191c1d] truncate">
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
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveMeal('dinner', meal.id)}
                          className="opacity-60 group-hover:opacity-100 p-1.5 rounded-md hover:bg-[#ffdad6] text-[#ba1a1a] transition-all cursor-pointer"
                          title="Eliminar plato"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            ) : (
              /* Empty Slot Dropzone */
              <button
                onClick={() => setQuickAddModal({ open: true, slot: 'dinner' })}
                className="flex-1 min-h-[160px] border-2 border-dashed border-[#bfc9c1] hover:border-[#0f5238] rounded-xl flex flex-col items-center justify-center text-[#707973] hover:text-[#0f5238] bg-[#f8f9fa]/60 hover:bg-[#b1f0ce]/10 transition-all cursor-pointer p-6 group"
              >
                <div className="w-10 h-10 rounded-full bg-white shadow-2xs flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                  <PlusCircle className="w-6 h-6 text-[#0f5238]" />
                </div>
                <span className="font-semibold text-sm">Añadir Receta a la Cena</span>
                <span className="text-xs text-[#707973] mt-0.5">Plato principal o acompañamiento</span>
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
                  Añadir al {quickAddModal.slot === 'lunch' ? 'Almuerzo' : quickAddModal.slot === 'dinner' ? 'Cena' : 'Desayuno'}
                </h3>
                <p className="text-xs text-[#707973]">
                  {currentDay.dayName}, {currentDay.dayNumber} de {currentMonthName}
                </p>
              </div>
              <button
                onClick={() => setQuickAddModal(null)}
                className="text-[#707973] hover:text-[#191c1d] text-lg font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
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

            <p className="text-xs font-bold text-[#404943] uppercase tracking-wider">
              Seleccionar del Recetario:
            </p>

            {/* Recipes Quick List */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1 custom-scrollbar">
              {recipes.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => handleAddMealToSlot(quickAddModal.slot, rec)}
                  className="flex items-center gap-3 p-2.5 rounded-xl border border-[#e1e3e4] hover:border-[#0f5238] hover:bg-[#b1f0ce]/10 cursor-pointer transition-all"
                >
                  <img
                    src={rec.imageUrl}
                    alt={rec.name}
                    className="w-14 h-14 rounded-lg object-cover border border-[#e1e3e4]"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-[#191c1d] truncate">
                      {rec.name}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-[#707973]">
                      <span>{rec.category}</span>
                      <span>•</span>
                      <span>{rec.timeMinutes}m</span>
                      <span>•</span>
                      <span className="text-[#9b4500] font-medium">{rec.calories} kcal</span>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-lg shrink-0">
                    Elegir
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
