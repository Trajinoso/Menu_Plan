import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  PlusCircle,
  Plus,
  Trash2,
  Calendar,
  X,
  Utensils
} from 'lucide-react';
import { MonthPlan, DayPlan, Recipe, MealItem } from '../types';

interface MonthlyViewProps {
  monthPlan: MonthPlan;
  recipes: Recipe[];
  onUpdateMonthPlan: (updatedMonthPlan: MonthPlan) => void;
  onAutofillEmpty: (year?: number, month?: number) => Promise<void>;
  isAutofilling: boolean;
  onOpenAddRecipe: () => void;
}

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];

const DAY_NAMES_ES = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado'
];

export const MonthlyView: React.FC<MonthlyViewProps> = ({
  monthPlan,
  recipes,
  onUpdateMonthPlan,
  onAutofillEmpty,
  isAutofilling,
  onOpenAddRecipe,
}) => {
  // Navigation state: defaults to October 2023 to match existing plans, can navigate anywhere
  const [currentDate, setCurrentDate] = useState<Date>(new Date(2023, 9, 1));
  const [selectedDayModal, setSelectedDayModal] = useState<DayPlan | null>(null);
  const [addingToMealType, setAddingToMealType] = useState<'lunch' | 'dinner' | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (0 = Enero, 9 = Octubre)
  const monthFormatted = (month + 1).toString().padStart(2, '0');
  const monthKeyPrefix = `${year}-${monthFormatted}`;

  const daysOfWeek = ['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'];

  // Calendar matrix calculations
  const firstDayOfWeekIndex = new Date(year, month, 1).getDay(); // 0 = Sunday
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPreviousMonth = new Date(year, month, 0).getDate();

  // Ghost days for previous month
  const prevMonthDays = Array.from({ length: firstDayOfWeekIndex }, (_, i) => {
    return daysInPreviousMonth - firstDayOfWeekIndex + 1 + i;
  });

  // Days in current active month
  const daysInMonth = Array.from({ length: daysInCurrentMonth }, (_, i) => i + 1);

  // Ghost days for next month to complete the row
  const totalCellsSoFar = prevMonthDays.length + daysInMonth.length;
  const trailingGhostCount = (7 - (totalCellsSoFar % 7)) % 7;
  const nextMonthDays = Array.from({ length: trailingGhostCount }, (_, i) => i + 1);

  const now = new Date();
  const isActualCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
  const actualTodayDate = now.getDate();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    // If already in current real month, go to October 2023 demo or real today
    const realDate = new Date();
    setCurrentDate(new Date(realDate.getFullYear(), realDate.getMonth(), 1));
  };

  const getDayPlan = (dayNum: number): DayPlan => {
    const dateStr = `${monthKeyPrefix}-${dayNum.toString().padStart(2, '0')}`;
    const dayOfWeek = new Date(year, month, dayNum).getDay();
    return (
      monthPlan.days[dateStr] || {
        date: dateStr,
        dayName: DAY_NAMES_ES[dayOfWeek],
        dayNumber: dayNum,
        breakfast: [],
        lunch: [],
        dinner: []
      }
    );
  };

  const handleDayClick = (dayNum: number) => {
    const day = getDayPlan(dayNum);
    setSelectedDayModal(day);
  };

  const handleAddRecipeToDay = (recipe: Recipe, slot: 'lunch' | 'dinner') => {
    if (!selectedDayModal) return;
    const newMeal: MealItem = {
      id: `meal-${Date.now()}`,
      recipeId: recipe.id,
      name: recipe.name,
      timeMinutes: recipe.timeMinutes,
      calories: recipe.calories,
      imageUrl: recipe.imageUrl,
      category: recipe.category
    };

    const updatedDay: DayPlan = {
      ...selectedDayModal,
      [slot]: [...(selectedDayModal[slot] || []), newMeal]
    };

    const updatedMonthDays = {
      ...monthPlan.days,
      [selectedDayModal.date]: updatedDay
    };

    const updatedMonthPlan = {
      ...monthPlan,
      days: updatedMonthDays,
      plannedMealsCount: countTotalLunchesAndDinners(updatedMonthDays)
    };

    onUpdateMonthPlan(updatedMonthPlan);
    setSelectedDayModal(updatedDay);
    setAddingToMealType(null);
  };

  const handleRemoveMealFromDay = (slot: 'lunch' | 'dinner', mealId: string) => {
    if (!selectedDayModal) return;
    const updatedDay: DayPlan = {
      ...selectedDayModal,
      [slot]: selectedDayModal[slot].filter((m) => m.id !== mealId)
    };

    const updatedMonthDays = {
      ...monthPlan.days,
      [selectedDayModal.date]: updatedDay
    };

    const updatedMonthPlan = {
      ...monthPlan,
      days: updatedMonthDays,
      plannedMealsCount: countTotalLunchesAndDinners(updatedMonthDays)
    };

    onUpdateMonthPlan(updatedMonthPlan);
    setSelectedDayModal(updatedDay);
  };

  const countTotalLunchesAndDinners = (daysMap: Record<string, DayPlan>) => {
    let count = 0;
    Object.values(daysMap).forEach((d) => {
      count += (d.lunch?.length || 0) + (d.dinner?.length || 0);
    });
    return count;
  };

  // Planned stats for the currently viewed month
  const plannedInCurrentMonth = (Object.entries(monthPlan.days || {}) as [string, DayPlan][])
    .filter(([date]) => date.startsWith(monthKeyPrefix))
    .reduce((acc, [, d]) => acc + (d.lunch?.length || 0) + (d.dinner?.length || 0), 0);

  const totalMealSlotsInMonth = daysInCurrentMonth * 2; // 2 slots per day: Almuerzo and Cena

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] overflow-hidden">
      {/* Header Actions */}
      <header className="px-4 md:px-8 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0 bg-white z-10 border-b border-[#e1e3e4] shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl md:text-3xl font-bold text-[#191c1d] font-heading">
              {MONTH_NAMES_ES[month]} {year}
            </h2>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#e7e8e9] text-[#0f5238]">
              Vista Mensual
            </span>
          </div>
          <p className="text-xs md:text-sm text-[#707973] mt-1">
            {plannedInCurrentMonth} / {totalMealSlotsInMonth} Comidas Planificadas • Almuerzo y Cena
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          {/* Month Navigation Control */}
          <div className="flex items-center bg-[#f3f4f5] rounded-xl p-1 border border-[#e1e3e4] shadow-2xs">
            <button
              onClick={handlePrevMonth}
              title="Mes anterior"
              className="p-1.5 rounded-lg text-[#707973] hover:text-[#191c1d] hover:bg-white transition-colors cursor-pointer active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              title="Ir al mes actual"
              className="px-3 py-1 text-xs font-bold text-[#191c1d] hover:bg-white rounded-lg transition-colors cursor-pointer"
            >
              Hoy
            </button>
            <button
              onClick={handleNextMonth}
              title="Mes siguiente"
              className="p-1.5 rounded-lg text-[#707973] hover:text-[#191c1d] hover:bg-white transition-colors cursor-pointer active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={() => onAutofillEmpty(year, month + 1)}
            disabled={isAutofilling}
            className="ml-auto md:ml-2 text-xs md:text-sm font-semibold px-4 py-2.5 rounded-xl bg-[#fc8a40] hover:bg-[#9b4500] text-white transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-70 active:scale-98"
          >
            <Sparkles className={`w-4 h-4 text-white ${isAutofilling ? 'animate-spin' : ''}`} />
            <span>{isAutofilling ? 'Generando con IA...' : 'Autocompletar Vacíos'}</span>
          </button>
        </div>
      </header>

      {/* Calendar Grid Area */}
      <div className="flex-1 overflow-auto p-4 md:p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 md:gap-3 mb-2 sticky top-0 bg-[#f8f9fa]/95 backdrop-blur z-10 py-1">
            {daysOfWeek.map((day) => (
              <div key={day} className="text-center text-xs font-bold text-[#707973] uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>

          {/* Grid of days */}
          <div className="grid grid-cols-7 gap-2 md:gap-3">
            {/* Prev month ghost days */}
            {prevMonthDays.map((d) => (
              <div
                key={`prev-${d}`}
                className="bg-white/40 rounded-xl p-2 min-h-[110px] md:min-h-[125px] border border-transparent opacity-40 select-none flex flex-col justify-between"
              >
                <span className="text-xs font-medium text-[#bfc9c1]">{d}</span>
              </div>
            ))}

            {/* Current month days */}
            {daysInMonth.map((dayNum) => {
              const day = getDayPlan(dayNum);
              const isToday =
                (isActualCurrentMonth && dayNum === actualTodayDate) ||
                (year === 2023 && month === 9 && dayNum === 4);

              const hasLunch = day.lunch && day.lunch.length > 0;
              const hasDinner = day.dinner && day.dinner.length > 0;
              const mealCount = (day.lunch?.length || 0) + (day.dinner?.length || 0);

              return (
                <div
                  key={dayNum}
                  onClick={() => handleDayClick(dayNum)}
                  className={`rounded-xl p-2 min-h-[110px] md:min-h-[125px] transition-all cursor-pointer relative group flex flex-col justify-between ${
                    isToday
                      ? 'bg-[#0f5238]/5 border-2 border-[#0f5238] shadow-xs'
                      : 'bg-white hover:bg-[#f3f4f5] border border-[#e1e3e4] hover:border-[#0f5238]/60 shadow-2xs hover:shadow-xs'
                  }`}
                >
                  {/* Top Bar with Number & Indicators */}
                  <div className="flex justify-between items-start">
                    {isToday ? (
                      <span className="w-6 h-6 rounded-full bg-[#0f5238] text-white font-bold text-xs flex items-center justify-center font-heading">
                        {dayNum}
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-[#191c1d] font-heading pl-0.5">
                        {dayNum}
                      </span>
                    )}

                    {/* Status indicator dots */}
                    <div className="flex gap-1 items-center">
                      {isToday ? (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0f5238]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#0f5238]" />
                        </>
                      ) : mealCount > 0 ? (
                        <>
                          {hasLunch && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#0f5238]" title="Almuerzo listo" />
                          )}
                          {hasDinner && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#fc8a40]" title="Cena lista" />
                          )}
                        </>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#e1e3e4]" />
                      )}
                    </div>
                  </div>

                  {/* Meal Chips / Preview (LUNCH & DINNER ONLY) */}
                  <div className="my-1 flex-1 flex flex-col justify-center gap-1.5 overflow-hidden">
                    {mealCount > 0 ? (
                      <div className="flex flex-col gap-1">
                        {/* Lunch Chip */}
                        {hasLunch ? (
                          <div
                            className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                              isToday
                                ? 'bg-[#2d6a4f] text-[#a8e7c5]'
                                : 'bg-[#edeeef] text-[#191c1d] border border-[#e1e3e4]/60'
                            }`}
                            title={`Almuerzo: ${day.lunch[0].name}`}
                          >
                            <span className="font-bold opacity-75 mr-1">A:</span>
                            {day.lunch[0].name}
                          </div>
                        ) : (
                          <div className="border border-dashed border-[#bfc9c1] text-[#707973] text-[9px] md:text-[10px] px-1.5 py-0.5 rounded truncate text-center">
                            + Almuerzo
                          </div>
                        )}

                        {/* Dinner Chip */}
                        {hasDinner ? (
                          <div
                            className={`text-[9px] md:text-[10px] px-1.5 py-0.5 rounded truncate font-medium ${
                              isToday
                                ? 'bg-[#2d6a4f] text-[#a8e7c5]'
                                : 'bg-[#edeeef] text-[#191c1d] border border-[#e1e3e4]/60'
                            }`}
                            title={`Cena: ${day.dinner[0].name}`}
                          >
                            <span className="font-bold opacity-75 mr-1">C:</span>
                            {day.dinner[0].name}
                          </div>
                        ) : (
                          <div className="border border-dashed border-[#bfc9c1] text-[#707973] text-[9px] md:text-[10px] px-1.5 py-0.5 rounded truncate text-center">
                            + Cena
                          </div>
                        )}
                      </div>
                    ) : (
                      // Empty state
                      <div className="flex items-center justify-center h-full opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[#0f5238] flex items-center gap-1 text-[11px] font-semibold">
                          <PlusCircle className="w-4 h-4" />
                          <span className="hidden md:inline">Planificar</span>
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-[10px] text-[#707973] text-right font-medium">
                    {mealCount > 0 ? `${mealCount} ${mealCount === 1 ? 'plato' : 'platos'}` : ''}
                  </div>
                </div>
              );
            })}

            {/* Next month ghost days */}
            {nextMonthDays.map((d) => (
              <div
                key={`next-${d}`}
                className="bg-white/40 rounded-xl p-2 min-h-[110px] md:min-h-[125px] border border-transparent opacity-40 select-none flex flex-col justify-between"
              >
                <span className="text-xs font-medium text-[#bfc9c1]">{d}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Day Details Modal / Drawer (ALMUERZO & CENA ONLY) */}
      {selectedDayModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl border border-[#e1e3e4] space-y-4 max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-center pb-3 border-b border-[#e1e3e4]">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0f5238]">
                  {selectedDayModal.dayName}
                </span>
                <h3 className="text-xl font-bold text-[#191c1d] font-heading">
                  {selectedDayModal.dayNumber} de {MONTH_NAMES_ES[month]}, {year}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedDayModal(null);
                  setAddingToMealType(null);
                }}
                className="p-1 rounded-lg text-[#707973] hover:text-[#191c1d] hover:bg-[#edeeef] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Meal Slots in Day: ONLY Almuerzo and Cena */}
            <div className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              {/* Almuerzo */}
              <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#e1e3e4]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0f5238]" />
                    <span className="text-xs font-bold text-[#404943] uppercase tracking-wider">
                      Almuerzo
                    </span>
                  </div>
                  <button
                    onClick={() => setAddingToMealType(addingToMealType === 'lunch' ? null : 'lunch')}
                    className="text-xs font-semibold text-[#0f5238] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
                {selectedDayModal.lunch && selectedDayModal.lunch.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayModal.lunch.map((m) => (
                      <div
                        key={m.id}
                        className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#e1e3e4]"
                      >
                        <span className="text-sm font-semibold text-[#191c1d]">{m.name}</span>
                        <div className="flex items-center gap-3 text-xs text-[#707973]">
                          <span>{m.calories} kcal</span>
                          <button
                            onClick={() => handleRemoveMealFromDay('lunch', m.id)}
                            className="text-[#ba1a1a] hover:opacity-75 cursor-pointer p-1"
                            title="Eliminar plato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#707973] italic">Sin almuerzo planificado</p>
                )}
              </div>

              {/* Cena */}
              <div className="bg-[#f8f9fa] p-4 rounded-xl border border-[#e1e3e4]">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#fc8a40]" />
                    <span className="text-xs font-bold text-[#404943] uppercase tracking-wider">
                      Cena
                    </span>
                  </div>
                  <button
                    onClick={() => setAddingToMealType(addingToMealType === 'dinner' ? null : 'dinner')}
                    className="text-xs font-semibold text-[#0f5238] flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir</span>
                  </button>
                </div>
                {selectedDayModal.dinner && selectedDayModal.dinner.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayModal.dinner.map((m) => (
                      <div
                        key={m.id}
                        className="flex justify-between items-center bg-white p-2.5 rounded-lg border border-[#e1e3e4]"
                      >
                        <span className="text-sm font-semibold text-[#191c1d]">{m.name}</span>
                        <div className="flex items-center gap-3 text-xs text-[#707973]">
                          <span>{m.calories} kcal</span>
                          <button
                            onClick={() => handleRemoveMealFromDay('dinner', m.id)}
                            className="text-[#ba1a1a] hover:opacity-75 cursor-pointer p-1"
                            title="Eliminar plato"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#707973] italic">Sin cena planificada</p>
                )}
              </div>

              {/* Inline recipe picker when clicking "Añadir" */}
              {addingToMealType && (
                <div className="p-4 bg-[#e7e8e9] rounded-xl border border-[#bfc9c1] space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-[#0f5238]">
                      Elegir receta para {addingToMealType === 'lunch' ? 'Almuerzo' : 'Cena'}:
                    </span>
                    <button
                      onClick={() => setAddingToMealType(null)}
                      className="text-xs text-[#707973] hover:text-[#191c1d] cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                    {recipes.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => handleAddRecipeToDay(r, addingToMealType)}
                        className="w-full text-left p-2 rounded-lg bg-white hover:bg-[#b1f0ce]/20 border border-[#e1e3e4] hover:border-[#0f5238] flex items-center justify-between text-xs font-medium cursor-pointer transition-colors"
                      >
                        <span className="truncate mr-2 font-semibold text-[#191c1d]">{r.name}</span>
                        <span className="text-[#9b4500] font-semibold shrink-0">{r.calories} kcal</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => {
                  setSelectedDayModal(null);
                  setAddingToMealType(null);
                }}
                className="px-5 py-2.5 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
