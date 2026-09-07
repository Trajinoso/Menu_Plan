import React, { useState } from 'react';
import {
  Search,
  History,
  Download,
  RotateCcw,
  Tag,
  Calendar,
  Check,
  Plus,
  ArrowUpRight,
  FileText
} from 'lucide-react';
import { HistoryArchiveItem, WeeklyPlan } from '../types';

interface HistoryViewProps {
  history: HistoryArchiveItem[];
  currentPlan: WeeklyPlan;
  onLoadPlan: (archiveId: string) => void;
  onArchiveCurrentPlan: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  history,
  currentPlan,
  onLoadPlan,
  onArchiveCurrentPlan,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [loadedId, setLoadedId] = useState<string | null>(null);

  const filters = ['Todos', 'Proteico', 'Vegetariano', 'Comidas Rápidas'];

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeFilter === 'Todos') return true;
    if (activeFilter === 'Proteico') return item.tags.some(t => t.toLowerCase().includes('proteico') || t.toLowerCase().includes('proteína'));
    if (activeFilter === 'Vegetariano') return item.tags.some(t => t.toLowerCase().includes('vegetariano'));
    if (activeFilter === 'Comidas Rápidas') return item.tags.some(t => t.toLowerCase().includes('rápido') || t.toLowerCase().includes('rápidas'));

    return true;
  });

  const handleExportPlan = (item: HistoryArchiveItem) => {
    const jsonStr = JSON.stringify(item.planData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${item.title.toLowerCase().replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (id: string) => {
    onLoadPlan(id);
    setLoadedId(id);
    setTimeout(() => {
      setLoadedId(null);
    }, 2000);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs">
        <div>
          <h2 className="text-2xl font-bold text-[#191c1d] font-heading">
            Historial de Planes Guardados
          </h2>
          <p className="text-xs md:text-sm text-[#707973]">
            Recupera y reutiliza menús semanales anteriores con un solo clic
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-[#707973] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por fecha o etiqueta..."
              className="w-full pl-9 pr-3 py-2 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
            />
          </div>

          <button
            onClick={onArchiveCurrentPlan}
            className="shrink-0 bg-[#fc8a40] hover:bg-[#9b4500] text-white text-xs md:text-sm font-semibold px-4 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>Archivar Plan Actual</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeFilter === f
                ? 'bg-[#0f5238] text-white shadow-xs'
                : 'bg-white text-[#404943] border border-[#e1e3e4] hover:bg-[#f3f4f5]'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* History Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredHistory.map((item) => {
          const isCurrentLoaded = loadedId === item.id;

          return (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-[#e1e3e4] p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
            >
              {/* Header inside Card */}
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex flex-wrap gap-1.5 mb-1.5">
                    {item.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] font-bold uppercase tracking-wider bg-[#b1f0ce]/40 text-[#002114] px-2 py-0.5 rounded-md border border-[#95d4b3]/60"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                  <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                    {item.title}
                  </h3>
                  <p className="text-xs text-[#707973]">
                    {item.totalDays} Días completados • {item.recipeCount} Recetas programadas
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleExportPlan(item)}
                    className="p-2 rounded-lg text-[#404943] hover:text-[#0f5238] hover:bg-[#f3f4f5] border border-[#bfc9c1] transition-colors cursor-pointer"
                    title="Exportar archivo JSON/Markdown"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleLoad(item.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isCurrentLoaded
                        ? 'bg-[#0f5238] text-white'
                        : 'bg-[#0f5238] hover:bg-[#2d6a4f] text-white shadow-2xs active:scale-98'
                    }`}
                  >
                    {isCurrentLoaded ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>¡Cargado!</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Cargar Plan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview thumbnails mosaic matching mockup */}
              <div className="grid grid-cols-3 gap-2">
                {item.previewRecipes.slice(0, 2).map((rec, idx) => (
                  <div
                    key={idx}
                    className="relative h-24 rounded-xl overflow-hidden bg-[#e1e3e4] border border-[#e1e3e4] group"
                  >
                    <img
                      src={rec.imageUrl}
                      alt={rec.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2">
                      <span className="text-[10px] font-medium text-white line-clamp-1">
                        {rec.name}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="h-24 rounded-xl bg-[#f8f9fa] border border-dashed border-[#bfc9c1] flex flex-col items-center justify-center text-center p-2">
                  <span className="text-base font-bold text-[#0f5238] font-heading">
                    +{item.recipeCount - 2 > 0 ? item.recipeCount - 2 : 8}
                  </span>
                  <span className="text-[10px] text-[#707973] font-medium">
                    Más recetas
                  </span>
                </div>
              </div>

              {/* Date footer */}
              <div className="text-[11px] text-[#707973] flex items-center justify-between pt-2 border-t border-[#e1e3e4]/60">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {item.startDate} al {item.endDate}
                </span>
                <span>Guardado: {item.createdAt}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
