import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import i18n from "../i18n";
import "./ErrorBoundary.css";

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <h1 className="error-boundary__title">{i18n.t("ui.errorBoundaryTitle", { defaultValue: "Something went wrong" })}</h1>
          <p className="error-boundary__message">{i18n.t("ui.errorBoundaryMessage", { defaultValue: "An unexpected error occurred. Please reload the page to continue." })}</p>
          <button type="button" className="error-boundary__button" onClick={() => window.location.reload()}>
            {i18n.t("ui.reload", { defaultValue: "Reload" })}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;