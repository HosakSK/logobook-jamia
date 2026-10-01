"use client";

import React, { createContext, useContext, useMemo } from "react";
import {
  BrandCascadeTokens,
  CascadeStyleOverrides,
} from "@/lib/types/module";
import {
  GlobalShapesRecord,
  GlobalColorsRecord,
  GlobalTypographyRecord,
} from "@/types/pocketbase-types";
import { BrandColor } from "@/lib/types/color";
import {
  computeBrandCssVariables,
  buildBrandCascadeTokens,
  resolveCascadeRadius,
  resolveCascadeColor,
  resolveCascadeBorderWidth,
  resolveCascadeStyleObject,
} from "@/lib/utils/cascade";

interface BrandCascadeContextValue {
  tokens: BrandCascadeTokens;
  cssVariables: Record<string, string>;
  resolveRadius: (override?: CascadeStyleOverrides) => string;
  resolveColor: (
    overrideColor?: string,
    fallbackRoleKey?: "primary" | "secondary" | "accent" | "neutral" | "success" | "warning" | "danger" | "info"
  ) => string;
  resolveBorderWidth: (overrideWidthPx?: number) => string;
  resolveStyles: (override?: CascadeStyleOverrides) => React.CSSProperties;
}

const defaultTokens: BrandCascadeTokens = {
  radius: "3px",
  radiusMode: "rounded",
  customRadiusPx: 3,
  borderWidth: "1px",
  borderWidthPx: 1,
  colors: {
    primary: "#c8d400",
    secondary: "#17212a",
    accent: "#009f80",
    neutral: "#fafbfc",
    success: "#10b981",
    warning: "#f59e0b",
    danger: "#bb4934",
    info: "#3b82f6",
  },
  palette: [],
};

const defaultCssVariables = computeBrandCssVariables(null, null, null);

const BrandCascadeContext = createContext<BrandCascadeContextValue>({
  tokens: defaultTokens,
  cssVariables: defaultCssVariables,
  resolveRadius: (override) => resolveCascadeRadius(override, defaultTokens),
  resolveColor: (overrideColor, role = "primary") =>
    resolveCascadeColor(overrideColor, role, defaultTokens),
  resolveBorderWidth: (overrideWidth) =>
    resolveCascadeBorderWidth(overrideWidth, defaultTokens),
  resolveStyles: (override) => resolveCascadeStyleObject(override, defaultTokens),
});

export interface BrandCascadeProviderProps {
  tokens?: BrandCascadeTokens;
  shapes?: Partial<GlobalShapesRecord> | null;
  colors?: Array<Partial<GlobalColorsRecord> | BrandColor> | null;
  typography?: Array<Partial<GlobalTypographyRecord>> | null;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: "div" | "main" | "section" | "article";
}

/**
 * Injects Level 1 Brand Tokens as CSS custom properties into the DOM tree
 * and exposes them via React Context to all descendants (containers, columns, modules).
 */
export function BrandCascadeProvider({
  tokens: initialTokens,
  shapes,
  colors,
  typography,
  children,
  className,
  style,
  as: Component = "div",
}: BrandCascadeProviderProps) {
  const tokens = useMemo(() => {
    if (initialTokens) return initialTokens;
    return buildBrandCascadeTokens(shapes, colors, typography);
  }, [initialTokens, shapes, colors, typography]);

  const cssVariables = useMemo(() => {
    return computeBrandCssVariables(shapes, colors, typography);
  }, [shapes, colors, typography]);

  const contextValue = useMemo<BrandCascadeContextValue>(() => {
    return {
      tokens,
      cssVariables,
      resolveRadius: (override) => resolveCascadeRadius(override, tokens),
      resolveColor: (overrideColor, role = "primary") =>
        resolveCascadeColor(overrideColor, role, tokens),
      resolveBorderWidth: (overrideWidth) =>
        resolveCascadeBorderWidth(overrideWidth, tokens),
      resolveStyles: (override) => resolveCascadeStyleObject(override, tokens),
    };
  }, [tokens, cssVariables]);

  const combinedStyle: React.CSSProperties = {
    ...(cssVariables as unknown as React.CSSProperties),
    ...style,
  };

  return (
    <BrandCascadeContext.Provider value={contextValue}>
      <Component className={className} style={combinedStyle}>
        {children}
      </Component>
    </BrandCascadeContext.Provider>
  );
}

/**
 * Hook to access brand cascade tokens and resolution helpers in any child module.
 */
export function useBrandCascade(): BrandCascadeContextValue {
  const ctx = useContext(BrandCascadeContext);
  if (!ctx) {
    throw new Error("useBrandCascade must be used within a BrandCascadeProvider");
  }
  return ctx;
}
