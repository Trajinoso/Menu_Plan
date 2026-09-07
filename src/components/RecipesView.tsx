import React, { useState } from 'react';
import {
  Search,
  Plus,
  Timer,
  Flame,
  Calendar,
  Check,
  X,
  Sparkles,
  ChevronRight,
  Filter,
  BookOpen
} from 'lucide-react';
import { Recipe, MealType } from '../types';

interface RecipesViewProps {
  recipes: Recipe[];
  onOpenAddRecipe: () => void;
  onAssignRecipeToPlan: (recipe: Recipe, dates: string[], mealType: MealType) => void;
  onOpenGenerateAI: () => void;
}

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  onOpenAddRecipe,
  onAssignRecipeToPlan,
  onOpenGenerateAI,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [assigningRecipe, setAssigningRecipe] = useState<Recipe | null>(null);

  // For the Assign to Plan modal
  const [selectedDays, setSelectedDays] = useState<string[]>(['2023-10-12']); // Default to Monday 12
  const [selectedMealType, setSelectedMealType] = useState<MealType>('Almuerzo');
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);

  const filters = ['Todos', 'Altos en Proteína', 'Vegetariano', 'Comidas Rápidas', 'Desayuno', 'Gourmet'];

  const filteredRecipes = recipes.filter((recipe) => {
    const matchesSearch =
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (recipe.description && recipe.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      recipe.ingredients.some((ing) => ing.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'Todos') return true;
    if (activeFilter === 'Altos en Proteína') return recipe.category === 'Proteico' || recipe.tags.some(t => t.toLowerCase().includes('proteína') || t.toLowerCase().includes('proteico'));
    if (activeFilter === 'Vegetariano') return recipe.category === 'Vegetariano' || recipe.tags.some(t => t.toLowerCase().includes('vegetariano') || t.toLowerCase().includes('vegano'));
    if (activeFilter === 'Comidas Rápidas') return recipe.timeMinutes <= 15 || recipe.category === 'Rápido' || recipe.tags.some(t => t.toLowerCase().includes('rápido'));
    if (activeFilter === 'Desayuno') return recipe.category === 'Desayuno' || recipe.tags.some(t => t.toLowerCase().includes('desayuno'));
    if (activeFilter === 'Gourmet') return recipe.category === 'Gourmet' || recipe.difficulty === 'Difícil';

    return true;
  });

  const weekDayOptions = [
    { label: 'L', name: 'Lunes 12', date: '2023-10-12' },
    { label: 'M', name: 'Martes 13', date: '2023-10-13' },
    { label: 'X', name: 'Miércoles 14', date: '2023-10-14' },
    { label: 'J', name: 'Jueves 15', date: '2023-10-15' },
    { label: 'V', name: 'Viernes 16', date: '2023-10-16' },
    { label: 'S', name: 'Sábado 17', date: '2023-10-17' },
    { label: 'D', name: 'Domingo 18', date: '2023-10-18' },
  ];

  const handleToggleDay = (dateStr: string) => {
    if (selectedDays.includes(dateStr)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dateStr));
      }
    } else {
      setSelectedDays([...selectedDays, dateStr]);
    }
  };

  const handleConfirmAssign = () => {
    if (!assigningRecipe) return;
    onAssignRecipeToPlan(assigningRecipe, selectedDays, selectedMealType);
    setFeedbackSuccess(true);
    setTimeout(() => {
      setFeedbackSuccess(false);
      setAssigningRecipe(null);
    }, 1100);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header & Search Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1d] font-heading">
            Recetario Inteligente
          </h2>
          <p className="text-xs md:text-sm text-[#707973]">
            {recipes.length} recetas guardadas y listas para añadir a tu plan
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search box */}
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-[#707973] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar receta o ingrediente..."
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238] focus:ring-1 focus:ring-[#0f5238] transition-all"
            />
          </div>

          <button
            onClick={onOpenAddRecipe}
            className="shrink-0 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Añadir Receta</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === filter
                ? 'bg-[#0f5238] text-white shadow-xs'
                : 'bg-white text-[#404943] border border-[#e1e3e4] hover:bg-[#f3f4f5]'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Recipes Cards Grid */}
      {filteredRecipes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white rounded-2xl border border-[#e1e3e4] overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Image & Category Pill */}
              <div className="relative h-44 w-full overflow-hidden bg-[#e1e3e4]">
                <img
                  src={recipe.imageUrl}
                  alt={recipe.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <span className="absolute top-3 left-3 bg-[#0f5238]/90 backdrop-blur-xs text-white text-[11px] font-semibold px-2.5 py-1 rounded-full shadow-xs">
                  {recipe.category}
                </span>
                {recipe.isAiGenerated && (
                  <span className="absolute top-3 right-3 bg-[#fc8a40] text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3 h-3" />
                    IA
                  </span>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div>
                  <h3 className="font-bold text-base text-[#191c1d] leading-snug line-clamp-2 font-heading">
                    {recipe.name}
                  </h3>
                  {recipe.description && (
                    <p className="text-xs text-[#707973] line-clamp-2 mt-1.5">
                      {recipe.description}
                    </p>
                  )}
                </div>

                {/* Metrics */}
                <div className="flex items-center justify-between pt-2 border-t border-[#e1e3e4]/70 text-xs text-[#707973]">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium">
                      <Timer className="w-3.5 h-3.5 text-[#0f5238]" />
                      {recipe.timeMinutes} min
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium text-[#9b4500]">
                      <Flame className="w-3.5 h-3.5 text-[#9b4500]" />
                      {recipe.calories} kcal
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-[#404943] bg-[#f3f4f5] px-2 py-0.5 rounded">
                    {recipe.difficulty}
                  </span>
                </div>
              </div>

              {/* Card Action */}
              <div className="p-4 pt-0">
                <button
                  onClick={() => setAssigningRecipe(recipe)}
                  className="w-full bg-[#f8f9fa] hover:bg-[#0f5238] text-[#0f5238] hover:text-white border border-[#bfc9c1] hover:border-[#0f5238] font-semibold text-xs py-2.5 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Añadir al Plan</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#e1e3e4] space-y-4">
          <BookOpen className="w-12 h-12 text-[#bfc9c1] mx-auto" />
          <h3 className="text-lg font-bold text-[#191c1d] font-heading">
            No se encontraron recetas
          </h3>
          <p className="text-xs text-[#707973] max-w-sm mx-auto">
            Prueba a buscar con otro término o utiliza la IA para generar una nueva receta automáticamente.
          </p>
          <button
            onClick={onOpenGenerateAI}
            className="px-4 py-2 bg-[#9b4500] hover:bg-[#763300] text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generar Recetas con IA</span>
          </button>
        </div>
      )}

      {/* Añadir al Plan Popup Modal (Matching the exact mockup) */}
      {assigningRecipe && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-5 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[11px] font-bold text-[#0f5238] uppercase tracking-wider">
                  Planificador de Menús
                </span>
                <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                  Añadir al Plan
                </h3>
              </div>
              <button
                onClick={() => setAssigningRecipe(null)}
                className="p-1 rounded-lg text-[#707973] hover:text-[#191c1d] hover:bg-[#edeeef] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Selected Recipe Banner Preview */}
            <div className="flex items-center gap-3 p-3 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
              <img
                src={assigningRecipe.imageUrl}
                alt={assigningRecipe.name}
                className="w-14 h-14 rounded-lg object-cover border border-[#e1e3e4]"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-[#191c1d] truncate">
                  {assigningRecipe.name}
                </h4>
                <div className="flex items-center gap-2 text-xs text-[#707973] mt-0.5">
                  <span>{assigningRecipe.timeMinutes}m</span>
                  <span>•</span>
                  <span className="text-[#9b4500] font-semibold">{assigningRecipe.calories} kcal</span>
                </div>
              </div>
            </div>

            {/* Day Selector */}
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">
                Día(s) de la Semana
              </label>
              <div className="grid grid-cols-7 gap-1.5">
                {weekDayOptions.map((opt) => {
                  const isSelected = selectedDays.includes(opt.date);
                  return (
                    <button
                      key={opt.date}
                      type="button"
                      onClick={() => handleToggleDay(opt.date)}
                      className={`h-11 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0f5238] text-white shadow-sm ring-2 ring-[#0f5238] ring-offset-1'
                          : 'bg-[#f8f9fa] text-[#404943] border border-[#bfc9c1] hover:bg-[#e7e8e9]'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className="text-[9px] font-normal opacity-80">{opt.name.split(' ')[1]}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-[#707973] mt-1.5">
                Selecciona uno o varios días para programar esta comida.
              </p>
            </div>

            {/* Meal Type Radio Pills */}
            <div>
              <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">
                Tipo de Comida
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Desayuno', 'Almuerzo', 'Cena'] as MealType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedMealType(type)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      selectedMealType === type
                        ? 'bg-[#fc8a40] text-white shadow-xs'
                        : 'bg-[#f8f9fa] text-[#404943] border border-[#bfc9c1] hover:bg-[#e7e8e9]'
                    }`}
                  >
                    <span>{type === 'Almuerzo' ? '☀️' : type === 'Cena' ? '🌙' : '🍳'}</span>
                    <span>{type}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-3 border-t border-[#e1e3e4] flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setAssigningRecipe(null)}
                className="px-4 py-2 text-xs font-semibold text-[#707973] hover:text-[#191c1d] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmAssign}
                disabled={feedbackSuccess}
                className={`px-5 py-2.5 rounded-xl text-xs font-semibold text-white shadow-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  feedbackSuccess ? 'bg-[#0f5238]' : 'bg-[#0f5238] hover:bg-[#2d6a4f]'
                }`}
              >
                {feedbackSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>¡Añadido al Plan!</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Confirmar y Añadir</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
