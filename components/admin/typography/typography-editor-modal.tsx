"use client";

import { useState, useEffect, useTransition } from "react";
import { BrandTypography } from "@/lib/types/typography";
import { saveBrandTypographyAction } from "@/actions/typography";
import {
  FONT_SOURCES,
  FONT_ROLES,
  POPULAR_GOOGLE_FONTS,
  DEFAULT_PANGRAMS,
  FontSource,
  FontRole,
  sanitizeAdobeProjectId,
} from "@/lib/validations/typography";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  X,
  Type,
  Loader2,
  AlertCircle,
  Globe,
  Upload,
  Cloud,
  ShieldCheck,
  ShieldAlert,
  Info,
  Check,
} from "lucide-react";

interface TypographyEditorModalProps {
  typography: BrandTypography | null;
  brandId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AVAILABLE_WEIGHT_OPTIONS = [
  { value: 300, label: "300 (Light)" },
  { value: 400, label: "400 (Regular)" },
  { value: 500, label: "500 (Medium)" },
  { value: 600, label: "600 (SemiBold)" },
  { value: 700, label: "700 (Bold)" },
  { value: 800, label: "800 (ExtraBold)" },
];

export function TypographyEditorModal({
  typography,
  brandId,
  isOpen,
  onClose,
  onSuccess,
}: TypographyEditorModalProps) {
  const isEditing = Boolean(typography);

  // Form states
  const [name, setName] = useState(typography?.name || "");
  const [role, setRole] = useState<FontRole>(typography?.role || "HEADING");
  const [fontSource, setFontSource] = useState<FontSource>(
    typography?.fontSource || "GOOGLE_FONTS"
  );

  // Google Fonts
  const [googleFontFamily, setGoogleFontFamily] = useState(
    typography?.googleFontFamily || "Plus Jakarta Sans"
  );

  // Adobe Fonts
  const [adobeProjectId, setAdobeProjectId] = useState(typography?.adobeProjectId || "");
  const [fontFamilyName, setFontFamilyName] = useState(typography?.fontFamilyName || "");

  // Custom Upload
  const [file, setFile] = useState<File | null>(null);
  const [licenseConfirmed, setLicenseConfirmed] = useState(
    typography?.licenseConfirmed ?? false
  );
  const [licenseAllowsOfflineDistribution, setLicenseAllowsOfflineDistribution] = useState(
    typography?.licenseAllowsOfflineDistribution ?? false
  );

  // Advanced settings
  const [weights, setWeights] = useState<number[]>(
    typography?.settings.weights || [400, 700]
  );
  const [fallback, setFallback] = useState(
    typography?.settings.fallback || "sans-serif"
  );
  const [sampleText, setSampleText] = useState(
    typography?.sampleText || DEFAULT_PANGRAMS[0]
  );

  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Reset or populate state when modal opens or typography changes
  useEffect(() => {
    if (typography) {
      setName(typography.name);
      setRole(typography.role);
      setFontSource(typography.fontSource);
      setGoogleFontFamily(typography.googleFontFamily || typography.fontFamilyName || typography.name);
      setAdobeProjectId(typography.adobeProjectId || "");
      setFontFamilyName(typography.fontFamilyName || "");
      setLicenseConfirmed(typography.licenseConfirmed);
      setLicenseAllowsOfflineDistribution(typography.licenseAllowsOfflineDistribution);
      setWeights(typography.settings.weights || [400, 700]);
      setFallback(typography.settings.fallback || "sans-serif");
      setSampleText(typography.sampleText || DEFAULT_PANGRAMS[0]);
      setFile(null);
    } else {
      setName("");
      setRole("HEADING");
      setFontSource("GOOGLE_FONTS");
      setGoogleFontFamily("Plus Jakarta Sans");
      setAdobeProjectId("");
      setFontFamilyName("");
      setLicenseConfirmed(false);
      setLicenseAllowsOfflineDistribution(false);
      setWeights([400, 700]);
      setFallback("sans-serif");
      setSampleText(DEFAULT_PANGRAMS[0]);
      setFile(null);
    }
    setError(null);
  }, [typography, isOpen]);

  if (!isOpen) return null;

  // Handle Adobe Project ID input with real-time sanitation
  const handleAdobeIdChange = (val: string) => {
    const sanitized = sanitizeAdobeProjectId(val);
    setAdobeProjectId(sanitized);
  };

  const toggleWeight = (w: number) => {
    if (weights.includes(w)) {
      if (weights.length > 1) {
        setWeights(weights.filter((item) => item !== w));
      }
    } else {
      setWeights([...weights, w].sort((a, b) => a - b));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic frontend checks
    const finalName = name.trim() || (fontSource === "GOOGLE_FONTS" ? googleFontFamily : fontFamilyName);
    if (!finalName) {
      setError("Zadajte prosím názov písma.");
      return;
    }

    if (fontSource === "ADOBE_FONTS") {
      if (!adobeProjectId.trim()) {
        setError("Zadajte Adobe Project ID (Typekit ID).");
        return;
      }
      if (!fontFamilyName.trim()) {
        setError("Zadajte CSS rodinu fontu (Font-Family názov z Adobe Fonts).");
        return;
      }
    }

    if (fontSource === "CUSTOM_UPLOAD") {
      if (!isEditing && !file) {
        setError("Vyberte súbor písma (.woff2, .woff, .ttf, .otf).");
        return;
      }
      if (!licenseConfirmed) {
        setError("Pre uloženie vlastného fontu musíte potvrdiť platnú webovú licenciu.");
        return;
      }
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", finalName);
      formData.append("role", role);
      formData.append("fontSource", fontSource);
      formData.append("googleFontFamily", googleFontFamily);
      formData.append("adobeProjectId", adobeProjectId);
      formData.append("fontFamilyName", fontFamilyName || finalName);
      formData.append("licenseConfirmed", licenseConfirmed ? "true" : "false");
      formData.append(
        "licenseAllowsOfflineDistribution",
        licenseAllowsOfflineDistribution ? "true" : "false"
      );
      formData.append("weights", JSON.stringify(weights));
      formData.append("fallback", fallback);
      formData.append("sampleText", sampleText);

      if (file) {
        formData.append("customFont", file);
      }

      const res = await saveBrandTypographyAction(brandId, typography?.id || null, formData);
      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setError(res.message);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative w-full max-w-2xl bg-card border border-border rounded-[3px] shadow-2xl p-6 my-8 animate-in fade-in-50 zoom-in-95 duration-150"
        role="dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[3px] bg-primary/10 flex items-center justify-center text-primary">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {isEditing ? `Upraviť písmo: ${typography?.name}` : "Pridať nové písmo do knižnice"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Konfigurácia zdroja písma, typografickej roly a licenčných pravidiel
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-[3px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-4">
          {error && (
            <div className="flex items-start gap-2.5 p-3 rounded-[3px] bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Font Source Selector Tabs */}
          <div className="space-y-2">
            <Label className="text-xs font-medium">Zdroj písma (Font Source)</Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setFontSource("GOOGLE_FONTS");
                  if (!name) setName(googleFontFamily);
                }}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-[3px] border text-xs font-medium transition-all ${
                  fontSource === "GOOGLE_FONTS"
                    ? "border-sky-500 bg-sky-500/10 text-sky-400 font-semibold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Google Fonts</span>
              </button>

              <button
                type="button"
                onClick={() => setFontSource("ADOBE_FONTS")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-[3px] border text-xs font-medium transition-all ${
                  fontSource === "ADOBE_FONTS"
                    ? "border-red-500 bg-red-500/10 text-red-400 font-semibold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span>Adobe Fonts (Typekit)</span>
              </button>

              <button
                type="button"
                onClick={() => setFontSource("CUSTOM_UPLOAD")}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-[3px] border text-xs font-medium transition-all ${
                  fontSource === "CUSTOM_UPLOAD"
                    ? "border-lime-500 bg-lime-500/10 text-lime-400 font-semibold"
                    : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>Vlastný súbor (WOFF2)</span>
              </button>
            </div>
          </div>

          {/* Conditional Fields based on Source */}
          {fontSource === "GOOGLE_FONTS" && (
            <div className="space-y-3 p-3.5 rounded-[3px] bg-sky-500/5 border border-sky-500/15">
              <div className="flex items-center justify-between">
                <Label htmlFor="googleFontFamily" className="text-xs font-medium text-foreground">
                  Google Font Rodina
                </Label>
                <span className="text-[11px] text-muted-foreground">fonts.google.com</span>
              </div>

              {/* Popular quick selects */}
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_GOOGLE_FONTS.slice(0, 8).map((gf) => (
                  <button
                    key={gf}
                    type="button"
                    onClick={() => {
                      setGoogleFontFamily(gf);
                      if (!name || name === googleFontFamily) setName(gf);
                    }}
                    className={`px-2 py-0.5 text-[11px] rounded-[3px] border transition-colors ${
                      googleFontFamily === gf
                        ? "bg-sky-500/20 text-sky-400 border-sky-500/40 font-semibold"
                        : "bg-muted/40 text-muted-foreground hover:text-foreground border-border/40"
                    }`}
                  >
                    {gf}
                  </button>
                ))}
              </div>

              <Input
                id="googleFontFamily"
                value={googleFontFamily}
                onChange={(e) => {
                  setGoogleFontFamily(e.target.value);
                  if (!name) setName(e.target.value);
                }}
                placeholder="Napr. Plus Jakarta Sans alebo Montserrat"
                className="h-9 text-xs rounded-[3px] bg-background"
              />
            </div>
          )}

          {fontSource === "ADOBE_FONTS" && (
            <div className="space-y-3 p-3.5 rounded-[3px] bg-red-500/5 border border-red-500/15">
              <div className="space-y-1">
                <Label htmlFor="adobeProjectId" className="text-xs font-medium text-foreground">
                  Adobe Project ID (Typekit ID)
                </Label>
                <Input
                  id="adobeProjectId"
                  value={adobeProjectId}
                  onChange={(e) => handleAdobeIdChange(e.target.value)}
                  placeholder="napr. aok4bvg alebo skopírujte celý <link> tag"
                  className="h-9 text-xs font-mono rounded-[3px] bg-background"
                />
                <p className="text-[11px] text-muted-foreground">
                  Parser automaticky extrahuje čisté alfanumerické ID z URL aj HTML tagu.
                </p>
              </div>

              <div className="space-y-1">
                <Label htmlFor="fontFamilyName" className="text-xs font-medium text-foreground">
                  CSS Font-Family názov z Adobe Fonts
                </Label>
                <Input
                  id="fontFamilyName"
                  value={fontFamilyName}
                  onChange={(e) => setFontFamilyName(e.target.value)}
                  placeholder="napr. proxima-nova, futura-pt alebo adobe-garamond-pro"
                  className="h-9 text-xs font-mono rounded-[3px] bg-background"
                />
              </div>

              {/* Whitelist Warning */}
              <div className="flex items-start gap-2 p-2.5 rounded-[3px] bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed">
                <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
                <div>
                  <strong>Dôležité upozornenie:</strong> Vo svojom účte na fonts.adobe.com musíte v
                  nastaveniach projektu povoliť doménu <code className="bg-black/30 px-1 py-0.5 rounded">*.logobook.sk</code>{" "}
                  a prípadnú vlastnú doménu. Inak Adobe načítanie písma cez CORS zablokuje.
                </div>
              </div>
            </div>
          )}

          {fontSource === "CUSTOM_UPLOAD" && (
            <div className="space-y-3.5 p-3.5 rounded-[3px] bg-lime-500/5 border border-lime-500/15">
              <div className="space-y-1.5">
                <Label htmlFor="fontFile" className="text-xs font-medium text-foreground">
                  Súbor písma (.woff2 odporúčaný, .woff, .ttf, .otf do 15 MB)
                </Label>
                <Input
                  id="fontFile"
                  type="file"
                  accept=".woff2,.woff,.ttf,.otf,application/font-woff2,font/woff2,font/woff,font/ttf,font/otf"
                  onChange={(e) => {
                    const selected = e.target.files?.[0] || null;
                    setFile(selected);
                    if (selected && !name) {
                      const cleanBase = selected.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
                      setName(cleanBase);
                    }
                  }}
                  className="h-9 text-xs rounded-[3px] bg-background file:mr-3 file:py-1 file:px-2.5 file:rounded-[2px] file:border-0 file:text-xs file:font-medium file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
                />
                {isEditing && typography?.customFont && !file && (
                  <p className="text-[11px] text-muted-foreground">
                    Aktuálne nahraný súbor: <span className="font-mono text-foreground">{typography.customFont}</span>
                  </p>
                )}
              </div>

              {/* License Checkbox 1 (Mandatory) */}
              <div className="space-y-1">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={licenseConfirmed}
                    onChange={(e) => setLicenseConfirmed(e.target.checked)}
                    className="mt-0.5 rounded-[2px] accent-[#c8d400] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-foreground font-medium">
                    Potvrdzujem, že vlastním platnú webovú licenciu pre tento font a môžem ho používať na doméne logobook.sk a vlastnej doméne značky. <span className="text-destructive">*</span>
                  </span>
                </label>
              </div>

              {/* License Checkbox 2 (Optional Offline Distribution) */}
              <div className="space-y-1.5 p-3 rounded-[3px] bg-background/60 border border-border/50">
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={licenseAllowsOfflineDistribution}
                    onChange={(e) => setLicenseAllowsOfflineDistribution(e.target.checked)}
                    className="mt-0.5 rounded-[2px] accent-[#c8d400] w-4 h-4 cursor-pointer"
                  />
                  <span className="text-xs text-foreground font-medium">
                    Moja licencia EXPLICITNE POVOĽUJE distribúciu tohto fontu v offline HTML balíkoch odovzdávaných tretím stranám.
                  </span>
                </label>

                <p className="text-[11px] text-muted-foreground/90 pl-6 leading-relaxed">
                  ⚠ Väčšina komerčných fontov toto NEPOVOĽUJE. Ak si nie ste istý, nechajte nezaškrtnuté — font sa v offline ZIP exporte automaticky nahradí systémovým fallbackom (Inter / sans-serif). Online manuál bude zobrazovať font správne naďalej.
                </p>
              </div>
            </div>
          )}

          {/* General Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fontName" className="text-xs font-medium">
                Zobrazovaný názov písma <span className="text-destructive">*</span>
              </Label>
              <Input
                id="fontName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="napr. Plus Jakarta Sans alebo Proxima Nova"
                className="h-9 text-xs rounded-[3px]"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fontRole" className="text-xs font-medium">
                Typografická rola (Hierarchia)
              </Label>
              <select
                id="fontRole"
                value={role}
                onChange={(e) => setRole(e.target.value as FontRole)}
                className="w-full h-9 px-3 rounded-[3px] border border-input bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="HEADING">Nadpisy (HEADING)</option>
                <option value="BODY">Základný text (BODY)</option>
                <option value="DISPLAY">Display / Titulky (DISPLAY)</option>
                <option value="MONOSPACE">Kód & Technické (MONOSPACE)</option>
                <option value="EMAIL">Email & Systémové (EMAIL)</option>
              </select>
            </div>
          </div>

          {/* Weights Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Dostupné rezy písma (Weights)</Label>
              <span className="text-[11px] text-muted-foreground">Vyberte aspoň 1 rez</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_WEIGHT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => toggleWeight(opt.value)}
                  className={`px-2.5 py-1 text-xs rounded-[3px] border transition-colors flex items-center gap-1.5 ${
                    weights.includes(opt.value)
                      ? "bg-primary text-primary-foreground border-primary font-bold"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/60"
                  }`}
                >
                  {weights.includes(opt.value) && <Check className="w-3 h-3" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fallback Font & Default Sample */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="fontFallback" className="text-xs font-medium">
                CSS Fallback rodina
              </Label>
              <select
                id="fontFallback"
                value={fallback}
                onChange={(e) => setFallback(e.target.value)}
                className="w-full h-9 px-3 rounded-[3px] border border-input bg-background text-xs focus:outline-hidden focus:ring-1 focus:ring-primary"
              >
                <option value="sans-serif">sans-serif (Moderný čistý vzhľad)</option>
                <option value="serif">serif (Tradičné pätkové písmo)</option>
                <option value="monospace">monospace (Písmo s pevnou šírkou)</option>
                <option value="system-ui">system-ui (Natívne písmo OS)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sampleText" className="text-xs font-medium">
                Predvolený vzorový text
              </Label>
              <Input
                id="sampleText"
                value={sampleText}
                onChange={(e) => setSampleText(e.target.value)}
                placeholder="Príliš žltý kôň úpel temné tóny"
                className="h-9 text-xs rounded-[3px]"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isPending}
              className="text-xs rounded-[3px]"
            >
              Zrušiť
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isPending}
              className="text-xs rounded-[3px] gap-2 font-medium"
            >
              {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? "Uložiť zmeny" : "Pridať písmo"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
