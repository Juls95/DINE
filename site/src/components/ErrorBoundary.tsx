import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { label: string; children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    window.dispatchEvent(new CustomEvent("rdc:error", { detail: { label: this.props.label, message: error.message, stack: info.componentStack } }));
  }

  override render() {
    if (this.state.error) {
      return (
        <div className="error-box" role="alert">
          <strong>{this.props.label}: no se pudo mostrar.</strong>
          <span>{this.state.error.message}</span>
        </div>
      );
    }
    return this.props.children;
  }
}
