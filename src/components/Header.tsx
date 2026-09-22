import React from 'react';
import {
  Menu,
  CloudCheck,
  Sparkles,
  RefreshCw,
  PlusCircle,
  Database,
  LogIn,
  LogOut
} from 'lucide-react';
import { NavTab } from '../types';
import { SPANISH_MONTHS } from '../utils/dateHelpers';

interface HeaderProps {
  title: string;
  onOpenMobileMenu?: () => void;
  onSyncGit?: () => void;
  isSyncing?: boolean;
  onOpenNewRecipe?: () => void;
  onOpenGenerateAI?: () => void;
  activeTab: NavTab['id'];
  onSelectTab: (tab: NavTab['id']) => void;
  currentUser?: { email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
  onLogin?: () => void;
  onLogout?: () => void;
  firebaseConnected?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  onOpenMobileMenu,
  onSyncGit,
  isSyncing,
  onOpenNewRecipe,
  onOpenGenerateAI,
  activeTab,
  onSelectTab,
  currentUser,
  onLogin,
  onLogout,
  firebaseConnected = true,
}) => {
  const now = new Date();
  const currentMonthYear = `${SPANISH_MONTHS[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <header className="flex justify-between items-center w-full px-4 md:px-8 h-16 z-30 bg-white/95 backdrop-blur-md border-b border-[#e1e3e4] sticky top-0 shrink-0">
      {/* Mobile Brand / Menu Button */}
      <div className="flex items-center gap-3 md:hidden">
        <button
          onClick={onOpenMobileMenu}
          className="p-1.5 rounded-lg text-[#404943] hover:bg-[#edeeef] cursor-pointer"
          aria-label="Abrir Menú"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#0f5238] flex items-center justify-center text-white font-bold text-xs font-heading">
            M
          </div>
          <span className="font-bold text-[#0f5238] text-base font-heading">
            MenuMaster
          </span>
        </div>
      </div>

      {/* Desktop Title & Current Context */}
      <div className="hidden md:flex items-center gap-3">
        <h2 className="text-xl font-bold text-[#191c1d] font-heading">
          {title}
        </h2>
        {activeTab === 'weekly' && (
          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#b1f0ce] text-[#002114] border border-[#95d4b3]">
            {currentMonthYear}
          </span>
        )}
      </div>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Firebase Cloud status badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#f0f4f1] text-[#0f5238] border border-[#d2ddd6]">
          <Database className="w-3.5 h-3.5 text-[#0f5238]" />
          <span>{currentUser ? 'Firebase Nube Activa' : 'Firestore Conectado'}</span>
        </div>

        {onSyncGit && (
          <button
            onClick={onSyncGit}
            disabled={isSyncing}
            className="flex items-center gap-1.5 bg-[#9b4500] hover:bg-[#763300] text-white text-xs md:text-sm font-semibold px-3 md:px-4 py-1.5 md:py-2 rounded-full transition-all shadow-xs cursor-pointer disabled:opacity-75"
          >
            <CloudCheck className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">
              {isSyncing ? 'Sincronizando...' : 'Exportar Git'}
            </span>
          </button>
        )}

        {onOpenNewRecipe && (
          <button
            onClick={onOpenNewRecipe}
            className="p-2 rounded-full text-[#404943] hover:text-[#0f5238] hover:bg-[#edeeef] transition-colors cursor-pointer"
            title="Añadir Receta"
          >
            <PlusCircle className="w-5 h-5" />
          </button>
        )}

        {onOpenGenerateAI && (
          <button
            onClick={onOpenGenerateAI}
            className="p-2 rounded-full text-[#9b4500] hover:bg-[#ffdbc9] transition-colors cursor-pointer"
            title="Generar Plan con IA"
          >
            <Sparkles className="w-5 h-5" />
          </button>
        )}

        {/* User Account / Login */}
        {currentUser ? (
          <div className="flex items-center gap-2 pl-1 border-l border-[#e1e3e4]">
            <div
              className="w-8 h-8 rounded-full overflow-hidden border border-[#0f5238] flex items-center justify-center bg-[#0f5238] text-white text-xs font-bold"
              title={currentUser.email || currentUser.displayName || 'Usuario'}
            >
              {currentUser.photoURL ? (
                <img
                  src={currentUser.photoURL}
                  alt={currentUser.displayName || 'Usuario'}
                  className="w-full h-full object-cover"
                />
              ) : (
                (currentUser.displayName || currentUser.email || 'U')[0].toUpperCase()
              )}
            </div>
            {onLogout && (
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="hidden sm:flex text-xs text-[#707973] hover:text-[#ba1a1a] p-1 rounded-md cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        ) : (
          onLogin && (
            <button
              onClick={onLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-full shadow-2xs transition-all cursor-pointer"
              title="Iniciar sesión con Google para sincronizar tus datos"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Conectar Google</span>
            </button>
          )
        )}
      </div>
    </header>
  );
};
