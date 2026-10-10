"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  LayoutGrid,
  ExternalLink,
  ChevronRight,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Image as ImageIcon,
  MousePointerClick,
  Link as LinkIcon,
  Check,
  Upload,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import { M04RazcestnikConfig, M04CardItem } from "@/lib/validations/modules/m04";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction, getBrandPagesAction } from "@/actions/pages";
import { uploadMediaAction } from "@/actions/media";
import { PageItem } from "@/lib/types/page";
import { UniversalMediaPickerModal, SelectedMediaItem } from "@/components/admin/media/universal-media-picker-modal";

const SAMPLE_CARDS: M04CardItem[] = [
  {
    id: "card-sample-1",
    imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=600&q=80",
    title: {
      en: "Print Logo Assets",
      sk: "Tlačové podklady loga",
    },
    description: {
      en: "CMYK vector files, EPS and PDF formats for offset printing.",
      sk: "Vektorové súbory CMYK, formáty EPS a PDF pre ofsetovú tlač.",
    },
    targetUrl: "#print",
    button: {
      label: { en: "View print guidelines", sk: "Zobraziť tlačové pravidlá" },
      style: "primary",
    },
  },
  {
    id: "card-sample-2",
    imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80",
    title: {
      en: "Digital & Screen Assets",
      sk: "Digitálne formáty pre obrazovky",
    },
    description: {
      en: "RGB SVG, PNG and WebP assets optimized for web and mobile applications.",
      sk: "RGB súbory SVG, PNG a WebP optimalizované pre web a aplikácie.",
    },
    targetUrl: "#digital",
    button: {
      label: { en: "Explore digital guidelines", sk: "Preskúmať digitálne pravidlá" },
      style: "secondary",
    },
  },
];

