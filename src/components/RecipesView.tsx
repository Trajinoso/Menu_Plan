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
  BookOpen,
  Trash2,
  Pencil,
  Eye,
  Users,
  Utensils
} from 'lucide-react';
import { Recipe, MealType } from '../types';
import { getCurrentWeekDates } from '../utils/dateHelpers';

interface RecipesViewProps {
  recipes: Recipe[];
  onOpenAddRecipe: () => void;
  onAssignRecipeToPlan: (recipe: Recipe, dates: string[], mealType: MealType) => void;
  onOpenGenerateAI: () => void;
  onDeleteRecipe?: (id: string) => void;
  onEditRecipe?: (recipe: Recipe) => void;
}

export const RecipesView: React.FC<RecipesViewProps> = ({
  recipes,
  onOpenAddRecipe,
  onAssignRecipeToPlan,
  onOpenGenerateAI,
  onDeleteRecipe,
  onEditRecipe,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [assigningRecipe, setAssigningRecipe] = useState<Recipe | null>(null);
  const [selectedDetailRecipe, setSelectedDetailRecipe] = useState<Recipe | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Dynamic current week dates
  const currentWeek = getCurrentWeekDates();

  // For the Assign to Plan modal
  const [selectedDays, setSelectedDays] = useState<string[]>(() => [currentWeek[0]?.date || '2023-10-12']);
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

  const weekDayOptions = currentWeek.map((w) => {
    let letter = w.dayName.charAt(0).toUpperCase();
    if (w.dayName.toLowerCase().startsWith('mi')) letter = 'X';
    return {
      label: letter,
      name: `${w.dayName} ${w.dayNumber}`,
      date: w.date
    };
  });

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
              {/* Image & Category Pill (clickable to view recipe details) */}
              <div
                onClick={() => setSelectedDetailRecipe(recipe)}
                className="relative h-44 w-full overflow-hidden bg-[#e1e3e4] cursor-pointer"
                title="Haz clic para ver detalles de la receta"
              >
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                  <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Ver receta
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div
                  onClick={() => setSelectedDetailRecipe(recipe)}
                  className="cursor-pointer group/title"
                >
                  <h3 className="font-bold text-base text-[#191c1d] group-hover/title:text-[#0f5238] leading-snug line-clamp-2 font-heading transition-colors">
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
              <div className="p-4 pt-0 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningRecipe(recipe)}
                  className="flex-1 bg-[#f8f9fa] hover:bg-[#0f5238] text-[#0f5238] hover:text-white border border-[#bfc9c1] hover:border-[#0f5238] font-semibold text-xs py-2 px-2.5 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-98"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Añadir</span>
                </button>

                {onEditRecipe && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditRecipe(recipe);
                    }}
                    title="Editar receta"
                    className="p-2 text-[#0f5238] hover:text-[#0f5238] hover:bg-[#b1f0ce]/40 border border-[#bfc9c1] hover:border-[#0f5238] rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span className="text-xs">Editar</span>
                  </button>
                )}

                {onDeleteRecipe && (
                  confirmDeleteId === recipe.id ? (
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteRecipe(recipe.id);
                        setConfirmDeleteId(null);
                      }}
                      title="Clic para confirmar eliminación"
                      className="px-2.5 py-2 bg-[#ba1a1a] hover:bg-[#93000a] text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shrink-0 animate-in fade-in"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>¿Borrar?</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(recipe.id)}
                      title="Eliminar receta"
                      className="p-2 text-[#707973] hover:text-[#ba1a1a] hover:bg-[#ffdad6]/40 border border-transparent hover:border-[#ba1a1a]/30 rounded-xl transition-all cursor-pointer shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )
                )}
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

      {/* Recipe Detail Modal (Allows viewing recipe details & editing directly) */}
      {selectedDetailRecipe && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Header Image & Close Button */}
            <div className="relative h-56 w-full bg-[#f3f4f5] shrink-0">
              <img
                src={selectedDetailRecipe.imageUrl}
                alt={selectedDetailRecipe.name}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedDetailRecipe(null)}
                className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full cursor-pointer transition-colors shadow-md"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-3 flex items-center gap-2">
                <span className="bg-[#0f5238] text-white text-xs font-semibold px-3 py-1 rounded-full shadow-xs">
                  {selectedDetailRecipe.category}
                </span>
                <span className="bg-white/90 backdrop-blur-xs text-[#191c1d] text-xs font-semibold px-2.5 py-1 rounded-full shadow-xs">
                  {selectedDetailRecipe.difficulty}
                </span>
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-[#191c1d] font-heading">
                  {selectedDetailRecipe.name}
                </h2>
                {selectedDetailRecipe.description && (
                  <p className="text-xs md:text-sm text-[#707973] mt-1.5 leading-relaxed">
                    {selectedDetailRecipe.description}
                  </p>
                )}
              </div>

              {/* Quick Specs Grid */}
              <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#b1f0ce]/40 flex items-center justify-center text-[#0f5238]">
                    <Timer className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#707973] block">Tiempo</span>
                    <span className="text-xs font-bold text-[#191c1d]">{selectedDetailRecipe.timeMinutes} min</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#ffdad6]/40 flex items-center justify-center text-[#9b4500]">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#707973] block">Calorías</span>
                    <span className="text-xs font-bold text-[#191c1d]">{selectedDetailRecipe.calories} kcal</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#f3f4f5] flex items-center justify-center text-[#404943]">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#707973] block">Porciones</span>
                    <span className="text-xs font-bold text-[#191c1d]">{selectedDetailRecipe.servings || 1} raciones</span>
                  </div>
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <h3 className="text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#0f5238]" />
                  <span>Ingredientes ({selectedDetailRecipe.ingredients?.length || 0})</span>
                </h3>
                {selectedDetailRecipe.ingredients && selectedDetailRecipe.ingredients.length > 0 ? (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#191c1d]">
                    {selectedDetailRecipe.ingredients.map((ing, idx) => (
                      <li key={idx} className="flex items-start gap-2 bg-[#f8f9fa] p-2 rounded-lg border border-[#e1e3e4]/60">
                        <Check className="w-3.5 h-3.5 text-[#0f5238] mt-0.5 shrink-0" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-[#707973] italic">No hay ingredientes registrados para esta receta.</p>
                )}
              </div>

              {/* Instructions */}
              <div>
                <h3 className="text-xs font-bold text-[#404943] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[#0f5238]" />
                  <span>Instrucciones de Preparación</span>
                </h3>
                {selectedDetailRecipe.instructions && selectedDetailRecipe.instructions.length > 0 ? (
                  <div className="space-y-2.5">
                    {selectedDetailRecipe.instructions.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-2.5 bg-[#f8f9fa] rounded-xl border border-[#e1e3e4]/60">
                        <span className="w-5 h-5 rounded-full bg-[#0f5238] text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <p className="text-xs md:text-sm text-[#191c1d] leading-relaxed">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#707973] italic">No hay instrucciones registradas.</p>
                )}
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="p-4 bg-[#f8f9fa] border-t border-[#e1e3e4] flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedDetailRecipe(null)}
                className="px-4 py-2 text-xs font-semibold text-[#707973] hover:text-[#191c1d] transition-colors cursor-pointer"
              >
                Cerrar
              </button>

              <div className="flex items-center gap-2">
                {onEditRecipe && (
                  <button
                    type="button"
                    onClick={() => {
                      const rec = selectedDetailRecipe;
                      setSelectedDetailRecipe(null);
                      onEditRecipe(rec);
                    }}
                    className="px-4 py-2.5 bg-white hover:bg-[#b1f0ce]/40 text-[#0f5238] border border-[#0f5238] rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    <span>Editar Receta</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    const rec = selectedDetailRecipe;
                    setSelectedDetailRecipe(null);
                    setAssigningRecipe(rec);
                  }}
                  className="px-5 py-2.5 bg-[#0f5238] hover:bg-[#2d6a4f] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Añadir al Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
