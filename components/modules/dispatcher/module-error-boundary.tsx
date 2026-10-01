"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModuleErrorBoundaryProps {
  moduleType?: string;
  moduleId?: string;
  isEditor?: boolean;
  children: ReactNode;
  fallbackMessage?: string;
}

interface ModuleErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Robust React Error Boundary protecting against 'White Screen of Death'.
 * Catches any render crashes inside modules and provides role-aware fallbacks.
 */
export class ModuleErrorBoundary extends Component<
  ModuleErrorBoundaryProps,
  ModuleErrorBoundaryState
> {
  constructor(props: ModuleErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ModuleErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(
      `[ModuleErrorBoundary] Error in module ${this.props.moduleType || "unknown"}:`,
      error,
      errorInfo
    );
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { moduleType = "Neznámy modul", isEditor = false } = this.props;

      // 1. Editor mode (PageBuilder Admin): Detailed actionable error box for the designer
      if (isEditor) {
        return (
          <div className="border border-rose-500/40 rounded-[3px] p-4 bg-rose-950/20 text-rose-200 space-y-3 shadow-2xs my-2">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Chyba pri načítaní modulu: <span className="font-mono">{moduleType}</span>
                </h4>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={this.handleRetry}
                className="h-6 px-2 text-[11px] rounded-[2px] border-rose-700/50 hover:bg-rose-900/40 text-rose-200 gap-1"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Skúsiť znova</span>
              </Button>
            </div>

            <p className="text-xs text-rose-300/80 leading-relaxed">
              Modul sa nepodarilo vyrenderovať. Skontrolujte prosím JSON konfiguráciu v editore
              alebo nastavenie premenných.
            </p>

            {this.state.error?.message && (
              <div className="p-2 rounded-[2px] bg-neutral-950/60 border border-rose-900/30 font-mono text-[10px] text-rose-300/90 overflow-x-auto">
                {this.state.error.message}
              </div>
            )}
          </div>
        );
      }

      // 2. Public view mode: Graceful, unobtrusive placeholder ("Obsah sa pripravuje")
      return (
        <div className="border border-border/40 rounded-[3px] p-6 bg-card/40 text-center my-2 transition-all">
          <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
            <FileQuestion className="h-6 w-6 text-muted-foreground/60" />
            <p className="text-xs font-medium text-foreground/80">
              {this.props.fallbackMessage || "Obsah sa pripravuje."}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