export default function M04RazcestnikModule({
  id,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const params = useParams();
  const router = useRouter();
  const brandId = (params?.brandId as string) || "";

  const typedConfig = config as unknown as (Partial<M04RazcestnikConfig> & { gridColumns?: number }) | undefined;

  const columns = typedConfig?.columns || typedConfig?.gridColumns || 2;
  const clickableEntireCard =
    typedConfig?.clickableEntireCard !== undefined ? typedConfig.clickableEntireCard : true;
  const items: M04CardItem[] =
    typedConfig?.items && typedConfig.items.length > 0 ? typedConfig.items : SAMPLE_CARDS;

  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [brandPages, setBrandPages] = useState<PageItem[]>([]);
  const [editingCardIndex, setEditingCardIndex] = useState<number>(0);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pageSearchQuery, setPageSearchQuery] = useState("");
  const [isCardImagePickerOpen, setIsCardImagePickerOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load brand pages for linking
  const brandIdentifier =
    brandId ||
    (params?.domain as string) ||
    (typeof window !== "undefined"
      ? window.location.pathname.match(/\/admin\/brand\/([^/]+)/)?.[1] ||
        (window.location.pathname.startsWith("/m/")
          ? window.location.pathname.split("/")[2]
          : "")
      : "") ||
    "logobook";

  useEffect(() => {
    if (brandIdentifier) {
      getBrandPagesAction(brandIdentifier).then((res) => {
        if (res.success && res.pages) {
          setBrandPages(res.pages);
        }
      });
    }
  }, [brandIdentifier, isManageModalOpen]);

  // Helper to commit config updates to server
  const handleUpdateConfig = async (patch: Partial<M04RazcestnikConfig>) => {
    const updated: M04RazcestnikConfig = {
      columns,
      clickableEntireCard,
      items,
      styleOverrides: typedConfig?.styleOverrides,
      ...patch,
    };

    if (onConfigChange) {
      onConfigChange(updated as unknown as BaseModuleConfig);
    } else if (id) {
      await updateModuleConfigAction(id, updated as unknown as Record<string, unknown>);
    }
  };

  // Direct Inline Edit of a Card Title
  const handleSaveCardTitle = async (cardIndex: number, newTitle: string) => {
    const newItems = [...items];
    newItems[cardIndex] = {
      ...newItems[cardIndex],
      title: setI18nText(newItems[cardIndex].title, locale, newTitle),
    };
    await handleUpdateConfig({ items: newItems });
  };

  // Direct Inline Edit of a Card Description
  const handleSaveCardDesc = async (cardIndex: number, newDesc: string) => {
    const newItems = [...items];
    const prevDesc = newItems[cardIndex].description || (newItems[cardIndex] as any).subtitle;
    newItems[cardIndex] = {
      ...newItems[cardIndex],
      description: setI18nText(prevDesc, locale, newDesc),
    };
    await handleUpdateConfig({ items: newItems });
  };

  // Direct Inline Edit of a Card Button Label
  const handleSaveCardButtonLabel = async (cardIndex: number, newLabel: string) => {
    const newItems = [...items];
    const prevButton = newItems[cardIndex].button || {
      label: { en: "Explore section", sk: "Prejsť do sekcie" },
      style: "primary",
    };
    newItems[cardIndex] = {
      ...newItems[cardIndex],
      button: {
        ...prevButton,
        label: setI18nText(prevButton.label, locale, newLabel),
      },
    };
    await handleUpdateConfig({ items: newItems });
  };

  // Card Management Modal Handlers
  const handleAddCard = () => {
    const newCard: M04CardItem = {
      id: `card-${Date.now()}`,
      imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&w=600&q=80",
      title: {
        en: "New Section Card",
        sk: "Nová karta sekcie",
      },
      description: {
        en: "Brief description of the section topic.",
        sk: "Krátky popis témy tejto sekcie.",
      },
      targetUrl: "#",
      button: {
        label: { en: "Explore section", sk: "Prejsť do sekcie" },
        style: "primary",
      },
    };
    const newItems = [...items, newCard];
    handleUpdateConfig({ items: newItems });
    setEditingCardIndex(newItems.length - 1);
  };

  const handleDeleteCard = (cardIndex: number) => {
    if (items.length <= 1) {
      alert("Rázcestník musí obsahovať aspoň jednu kartu.");
      return;
    }
    const newItems = items.filter((_, idx) => idx !== cardIndex);
    handleUpdateConfig({ items: newItems });
    setEditingCardIndex(Math.max(0, cardIndex - 1));
  };

  const handleMoveCard = (cardIndex: number, direction: "up" | "down") => {
    const targetIdx = direction === "up" ? cardIndex - 1 : cardIndex + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;
    const newItems = [...items];
    const temp = newItems[cardIndex];
    newItems[cardIndex] = newItems[targetIdx];
    newItems[targetIdx] = temp;
    handleUpdateConfig({ items: newItems });
    setEditingCardIndex(targetIdx);
  };

  const handleUpdateActiveCard = (patch: Partial<M04CardItem>) => {
    const newItems = [...items];
    newItems[editingCardIndex] = {
      ...newItems[editingCardIndex],
      ...patch,
    };
    handleUpdateConfig({ items: newItems });
  };

  // Upload card image to Cloudflare R2 / PocketBase mediaAssets (enforces storage quota)
  const handleUploadCardImage = async (file: File) => {
    setIsUploadingImage(true);
    setUploadError(null);
    try {
      const activeCard = items[editingCardIndex];
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("fileType", "IMAGE");
      const alt = resolveI18nText(activeCard?.title, locale, "en") || file.name;
      formData.append("altText", alt);

      const res = await uploadMediaAction(brandIdentifier, formData);
      if (res.success && res.asset?.fileUrl) {
        handleUpdateActiveCard({ imageUrl: res.asset.fileUrl });
      } else {
        setUploadError(res.message || "Nepodarilo sa nahrať obrázok.");
      }
    } catch (err: any) {
      console.error("Failed to upload card image:", err);
      setUploadError(err.message || "Chyba pri nahrávaní obrázka.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Filtered internal pages for search autocomplete
  const filteredPages = brandPages.filter((p) => {
    if (!pageSearchQuery.trim()) return true;
    const q = pageSearchQuery.toLowerCase().trim();
    const skTitle = p.title?.sk?.toLowerCase() || "";
    const enTitle = p.title?.en?.toLowerCase() || "";
    const csTitle = p.title?.cs?.toLowerCase() || "";
    const slug = p.slug?.toLowerCase() || "";
    return skTitle.includes(q) || enTitle.includes(q) || csTitle.includes(q) || slug.includes(q);
  });

  // Layout calculation for M04 cards:
  // Rules:
  // - 1 card: 100% full width (col-span-6)
  // - 2 cards: 50% : 50% (col-span-3 each)
  // - 3 cards: 33.3% : 33.3% : 33.3% (col-span-2 each)
  // - 4 cards: 2 rows of 50% : 50% (col-span-3 each)
  // - 5 cards: 1st row 50% : 50% (first 2 col-span-3), 2nd row 33.3% : 33.3% : 33.3% (last 3 col-span-2)
  // - default/fallback: standard 6-column grid proportion based on columns config
  const totalCards = items.length;

  const getCardColSpanClass = (cardIndex: number) => {
    if (totalCards === 1) {
      return "col-span-1 sm:col-span-6";
    }
    if (totalCards === 2) {
      return "col-span-1 sm:col-span-3";
    }
    if (totalCards === 3) {
      return "col-span-1 sm:col-span-2";
    }
    if (totalCards === 4) {
      return "col-span-1 sm:col-span-3";
    }
    if (totalCards === 5) {
      return cardIndex < 2 ? "col-span-1 sm:col-span-3" : "col-span-1 sm:col-span-2";
    }

    // Fallback for > 5 cards: respect config columns
    if (columns === 1) return "col-span-1 sm:col-span-6";
    if (columns === 2) return "col-span-1 sm:col-span-3";
    return "col-span-1 sm:col-span-2";
  };

  // Button styles mapping
  const getButtonStyle = (style?: "primary" | "secondary" | "outline" | "ghost") => {
    switch (style) {
      case "secondary":
        return "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border";
      case "outline":
        return "bg-transparent text-foreground border border-border hover:border-primary hover:text-primary";
      case "ghost":
        return "bg-transparent text-primary hover:bg-primary/10";
      case "primary":
      default:
        return "bg-primary text-primary-foreground font-bold hover:bg-primary/90";
    }
  };

  const currentBrand =
    brandId ||
    brandIdentifier ||
    "logobook";

  // Link resolver for card
  const getCardHref = (card: M04CardItem & { url?: string; subtitle?: any; targetSlug?: string; slug?: string }) => {
    // 1. Direct explicit targetSlug or slug on card
    let rawTarget = card.targetSlug || card.slug || "";

    // 2. Extract from targetUrl or url if not found
    if (!rawTarget) {
      const urlStr = card.targetUrl || card.url || "";
      if (urlStr && urlStr !== "#") {
        if (urlStr.includes("/builder/")) {
          rawTarget = urlStr.split("/builder/")[1] || "";
        } else {
          rawTarget = urlStr.replace(/^\/+/, "");
        }
      }
    }

    // 3. Fallback to targetPageId
    if (!rawTarget && card.targetPageId) {
      rawTarget = card.targetPageId;
    }

    if (!rawTarget || rawTarget === "#") return "#";

    // Match against brandPages list if available
    const matched = brandPages.find((p) => p.id === rawTarget || p.slug === rawTarget);
    const finalSlug = matched?.slug || rawTarget;

    if (isEditor) {
      return `/admin/brand/${currentBrand}/builder/${finalSlug}`;
    } else {
      const isSubdomainOrCustom =
        typeof window !== "undefined" &&
        !["logobook.sk", "www.logobook.sk", "logobook.eu", "www.logobook.eu", "localhost"].includes(
          window.location.hostname.toLowerCase()
        ) &&
        !window.location.hostname.toLowerCase().endsWith(".sslip.io");

      if (isSubdomainOrCustom) {
        return `/${finalSlug}`;
      }

      let prefix = "";
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/m/")) {
          const parts = path.split("/").filter(Boolean);
          const domainPart = parts[1] || currentBrand;
          prefix = `/m/${domainPart}`;
        }
      }
      if (!prefix) {
        prefix = `/m/${currentBrand}`;
      }
      return `${prefix}/${finalSlug}`;
    }
  };

  return (
    <div className="group/m04 relative w-full py-1">
      {/* Editor Hover Toolbar */}
      {isEditor && (
        <div className="absolute -top-9 left-0 z-30 opacity-0 group-hover/m04:opacity-100 transition-opacity bg-[#070b0f] border border-white/20 rounded-[3px] p-1 flex items-center gap-1 shadow-xl">
          {/* Columns Selector */}
          <div className="flex items-center gap-0.5 bg-neutral-900 rounded-[2px] p-0.5 border border-white/10">
            {([1, 2, 3] as const).map((colNum) => (
              <button
                key={colNum}
                type="button"
                onClick={() => handleUpdateConfig({ columns: colNum })}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded-[1px] transition-colors cursor-pointer ${
                  columns === colNum
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-white/70 hover:text-white hover:bg-neutral-800"
                }`}
                title={`Počet stĺpcov: ${colNum}`}
              >
                {colNum} {colNum === 1 ? "Stĺpec" : "Stĺpce"}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-3 bg-white/20 my-auto mx-0.5" />

          {/* Clickable entire card toggle */}
          <button
            type="button"
            onClick={() => handleUpdateConfig({ clickableEntireCard: !clickableEntireCard })}
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[2px] border transition-colors flex items-center gap-1 cursor-pointer ${
              clickableEntireCard
                ? "bg-primary/20 border-primary text-primary font-bold"
                : "border-white/20 text-white/70 hover:text-white hover:bg-neutral-900"
            }`}
            title="Prepnúť klikateľnosť celej karty (A11y)"
          >
            <MousePointerClick className="h-3 w-3" />
            <span>Celá karta</span>
          </button>

          <div className="w-[1px] h-3 bg-white/20 my-auto mx-0.5" />

          {/* Manage Cards Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-neutral-900 hover:bg-neutral-800 text-white border border-white/20 transition-colors flex items-center gap-1 cursor-pointer"
            title="Spravovať karty a prekliky"
          >
            <LayoutGrid className="h-3 w-3 text-primary" />
            <span>Spravovať karty ({items.length})</span>
          </button>

          {/* Active Locale indicator */}
          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded-[1px] bg-neutral-900 border border-white/20 text-white/60 ml-0.5">
            {locale}
          </span>
        </div>
      )}

      {/* Grid of Navigation Cards (6-column base grid supporting 100%, 50:50 and 33:33:33 layout combinations) */}
      <div className="grid grid-cols-1 sm:grid-cols-6 gap-4 sm:gap-6">
        {items.map((rawCard, idx) => {
          const cardColSpanClass = getCardColSpanClass(idx);
          const card = rawCard as M04CardItem & { url?: string; subtitle?: any };
          const cardTitle =
            resolveI18nText(card.title, locale, "en") ||
            (locale === "sk" ? "Názov sekcie" : "Section Title");
          const cardDesc =
            resolveI18nText(card.description || card.subtitle, locale, "en") || "";
          const buttonLabel =
            resolveI18nText(card.button?.label, locale, "en") ||
            resolveI18nText(card.subtitle, locale, "en") ||
            (locale === "sk" ? "Prejsť do sekcie" : "Explore section");
          const buttonStyle = card.button?.style || "primary";

          // Resolved link
          const resolvedHref = getCardHref(card);
          const hasValidHref = resolvedHref && resolvedHref !== "#";

          // Card inner content
          const CardContent = (
            <div
              className={`group/card relative flex flex-col justify-between overflow-hidden bg-card border border-border hover:border-primary/60 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 h-full ${
                hasValidHref ? "cursor-pointer" : ""
              }`}
              style={{
                borderRadius: "var(--brand-radius, 3px)",
                borderWidth: "var(--brand-border-width, 1px)",
                borderStyle: "solid",
                ...(typedConfig?.styleOverrides?.backgroundColor
                  ? { backgroundColor: typedConfig.styleOverrides.backgroundColor }
                  : {}),
                ...(typedConfig?.styleOverrides?.borderColor
                  ? { borderColor: typedConfig.styleOverrides.borderColor }
                  : {}),
                ...(typedConfig?.styleOverrides?.textColor
                  ? { color: typedConfig.styleOverrides.textColor }
                  : {}),
              }}
            >
              {/* Card Image (1:1 aspect ratio) */}
              {card.imageUrl ? (
                <div className="aspect-square w-full overflow-hidden bg-muted/40 relative">
                  <img
                    src={card.imageUrl}
                    alt={cardTitle}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-square w-full flex items-center justify-center bg-muted/30 text-muted-foreground/60 border-b border-border/20">
                  <ImageIcon className="h-8 w-8" />
                </div>
              )}

              {/* Card Body */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  {isEditor ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <InlineEditableText
                        as="h4"
                        value={cardTitle}
                        onSave={(val) => handleSaveCardTitle(idx, val)}
                        className="text-base sm:text-lg font-bold tracking-tight text-foreground block"
                        placeholder="Card Title..."
                      />
                    </div>
                  ) : (
                    <h4 className="text-base sm:text-lg font-bold tracking-tight text-foreground group-hover/card:text-primary transition-colors">
                      {cardTitle}
                    </h4>
                  )}

                  {isEditor ? (
                    <div onClick={(e) => e.stopPropagation()}>
                      <InlineEditableText
                        as="p"
                        multiline={true}
                        value={cardDesc}
                        onSave={(val) => handleSaveCardDesc(idx, val)}
                        className="text-xs sm:text-sm text-muted-foreground leading-relaxed block"
                        placeholder="Card description..."
                      />
                    </div>
                  ) : (
                    cardDesc && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {cardDesc}
                      </p>
                    )
                  )}
                </div>

                {/* Call to action button */}
                <div className="pt-2 flex items-center justify-between">
                  {hasValidHref ? (
                    <Link
                      href={resolvedHref}
                      onClick={(e) => e.stopPropagation()}
                      className={`px-3 py-1.5 rounded-[2px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${getButtonStyle(
                        buttonStyle
                      )}`}
                    >
                      {isEditor ? (
                        <span onClick={(e) => e.stopPropagation()}>
                          <InlineEditableText
                            value={buttonLabel}
                            onSave={(val) => handleSaveCardButtonLabel(idx, val)}
                          />
                        </span>
                      ) : (
                        <span>{buttonLabel}</span>
                      )}
                      <ChevronRight className="h-3 w-3 transition-transform group-hover/card:translate-x-0.5" />
                    </Link>
                  ) : (
                    <div
                      className={`px-3 py-1.5 rounded-[2px] text-xs font-semibold flex items-center gap-1.5 transition-colors ${getButtonStyle(
                        buttonStyle
                      )}`}
                    >
                      {isEditor ? (
                        <span onClick={(e) => e.stopPropagation()}>
                          <InlineEditableText
                            value={buttonLabel}
                            onSave={(val) => handleSaveCardButtonLabel(idx, val)}
                          />
                        </span>
                      ) : (
                        <span>{buttonLabel}</span>
                      )}
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  )}

                  {isEditor && hasValidHref && (
                    <Link
                      href={resolvedHref}
                      onClick={(e) => e.stopPropagation()}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-neutral-800 rounded-[2px] transition-colors"
                      title="Otvoriť cieľovú podstránku v PageBuilderi"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          );

          // Return wrapped card when clickable entire card is active
          if (clickableEntireCard && hasValidHref) {
            return (
              <Link
                key={card.id || idx}
                href={resolvedHref}
                className={`block h-full outline-hidden ${cardColSpanClass}`}
              >
                {CardContent}
              </Link>
            );
          }

          return (
            <div key={card.id || idx} className={cardColSpanClass}>
              {CardContent}
            </div>
          );
        })}
      </div>

      {/* Card Management Modal (Sheet / Dialog) */}
      {isManageModalOpen && (
        <div
          className="dark fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 text-[#fafbfc]"
          data-theme="dark"
        >
          <div className="bg-[#0e161d] border border-[rgba(63,85,102,0.65)] rounded-[4px] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden text-[#fafbfc] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a] flex items-center justify-between text-[#fafbfc]">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-[#fafbfc]">
                  Správa kariet rázcestníka ({items.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="text-xs text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-white/10 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Left Card List / Right Active Card Editor */}
            <div className="flex-1 overflow-hidden grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[rgba(63,85,102,0.45)] bg-[#0e161d]">
              {/* Left Column: Cards List */}
              <div className="md:col-span-5 p-3 overflow-y-auto space-y-2 bg-[#070b0f]">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] uppercase font-bold text-[#96abbe]">
                    Zoznam kariet
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="h-6 px-2 text-[11px] font-bold rounded-[2px] bg-primary text-[#070b0f] flex items-center gap-1 hover:brightness-110 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Pridať kartu</span>
                  </button>
                </div>

                <div className="space-y-1.5">
                  {items.map((rawC, i) => {
                    const c = rawC as M04CardItem & { url?: string; subtitle?: any };
                    const cTitle = resolveI18nText(c.title, locale, "en") || `Karta ${i + 1}`;
                    const isSelected = editingCardIndex === i;

                    return (
                      <div
                        key={c.id || i}
                        onClick={() => setEditingCardIndex(i)}
                        className={`p-2.5 rounded-[2px] border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          isSelected
                            ? "bg-primary/15 border-primary text-[#fafbfc] font-bold"
                            : "bg-[#17212a] border-[rgba(63,85,102,0.45)] hover:border-primary/50 text-[#96abbe] hover:text-[#fafbfc]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-[#96abbe]">
                            {i + 1}.
                          </span>
                          <span className="truncate">{cTitle}</span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveCard(i, "up");
                            }}
                            className="p-1 hover:text-[#fafbfc] text-[#96abbe] disabled:opacity-30"
                            title="Posunúť vyššie"
                          >
                            <ChevronUp className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            disabled={i === items.length - 1}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMoveCard(i, "down");
                            }}
                            className="p-1 hover:text-[#fafbfc] text-[#96abbe] disabled:opacity-30"
                            title="Posunúť nižšie"
                          >
                            <ChevronDown className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCard(i);
                            }}
                            className="p-1 hover:text-rose-400 text-[#96abbe] ml-1"
                            title="Vymazať kartu"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Active Card Detail Editor */}
              {items[editingCardIndex] && (
                <div className="md:col-span-7 p-4 overflow-y-auto space-y-3.5 bg-[#0e161d] text-[#fafbfc]">
                  <div className="text-xs font-bold text-[#fafbfc] border-b border-[rgba(63,85,102,0.45)] pb-2">
                    Nastavenie karty: {editingCardIndex + 1}
                  </div>

                  {/* Title (Active Locale) */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-[#96abbe]">
                      Názov karty ({locale.toUpperCase()})
                    </label>
                    <input
                      type="text"
                      value={resolveI18nText(items[editingCardIndex].title, locale, "en")}
                      onChange={(e) =>
                        handleUpdateActiveCard({
                          title: setI18nText(
                            items[editingCardIndex].title,
                            locale,
                            e.target.value
                          ),
                        })
                      }
                      className="w-full h-8 px-2.5 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Description (Active Locale) */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-[#96abbe]">
                      Popis karty ({locale.toUpperCase()})
                    </label>
                    <textarea
                      rows={2}
                      value={resolveI18nText(
                        items[editingCardIndex].description ||
                          (items[editingCardIndex] as any).subtitle,
                        locale,
                        "en"
                      )}
                      onChange={(e) =>
                        handleUpdateActiveCard({
                          description: setI18nText(
                            items[editingCardIndex].description ||
                              (items[editingCardIndex] as any).subtitle,
                            locale,
                            e.target.value
                          ),
                        })
                      }
                      className="w-full p-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Image Upload & URL (1:1 aspect ratio) */}
                  <div className="space-y-2 p-3 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.45)]">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase font-semibold text-[#96abbe] flex items-center gap-1.5">
                        <ImageIcon className="h-3 w-3 text-primary" />
                        <span>Obrázok karty (pomer 1:1)</span>
                      </label>
                      {items[editingCardIndex].imageUrl && (
                        <button
                          type="button"
                          onClick={() => handleUpdateActiveCard({ imageUrl: "" })}
                          className="text-[10px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer transition-colors"
                          title="Odstrániť obrázok karty"
                        >
                          <Trash2 className="h-3 w-3" />
                          <span>Zmazať</span>
                        </button>
                      )}
                    </div>

                    {/* Hidden file input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml,image/avif"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          await handleUploadCardImage(file);
                        }
                        e.target.value = "";
                      }}
                    />

                    <div className="flex items-start gap-3">
                      {/* Square 1:1 Preview Box */}
                      <div className="relative w-16 h-16 rounded-[2px] border border-[rgba(63,85,102,0.6)] bg-[#17212a] overflow-hidden shrink-0 flex items-center justify-center group/thumb">
                        {items[editingCardIndex].imageUrl ? (
                          <>
                            <img
                              src={items[editingCardIndex].imageUrl}
                              alt="Náhľad karty"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => setIsCardImagePickerOpen(true)}
                                className="p-1 rounded bg-white/20 hover:bg-white/40 text-white cursor-pointer"
                                title="Zmeniť obrázok"
                              >
                                <Upload className="h-3 w-3" />
                              </button>
                            </div>
                          </>
                        ) : (
                          <ImageIcon className="h-6 w-6 text-[#96abbe]/30" />
                        )}
                      </div>

                      {/* Open Universal Media Picker Modal & direct URL input */}
                      <div className="flex-1 space-y-2">
                        <button
                          type="button"
                          onClick={() => setIsCardImagePickerOpen(true)}
                          className="w-full h-7 px-3 rounded-[2px] bg-[#17212a] hover:bg-[#1f2c36] border border-[rgba(63,85,102,0.6)] hover:border-primary text-xs font-medium text-[#fafbfc] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <Upload className="h-3.5 w-3.5 text-primary" />
                          <span className="text-[11px] font-semibold">Vybrať z médií alebo nahrať</span>
                        </button>

                        <input
                          type="text"
                          value={items[editingCardIndex].imageUrl || ""}
                          onChange={(e) => handleUpdateActiveCard({ imageUrl: e.target.value })}
                          placeholder="Alebo zadajte priamu URL (https://...)"
                          className="w-full h-7 px-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.4)] text-[11px] font-mono text-[#fafbfc] placeholder:text-[#96abbe]/40 focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>

                    {uploadError && (
                      <div className="text-[10px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2 py-1 rounded-[2px]">
                        {uploadError}
                      </div>
                    )}
                  </div>

                  {/* Internal Page Relation Dropdown with Search Filter */}
                  {brandPages.length > 0 && (
                    <div className="space-y-1.5 p-3 rounded-[3px] bg-[#070b0f] border border-[rgba(63,85,102,0.45)]">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase font-semibold text-[#96abbe] flex items-center gap-1.5">
                          <LinkIcon className="h-3 w-3 text-primary" />
                          <span>Prepojiť s internou stránkou manuálu</span>
                        </label>
                        {pageSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setPageSearchQuery("")}
                            className="text-[10px] text-[#96abbe] hover:text-[#fafbfc] flex items-center gap-0.5 cursor-pointer"
                          >
                            <X className="h-2.5 w-2.5" />
                            <span>Zrušiť filter</span>
                          </button>
                        )}
                      </div>

                      {/* Search Filter Input */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1.5 h-3.5 w-3.5 text-[#96abbe]/60 pointer-events-none" />
                        <input
                          type="text"
                          value={pageSearchQuery}
                          onChange={(e) => setPageSearchQuery(e.target.value)}
                          placeholder="Filtrovať podstránku podľa názvu..."
                          className="w-full h-7 pl-8 pr-2.5 rounded-[2px] bg-[#17212a] border border-[rgba(63,85,102,0.45)] text-[11px] text-[#fafbfc] placeholder:text-[#96abbe]/40 focus:border-primary focus:outline-none"
                        />
                      </div>

                      <select
                        value={
                          items[editingCardIndex].targetPageId ||
                          (items[editingCardIndex].targetUrl?.startsWith("/admin/brand/")
                            ? items[editingCardIndex].targetUrl?.split("/builder/")[1]
                            : "") ||
                          ((items[editingCardIndex] as any).url?.startsWith("/admin/brand/")
                            ? (items[editingCardIndex] as any).url?.split("/builder/")[1]
                            : "") ||
                          ""
                        }
                        onChange={(e) => {
                          const pageId = e.target.value;
                          const selectedPage = brandPages.find((p) => p.id === pageId);
                          handleUpdateActiveCard({
                            targetPageId: pageId || undefined,
                            targetUrl: pageId ? `/admin/brand/${brandIdentifier}/builder/${pageId}` : undefined,
                          });
                        }}
                        className="w-full h-8 px-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                      >
                        <option value="" className="bg-[#0e161d] text-[#fafbfc]">
                          — {filteredPages.length === 0 ? "Žiadna stránka nevyhovuje filtru" : "Vyberte stránku (alebo zadajte URL nižšie)"} —
                        </option>
                        {filteredPages.map((p) => (
                          <option key={p.id} value={p.id} className="bg-[#0e161d] text-[#fafbfc]">
                            {p.title?.sk || p.title?.en || p.slug} (/{p.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Target URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-[#96abbe]">
                      Cieľová URL adresa (interná alebo externá)
                    </label>
                    <input
                      type="text"
                      value={
                        items[editingCardIndex].targetUrl ||
                        (items[editingCardIndex] as any).url ||
                        ""
                      }
                      onChange={(e) =>
                        handleUpdateActiveCard({
                          targetUrl: e.target.value,
                        })
                      }
                      placeholder="/admin/brand/.../builder/... alebo /logo/tlac"
                      className="w-full h-8 px-2.5 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs font-mono text-[#fafbfc] placeholder:text-[#96abbe]/40 focus:border-primary focus:outline-none"
                    />
                  </div>

                  {/* Button Settings */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[rgba(63,85,102,0.45)]">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-[#96abbe]">
                        Text tlačidla ({locale.toUpperCase()})
                      </label>
                      <input
                        type="text"
                        value={resolveI18nText(
                          items[editingCardIndex].button?.label ||
                            (items[editingCardIndex] as any).subtitle,
                          locale,
                          "en"
                        )}
                        onChange={(e) =>
                          handleUpdateActiveCard({
                            button: {
                              style: items[editingCardIndex].button?.style || "primary",
                              label: setI18nText(
                                items[editingCardIndex].button?.label ||
                                  (items[editingCardIndex] as any).subtitle,
                                locale,
                                e.target.value
                              ),
                            },
                          })
                        }
                        className="w-full h-8 px-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-[#96abbe]">
                        Štýl tlačidla
                      </label>
                      <select
                        value={items[editingCardIndex].button?.style || "primary"}
                        onChange={(e) =>
                          handleUpdateActiveCard({
                            button: {
                              label: items[editingCardIndex].button?.label || {
                                en: "Explore section",
                                sk: "Prejsť do sekcie",
                              },
                              style: e.target.value as "primary" | "secondary" | "outline" | "ghost",
                            },
                          })
                        }
                        className="w-full h-8 px-2 rounded-[2px] bg-[#070b0f] border border-[rgba(63,85,102,0.6)] text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                      >
                        <option value="primary" className="bg-[#0e161d] text-[#fafbfc]">Primary (Značková farba)</option>
                        <option value="secondary" className="bg-[#0e161d] text-[#fafbfc]">Secondary (Tmavá)</option>
                        <option value="outline" className="bg-[#0e161d] text-[#fafbfc]">Outline (Orámovaná)</option>
                        <option value="ghost" className="bg-[#0e161d] text-[#fafbfc]">Ghost (Čistá)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-[rgba(63,85,102,0.45)] bg-[#17212a] flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="h-7 px-4 text-xs font-bold rounded-[2px] bg-primary text-[#070b0f] hover:brightness-110 cursor-pointer"
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Universal Media Picker Modal for Card Images */}
      <UniversalMediaPickerModal
        isOpen={isCardImagePickerOpen}
        onClose={() => setIsCardImagePickerOpen(false)}
        brandId={brandIdentifier}
        title="Vybrať obrázok karty rázcestníka (1:1)"
        description="Vyberte z nahraných médií a grafík značky alebo nahrajte nový obrázok (započíta sa do kvóty konta)."
        currentUrl={items[editingCardIndex]?.imageUrl}
        onSelect={(selected) => {
          handleUpdateActiveCard({ imageUrl: selected.url });
        }}
        acceptedFileTypes="image/*,.png,.jpg,.jpeg,.webp,.svg,.avif"
        allowDirectUrl={true}
        includeBrandLogos={true}
      />
    </div>
  );
}
