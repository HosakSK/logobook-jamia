"use client";

import { useState, useTransition, useMemo } from "react";
import { MediaAsset, MediaFilterType, MediaType } from "@/lib/types/media";
import {
  getBrandMediaAction,
  bulkDeleteMediaAction,
} from "@/actions/media";
import { formatBytes } from "@/lib/validations/media";
import { MediaCard } from "./media-card";
import { MediaDropzone } from "./media-dropzone";
import { MediaEditModal } from "./media-edit-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Search,
  RefreshCw,
  Trash2,
  CheckSquare,
  Square,
  ImageIcon,
  FileText,
  ExternalLink,
  Layers,
  HardDrive,
} from "lucide-react";

interface MediaGalleryViewProps {
  brandId: string;
  initialMedia: MediaAsset[];
  brandName: string;
  pageMode?: "all" | "icons" | "patterns";
}

export function MediaGalleryView({
  brandId,
  initialMedia,
  brandName,
  pageMode = "all",
}: MediaGalleryViewProps) {
  const [mediaList, setMediaList] = useState<MediaAsset[]>(initialMedia);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<MediaFilterType>(
    pageMode === "icons" ? "ICON" : pageMode === "patterns" ? "PATTERN" : "ALL"
  );

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<MediaAsset | null>(null);

  const [isRefreshing, startRefresh] = useTransition();
  const [isBulkDeleting, startBulkDelete] = useTransition();

  const handleRefresh = () => {
    startRefresh(async () => {
      const res = await getBrandMediaAction(brandId);
      if (res.success) {
        setMediaList(res.media);
        setSelectedIds(new Set());
      }
    });
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredMedia.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredMedia.map((m) => m.id)));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleSingleDelete = (id: string, name: string) => {
    if (confirm(`Naozaj chcete vymazať súbor "${name}"? Táto akcia je nevratná.`)) {
      startBulkDelete(async () => {
        await bulkDeleteMediaAction(brandId, [id]);
        handleRefresh();
      });
    }
  };

  const handleBulkDelete = () => {
    const count = selectedIds.size;
    if (count === 0) return;

    if (
      confirm(
        `Naozaj chcete natrvalo vymazať ${count} ${
          count === 1 ? "položku" : count >= 2 && count <= 4 ? "položky" : "položiek"
        }? Súbory sa odstránia aj z R2 úložiska.`
      )
    ) {
      startBulkDelete(async () => {
        await bulkDeleteMediaAction(brandId, Array.from(selectedIds));
        handleRefresh();
      });
    }
  };

  const handleOpenEdit = (asset: MediaAsset) => {
    setEditingAsset(asset);
    setIsEditModalOpen(true);
  };

  // Filtered Media
  const filteredMedia = useMemo(() => {
    return mediaList.filter((item) => {
      if (typeFilter !== "ALL" && item.fileType !== typeFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = item.fileName.toLowerCase().includes(query);
        const matchesAlt = item.altText?.toLowerCase().includes(query);
        return matchesName || matchesAlt;
      }
      return true;
    });
  }, [mediaList, typeFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = mediaList.length;
    const images = mediaList.filter(
      (m) => m.fileType === "IMAGE" || m.fileType === "ICON" || m.fileType === "PATTERN"
    ).length;
    const docs = mediaList.filter((m) => m.fileType === "DOCUMENT").length;
    const externals = mediaList.filter((m) => m.fileType === "EXTERNAL").length;
    const totalBytes = mediaList.reduce((acc, curr) => acc + (curr.fileSize || 0), 0);
    return { total, images, docs, externals, totalBytes };
  }, [mediaList]);

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              {pageMode === "icons"
                ? "Knižnica ikon a piktogramov"
                : pageMode === "patterns"
                ? "Knižnica vzorov a textúr"
                : "Mediálna knižnica"}
            </h1>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-[3px] bg-primary/10 text-primary border border-primary/20">
              {filteredMedia.length} {filteredMedia.length === 1 ? "položka" : filteredMedia.length >= 2 && filteredMedia.length <= 4 ? "položky" : "položiek"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {pageMode === "icons"
              ? `Centrálny register vektorových SVG ikon, piktogramov a systémových sémantických rolí pre ${brandName}.`
              : pageMode === "patterns"
              ? `Vektorové SVG patterny, plynulé opakovacie textúry a motívy značky ${brandName}.`
              : `Centrálny správca súborov, fotografií, vzorov a dokumentov pre brand ${brandName}.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="h-8 px-2.5 text-xs rounded-[3px] gap-1.5"
            title="Obnoviť knižnicu médií"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Obnoviť</span>
          </Button>
        </div>
      </div>

      {/* Stats Summary Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] rounded-[3px] p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-primary/10 flex items-center justify-center text-primary">
            <FolderOpen className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight text-[#fafbfc]">{stats.total}</div>
            <div className="text-[11px] text-[#96abbe]">Celkovo médií</div>
          </div>
        </div>

        <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] rounded-[3px] p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-sky-500/10 flex items-center justify-center text-sky-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight text-[#fafbfc]">{stats.images}</div>
            <div className="text-[11px] text-[#96abbe]">Obrázky & Ikony</div>
          </div>
        </div>

        <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] rounded-[3px] p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-amber-500/10 flex items-center justify-center text-amber-400">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight text-[#fafbfc]">{stats.docs}</div>
            <div className="text-[11px] text-[#96abbe]">Dokumenty</div>
          </div>
        </div>

        <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[#fafbfc] rounded-[3px] p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-[3px] bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold leading-tight text-[#fafbfc]">{formatBytes(stats.totalBytes)}</div>
            <div className="text-[11px] text-[#96abbe]">Obsadené v R2</div>
          </div>
        </div>
      </div>

      {/* Bulk Drag & Drop & External Link Zone */}
      <MediaDropzone
        brandId={brandId}
        onUploadComplete={handleRefresh}
        targetFileType={pageMode === "icons" ? "ICON" : pageMode === "patterns" ? "PATTERN" : undefined}
        designerGuideType={pageMode === "icons" ? "icons" : pageMode === "patterns" ? "patterns" : "general"}
        acceptedExtensions={pageMode === "icons" ? ".svg,image/svg+xml" : pageMode === "patterns" ? ".svg,.png,.jpg,.jpeg,image/*" : undefined}
      />

      {/* Search, Category Filters & Bulk Action Toolbar */}
      <div className="space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded-[3px] p-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#96abbe]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Hľadať súbory podľa názvu alebo popisu..."
              className="h-8 pl-8 text-xs rounded-[3px] bg-[#070b0f] text-[#fafbfc] border-[rgba(63,85,102,0.6)] focus-visible:ring-[#c8d400]/40"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-2.5 py-1 text-xs rounded-[3px] border transition-colors ${
                typeFilter === "ALL"
                  ? "bg-primary text-primary-foreground border-primary font-bold shadow-xs"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/60"
              }`}
            >
              Všetky ({stats.total})
            </button>
            <button
              onClick={() => setTypeFilter("IMAGE")}
              className={`px-2.5 py-1 text-xs rounded-[3px] border transition-colors ${
                typeFilter === "IMAGE"
                  ? "bg-sky-500/20 text-sky-400 border-sky-500/40 font-bold"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/60"
              }`}
            >
              Obrázky
            </button>
            <button
              onClick={() => setTypeFilter("ICON")}
              className={`px-2.5 py-1 text-xs rounded-[3px] border transition-colors ${
                typeFilter === "ICON"
                  ? "bg-purple-500/20 text-purple-400 border-purple-500/40 font-bold"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/60"
              }`}
            >
              Ikony
            </button>
            <button
              onClick={() => setTypeFilter("DOCUMENT")}
              className={`px-2.5 py-1 text-xs rounded-[3px] border transition-colors ${
                typeFilter === "DOCUMENT"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/40 font-bold"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/60"
              }`}
            >
              Dokumenty
            </button>
            <button
              onClick={() => setTypeFilter("EXTERNAL")}
              className={`px-2.5 py-1 text-xs rounded-[3px] border transition-colors ${
                typeFilter === "EXTERNAL"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 font-bold"
                  : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/60"
              }`}
            >
              Externé linky
            </button>
          </div>
        </div>

        {/* Bulk Action Sticky Bar (when items are selected) */}
        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between gap-3 p-3 rounded-[3px] bg-primary/10 border border-primary/30 text-xs animate-in fade-in-50 duration-150">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">
                Označené: {selectedIds.size}{" "}
                {selectedIds.size === 1
                  ? "položka"
                  : selectedIds.size >= 2 && selectedIds.size <= 4
                  ? "položky"
                  : "položiek"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSelectAll}
                className="h-7 text-xs rounded-[3px]"
              >
                {selectedIds.size === filteredMedia.length ? "Zrušiť všetko" : "Vybrať všetko"}
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="h-7 text-xs rounded-[3px] gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Zmazať označené ({selectedIds.size})
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Grid of Media Assets */}
      {filteredMedia.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filteredMedia.map((asset) => (
            <MediaCard
              key={asset.id}
              asset={asset}
              isSelected={selectedIds.has(asset.id)}
              onToggleSelect={handleToggleSelect}
              onEdit={handleOpenEdit}
              onDelete={handleSingleDelete}
            />
          ))}
        </div>
      ) : (
        <div className="border border-dashed border-[rgba(63,85,102,0.45)] rounded-[3px] p-12 text-center bg-[#17212a] text-[#fafbfc] space-y-4">
          <div className="w-12 h-12 rounded-[3px] bg-[#070b0f] text-[#c8d400] mx-auto flex items-center justify-center border border-[rgba(63,85,102,0.5)]">
            <FolderOpen className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto space-y-1.5">
            <h3 className="font-semibold text-base text-[#fafbfc]">
              {mediaList.length === 0
                ? "Knižnica médií je zatiaľ prázdna"
                : "Žiadne súbory nezodpovedajú zvolenému filtru"}
            </h3>
            <p className="text-xs text-[#96abbe] leading-relaxed">
              {mediaList.length === 0
                ? "Presuňte sem fotografie, produktové rendery, ikony alebo pridajte externý odkaz na Google Drive / Dropbox."
                : "Skúste zmeniť vyhľadávací dotaz alebo kliknúť na 'Všetky'."}
            </p>
          </div>

          {mediaList.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setTypeFilter("ALL");
              }}
              className="text-xs rounded-[3px]"
            >
              Resetovať filtre
            </Button>
          )}
        </div>
      )}

      {/* Edit Metadata Modal */}
      <MediaEditModal
        asset={editingAsset}
        brandId={brandId}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingAsset(null);
        }}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
