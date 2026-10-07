"use client";

import { useState, useEffect, useTransition } from "react";
import { BrandAsset, BrandAssetFile } from "@/lib/types/asset";
import { AssetCard } from "@/components/admin/assets/asset-card";
import { BulkUploadModal } from "@/components/admin/assets/bulk-upload-modal";
import { AssetFilesModal } from "@/components/admin/assets/asset-files-modal";
import { EditAssetModal } from "@/components/admin/assets/edit-asset-modal";
import { bulkDeleteBrandAssetsAction } from "@/actions/assets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dictionary } from "@/lib/i18n";
import {
  Upload,
  Search,
  Filter,
  Image as ImageIcon,
  FolderArchive,
  Layers,
  Sparkles,
  Trash2,
  CheckSquare,
  Square,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

interface AssetsGalleryViewProps {
  initialAssets: BrandAsset[];
  brandId: string;
  brandName: string;
  locale: string;
  dict: Dictionary;
}

export function AssetsGalleryView({
  initialAssets,
  brandId,
  brandName,
  locale,
  dict,
}: AssetsGalleryViewProps) {
  const router = useRouter();
  const [assets, setAssets] = useState<BrandAsset[]>(initialAssets);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isBulkDeleting, startBulkDelete] = useTransition();

  const [search, setSearch] = useState("");
  const [mediumFilter, setMediumFilter] = useState<string>("ALL");
  const [orientationFilter, setOrientationFilter] = useState<string>("ALL");
  const [backgroundFilter, setBackgroundFilter] = useState<string>("ALL");

  // Keep assets in sync when server component revalidates
  useEffect(() => {
    setAssets(initialAssets);
  }, [initialAssets]);

  // Modal states
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [activeFilesAsset, setActiveFilesAsset] = useState<BrandAsset | null>(null);
  const [activeEditAsset, setActiveEditAsset] = useState<BrandAsset | null>(null);

  // Handle asset deletion immediately in client state + server sync
  const handleDeleteAsset = (assetId: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== assetId));
    setSelectedIds((prev) => prev.filter((id) => id !== assetId));
    router.refresh();
  };

  // Toggle selection
  const handleToggleSelect = (assetId: string) => {
    setSelectedIds((prev) =>
      prev.includes(assetId) ? prev.filter((id) => id !== assetId) : [...prev, assetId]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredAssets.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredAssets.map((a) => a.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(
        `Naozaj chcete hromadne vymazať ${selectedIds.length} označených lôg a všetky ich súbory z Cloudflare R2?`
      )
    ) {
      return;
    }

    startBulkDelete(async () => {
      const res = await bulkDeleteBrandAssetsAction(selectedIds, brandId);
      if (res.success) {
        setAssets((prev) => prev.filter((a) => !selectedIds.includes(a.id)));
        setSelectedIds([]);
        router.refresh();
      } else {
        alert(res.message);
      }
    });
  };

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const displayName =
      asset.name[locale] || asset.name.sk || asset.name.en || asset.name.cs || "";

    if (search.trim() && !displayName.toLowerCase().includes(search.toLowerCase().trim())) {
      return false;
    }
    if (mediumFilter !== "ALL" && asset.medium !== mediumFilter) {
      return false;
    }
    if (orientationFilter !== "ALL" && asset.orientation !== orientationFilter) {
      return false;
    }
    if (backgroundFilter !== "ALL" && asset.background !== backgroundFilter) {
      return false;
    }
    return true;
  });

  // Handle updated files from modal
  const handleFilesUpdated = (assetId: string, updatedFiles: BrandAssetFile[]) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === assetId ? { ...a, files: updatedFiles } : a))
    );
    if (activeFilesAsset && activeFilesAsset.id === assetId) {
      setActiveFilesAsset({ ...activeFilesAsset, files: updatedFiles });
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const isAllSelected = filteredAssets.length > 0 && selectedIds.length === filteredAssets.length;

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#fafbfc] font-mono">
            {dict.admin.brandLogos}
          </h1>
          <p className="text-sm text-[#96abbe] mt-1">
            Centrálny repozitár vektorových a bitmapových lôg pre manuál{" "}
            <span className="font-mono font-semibold text-[#fafbfc]">{brandName}</span>.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setBulkModalOpen(true)}
          className="h-9 px-4 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors shadow-xs self-start sm:self-auto cursor-pointer"
        >
          <Upload className="h-4 w-4" />
          <span>Hromadné nahrávanie (Bulk Upload)</span>
        </Button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="p-4 rounded-[3px] bg-[#17212a] border border-[rgba(63,85,102,0.45)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#96abbe]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadať logo podľa názvu..."
            className="pl-8 h-9 text-xs rounded-[3px] bg-[#070b0f] text-[#fafbfc] border-[rgba(63,85,102,0.6)] placeholder:text-[#96abbe]/60 focus:border-[#c8d400]"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Medium */}
          <select
            value={mediumFilter}
            onChange={(e) => setMediumFilter(e.target.value)}
            className="h-9 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs px-2.5 text-[#fafbfc] focus:outline-hidden focus:border-[#c8d400]"
          >
            <option value="ALL">Všetky médiá</option>
            <option value="PRINT_CMYK">CMYK (Tlač)</option>
            <option value="PRINT_PANTONE">Pantone (Tlač)</option>
            <option value="PRINT_MONOCHROME">Monochróm (Tlač)</option>
            <option value="PRINT_WB">Čiernobiela / WB (Tlač)</option>
            <option value="DIGITAL_RGB">RGB (Digitál)</option>
            <option value="UNIVERSAL">Univerzálne</option>
          </select>

          {/* Orientation */}
          <select
            value={orientationFilter}
            onChange={(e) => setOrientationFilter(e.target.value)}
            className="h-9 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs px-2.5 text-[#fafbfc] focus:outline-hidden focus:border-[#c8d400]"
          >
            <option value="ALL">Všetky orientácie</option>
            <option value="HORIZONTAL">Horizontálne</option>
            <option value="VERTICAL">Vertikálne</option>
            <option value="SYMBOL">Symbol / Značka</option>
          </select>

          {/* Background */}
          <select
            value={backgroundFilter}
            onChange={(e) => setBackgroundFilter(e.target.value)}
            className="h-9 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs px-2.5 text-[#fafbfc] focus:outline-hidden focus:border-[#c8d400]"
          >
            <option value="ALL">Všetky podklady</option>
            <option value="LIGHT">Svetlý podklad</option>
            <option value="DARK">Tmavý podklad</option>
          </select>
        </div>
      </div>

      {/* 2.5 Bulk Action Bar when items selected or to select all */}
      {filteredAssets.length > 0 && (
        <div className="p-3 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.5)] flex flex-wrap items-center justify-between gap-3 text-xs text-[#fafbfc]">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSelectAll}
              className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground font-mono transition-colors cursor-pointer"
            >
              {isAllSelected ? (
                <CheckSquare className="h-4 w-4 text-[#c8d400]" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span>
                {isAllSelected ? "Odznačiť všetky" : "Označiť všetky"} ({filteredAssets.length})
              </span>
            </button>

            {selectedIds.length > 0 && (
              <span className="px-2 py-0.5 rounded-[2px] bg-[#c8d400]/15 text-[#c8d400] font-mono font-semibold">
                Označených: {selectedIds.length}
              </span>
            )}
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={isBulkDeleting}
                onClick={handleBulkDelete}
                className="h-7 px-3 text-xs font-semibold rounded-[3px] gap-1.5 cursor-pointer"
              >
                {isBulkDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Mažem označené...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hromadne vymazať ({selectedIds.length})</span>
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 3. Assets Gallery Grid or Empty State */}
      {assets.length === 0 ? (
        <div className="border border-dashed border-[rgba(63,85,102,0.45)] rounded-[3px] p-12 text-center bg-[#17212a] text-[#fafbfc] space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-[#070b0f] flex items-center justify-center text-[#c8d400] border border-[rgba(63,85,102,0.5)]">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-[#fafbfc] font-mono">
              Knižnica lôg je zatiaľ prázdna
            </h3>
            <p className="text-xs text-[#96abbe] max-w-md mx-auto">
              Nahrajte vektorové logá (.SVG) značky. Systém z nich automaticky vygeneruje maticu logotypov, náhľady a uloží ich do Cloudflare R2.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setBulkModalOpen(true)}
            className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors cursor-pointer"
          >
            <Upload className="h-4 w-4" />
            <span>Nahrať prvé logá (Bulk Upload)</span>
          </Button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="border border-[rgba(63,85,102,0.45)] rounded-[3px] p-10 text-center bg-[#17212a] text-[#fafbfc] space-y-2">
          <p className="text-sm font-medium text-[#fafbfc]">Žiadne logá nezodpovedajú zvoleným filtrom.</p>
          <p className="text-xs text-[#96abbe]">Skúste resetovať vyhľadávanie alebo zvoľte iné parametre.</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setMediumFilter("ALL");
              setOrientationFilter("ALL");
              setBackgroundFilter("ALL");
            }}
            className="h-8 text-xs rounded-[3px] mt-2 cursor-pointer"
          >
            Resetovať filtre
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredAssets.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              brandId={brandId}
              locale={locale}
              dict={dict}
              isSelected={selectedIds.includes(asset.id)}
              onToggleSelect={handleToggleSelect}
              onOpenFiles={(a) => setActiveFilesAsset(a)}
              onEdit={(a) => setActiveEditAsset(a)}
              onDelete={handleDeleteAsset}
            />
          ))}
        </div>
      )}

      {/* 4. Modals */}
      <BulkUploadModal
        brandId={brandId}
        brandName={brandName}
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onSuccess={handleRefresh}
      />

      <AssetFilesModal
        asset={activeFilesAsset}
        brandId={brandId}
        isOpen={Boolean(activeFilesAsset)}
        onClose={() => setActiveFilesAsset(null)}
        onFilesUpdated={handleFilesUpdated}
      />

      <EditAssetModal
        asset={activeEditAsset}
        allAssets={assets}
        brandId={brandId}
        brandName={brandName}
        isOpen={Boolean(activeEditAsset)}
        onClose={() => setActiveEditAsset(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
