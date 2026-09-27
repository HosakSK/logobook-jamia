"use client";

import { useState, useTransition } from "react";
import { BrandColor } from "@/lib/types/color";
import { ColorCard } from "@/components/admin/colors/color-card";
import { ColorEditorModal } from "@/components/admin/colors/color-editor-modal";
import { BulkImportColorsModal } from "@/components/admin/colors/bulk-import-colors-modal";
import { reorderGlobalColorsAction } from "@/actions/colors";
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
  const [roleFilter, setRoleFilter] = useState<string>("ALL");

  // Modals state
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingColor, setEditingColor] = useState<BrandColor | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [isReordering, startReorder] = useTransition();

  // Filter colors
  const filteredColors = colors.filter((c) => {
    const name =
      c.name[locale] || c.name.sk || c.name.en || c.name.cs || "";

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = name.toLowerCase().includes(q);
      const matchHex = c.hex.toLowerCase().includes(q);
      const matchRal = c.ral?.toLowerCase().includes(q);
      if (!matchName && !matchHex && !matchRal) {
        return false;
      }
    }

    if (roleFilter !== "ALL" && c.role !== roleFilter) {
      return false;
    }

    return true;
  });

  const handleOpenAdd = () => {
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

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {dict.admin.brandColors}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Globálna knižnica brandových farieb pre manuál{" "}
            <span className="font-mono font-semibold text-foreground">{brandName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            type="button"
            variant="outline"
            onClick={() => setBulkOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold rounded-[3px] border-border/60 hover:bg-neutral-800 gap-1.5 transition-colors"
          >
            <Layers className="h-4 w-4 text-[#c8d400]" />
            <span>Hromadný import HEX</span>
          </Button>

          <Button
            type="button"
            onClick={handleOpenAdd}
            className="h-9 px-4 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="h-4 w-4" />
            <span>Pridať farbu</span>
          </Button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="p-4 rounded-[3px] bg-card border border-border/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadať farbu podľa názvu, #HEX alebo RAL..."
            className="pl-8 h-9 text-xs rounded-[3px] bg-neutral-900 border-border/60"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="h-9 rounded-[3px] bg-neutral-900 border border-border/60 text-xs px-2.5 text-foreground focus:outline-hidden focus:border-[#c8d400]"
          >
            <option value="ALL">Všetky roly ({colors.length})</option>
            <option value="PRIMARY">Primárne farby</option>
            <option value="SECONDARY">Sekundárne farby</option>
            <option value="ACCENT">Akcentové farby</option>
            <option value="NEUTRAL">Neutrálne farby</option>
            <option value="CUSTOM">Doplnkové farby</option>
          </select>
        </div>
      </div>

      {/* 3. Colors Grid or Empty State */}
      {colors.length === 0 ? (
        <div className="border border-dashed border-border/50 rounded-[3px] p-12 text-center bg-card/40 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center text-[#c8d400] border border-border/40">
            <Palette className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground font-mono">
              Paleta farieb je zatiaľ prázdna
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Pridajte primárne a sekundárne farby vašej značky s presnými HEX, RGB a CMYK kódmi pre tlačové a digitálne manuály.
            </p>
          </div>
          <div className="flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkOpen(true)}
              className="h-9 px-4 text-xs font-semibold rounded-[3px] border-border/60"
            >
              Hromadný import HEX
            </Button>
            <Button
              type="button"
              onClick={handleOpenAdd}
              className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Pridať prvú farbu</span>
            </Button>
          </div>
        </div>
      ) : filteredColors.length === 0 ? (
        <div className="border border-border/40 rounded-[3px] p-10 text-center bg-card space-y-2">
          <p className="text-sm font-medium text-foreground">Žiadne farby nezodpovedajú zvoleným filtrom.</p>
          <p className="text-xs text-muted-foreground">Skúste upraviť vyhľadávací výraz alebo zrušte filter role.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setRoleFilter("ALL");
            }}
            className="h-8 text-xs rounded-[3px] mt-2"
          >
            Resetovať filtre
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredColors.map((color, idx) => (
            <ColorCard
              key={color.id}
              color={color}
              brandId={brandId}
              locale={locale}
              index={idx}
              total={filteredColors.length}
              dict={dict}
              onEdit={handleOpenEdit}
              onMoveUp={() => handleMove(idx, "up")}
              onMoveDown={() => handleMove(idx, "down")}
            />
          ))}
        </div>
      )}

      {/* 4. Modals */}
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
    </div>
  );
}
