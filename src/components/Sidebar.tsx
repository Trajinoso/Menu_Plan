import React from 'react';
import {
  CalendarDays,
  CalendarRange,
  BookOpen,
  History,
  Settings,
  HelpCircle,
  Shield,
  Sparkles,
  Plus,
  CloudCheck
} from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  currentTab: NavTab['id'];
  onSelectTab: (tab: NavTab['id']) => void;
  onOpenNewMenu: () => void;
  onOpenGenerateAI: () => void;
  gitConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenNewMenu,
  onOpenGenerateAI,
  gitConnected,
}) => {
  const navItems = [
    { id: 'weekly' as const, label: 'Planificador Semanal', icon: CalendarDays },
    { id: 'monthly' as const, label: 'Vista Mensual', icon: CalendarRange },
    { id: 'recipes' as const, label: 'Recetario', icon: BookOpen },
    { id: 'history' as const, label: 'Historial', icon: History },
    { id: 'settings' as const, label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col h-screen w-64 fixed left-0 top-0 bg-[#f3f4f5] border-r border-[#e1e3e4] py-4 z-40 shadow-sm">
      {/* Brand Header */}
      <div className="px-6 mb-6 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-[#0f5238] flex items-center justify-center text-white font-bold text-lg shadow-sm font-heading">
          M
        </div>
        <div>
          <h1 className="text-xl font-bold text-[#0f5238] leading-tight font-heading">
            MenuMaster
          </h1>
          <p className="text-xs text-[#707973] flex items-center gap-1 font-medium">
            <span className={`w-2 h-2 rounded-full ${gitConnected ? 'bg-[#0f5238]' : 'bg-[#fc8a40]'}`} />
            {gitConnected ? 'Sincronización Git Activa' : 'Sin sincronizar'}
          </p>
        </div>
      </div>

      {/* CTA Nuevo Menú */}
      <div className="px-5 mb-5">
        <button
          onClick={onOpenNewMenu}
          className="w-full bg-[#fc8a40] hover:bg-[#9b4500] text-white font-semibold text-sm py-2.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center space-x-2 active:scale-98 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo Menú</span>
        </button>
      </div>

      {/* Navigation Links */}
      <ul className="flex-1 px-3 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <li key={item.id}>
              <button
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl transition-all text-left text-sm font-medium cursor-pointer ${
                  isActive
                    ? 'bg-[#e7e8e9] text-[#0f5238] font-bold border-r-4 border-[#0f5238] shadow-xs translate-x-0.5'
                    : 'text-[#404943] hover:bg-[#e1e3e4] hover:text-[#191c1d]'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-[#0f5238] stroke-[2.5]' : 'text-[#707973]'}`} />
                <span>{item.label}</span>
              </button>
            </li>
          );
        })}
      </ul>

      {/* AI Generator CTA button in footer */}
      <div className="px-5 mb-4">
        <button
          onClick={onOpenGenerateAI}
          className="w-full bg-[#9b4500] hover:bg-[#763300] text-white text-xs font-semibold py-2.5 px-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-[#ffb68d]" />
          <span>Generar Plan IA</span>
        </button>
      </div>

      {/* Footer User & Links */}
      <div className="mt-auto px-4 pt-3 border-t border-[#e1e3e4] space-y-2">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-lg bg-white/70 border border-[#e1e3e4]/60">
          <img
            src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=120&auto=format&fit=crop&q=80"
            alt="Chef Admin"
            className="w-8 h-8 rounded-full object-cover border border-[#bfc9c1]"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#191c1d] truncate">Chef Pro</p>
            <p className="text-[10px] text-[#707973] truncate">Cocina Inteligente</p>
          </div>
        </div>

        <div className="flex justify-between items-center px-2 text-[11px] text-[#707973]">
          <button onClick={() => onSelectTab('settings')} className="hover:text-[#0f5238] flex items-center gap-1 cursor-pointer">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ayuda</span>
          </button>
          <span>•</span>
          <button onClick={() => onSelectTab('settings')} className="hover:text-[#0f5238] flex items-center gap-1 cursor-pointer">
            <Shield className="w-3.5 h-3.5" />
            <span>Privacidad</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
