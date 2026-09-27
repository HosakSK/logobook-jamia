import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ActiveBrand {
  id: string;
  slug: string;
  name: string;
}

interface BrandState {
  activeBrand: ActiveBrand | null;
  setActiveBrand: (brand: ActiveBrand) => void;
  clearActiveBrand: () => void;
}

export const useBrandStore = create<BrandState>()(
  persist(
    (set) => ({
      activeBrand: {
        id: "demo",
        slug: "demo",
        name: "Logobook Global Design System",
      }, // Default fallback demo brand for instant testing
      setActiveBrand: (brand) => set({ activeBrand: brand }),
      clearActiveBrand: () => set({ activeBrand: null }),
    }),
    {
      name: "logobook-active-brand",
    }
  )
);
