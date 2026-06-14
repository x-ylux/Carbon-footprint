import { Component, type ErrorInfo, type ReactNode } from 'react';
import { TriangleAlert as AlertTriangle, RefreshCw, Hop as Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = '/';
  };

  handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
          <div className="max-w-md w-full text-center space-y-6 p-8 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-rose-500" aria-hidden="true" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold text-slate-800 dark:text-white">
                Something went wrong
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                An unexpected error occurred. Please try again or return to the home page.
              </p>
            </div>

            {import.meta.env.DEV && this.state.error && (
              <details className="text-left bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Error details
                </summary>
                <pre className="mt-2 text-xs text-rose-600 dark:text-rose-400 overflow-auto max-h-40">
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                type="button"
              >
                <RefreshCw className="w-4 h-4" aria-hidden="true" />
                Try Again
              </button>
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-forest-600 text-white font-semibold hover:bg-forest-700 transition-colors cursor-pointer"
                type="button"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
