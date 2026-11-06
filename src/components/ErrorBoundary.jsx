import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ error: this.state.error, reset: this.handleReset })
          : this.props.fallback;
      }

      return (
        <div className="p-6 md:p-8 rounded-2xl border border-red-200 bg-red-50/70 text-red-900 my-4 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-sm text-red-900 mb-1">
                {this.props.title || "Couldn't load this section"}
              </h3>
              <p className="text-xs text-red-700/90 leading-relaxed mb-4">
                {this.state.error?.message || "An unexpected error occurred while rendering this component."}
              </p>
              <button
                onClick={this.handleReset}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 transition-colors shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

