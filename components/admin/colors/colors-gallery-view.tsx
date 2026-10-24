"use client";

import { useState, useTransition, useMemo } from "react";
import { BrandColor } from "@/lib/types/color";
import { ColorCard } from "@/components/admin/colors/color-card";
import { ColorEditorModal } from "@/components/admin/colors/color-editor-modal";
import { BulkImportColorsModal } from "@/components/admin/colors/bulk-import-colors-modal";
import { TokensExportModal } from "@/components/admin/colors/tokens-export-modal";
import { reorderGlobalColorsAction } from "@/actions/colors";
import {
  COLOR_CATEGORIES,
  ColorCategory,
  COLOR_CATEGORY_DEFINITIONS,
  resolveColorCategory,
} from "@/lib/validations/color";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/lib/i18n";
import {
  Palette,
  Plus,
  Layers,
  Search,
  Filter,
  Sparkles,
  Sun,
  Moon,
  Monitor,
  ShieldCheck,
  Type,
  Code2,
  LayoutGrid,
  ListTree,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface ColorsGalleryViewProps {
  initialColors: BrandColor[];
  brandId: string;
  brandName: string;
  locale: string;
  dict: Dictionary;
}

export function ColorsGalleryView({
  initialColors,
  brandId,
  brandName,
  locale,
  dict,
}: ColorsGalleryViewProps) {
  const router = useRouter();
  const [colors, setColors] = useState<BrandColor[]>(initialColors);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grouped" | "flat">("grouped");

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<BrandColor | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const [isReordering, startReorder] = useTransition();

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: colors.length };
    COLOR_CATEGORIES.forEach((cat) => {
      counts[cat] = 0;
    });
    colors.forEach((c) => {
      const cat = resolveColorCategory(c.role, c.category);
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [colors]);

  // Filter colors
  const filteredColors = useMemo(() => {
    return colors.filter((c) => {
      const name =
        c.name[locale] || c.name.sk || c.name.en || c.name.cs || "";

      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const matchName = name.toLowerCase().includes(q);
        const matchHex = c.hex.toLowerCase().includes(q);
        const matchRal = c.ral?.toLowerCase().includes(q);
        const matchRole = c.role.toLowerCase().includes(q);
        if (!matchName && !matchHex && !matchRal && !matchRole) {
          return false;
        }
      }

      if (selectedCategory !== "ALL") {
        const cat = resolveColorCategory(c.role, c.category);
        if (cat !== selectedCategory) {
          return false;
        }
      }

      return true;
    });
  }, [colors, search, selectedCategory, locale]);

  // Grouped by Category for sectioned view
  const groupedByCategory = useMemo(() => {
    const map = new Map<ColorCategory, BrandColor[]>();
    COLOR_CATEGORIES.forEach((cat) => {
      map.set(cat, []);
    });

    filteredColors.forEach((color) => {
      const cat = resolveColorCategory(color.role, color.category);
      const list = map.get(cat) || [];
      list.push(color);
      map.set(cat, list);
    });

    return map;
  }, [filteredColors]);

  const handleOpenAdd = (defaultCategory?: ColorCategory) => {
    setEditingColor(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (color: BrandColor) => {
    setEditingColor(color);
    setEditorOpen(true);
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= colors.length) return;

    const newColors = [...colors];
    const temp = newColors[index];
    newColors[index] = newColors[targetIndex];
    newColors[targetIndex] = temp;

    setColors(newColors);

    startReorder(async () => {
      const ids = newColors.map((c) => c.id);
      await reorderGlobalColorsAction(brandId, ids);
    });
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const renderCategoryIcon = (cat: ColorCategory) => {
    switch (cat) {
      case "CORE":
        return <Palette className="h-4 w-4 text-[#c8d400]" />;
      case "DIGITAL":
        return <Monitor className="h-4 w-4 text-cyan-400" />;
      case "BACKGROUND":
        return <Sun className="h-4 w-4 text-orange-400" />;
      case "TYPOGRAPHY":
        return <Type className="h-4 w-4 text-purple-400" />;
      case "SEMANTIC":
        return <ShieldCheck className="h-4 w-4 text-emerald-400" />;
      case "CUSTOM":
      default:
        return <Layers className="h-4 w-4 text-[#96abbe]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-[#fafbfc] font-mono">
              {dict.admin.brandColors}
            </h1>
            <span className="px-2 py-0.5 rounded-[2px] bg-[#c8d400]/15 text-[#c8d400] text-xs font-mono font-semibold border border-[#c8d400]/30">
              {colors.length} farieb
            </span>
          </div>
          <p className="text-sm text-[#96abbe] mt-1">
            Knižnica farieb značky{" "}
            <span className="font-mono font-semibold text-[#fafbfc]">{brandName}</span>{" "}
            zoskupená do kategórií pre tlačové aj digitálne manuály a Day/Night témy.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          {/* Export Tokens Button */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setExportOpen(true)}
            className="h-9 px-3 text-xs font-semibold rounded-[3px] bg-[#17212a] text-[#fafbfc] border-[rgba(63,85,102,0.6)] hover:bg-[#1f2c36] gap-1.5 transition-colors"
            title="Exportovať tokeny ako CSS vars, Tailwind alebo JSON"
          >
            <Code2 className="h-4 w-4 text-[#c8d400]" />
            <span>Exportovať tokeny</span>
          </Button>

          {/* Bulk Import */}
          <Button
            type="button"
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold rounded-[3px] bg-[#17212a] text-[#fafbfc] border-[rgba(63,85,102,0.6)] hover:bg-[#1f2c36] gap-1.5 transition-colors"
          >
            <Layers className="h-4 w-4 text-[#c8d400]" />
            <span>Hromadný import HEX</span>
          </Button>

          {/* Add Color */}
          <Button
            type="button"
            onClick={() => handleOpenAdd()}
            className="h-9 px-4 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Pridať farbu</span>
          </Button>
        </div>
      </div>

      {/* 2. Category Quick Tabs Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1.5 rounded-[3px] text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5 border ${
            selectedCategory === "ALL"
              ? "bg-[#c8d400] text-[#070b0f] border-[#c8d400]"
              : "bg-[#17212a] text-[#96abbe] border-[rgba(63,85,102,0.4)] hover:text-[#fafbfc] hover:bg-[#1f2c36]"
          }`}
        >
          <span>Všetky kategórie</span>
          <span
            className={`px-1.5 py-0.2 rounded-[2px] text-[10px] ${
              selectedCategory === "ALL" ? "bg-black/20 text-black font-bold" : "bg-[#070b0f] text-[#96abbe]"
            }`}
          >
            {categoryCounts.ALL}
          </span>
        </button>

        {COLOR_CATEGORIES.map((cat) => {
          const def = COLOR_CATEGORY_DEFINITIONS[cat];
          const count = categoryCounts[cat] || 0;
          const isSelected = selectedCategory === cat;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-[3px] text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-1.5 border ${
                isSelected
                  ? "bg-[#c8d400] text-[#070b0f] border-[#c8d400]"
                  : "bg-[#17212a] text-[#96abbe] border-[rgba(63,85,102,0.4)] hover:text-[#fafbfc] hover:bg-[#1f2c36]"
              }`}
            >
              <span>{def.labelSk}</span>
              <span
                className={`px-1.5 py-0.2 rounded-[2px] text-[10px] ${
                  isSelected ? "bg-black/20 text-black font-bold" : "bg-[#070b0f] text-[#96abbe]"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Search and View Mode Controls */}
      <div className="p-3.5 rounded-[3px] bg-[#17212a] border border-[rgba(63,85,102,0.45)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#96abbe]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadať farbu podľa názvu, #HEX, roly alebo RAL kódu..."
            className="pl-8 h-9 text-xs rounded-[3px] bg-[#070b0f] text-[#fafbfc] border-[rgba(63,85,102,0.6)] placeholder:text-[#96abbe]/60 focus:border-[#c8d400]"
          />
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 shrink-0 bg-[#070b0f] p-1 rounded-[3px] border border-[rgba(63,85,102,0.5)]">
          <button
            type="button"
            onClick={() => setViewMode("grouped")}
            className={`px-2.5 py-1 text-xs font-mono rounded-[2px] flex items-center gap-1.5 transition-colors ${
              viewMode === "grouped"
                ? "bg-[#17212a] text-[#c8d400] font-bold border border-[rgba(63,85,102,0.6)]"
                : "text-[#96abbe] hover:text-[#fafbfc]"
            }`}
            title="Zoskupiť farby podľa kategórií"
          >
            <ListTree className="h-3.5 w-3.5" />
            <span>Podľa kategórií</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("flat")}
            className={`px-2.5 py-1 text-xs font-mono rounded-[2px] flex items-center gap-1.5 transition-colors ${
              viewMode === "flat"
                ? "bg-[#17212a] text-[#c8d400] font-bold border border-[rgba(63,85,102,0.6)]"
                : "text-[#96abbe] hover:text-[#fafbfc]"
            }`}
            title="Zobraziť všetky farby v jednej mriežke"
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            <span>Mriežka</span>
          </button>
        </div>
      </div>

      {/* 4. Colors Grid or Empty State */}
      {colors.length === 0 ? (
        <div className="border border-dashed border-[rgba(63,85,102,0.45)] rounded-[3px] p-12 text-center bg-[#17212a] text-[#fafbfc] space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#070b0f] flex items-center justify-center text-[#c8d400] border border-[rgba(63,85,102,0.5)]">
            <Palette className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#fafbfc] font-mono">
              Paleta farieb je zatiaľ prázdna
            </h3>
            <p className="text-xs text-[#96abbe] max-w-md mx-auto">
              Pridajte primárne, sekundárne, pozadia a textové farby pre tlačové aj digitálne manuály značky.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkOpen(true)}
              className="h-9 px-4 text-xs font-semibold rounded-[3px] border-[rgba(63,85,102,0.6)] bg-[#070b0f] text-[#fafbfc]"
            >
              Hromadný import HEX
            </Button>
            <Button
              type="button"
              onClick={() => handleOpenAdd()}
              className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Pridať prvú farbu</span>
            </Button>
          </div>
        </div>
      ) : filteredColors.length === 0 ? (
        <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-10 text-center bg-[#17212a] text-[#fafbfc] space-y-2">
          <p className="text-sm font-medium text-[#fafbfc]">
            Žiadne farby nezodpovedajú zvolenému filtru.
          </p>
          <p className="text-xs text-[#96abbe]">
            Skúste upraviť vyhľadávanie alebo zvoľte „Všetky kategórie“.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setSelectedCategory("ALL");
            }}
            className="h-8 text-xs rounded-[3px] mt-2"
          >
            Resetovať filtre
          </Button>
        </div>
      ) : viewMode === "grouped" ? (
        /* --- GROUPED SECTIONS VIEW --- */
        <div className="space-y-8">
          {COLOR_CATEGORIES.map((catKey) => {
            const catColors = groupedByCategory.get(catKey) || [];
            if (catColors.length === 0 && selectedCategory !== "ALL" && selectedCategory !== catKey) {
              return null;
            }

            const def = COLOR_CATEGORY_DEFINITIONS[catKey];

            return (
              <div
                key={catKey}
                className="rounded-[3px] border border-[rgba(63,85,102,0.4)] bg-[#131b22] p-5 space-y-4"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-[rgba(63,85,102,0.3)] pb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-[3px] bg-[#070b0f] flex items-center justify-center border border-[rgba(63,85,102,0.5)]">
                      {renderCategoryIcon(catKey)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold font-mono text-[#fafbfc]">
                          {def.labelSk}
                        </h2>
                        <span className="px-1.5 py-0.5 rounded-[2px] bg-[#070b0f] text-[10px] font-mono text-[#96abbe] border border-[rgba(63,85,102,0.4)]">
                          {catColors.length} farieb
                        </span>
                      </div>
                      <p className="text-xs text-[#96abbe] mt-0.5">
                        {def.descriptionSk}
                      </p>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAdd(catKey)}
                    className="h-7 px-2.5 text-xs font-mono rounded-[2px] border-[rgba(63,85,102,0.6)] bg-[#070b0f] text-[#fafbfc] hover:border-[#c8d400] gap-1 shrink-0 self-start sm:self-auto"
                  >
                    <Plus className="h-3 w-3 text-[#c8d400]" />
                    <span>Pridať farbu</span>
                  </Button>
                </div>

                {/* Category Cards Grid or Empty Notice */}
                {catColors.length === 0 ? (
                  <div className="p-6 rounded-[2px] border border-dashed border-[rgba(63,85,102,0.35)] bg-[#070b0f]/60 text-center text-xs text-[#96abbe]">
                    <span>V tejto kategórii zatiaľ nie sú priradené žiadne farby. </span>
                    <button
                      type="button"
                      onClick={() => handleOpenAdd(catKey)}
                      className="text-[#c8d400] underline hover:no-underline font-semibold ml-1"
                    >
                      Pridať farbu do {def.labelSk}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {catColors.map((color) => {
                      const globalIdx = colors.findIndex((c) => c.id === color.id);
                      return (
                        <ColorCard
                          key={color.id}
                          color={color}
                          brandId={brandId}
                          locale={locale}
                          index={globalIdx}
                          total={colors.length}
                          dict={dict}
                          onEdit={handleOpenEdit}
                          onMoveUp={() => handleMove(globalIdx, "up")}
                          onMoveDown={() => handleMove(globalIdx, "down")}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* --- FLAT LIST VIEW --- */
        <div className="space-y-2.5">
          {filteredColors.map((color) => {
            const globalIdx = colors.findIndex((c) => c.id === color.id);
            return (
              <ColorCard
                key={color.id}
                color={color}
                brandId={brandId}
                locale={locale}
                index={globalIdx}
                total={colors.length}
                dict={dict}
                onEdit={handleOpenEdit}
                onMoveUp={() => handleMove(globalIdx, "up")}
                onMoveDown={() => handleMove(globalIdx, "down")}
              />
            );
          })}
        </div>
      )}

      {/* 5. Modals */}
      <ColorEditorModal
        color={editingColor}
        brandId={brandId}
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSuccess={handleRefresh}
      />

      <BulkImportColorsModal
        brandId={brandId}
        isOpen={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onSuccess={handleRefresh}
      />

      <TokensExportModal
        colors={colors}
        brandName={brandName}
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
      />
    </div>
  );
}
