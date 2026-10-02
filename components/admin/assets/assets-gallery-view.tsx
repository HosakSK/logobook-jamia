"use client";

import { useState, useEffect } from "react";
import { BrandAsset, BrandAssetFile } from "@/lib/types/asset";
import { AssetCard } from "@/components/admin/assets/asset-card";
import { BulkUploadModal } from "@/components/admin/assets/bulk-upload-modal";
import { AssetFilesModal } from "@/components/admin/assets/asset-files-modal";
import { EditAssetModal } from "@/components/admin/assets/edit-asset-modal";
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
    router.refresh();
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

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-mono">
            {dict.admin.brandLogos}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centrálny repozitár vektorových a bitmapových lôg pre manuál{" "}
            <span className="font-mono font-semibold text-foreground">{brandName}</span>.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setBulkModalOpen(true)}
          className="h-9 px-4 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors shadow-xs self-start sm:self-auto"
        >
          <Upload className="h-4 w-4" />
          <span>Hromadné nahrávanie (Bulk Upload)</span>
        </Button>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="p-4 rounded-[3px] bg-card border border-border/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hľadať logo podľa názvu..."
            className="pl-8 h-9 text-xs rounded-[3px] bg-neutral-900 border-border/60"
          />
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Medium */}
          <select
            value={mediumFilter}
            onChange={(e) => setMediumFilter(e.target.value)}
            className="h-9 rounded-[3px] bg-neutral-900 border border-border/60 text-xs px-2.5 text-foreground focus:outline-hidden focus:border-[#c8d400]"
          >
            <option value="ALL">Všetky médiá</option>
            <option value="DIGITAL_RGB">RGB (Digitál)</option>
            <option value="PRINT_CMYK">CMYK (Tlač)</option>
            <option value="UNIVERSAL">Univerzálne</option>
          </select>

          {/* Orientation */}
          <select
            value={orientationFilter}
            onChange={(e) => setOrientationFilter(e.target.value)}
            className="h-9 rounded-[3px] bg-neutral-900 border border-border/60 text-xs px-2.5 text-foreground focus:outline-hidden focus:border-[#c8d400]"
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
            className="h-9 rounded-[3px] bg-neutral-900 border border-border/60 text-xs px-2.5 text-foreground focus:outline-hidden focus:border-[#c8d400]"
          >
            <option value="ALL">Všetky podklady</option>
            <option value="LIGHT">Svetlý</option>
            <option value="DARK">Tmavý</option>
            <option value="TRANSPARENT">Priehľadný</option>
            <option value="MONOCHROME">Monochróm</option>
            <option value="INVERSE">Inverzný</option>
          </select>
        </div>
      </div>

      {/* 3. Assets Gallery Grid or Empty State */}
      {assets.length === 0 ? (
        <div className="border border-dashed border-border/50 rounded-[3px] p-12 text-center bg-card/40 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center text-[#c8d400] border border-border/40">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-base text-foreground font-mono">
              Knižnica lôg je zatiaľ prázdna
            </h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Nahrajte vektorové logá (.SVG) značky. Systém z nich automaticky vygeneruje maticu logotypov, náhľady a uloží ich do Cloudflare R2.
            </p>
          </div>
          <Button
            type="button"
            onClick={() => setBulkModalOpen(true)}
            className="h-9 px-5 text-xs font-semibold rounded-[3px] bg-[#c8d400] text-[#070b0f] hover:bg-[#b5c000] gap-1.5 transition-colors"
          >
            <Upload className="h-4 w-4" />
            <span>Nahrať prvé logá (Bulk Upload)</span>
          </Button>
        </div>
      ) : filteredAssets.length === 0 ? (
        <div className="border border-border/40 rounded-[3px] p-10 text-center bg-card space-y-2">
          <p className="text-sm font-medium text-foreground">Žiadne logá nezodpovedajú zvoleným filtrom.</p>
          <p className="text-xs text-muted-foreground">Skúste resetovať vyhľadávanie alebo zvoľte iné parametre.</p>
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
            className="h-8 text-xs rounded-[3px] mt-2"
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
        brandId={brandId}
        brandName={brandName}
        isOpen={Boolean(activeEditAsset)}
        onClose={() => setActiveEditAsset(null)}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
