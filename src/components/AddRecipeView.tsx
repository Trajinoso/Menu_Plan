import React, { useState } from 'react';
import {
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Check,
  ArrowLeft,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
  Tag
} from 'lucide-react';
import { Recipe, Difficulty } from '../types';

interface AddRecipeViewProps {
  onSaveRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  categories?: string[];
  onAddCategory?: (cat: string) => void;
  onDeleteCategory?: (cat: string) => void;
}

export const AddRecipeView: React.FC<AddRecipeViewProps> = ({
  onSaveRecipe,
  onCancel,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [urlInput, setUrlInput] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);

  // Default empty form states - everything blank as requested
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [timeMinutes, setTimeMinutes] = useState<string>('');
  const [calories, setCalories] = useState<string>('');
  const [servings, setServings] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Fácil');
  const [imageUrl, setImageUrl] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [instructionsText, setInstructionsText] = useState('');

  // Category management state
  const DEFAULT_INITIAL_CATEGORIES = [
    'Proteico',
    'Vegetariano',
    'Rápido',
    'Desayuno',
    'Almuerzo',
    'Cena',
    'Postre',
    'Snack',
    'Gourmet'
  ];
  const [localCategories, setLocalCategories] = useState<string[]>(DEFAULT_INITIAL_CATEGORIES);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const availableCategories = categories && categories.length > 0 ? categories : localCategories;

  const handleAddNewCategory = () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (onAddCategory) {
      onAddCategory(trimmed);
    }
    if (!availableCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setLocalCategories((prev) => [...prev, trimmed]);
    }
    setCategory(trimmed);
    setNewCategoryInput('');
  };

  const handleDeleteCategoryItem = (catToDelete: string) => {
    if (onDeleteCategory) {
      onDeleteCategory(catToDelete);
    }
    setLocalCategories((prev) => prev.filter((c) => c.toLowerCase() !== catToDelete.toLowerCase()));
    if (category === catToDelete) {
      setCategory('');
    }
  };

  const presetImages = [
    { label: 'Bowl Saludable', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80' },
    { label: 'Salmón Grill', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBgTGnZnjsK70nGSrP-ENtWJxi04tJLoarv_LJrV4ue17CkKhLiyb_pFOfaDKXUQtZr6AMaC0P0jw2iOQcvBLqbmueU5nSRbZZqwLyD-PmoO7iG_xZ2Edu1B8Hwq2xV8jP5GoodCJt4jD_BDsGCYfxW0z0_wvhEtP_YkDuESpnQY2-tFVe-cGxpIxtp6LPVM9AtEGZzLtVuIok1BiltYmrAqjoPgeF1a6F_ZY_jYnp76OYV3Gb-rcSu' },
    { label: 'Ensalada Fresca', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDsdJwCKsZpeHNtSdm8txnbrxNfFmjL-K_CLN8e4OENPv8lM80ciD64H6c-64BJ2K8lusxS9LZ4LxLS4zzgJ6H1s0zLHl6ZdGx2_Vuk1Mj3uT6eWNVHpGliVe6OUt81HtuRKlLJHIOjE8HoxHd8oaq2JdNL0WXgoVLd8T6fs7pZcKg3_1K9e8CkROlB7gxLiwSkZ9kUYlYJuntMCI0SrTCFVJcE_ZrD8FqxGeoClsVe6DQVC-mJTA3t' },
    { label: 'Sopa / Crema', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT6EdnW4sWsMk5IFVwsog_IY2H9PL_b5N1JOcnZXtEAeHkZcQm_SCnAEHdloKi1K-RoMWaW4Mi9rWJeYh7SvMye0DElUwx8MZSbF4_gEEos-qjwkL5KIOsRUzueJj5o9MjwlPqQaevMmYtl98bkOB3s_fwRokmcJQNHdoic01Nz4JLOBqPSJa8S5VpPNOVxuixiuTLPNHWDT8DJKLZwymmY3xrWNzQgW00kHI3fTVHCaJscxaR_ivL' },
    { label: 'Risotto / Pasta', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAkPO7r9JqQ0fSQ9F2dAp39sjJD1V-jsj_0wk1wECyUZHvNvFAOu9v28iShdzK5Uptad0bG8i0KdqGl7H-u_WUsnabd19tqZGB2H2IH9PVTH-rsr8JFsrvsPPLdZmR4_k4NOOPBMS_Pf796ERAeryieqPCmV8eSxC91AuZJSpTndboZ2HGmK1jLQiFF0dncoV4_n6DEd1FKBpuzZdzMmQgjCu6nAddrzVe3xp4cbb9t-UIA4xbpyoty' },
  ];

  const handleExtractWithAI = async () => {
    if (!urlInput.trim()) {
      setExtractError('Por favor ingresa una URL o el nombre de una receta');
      return;
    }
    setIsExtracting(true);
    setExtractError(null);

    try {
      const res = await fetch('/api/ai/extract-recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al extraer la receta');
      }

      if (data.name) setName(data.name);
      if (data.description) setDescription(data.description);
      if (data.timeMinutes) setTimeMinutes(String(data.timeMinutes));
      if (data.calories) setCalories(String(data.calories));
      if (data.servings) setServings(String(data.servings));
      if (data.category) {
        setCategory(data.category);
        if (!availableCategories.includes(data.category)) {
          if (onAddCategory) onAddCategory(data.category);
          setLocalCategories((prev) => [...prev, data.category]);
        }
      }
      if (data.difficulty) setDifficulty(data.difficulty as Difficulty);
      if (data.ingredients && Array.isArray(data.ingredients)) setIngredients(data.ingredients);
      if (data.instructions && Array.isArray(data.instructions)) {
        setInstructionsText(data.instructions.map((inst: string, i: number) => `${i + 1}. ${inst}`).join('\n'));
      }
      if (data.imageUrl) setImageUrl(data.imageUrl);
    } catch (err: any) {
      setExtractError(err.message || 'No se pudo extraer la receta con IA');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setIngredients([...ingredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const instructionsArray = instructionsText
      .split('\n')
      .map((s) => s.replace(/^\d+\.\s*/, '').trim())
      .filter((s) => s.length > 0);

    const chosenCategory = category.trim() || availableCategories[0] || 'General';
    const numMinutes = timeMinutes ? Number(timeMinutes) : 20;
    const numCalories = calories ? Number(calories) : 350;
    const numServings = servings ? Number(servings) : 1;

    onSaveRecipe({
      name: name.trim(),
      description: description.trim(),
      timeMinutes: numMinutes,
      calories: numCalories,
      servings: numServings,
      category: chosenCategory,
      difficulty,
      tags: [chosenCategory, difficulty, `${numMinutes}m`],
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&auto=format&fit=crop&q=80',
      ingredients: ingredients.filter((i) => i.trim().length > 0),
      instructions: instructionsArray,
      sourceUrl: urlInput.trim()
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-xs md:text-sm font-semibold text-[#404943] hover:text-[#0f5238] flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Recetario</span>
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-[#191c1d] font-heading">
          Añadir Nueva Receta
        </h2>
        <div className="w-16" />
      </div>

      {/* Import with AI Banner (matching design) */}
      <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#fc8a40]/15 text-[#9b4500]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#191c1d] font-heading">
              Importar Receta desde URL o Nombre
            </h3>
            <p className="text-xs text-[#707973]">
              Pega un enlace de cualquier blog de cocina o escribe una idea de plato y la IA autocompletará los ingredientes, tiempos e instrucciones.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://ejemplo.com/receta-deliciosa o 'Salmón con salsa tártara y arroz'"
            className="flex-1 px-3.5 py-2.5 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238] focus:ring-1 focus:ring-[#0f5238]"
          />
          <button
            type="button"
            onClick={handleExtractWithAI}
            disabled={isExtracting}
            className="bg-[#fc8a40] hover:bg-[#9b4500] text-white text-xs md:text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 active:scale-98"
          >
            {isExtracting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Extrayendo con IA...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Extraer Datos con IA</span>
              </>
            )}
          </button>
        </div>

        {extractError && (
          <div className="p-2.5 rounded-lg bg-[#ffdad6] text-[#ba1a1a] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{extractError}</span>
          </div>
        )}
      </div>

      {/* Main Recipe Form */}
      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-6">
        {/* Photo Upload & Preview Section */}
        <div>
          <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">
            Foto de la Receta
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
            <div className="md:col-span-1">
              <div className="h-44 rounded-xl overflow-hidden border border-[#bfc9c1] bg-[#f8f9fa] relative group flex items-center justify-center">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Preview de receta"
                    className="w-full h-full object-cover"
                    onError={() => setImageUrl('')}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 text-center text-[#707973]">
                    <ImageIcon className="w-8 h-8 mb-2 text-[#bfc9c1]" />
                    <span className="text-xs font-semibold">Sin imagen</span>
                    <span className="text-[11px] text-[#707973] mt-0.5">Elige un preset o pega una URL</span>
                  </div>
                )}
              </div>
            </div>
            <div className="md:col-span-2 space-y-3">
              <p className="text-xs text-[#707973]">
                Selecciona una imagen sugerida o ingresa una URL personalizada:
              </p>
              <div className="flex flex-wrap gap-2">
                {presetImages.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                      imageUrl === preset.url
                        ? 'bg-[#0f5238] text-white border-[#0f5238]'
                        : 'bg-[#f8f9fa] text-[#404943] border-[#bfc9c1] hover:bg-[#e7e8e9]'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="URL de la imagen (https://...)"
                className="w-full px-3 py-2 text-xs bg-[#f8f9fa] border border-[#bfc9c1] rounded-lg focus:outline-none focus:border-[#0f5238]"
              />
            </div>
          </div>
        </div>

        {/* Basic Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
              Nombre de la Receta *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Salmón a la Plancha con Espárragos"
              className="w-full px-3.5 py-2.5 text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238] focus:ring-1 focus:ring-[#0f5238]"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
              Descripción Breve
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ej: Filete de salmón dorado con espárragos frescos y quinoa aromatizada."
              className="w-full px-3.5 py-2 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
              Tiempo (minutos)
            </label>
            <input
              type="number"
              min="1"
              value={timeMinutes}
              onChange={(e) => setTimeMinutes(e.target.value)}
              placeholder="Ej: 25"
              className="w-full px-3.5 py-2 text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
              Calorías (kcal por porción)
            </label>
            <input
              type="number"
              min="1"
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              placeholder="Ej: 450"
              className="w-full px-3.5 py-2 text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
              Porciones
            </label>
            <input
              type="number"
              min="1"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="Ej: 2"
              className="w-full px-3.5 py-2 text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
              Categoría *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2 text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
            >
              <option value="">-- Seleccionar categoría --</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Categorías Management: Add new and delete existing categories */}
          <div className="md:col-span-2 p-4 bg-[#f8f9fa] border border-[#e1e3e4] rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-[#0f5238]" />
                <span className="text-xs font-bold text-[#191c1d] uppercase tracking-wider">
                  Gestión de Categorías ({availableCategories.length})
                </span>
              </div>
              <span className="text-[11px] text-[#707973]">
                Puedes crear nuevas o borrar las que no uses
              </span>
            </div>

            {/* List of categories with delete icon */}
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => (
                <span
                  key={cat}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    category === cat
                      ? 'bg-[#b1f0ce]/60 border-[#0f5238] text-[#0f5238]'
                      : 'bg-white border-[#bfc9c1] text-[#404943]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setCategory(cat)}
                    className="cursor-pointer hover:underline"
                    title={`Seleccionar ${cat}`}
                  >
                    {cat}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCategoryItem(cat);
                    }}
                    title={`Eliminar categoría ${cat}`}
                    className="p-0.5 rounded hover:bg-[#ffdad6] text-[#ba1a1a] transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>

            {/* Add new category form */}
            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddNewCategory();
                  }
                }}
                placeholder="Nombre de nueva categoría (ej: Vegano, Postre, Airfryer...)"
                className="flex-1 px-3 py-2 text-xs md:text-sm bg-white border border-[#bfc9c1] rounded-lg focus:outline-none focus:border-[#0f5238]"
              />
              <button
                type="button"
                onClick={handleAddNewCategory}
                className="px-3.5 py-2 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-2xs transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir Categoría</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dificultad Buttons */}
        <div>
          <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">
            Dificultad
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['Fácil', 'Medio', 'Difícil'] as Difficulty[]).map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setDifficulty(diff)}
                className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  difficulty === diff
                    ? 'bg-[#0f5238] text-white shadow-xs'
                    : 'bg-[#f8f9fa] text-[#404943] border border-[#bfc9c1] hover:bg-[#e7e8e9]'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Ingredientes List */}
        <div>
          <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">
            Ingredientes ({ingredients.length})
          </label>
          <div className="space-y-2 mb-3">
            {ingredients.length === 0 ? (
              <p className="text-xs text-[#707973] italic py-1">
                Sin ingredientes añadidos. Escribe un ingrediente y pulsa Añadir o presiona Enter.
              </p>
            ) : (
              ingredients.map((ing, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#e7e8e9] text-[#404943] text-xs font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={ing}
                    onChange={(e) => {
                      const updated = [...ingredients];
                      updated[idx] = e.target.value;
                      setIngredients(updated);
                    }}
                    className="flex-1 px-3 py-1.5 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-lg focus:outline-none focus:border-[#0f5238]"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(idx)}
                    className="p-1.5 text-[#ba1a1a] hover:bg-[#ffdad6] rounded-lg transition-colors cursor-pointer"
                    title="Eliminar ingrediente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add ingredient input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newIngredient}
              onChange={(e) => setNewIngredient(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddIngredient();
                }
              }}
              placeholder="Ej: 100g Tomates cherry en mitades..."
              className="flex-1 px-3 py-2 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-lg focus:outline-none focus:border-[#0f5238]"
            />
            <button
              type="button"
              onClick={handleAddIngredient}
              className="px-4 py-2 bg-[#f3f4f5] hover:bg-[#e7e8e9] text-[#0f5238] font-semibold text-xs rounded-lg border border-[#bfc9c1] flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir</span>
            </button>
          </div>
        </div>

        {/* Instrucciones */}
        <div>
          <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">
            Instrucciones de Preparación
          </label>
          <textarea
            rows={5}
            value={instructionsText}
            onChange={(e) => setInstructionsText(e.target.value)}
            placeholder="1. Preparar los ingredientes...&#10;2. Cocinar a fuego medio...&#10;3. Emplatar y disfrutar."
            className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238] custom-scrollbar"
          />
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-[#e1e3e4] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-[#707973] hover:text-[#191c1d] hover:bg-[#f3f4f5] transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#0f5238] hover:bg-[#2d6a4f] text-white font-semibold text-xs md:text-sm rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer active:scale-98"
          >
            <Check className="w-4 h-4" />
            <span>Guardar Receta</span>
          </button>
        </div>
      </form>
    </div>
  );
};
