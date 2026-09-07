import React, { Component, ReactNode, ErrorInfo } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
  }

  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
  }

  private handleReset = () => {
    localStorage.clear();
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#f8f9fa] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-md border border-[#e1e3e4] text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-[#ba1a1a]/10 text-[#ba1a1a] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#191c1d] font-heading">
              Algo ha salido mal
            </h2>
            <p className="text-sm text-[#707973]">
              Ha ocurrido un error inesperado al renderizar la aplicación. Puedes reiniciar los datos locales o recargar la página.
            </p>
            {this.state.error && (
              <div className="bg-[#f3f4f5] p-3 rounded-lg text-left text-xs font-mono text-[#ba1a1a] overflow-x-auto max-h-32">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#0f5238] hover:bg-[#2d6a4f] text-white text-xs font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Recargar página
              </button>
              <button
                onClick={this.handleReset}
                className="px-4 py-2 bg-[#edeeef] hover:bg-[#e1e3e4] text-[#191c1d] text-xs font-semibold rounded-xl cursor-pointer transition-colors"
              >
                Reiniciar caché
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
