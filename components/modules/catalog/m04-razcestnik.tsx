"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import { M04RazcestnikConfig, M04CardItem } from "@/lib/validations/modules/m04";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { InlineEditableText } from "@/components/admin/builder/inline-editable-text";
import { updateModuleConfigAction, getBrandPagesAction } from "@/actions/pages";
import { PageItem } from "@/lib/types/page";

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

  // Load brand pages for linking
  useEffect(() => {
    if (brandId) {
      getBrandPagesAction(brandId).then((res) => {
        if (res.success && res.pages) {
          setBrandPages(res.pages);
        }
      });
    }
  }, [brandId, isManageModalOpen]);

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

  // Grid columns styling
  const gridColsClass =
    columns === 1
      ? "grid-cols-1"
      : columns === 3
      ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
      : "grid-cols-1 sm:grid-cols-2";

  // Button styles mapping
  const getButtonStyle = (style?: "primary" | "secondary" | "outline" | "ghost") => {
    switch (style) {
      case "secondary":
        return "bg-neutral-800 text-foreground hover:bg-neutral-700 border border-border/80";
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
    (typeof window !== "undefined"
      ? window.location.pathname.match(/\/admin\/brand\/([^/]+)/)?.[1] ||
        (window.location.pathname.startsWith("/m/")
          ? window.location.pathname.split("/")[2]
          : "")
      : "") ||
    "logobook";

  // Link resolver for card
  const getCardHref = (card: M04CardItem & { url?: string; subtitle?: any }) => {
    if (isEditor) {
      if (card.targetPageId) {
        return `/admin/brand/${currentBrand}/builder/${card.targetPageId}`;
      }
      if (card.targetUrl && card.targetUrl !== "#") {
        if (card.targetUrl.includes("/builder/")) {
          const targetId = card.targetUrl.split("/builder/")[1];
          return `/admin/brand/${currentBrand}/builder/${targetId}`;
        }
        return card.targetUrl;
      }
      if (card.url && card.url !== "#") {
        if (card.url.includes("/builder/")) {
          const targetId = card.url.split("/builder/")[1];
          return `/admin/brand/${currentBrand}/builder/${targetId}`;
        }
        return card.url;
      }
      return "#";
    } else {
      // Public manual mode
      let prefix = "";
      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/m/")) {
          const parts = path.split("/").filter(Boolean);
          const domainPart = parts[1] || currentBrand;
          prefix = `/m/${domainPart}`;
        }
      }

      let slug = "";
      if (card.targetPageId) {
        const matched = brandPages.find((p) => p.id === card.targetPageId);
        slug = matched?.slug || card.targetPageId;
      } else if (card.targetUrl && card.targetUrl !== "#") {
        if (card.targetUrl.includes("/builder/")) {
          const targetId = card.targetUrl.split("/builder/")[1];
          const matched = brandPages.find((p) => p.id === targetId);
          slug = matched?.slug || targetId;
        } else {
          slug = card.targetUrl.replace(/^\/+/, "");
        }
      } else if (card.url && card.url !== "#") {
        if (card.url.includes("/builder/")) {
          const targetId = card.url.split("/builder/")[1];
          const matched = brandPages.find((p) => p.id === targetId);
          slug = matched?.slug || targetId;
        } else {
          slug = card.url.replace(/^\/+/, "");
        }
      }

      if (!slug) return "#";
      return prefix ? `${prefix}/${slug}` : `/${slug}`;
    }
  };

  return (
    <div className="group/m04 relative w-full py-1">
      {/* Editor Hover Toolbar */}
      {isEditor && (
        <div className="absolute -top-9 left-0 z-30 opacity-0 group-hover/m04:opacity-100 transition-opacity bg-neutral-950/95 border border-border/80 rounded-[3px] p-1 flex items-center gap-1 shadow-xl">
          {/* Columns Selector */}
          <div className="flex items-center gap-0.5 bg-neutral-900 rounded-[2px] p-0.5 border border-border/40">
            {([1, 2, 3] as const).map((colNum) => (
              <button
                key={colNum}
                type="button"
                onClick={() => handleUpdateConfig({ columns: colNum })}
                className={`px-1.5 py-0.5 text-[10px] font-mono rounded-[1px] transition-colors ${
                  columns === colNum
                    ? "bg-primary text-primary-foreground font-bold"
                    : "text-muted-foreground hover:text-foreground hover:bg-neutral-800"
                }`}
                title={`Počet stĺpcov: ${colNum}`}
              >
                {colNum} {colNum === 1 ? "Stĺpec" : "Stĺpce"}
              </button>
            ))}
          </div>

          <div className="w-[1px] h-3 bg-border/40 my-auto mx-0.5" />

          {/* Clickable entire card toggle */}
          <button
            type="button"
            onClick={() => handleUpdateConfig({ clickableEntireCard: !clickableEntireCard })}
            className={`px-1.5 py-0.5 text-[10px] font-medium rounded-[2px] border transition-colors flex items-center gap-1 ${
              clickableEntireCard
                ? "bg-primary/10 border-primary text-primary font-bold"
                : "border-border/40 text-muted-foreground hover:text-foreground hover:bg-neutral-900"
            }`}
            title="Prepnúť klikateľnosť celej karty (A11y)"
          >
            <MousePointerClick className="h-3 w-3" />
            <span>Celá karta</span>
          </button>

          <div className="w-[1px] h-3 bg-border/40 my-auto mx-0.5" />

          {/* Manage Cards Modal Trigger */}
          <button
            type="button"
            onClick={() => setIsManageModalOpen(true)}
            className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-neutral-800 hover:bg-neutral-700 text-foreground border border-border/60 transition-colors flex items-center gap-1"
            title="Spravovať karty a prekliky"
          >
            <LayoutGrid className="h-3 w-3 text-primary" />
            <span>Spravovať karty ({items.length})</span>
          </button>

          {/* Active Locale indicator */}
          <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded-[1px] bg-neutral-900 border border-border/40 text-muted-foreground ml-0.5">
            {locale}
          </span>
        </div>
      )}

      {/* Grid of Navigation Cards */}
      <div className={`grid gap-4 sm:gap-6 ${gridColsClass}`}>
        {items.map((rawCard, idx) => {
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
              className={`group/card relative flex flex-col justify-between overflow-hidden bg-neutral-900/60 hover:bg-neutral-900/90 border border-border/50 hover:border-primary/60 transition-all duration-200 shadow-2xs hover:shadow-lg hover:-translate-y-1 h-full ${
                hasValidHref ? "cursor-pointer" : ""
              }`}
              style={{
                borderRadius: "var(--brand-radius, 3px)",
                borderWidth: "var(--brand-border-width, 1px)",
                borderStyle: "solid",
              }}
            >
              {/* Card Image (16:9 aspect ratio) */}
              {card.imageUrl ? (
                <div className="aspect-video w-full overflow-hidden bg-neutral-950/60 relative">
                  <img
                    src={card.imageUrl}
                    alt={cardTitle}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover/card:scale-105"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="aspect-video w-full flex items-center justify-center bg-neutral-950/40 text-muted-foreground/40 border-b border-border/20">
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
                className="block h-full outline-hidden"
              >
                {CardContent}
              </Link>
            );
          }

          return <div key={card.id || idx}>{CardContent}</div>;
        })}
      </div>

      {/* Card Management Modal (Sheet / Dialog) */}
      {isManageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-[3px] w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">
                  Správa kariet rázcestníka ({items.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: Left Card List / Right Active Card Editor */}
            <div className="flex-1 overflow-hidden grid md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-border/40">
              {/* Left Column: Cards List */}
              <div className="md:col-span-5 p-3 overflow-y-auto space-y-2 bg-neutral-950/30">
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Zoznam kariet
                  </span>
                  <button
                    type="button"
                    onClick={handleAddCard}
                    className="h-6 px-2 text-[11px] font-bold rounded-[2px] bg-primary text-primary-foreground flex items-center gap-1"
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
                            ? "bg-primary/10 border-primary text-foreground font-bold"
                            : "bg-neutral-900 border-border/40 hover:border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-[10px] font-mono text-muted-foreground">
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
                            className="p-1 hover:text-foreground disabled:opacity-30"
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
                            className="p-1 hover:text-foreground disabled:opacity-30"
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
                            className="p-1 hover:text-rose-400 text-muted-foreground ml-1"
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
                <div className="md:col-span-7 p-4 overflow-y-auto space-y-3.5">
                  <div className="text-xs font-bold text-foreground border-b border-border/30 pb-2">
                    Nastavenie karty: {editingCardIndex + 1}
                  </div>

                  {/* Title (Active Locale) */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground">
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
                      className="w-full h-8 px-2.5 rounded-[2px] bg-neutral-900 border border-border/50 text-xs text-foreground"
                    />
                  </div>

                  {/* Description (Active Locale) */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground">
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
                      className="w-full p-2 rounded-[2px] bg-neutral-900 border border-border/50 text-xs text-foreground"
                    />
                  </div>

                  {/* Image URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                      URL obrázka (pomer 16:9)
                    </label>
                    <input
                      type="text"
                      value={items[editingCardIndex].imageUrl || ""}
                      onChange={(e) => handleUpdateActiveCard({ imageUrl: e.target.value })}
                      placeholder="https://... / mockup.png"
                      className="w-full h-8 px-2.5 rounded-[2px] bg-neutral-900 border border-border/50 text-xs font-mono text-foreground"
                    />
                  </div>

                  {/* Internal Page Relation Dropdown */}
                  {brandPages.length > 0 && (
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                        Prepojiť s internou stránkou manuálu
                      </label>
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
                            targetUrl: pageId ? `/admin/brand/${brandId}/builder/${pageId}` : undefined,
                          });
                        }}
                        className="w-full h-8 px-2 rounded-[2px] bg-neutral-900 border border-border/50 text-xs text-foreground"
                      >
                        <option value="">— Vyberte stránku (alebo zadajte URL nižšie) —</option>
                        {brandPages.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.title?.sk || p.title?.en || p.slug} (/{p.slug})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Target URL */}
                  <div className="space-y-1">
                    <label className="text-[10px] uppercase font-semibold text-muted-foreground">
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
                      className="w-full h-8 px-2.5 rounded-[2px] bg-neutral-900 border border-border/50 text-xs font-mono text-foreground"
                    />
                  </div>

                  {/* Button Settings */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border/30">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-muted-foreground">
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
                        className="w-full h-8 px-2 rounded-[2px] bg-neutral-900 border border-border/50 text-xs text-foreground"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-semibold text-muted-foreground">
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
                        className="w-full h-8 px-2 rounded-[2px] bg-neutral-900 border border-border/50 text-xs text-foreground"
                      >
                        <option value="primary">Primary (Značková farba)</option>
                        <option value="secondary">Secondary (Tmavá)</option>
                        <option value="outline">Outline (Orámovaná)</option>
                        <option value="ghost">Ghost (Čistá)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-border/40 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsManageModalOpen(false)}
                className="h-7 px-3 text-xs font-bold rounded-[2px] bg-primary text-primary-foreground"
              >
                Hotovo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
