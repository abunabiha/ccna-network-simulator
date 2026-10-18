import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Copy, Check } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    copied: false
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetState = () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch (e) {
      console.warn('Could not clear storage:', e);
    }
    if (this.props.onReset) {
      this.props.onReset();
    }
    window.location.reload();
  };

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleCopyError = () => {
    const text = `Error: ${this.state.error?.message || 'Unknown'}\n\nStack:\n${this.state.error?.stack || ''}\n\nComponent Stack:\n${this.state.errorInfo?.componentStack || ''}`;
    navigator.clipboard.writeText(text).then(() => {
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[280px] w-full h-full flex items-center justify-center bg-slate-950 p-6 text-slate-100">
          <div className="max-w-xl w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/80 border border-rose-500/50 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <div>
                <h2 className="text-base font-bold text-rose-300">
                  {this.props.fallbackTitle || 'Terjadi Gangguan pada Tampilan Simulator'}
                </h2>
                <p className="text-xs text-slate-400">
                  Komponen simulator mendeteksi error runtime dan mencegah crash layar putih (white screen).
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-rose-300 max-h-36 overflow-y-auto whitespace-pre-wrap select-text">
              {this.state.error?.message || 'Unknown rendering error'}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Coba Pulihkan Tampilan</span>
              </button>

              <button
                onClick={this.handleReload}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition-colors"
              >
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                onClick={this.handleResetState}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-950/70 hover:bg-rose-900 border border-rose-800/60 text-rose-300 rounded-lg text-xs font-medium transition-colors"
                title="Hapus cache dan set ulang canvas"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Reset Canvas & Cache</span>
              </button>

              <button
                onClick={this.handleCopyError}
                className="ml-auto flex items-center gap-1 px-2.5 py-1.5 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              >
                {this.state.copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{this.state.copied ? 'Tersalin' : 'Salin Detail'}</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
