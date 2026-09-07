import React, { useState } from 'react';
import {
  Sparkles,
  Loader2,
  X,
  CheckCircle2,
  Flame,
  Utensils,
  Calendar
} from 'lucide-react';

interface GeneratePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlanGenerated: (planData: any) => void;
}

export const GeneratePlanModal: React.FC<GeneratePlanModalProps> = ({
  isOpen,
  onClose,
  onPlanGenerated,
}) => {
  const [dietType, setDietType] = useState('Equilibrada con alto contenido proteico');
  const [targetCalories, setTargetCalories] = useState(2200);
  const [specificPreferences, setSpecificPreferences] = useState('Cenas ligeras, almuerzos energéticos y platos ricos en fibra.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const dietOptions = [
    'Equilibrada con alto contenido proteico',
    'Vegetariana / Vegana',
    'Sabores de Otoño / Temporada',
    'Keto / Baja en Carbohidratos',
    'Mediterránea Tradicional',
    'Comidas Rápidas (menos de 20 min)'
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: 'week',
          dietType,
          targetCalories,
          specificPreferences
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al generar el menú con IA');
      }

      onPlanGenerated(data);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'No se pudo generar el plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-5 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex justify-between items-start pb-3 border-b border-[#e1e3e4]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#fc8a40]/15 text-[#9b4500]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                Generador de Menú con IA
              </h3>
              <p className="text-xs text-[#707973]">
                Crea un plan semanal balanceado impulsado por Gemini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#707973] hover:text-[#191c1d] hover:bg-[#edeeef] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-2">
              Tipo de Dieta o Enfoque
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {dietOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setDietType(opt)}
                  className={`text-left p-2.5 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                    dietType === opt
                      ? 'bg-[#0f5238] text-white border-[#0f5238] shadow-xs'
                      : 'bg-[#f8f9fa] text-[#404943] border-[#bfc9c1] hover:bg-[#e7e8e9]'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
              <span>Objetivo Calórico Diario</span>
              <span className="text-[#9b4500] font-bold text-sm">~{targetCalories} kcal</span>
            </div>
            <input
              type="range"
              min="1400"
              max="3200"
              step="50"
              value={targetCalories}
              onChange={(e) => setTargetCalories(Number(e.target.value))}
              className="w-full accent-[#0f5238] cursor-pointer"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
              Instrucciones o Preferencias Específicas
            </label>
            <textarea
              rows={3}
              value={specificPreferences}
              onChange={(e) => setSpecificPreferences(e.target.value)}
              placeholder="Ej: Cenas ligeras, sin mariscos, platos fáciles de preparar..."
              className="w-full px-3.5 py-2 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
            />
          </div>

          {errorMessage && (
            <div className="p-3 bg-[#ffdad6] text-[#ba1a1a] text-xs rounded-xl">
              {errorMessage}
            </div>
          )}

          <div className="pt-3 border-t border-[#e1e3e4] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-[#707973] hover:text-[#191c1d]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-5 py-2.5 bg-[#fc8a40] hover:bg-[#9b4500] text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer disabled:opacity-75 active:scale-98"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Diseñando Menú con IA...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generar y Aplicar Plan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
