import { create } from "zustand";

export interface ColorPaletteItem {
  name?: string;
  role?: string;
  hex: string;
}

export interface OpenColorPickerOptions {
  title?: string;
  color: string;
  palette?: ColorPaletteItem[];
  allowTransparent?: boolean;
  onSelect: (color: string) => void;
}

interface ColorPickerState {
  isOpen: boolean;
  title: string;
  color: string;
  initialColor: string;
  palette: ColorPaletteItem[];
  allowTransparent: boolean;
  onSelect: ((color: string) => void) | null;

  openColorPicker: (options: OpenColorPickerOptions) => void;
  closeColorPicker: () => void;
  setColor: (color: string) => void;
}

export const useColorPickerStore = create<ColorPickerState>((set) => ({
  isOpen: false,
  title: "Výber farby",
  color: "#000000",
  initialColor: "#000000",
  palette: [],
  allowTransparent: false,
  onSelect: null,

  openColorPicker: (options) =>
    set({
      isOpen: true,
      title: options.title || "Výber farby",
      color: options.color || "#000000",
      initialColor: options.color || "#000000",
      palette: options.palette || [],
      allowTransparent: options.allowTransparent || false,
      onSelect: options.onSelect,
    }),

  closeColorPicker: () =>
    set({
      isOpen: false,
      onSelect: null,
    }),

  setColor: (color) => set({ color }),
}));
