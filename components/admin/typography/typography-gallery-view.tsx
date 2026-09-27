"use client";

import { useState, useTransition, useMemo } from "react";
import { BrandTypography } from "@/lib/types/typography";
import { FontRole, FontSource } from "@/lib/validations/typography";
import {
  getBrandTypographyAction,
  reorderBrandTypographyAction,
} from "@/actions/typography";
import { TypographyCard } from "./typography-card";
import { TypographyEditorModal } from "./typography-editor-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Type,
  Plus,
  Search,
  SlidersHorizontal,
  RefreshCw,
  Globe,
  Upload,
  Cloud,
  FileCheck,
  AlertCircle,
} from "lucide-react";

interface TypographyGalleryViewProps {
  brandId: string;
  initialTypography: BrandTypography[];
  brandName: string;
}

export function TypographyGalleryView({
  brandId,
  initialTypography,
  brandName,
}: TypographyGalleryViewProps) {
  const [typographyList, setTypographyList] = useState<BrandTypography[]>(initialTypography);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | FontRole>("ALL");
  const [sourceFilter, setSourceFilter] = useState<"ALL" | FontSource>("ALL");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BrandTypography | null>(null);

  const [isRefreshing, startRefresh] = useTransition();

  const handleRefresh = () => {
    startRefresh(async () => {
      const res = await getBrandTypographyAction(brandId);
      if (res.success) {
        setTypographyList(res.typography);
      }
    });
  };

  const handleOpenAdd = () => {
    setEditingItem(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (item: BrandTypography) => {
    setEditingItem(item);
    setIsEditorOpen(true);
  };

  // Reordering
  const handleMove = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= typographyList.length) return;

    const updated = [...typographyList];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    setTypographyList(updated);
    const orderedIds = updated.map((t) => t.id);
    await reorderBrandTypographyAction(brandId, orderedIds);
  };

  // Filtered typography list
  const filteredList = useMemo(() => {
    return typographyList.filter((item) => {
      // Role filter
      if (roleFilter !== "ALL" && item.role !== roleFilter) {
        return false;
      }
      // Source filter
      if (sourceFilter !== "ALL" && item.fontSource !== sourceFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(query);
        const matchesGoogle = item.googleFontFamily?.toLowerCase().includes(query);
        const matchesAdobe = item.adobeProjectId?.toLowerCase().includes(query);
        const matchesFamily = item.fontFamilyName?.toLowerCase().includes(query);
        return matchesName || matchesGoogle || matchesAdobe || matchesFamily;
      }
      return true;
    });
  }, [typographyList, roleFilter, sourceFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = typographyList.length;
    const google = typographyList.filter((t) => t.fontSource === "GOOGLE_FONTS").length;
    const adobe = typographyList.filter((t) => t.fontSource === "ADOBE_FONTS").length;
    const custom = typographyList.filter((t) => t.fontSource === "CUSTOM_UPLOAD").length;
    return { total, google, adobe, custom };
  }, [typographyList]);

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Typografia a Písma</h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-[3px] bg-primary/10 text-primary border border-primary/20">
              {stats.total} {stats.total === 1 ? "písmo" : stats.total >= 2 && stats.total <= 4 ? "písma" : "písiem"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Globálna hierarchia písiem a živé prepojenie na manuál pre brand{" "}
            <span className="font-semibold text-foreground">{brandName}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs rounded-[3px] gap-1.5"
            title="Obnoviť knižnicu fontov"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Obnoviť</span>
          </Button>

          <Button
            size="sm"
            onClick={handleOpenAdd}
            className="h-8 px-3 text-xs rounded-[3px] gap-1.5 font-medium shadow-xs"
          >
            <Plus className="w-4 h-4" /> Pridať Písmo
          </Button>
        </div>
      </div>

      {/* Stats Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-card border border-border/80 rounded-[3px] p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-primary/10 flex items-center justify-center text-primary">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">{stats.total}</div>
            <div className="text-[11px] text-muted-foreground">Celkovo písiem</div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-[3px] p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-sky-500/10 flex items-center justify-center text-sky-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">{stats.google}</div>
            <div className="text-[11px] text-muted-foreground">Google Fonts</div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-[3px] p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-red-500/10 flex items-center justify-center text-red-400">
            <Cloud className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">{stats.adobe}</div>
            <div className="text-[11px] text-muted-foreground">Adobe Fonts</div>
          </div>
        </div>

        <div className="bg-card border border-border/80 rounded-[3px] p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-lime-500/10 flex items-center justify-center text-lime-400">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight">{stats.custom}</div>
            <div className="text-[11px] text-muted-foreground">Vlastné WOFF2</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-card border border-border/80 rounded-[3px] p-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Hľadať podľa názvu, rodiny alebo ID..."
            className="h-8 pl-8 text-xs rounded-[3px] bg-background"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Role Filter */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-[11px]">Rola:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="h-8 px-2 rounded-[3px] border border-input bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Všetky roly</option>
              <option value="HEADING">Nadpisy (HEADING)</option>
              <option value="BODY">Základný text (BODY)</option>
              <option value="DISPLAY">Display / Titulky</option>
              <option value="MONOSPACE">Kód & Technické</option>
              <option value="EMAIL">Email & Systémové</option>
            </select>
          </div>

          {/* Source Filter */}
          <div className="flex items-center gap-1">
            <span className="text-muted-foreground text-[11px]">Zdroj:</span>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as any)}
              className="h-8 px-2 rounded-[3px] border border-input bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
            >
              <option value="ALL">Všetky zdroje</option>
              <option value="GOOGLE_FONTS">Google Fonts</option>
              <option value="ADOBE_FONTS">Adobe Fonts</option>
              <option value="CUSTOM_UPLOAD">Vlastný súbor (WOFF2)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Typography List / Grid */}
      {filteredList.length > 0 ? (
        <div className="space-y-4">
          {filteredList.map((item, index) => (
            <TypographyCard
              key={item.id}
              typography={item}
              brandId={brandId}
              index={index}
              total={filteredList.length}
              onEdit={handleOpenEdit}
              onMoveUp={() => handleMove(index, "up")}
              onMoveDown={() => handleMove(index, "down")}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-border/80 rounded-[3px] p-12 text-center bg-card/40 space-y-4">
          <div className="w-12 h-12 rounded-[3px] bg-primary/10 text-primary mx-auto flex items-center justify-center">
            <Type className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-semibold text-base text-foreground">
              {typographyList.length === 0
                ? "Knižnica typografie je prázdna"
                : "Žiadne písma nezodpovedajú zvolenému filtru"}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {typographyList.length === 0
                ? "Pridajte prvé písmo pre nadpisy alebo bežný text značky. Môžete použiť Google Fonts, Adobe Fonts (Typekit) alebo nahrať vlastný WOFF2 súbor."
                : "Skúste upraviť vyhľadávací výraz alebo resetovať filter rolí a zdrojov."}
            </p>
          </div>

          {typographyList.length === 0 ? (
            <Button
              onClick={handleOpenAdd}
              size="sm"
              className="text-xs rounded-[3px] gap-2 font-medium"
            >
              <Plus className="w-4 h-4" /> Pridať prvé písmo
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setRoleFilter("ALL");
                setSourceFilter("ALL");
              }}
              className="text-xs rounded-[3px]"
            >
              Zrušiť filtre
            </Button>
          )}
        </div>
      )}

      {/* Editor Modal */}
      <TypographyEditorModal
        typography={editingItem}
        brandId={brandId}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingItem(null);
        }}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
