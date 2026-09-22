import React, { useState, useRef } from 'react';
import {
  GitBranch,
  Key,
  FolderGit2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileCode2,
  Download,
  Upload,
  AlertCircle,
  Database,
  CloudCheck,
  LogIn,
  LogOut,
  HardDriveDownload,
  CloudUpload
} from 'lucide-react';
import { GitSyncConfig, AISettingsConfig } from '../types';

export interface SettingsViewProps {
  gitConfig: GitSyncConfig;
  aiSettings: AISettingsConfig;
  onSaveGitConfig: (config: Partial<GitSyncConfig>) => void;
  onSaveAISettings: (settings: Partial<AISettingsConfig>) => void;
  onForceSync: () => Promise<{ success: boolean; markdownPreview?: string }>;
  isSyncing: boolean;
  currentUser?: { email?: string | null; displayName?: string | null; photoURL?: string | null } | null;
  onLoginWithGoogle?: () => Promise<void>;
  onLogoutGoogle?: () => Promise<void>;
  onSyncToFirebase?: () => Promise<void>;
  onRestoreFromFirebase?: () => Promise<void>;
  onExportJsonBackup?: () => void;
  onImportJsonBackup?: (file: File) => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  gitConfig,
  aiSettings,
  onSaveGitConfig,
  onSaveAISettings,
  onForceSync,
  isSyncing,
  currentUser,
  onLoginWithGoogle,
  onLogoutGoogle,
  onSyncToFirebase,
  onRestoreFromFirebase,
  onExportJsonBackup,
  onImportJsonBackup,
}) => {
  // Git local states
  const [repoUrl, setRepoUrl] = useState(gitConfig.repoUrl || '');
  const [branch, setBranch] = useState(gitConfig.branch || 'main');
  const [token, setToken] = useState(gitConfig.token || '');
  const [gitSavedMessage, setGitSavedMessage] = useState(false);

  // AI local states
  const [systemInstruction, setSystemInstruction] = useState(aiSettings.systemInstruction || '');
  const [preferredDiet, setPreferredDiet] = useState(aiSettings.preferredDiet || 'Equilibrada con alto contenido proteico');
  const [aiSavedMessage, setAiSavedMessage] = useState(false);

  // Firebase operation states
  const [isFirebaseSyncing, setIsFirebaseSyncing] = useState(false);
  const [firebaseMessage, setFirebaseMessage] = useState<string | null>(null);

  // Sync result preview
  const [previewMd, setPreviewMd] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveGit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveGitConfig({
      repoUrl,
      branch,
      token,
      isConnected: Boolean(repoUrl && token),
      statusText: repoUrl ? 'Conectado y Activo' : 'No Conectado'
    });
    setGitSavedMessage(true);
    setTimeout(() => setGitSavedMessage(false), 2000);
  };

  const handleSaveAI = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveAISettings({
      systemInstruction,
      preferredDiet
    });
    setAiSavedMessage(true);
    setTimeout(() => setAiSavedMessage(false), 2000);
  };

  const handleTriggerSync = async () => {
    const res = await onForceSync();
    if (res.markdownPreview) {
      setPreviewMd(res.markdownPreview);
    }
  };

  const handlePushToFirebase = async () => {
    if (!onSyncToFirebase) return;
    setIsFirebaseSyncing(true);
    setFirebaseMessage(null);
    try {
      await onSyncToFirebase();
      setFirebaseMessage('¡Datos subidos y guardados con éxito en Firebase Firestore!');
      setTimeout(() => setFirebaseMessage(null), 4000);
    } catch (err: any) {
      setFirebaseMessage('Error al sincronizar con Firebase: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handlePullFromFirebase = async () => {
    if (!onRestoreFromFirebase) return;
    setIsFirebaseSyncing(true);
    setFirebaseMessage(null);
    try {
      await onRestoreFromFirebase();
      setFirebaseMessage('¡Datos descargados y sincronizados desde Firebase Firestore!');
      setTimeout(() => setFirebaseMessage(null), 4000);
    } catch (err: any) {
      setFirebaseMessage('Error al descargar de Firebase: ' + (err?.message || 'Error desconocido'));
    } finally {
      setIsFirebaseSyncing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportJsonBackup) return;
    try {
      await onImportJsonBackup(file);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#e1e3e4] shadow-xs">
        <h2 className="text-2xl font-bold text-[#191c1d] font-heading">
          Configuración y Persistencia
        </h2>
        <p className="text-xs md:text-sm text-[#707973] mt-0.5">
          Gestiona la base de datos en la nube de Firebase, copias de seguridad locales y sincronización Git
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Cloud, Backups, Git & AI */}
        <div className="lg:col-span-2 space-y-6">

          {/* 1. Firebase Firestore Cloud Persistence Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#b1f0ce] shadow-xs space-y-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-[#e1e3e4]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#0f5238] text-white flex items-center justify-center shadow-xs">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#191c1d] font-heading flex items-center gap-2">
                    <span>Persistencia en la Nube (Google Firebase Firestore)</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#b1f0ce] text-[#002114]">
                      Permanente
                    </span>
                  </h3>
                  <p className="text-xs text-[#707973]">
                    Tus recetas, categorías, historial y planes quedan a salvo en los servidores de Google, inmunes a actualizaciones o republicaciones.
                  </p>
                </div>
              </div>
            </div>

            {/* Connection Status Box */}
            <div className="p-4 rounded-xl bg-[#f0f4f1] border border-[#d2ddd6] space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#0f5238] animate-pulse" />
                    <span className="text-xs font-bold text-[#0f5238]">
                      Base de Datos Firestore Provisionada
                    </span>
                  </div>
                  <p className="text-xs text-[#404943]">
                    {currentUser ? (
                      <span>Sesión iniciada con: <strong>{currentUser.email}</strong></span>
                    ) : (
                      <span>Conéctate con tu cuenta de Google (Gmail) para asociar y proteger tus datos.</span>
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {currentUser ? (
                    onLogoutGoogle && (
                      <button
                        onClick={onLogoutGoogle}
                        className="px-3 py-1.5 bg-white border border-[#bfc9c1] hover:bg-[#ffebee] hover:border-[#ffcdd2] text-[#ba1a1a] text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    )
                  ) : (
                    onLoginWithGoogle && (
                      <button
                        onClick={onLoginWithGoogle}
                        className="px-4 py-2 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-xs"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Iniciar Sesión con Google</span>
                      </button>
                    )
                  )}
                </div>
              </div>

              {/* Action Buttons for Cloud Sync */}
              <div className="pt-2 border-t border-[#d2ddd6] flex flex-wrap gap-2.5">
                <button
                  onClick={handlePushToFirebase}
                  disabled={isFirebaseSyncing}
                  className="px-3.5 py-2 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <CloudUpload className={`w-4 h-4 ${isFirebaseSyncing ? 'animate-spin' : ''}`} />
                  <span>Subir todo a Firebase ahora</span>
                </button>

                <button
                  onClick={handlePullFromFirebase}
                  disabled={isFirebaseSyncing}
                  className="px-3.5 py-2 bg-white hover:bg-[#e7e8e9] text-[#191c1d] border border-[#bfc9c1] text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-2xs"
                >
                  <HardDriveDownload className={`w-4 h-4 ${isFirebaseSyncing ? 'animate-spin' : ''}`} />
                  <span>Cargar todo desde Firebase</span>
                </button>
              </div>

              {firebaseMessage && (
                <div className="p-2.5 rounded-lg bg-white border border-[#b1f0ce] text-xs text-[#0f5238] font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#0f5238] shrink-0" />
                  <span>{firebaseMessage}</span>
                </div>
              )}
            </div>
          </div>

          {/* 2. Local Backup & Restore (JSON) Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-[#e1e3e4]">
              <div className="w-10 h-10 rounded-xl bg-[#fc8a40]/10 text-[#9b4500] flex items-center justify-center">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                  Copia de Seguridad y Restauración Manual (JSON)
                </h3>
                <p className="text-xs text-[#707973]">
                  Descarga un archivo JSON con todas tus recetas, categorías y menús, o restaura una copia guardada en tu ordenador
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={onExportJsonBackup}
                className="p-4 rounded-xl border border-[#e1e3e4] bg-[#f8f9fa] hover:bg-white hover:border-[#0f5238] text-left transition-all group cursor-pointer space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#191c1d] group-hover:text-[#0f5238]">
                    Descargar Copia JSON
                  </span>
                  <Download className="w-4 h-4 text-[#707973] group-hover:text-[#0f5238]" />
                </div>
                <p className="text-[11px] text-[#707973] leading-relaxed">
                  Guarda un archivo <code>menumaster_backup.json</code> en tu PC con todo el contenido actual.
                </p>
              </button>

              <label className="p-4 rounded-xl border border-[#e1e3e4] bg-[#f8f9fa] hover:bg-white hover:border-[#0f5238] text-left transition-all group cursor-pointer space-y-1.5 shadow-2xs block">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#191c1d] group-hover:text-[#0f5238]">
                    Restaurar desde JSON
                  </span>
                  <Upload className="w-4 h-4 text-[#707973] group-hover:text-[#0f5238]" />
                </div>
                <p className="text-[11px] text-[#707973] leading-relaxed">
                  Selecciona tu archivo de respaldo para repoblar al instante recetas, planes e historial.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 3. Repositorio Git Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#e1e3e4]">
              <div className="w-10 h-10 rounded-xl bg-[#0f5238]/10 text-[#0f5238] flex items-center justify-center">
                <FolderGit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                  Exportación y Repositorio Git
                </h3>
                <p className="text-xs text-[#707973]">
                  Exporta tus menús y recetas en Markdown/JSON limpios para versionar en tu repositorio
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveGit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
                  URL del Repositorio Git
                </label>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/usuario/planes-comida.git"
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
                    Rama (Branch)
                  </label>
                  <div className="relative">
                    <GitBranch className="w-4 h-4 text-[#707973] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      placeholder="main"
                      className="w-full pl-9 pr-3 py-2.5 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
                    Token de Acceso Personal (PAT)
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-[#707973] absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxx"
                      className="w-full pl-9 pr-3 py-2.5 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-xs text-[#707973] bg-[#f8f9fa] p-3 rounded-xl border border-[#e1e3e4]">
                <Lock className="w-4 h-4 text-[#0f5238] shrink-0" />
                <span>
                  Los datos se serializan en formato Markdown y JSON listos para descargar o commitear a tu repositorio.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {gitSavedMessage ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#b1f0ce]" />
                      <span>¡Guardado Correctamente!</span>
                    </>
                  ) : (
                    <span>Guardar Configuración Git</span>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 4. Configuración de Gemini AI Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-[#e1e3e4]">
              <div className="w-10 h-10 rounded-xl bg-[#fc8a40]/10 text-[#9b4500] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                  Configuración de Gemini AI
                </h3>
                <p className="text-xs text-[#707973]">
                  Personaliza el motor de extracción de recetas y el planificador inteligente
                </p>
              </div>
            </div>

            {/* Secrets & API Key Status Banner */}
            <div className={`p-4 rounded-xl border flex items-start gap-3.5 ${
              aiSettings.hasApiKey
                ? 'bg-[#e8f5ee] border-[#b1f0ce] text-[#0f5238]'
                : 'bg-[#fff4e5] border-[#ffcc80] text-[#9b4500]'
            }`}>
              <div className="p-1.5 rounded-lg bg-white/70 shadow-2xs mt-0.5">
                <Key className="w-4 h-4" />
              </div>
              <div className="flex-1 text-xs space-y-1">
                <div className="flex items-center justify-between font-bold text-sm">
                  <span>API Key de Gemini (Secrets)</span>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    aiSettings.hasApiKey
                      ? 'bg-[#0f5238] text-white'
                      : 'bg-[#9b4500] text-white'
                  }`}>
                    {aiSettings.hasApiKey ? '✓ Clave Activa' : '⚠ Pendiente en Secrets'}
                  </span>
                </div>
                <p className="leading-relaxed">
                  {aiSettings.hasApiKey
                    ? 'La clave GEMINI_API_KEY está configurada de forma segura en las variables de entorno del servidor. Los modelos Gemini Flash y Pro están listos para operar.'
                    : 'Para activar la IA en Google AI Studio, añade GEMINI_API_KEY en los Secrets del entorno (o en .env).'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAI} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
                  Preferencia Dietética Predeterminada
                </label>
                <input
                  type="text"
                  value={preferredDiet}
                  onChange={(e) => setPreferredDiet(e.target.value)}
                  placeholder="Equilibrada, Alta en Proteína, Vegetariana, etc."
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#404943] uppercase tracking-wider mb-1.5">
                  Instrucciones del Sistema para la IA (System Instruction)
                </label>
                <textarea
                  rows={3}
                  value={systemInstruction}
                  onChange={(e) => setSystemInstruction(e.target.value)}
                  placeholder="Instrucciones culinarias para ajustar el tono o cálculo de nutrientes..."
                  className="w-full px-3.5 py-2.5 text-xs md:text-sm bg-[#f8f9fa] border border-[#bfc9c1] rounded-xl focus:outline-none focus:border-[#0f5238]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5 text-xs text-[#0f5238] font-medium">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Gemini Flash & Fallback Activo</span>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#9b4500] hover:bg-[#763300] text-white text-xs md:text-sm font-semibold rounded-xl transition-all shadow-xs flex items-center gap-2 cursor-pointer"
                >
                  {aiSavedMessage ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-[#ffdbc9]" />
                      <span>¡Preferencias Guardadas!</span>
                    </>
                  ) : (
                    <span>Guardar Preferencias AI</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Column: Sync Status & Explanation Card */}
        <div className="space-y-6">
          {/* Sync Status Card */}
          <div className="bg-white p-6 rounded-2xl border border-[#e1e3e4] shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#191c1d] font-heading">
              Estado de Sincronización
            </h3>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8f9fa] border border-[#e1e3e4]">
              <span className="text-xs font-semibold text-[#404943]">Base de Datos</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f5238]">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0f5238] animate-pulse" />
                Firebase Firestore
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8f9fa] border border-[#e1e3e4]">
              <span className="text-xs font-semibold text-[#404943]">Repositorio Git</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0f5238]">
                <span className={`w-2.5 h-2.5 rounded-full ${gitConfig.isConnected ? 'bg-[#0f5238]' : 'bg-[#707973]'}`} />
                {gitConfig.statusText || (gitConfig.isConnected ? 'Conectado y Activo' : 'Exportación Local')}
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#f8f9fa] border border-[#e1e3e4]">
              <span className="text-xs font-semibold text-[#404943]">Última Sincronización</span>
              <span className="text-xs font-medium text-[#191c1d]">
                {gitConfig.lastSyncedAt || 'No sincronizado'}
              </span>
            </div>

            <button
              onClick={handleTriggerSync}
              disabled={isSyncing}
              className="w-full py-3 px-4 bg-[#fc8a40] hover:bg-[#9b4500] text-white font-bold text-xs md:text-sm rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 active:scale-98"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Exportando Archivos...' : 'Exportar a Markdown / Git'}</span>
            </button>
          </div>

          {/* Explanation Card */}
          <div className="bg-gradient-to-br from-[#0f5238] to-[#1e4d3a] text-white p-6 rounded-2xl shadow-md space-y-3 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
            <h3 className="text-base font-bold font-heading flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#b1f0ce]" />
              <span>Seguridad de Datos</span>
            </h3>
            <p className="text-xs text-[#b1f0ce] leading-relaxed">
              Con <strong>Firebase Firestore</strong>, tus datos están protegidos en la nube de Google. Las recetas, la planificación mensual y el historial no se borran al desplegar o actualizar versiones del código.
            </p>
            <div className="pt-2">
              <button
                onClick={handleTriggerSync}
                className="text-xs text-white font-semibold underline hover:text-[#b1f0ce] flex items-center gap-1 cursor-pointer"
              >
                <span>Ver vista previa serializada (.md)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Live Markdown Preview Modal after Sync */}
      {previewMd && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#e1e3e4] space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-[#e1e3e4]">
              <div className="flex items-center gap-2">
                <FileCode2 className="w-5 h-5 text-[#0f5238]" />
                <h3 className="text-lg font-bold text-[#191c1d] font-heading">
                  Exportación Serializada (menu_plan.md)
                </h3>
              </div>
              <button
                onClick={() => setPreviewMd(null)}
                className="text-[#707973] hover:text-[#191c1d] font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#1e1e1e] text-[#d4d4d4] font-mono text-xs p-4 rounded-xl overflow-auto flex-1 custom-scrollbar whitespace-pre-wrap">
              {previewMd}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-[#707973]">
                Archivo generado en <code>./data/git-export/menu_plan.md</code>
              </span>
              <button
                onClick={() => setPreviewMd(null)}
                className="px-5 py-2 bg-[#0f5238] text-white text-xs font-semibold rounded-xl hover:bg-[#2d6a4f] cursor-pointer"
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
