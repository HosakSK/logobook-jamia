/**
 * Logobook Admin Studio Design System Tokens
 *
 * Centralized source of truth for the entire admin interface appearance.
 * All admin screens, components, inputs, buttons and panels inherit these settings.
 * Modify these values here or via the CSS variables in globals.css to adjust the entire admin style.
 */
export const ADMIN_THEME = {
  radiusPx: 16,
  radius: "16px",
  borderWidthPx: 1,
  borderWidth: "1px",
  borderStyle: "dotted" as const,
  borderColor: "rgba(63, 85, 102, 0.45)",
} as const;

export type AdminThemeConfig = typeof ADMIN_THEME;
