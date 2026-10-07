"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Copy,
  Check,
  Settings2,
  Code,
  Image as ImageIcon,
  User,
  Mail,
  Phone,
  Globe,
  Building2,
  ExternalLink,
  Share2,
  Sparkles,
  Plus,
  Trash2,
  Upload,
  Loader2,
  Eye,
  RotateCcw,
  Palette,
  Layout,
  FileText,
  X,
} from "lucide-react";
import { ModuleRenderProps, BaseModuleConfig } from "@/lib/types/module";
import {
  M22EmailSignatureConfig,
  m22EmailSignatureSchema,
  M22TemplateId,
  M22SocialPlatform,
  M22SocialLink,
} from "@/lib/validations/modules/m22";
import { resolveI18nText, setI18nText } from "@/lib/validations/module";
import { useBrandCascade } from "@/components/modules/cascade";
import { updateModuleConfigAction } from "@/actions/pages";
import { getBrandAssetsAction } from "@/actions/assets";
import { uploadMediaAction } from "@/actions/media";
import { BrandAsset } from "@/lib/types/asset";

/**
 * Metadata & labels for all 7 signature templates
 */
const TEMPLATE_DEFINITIONS: Record<
  M22TemplateId,
  {
    id: M22TemplateId;
    title: string;
    description: string;
    badge: string;
  }
> = {
  classic_corporate: {
    id: "classic_corporate",
    title: "Klasický firemný (Dvojstĺpcový)",
    description: "Elegantný predelený layout s logom, voliteľnou fotkou a vertikálnou linkou.",
    badge: "Odporúčané",
  },
  modern_minimal: {
    id: "modern_minimal",
    title: "Moderný minimalistický",
    description: "Vzdušný horizontálny layout so značkovou linkou a kompaktným písmom.",
    badge: "Minimal",
  },
  badge_card: {
    id: "badge_card",
    title: "Karta so značkovým pásikom",
    description: "Ohraničená vizuálna karta s horným farebným akcentom a zaoblenými rohmi.",
    badge: "Karta",
  },
  compact_inline: {
    id: "compact_inline",
    title: "Kompaktný riadkový (Odpovede)",
    description: "Úsporný podpis vhodný pre mobilné zariadenia a rýchle e-mailové vlákna.",
    badge: "Kompaktný",
  },
  creative_split: {
    id: "creative_split",
    title: "Kreatívny štúdiový blok",
    description: "Kontrastný tmavý blok s logom a fotkou vľavo, kontaktné údaje vpravo.",
    badge: "Kreatívny",
  },
  promo_banner: {
    id: "promo_banner",
    title: "Marketingový s bannerom",
    description: "Kompletný firemný podpis s priloženým kampaňovým alebo náborovým bannerom.",
    badge: "Marketing",
  },
  executive_elegant: {
    id: "executive_elegant",
    title: "Manažérsky s právnou doložkou",
    description: "Vznešený profil s decentným písmom a formálnou doložkou o mlčanlivosti.",
    badge: "Executive",
  },
};

/**
 * Generates 100% email-client-bulletproof inline HTML table code for each template
 */
function generateSignatureHtml(
  templateId: M22TemplateId,
  data: {
    name: string;
    role: string;
    company: string;
    phone: string;
    email: string;
    website: string;
    logoUrl: string;
    photoUrl: string;
    primaryColor: string;
    socialLinks: M22SocialLink[];
    promoBannerUrl?: string | null;
    promoBannerLink?: string | null;
    disclaimerText?: string | null;
    fields: {
      showPhoto: boolean;
      showRole: boolean;
      showPhone: boolean;
      showSocials: boolean;
      showWebsite: boolean;
      showDisclaimer: boolean;
    };
  }
): string {
  const {
    name,
    role,
    company,
    phone,
    email,
    website,
    logoUrl,
    photoUrl,
    primaryColor,
    socialLinks,
    promoBannerUrl,
    promoBannerLink,
    disclaimerText,
    fields,
  } = data;

  const fontStack = "font-family: Arial, Helvetica, sans-serif;";
  const primary = primaryColor || "#c8d400";
  const darkText = "#17212a";
  const mutedText = "#64748b";

  // Build social icons HTML
  const socialsHtml =
    fields.showSocials && socialLinks.length > 0
      ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-top: 8px;">
          <tr>
            ${socialLinks
              .filter((s) => s.url)
              .map(
                (s) => `
              <td style="padding-right: 8px;">
                <a href="${s.url}" target="_blank" style="text-decoration: none; display: inline-block;">
                  <span style="font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: ${primary}; text-transform: uppercase;">
                    ${s.platform}
                  </span>
                </a>
              </td>`
              )
              .join("")}
          </tr>
        </table>`
      : "";

  // Build photo HTML if enabled and url present
  const photoHtml =
    fields.showPhoto && photoUrl
      ? `<img src="${photoUrl}" alt="${name}" width="56" height="56" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover; display: block; border: 2px solid ${primary};" />`
      : "";

  // Logo HTML (always present!)
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="${company}" height="32" style="max-height: 32px; max-width: 120px; display: block; object-fit: contain;" />`
    : `<span style="${fontStack} font-size: 16px; font-weight: bold; color: ${primary};">${company}</span>`;

  // Promotional banner HTML
  const bannerHtml =
    promoBannerUrl
      ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-top: 14px; max-width: 440px;">
          <tr>
            <td>
              <a href="${promoBannerLink || "#"}" target="_blank" style="text-decoration: none; display: block;">
                <img src="${promoBannerUrl}" alt="Special Announcement" width="440" style="width: 100%; max-width: 440px; height: auto; border-radius: 4px; display: block; border: 0;" />
              </a>
            </td>
          </tr>
        </table>`
      : "";

  // Legal disclaimer HTML
  const disclaimerHtml =
    fields.showDisclaimer && disclaimerText
      ? `<table cellpadding="0" cellspacing="0" border="0" style="margin-top: 12px; max-width: 460px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
          <tr>
            <td style="${fontStack} font-size: 9px; line-height: 14px; color: #94a3b8;">
              ${disclaimerText}
            </td>
          </tr>
        </table>`
      : "";

  // 1. CLASSIC CORPORATE (Dvojstĺpcový)
  if (templateId === "classic_corporate") {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="${fontStack} color: ${darkText}; font-size: 12px; line-height: 18px;">
  <tr>
    <td valign="middle" style="padding-right: 18px; text-align: center;">
      ${photoHtml ? `<div style="margin-bottom: 8px;">${photoHtml}</div>` : ""}
      <div>${logoHtml}</div>
    </td>
    <td valign="top" style="border-left: 2px solid ${primary}; padding-left: 18px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="${fontStack} font-size: 16px; font-weight: bold; color: ${darkText}; padding-bottom: 2px;">
            ${name}
          </td>
        </tr>
        ${
          fields.showRole && role
            ? `<tr>
                <td style="${fontStack} font-size: 12px; font-weight: 600; color: ${primary}; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 6px;">
                  ${role} <span style="color: ${mutedText}; font-weight: normal;">|</span> ${company}
                </td>
              </tr>`
            : ""
        }
        ${
          fields.showPhone && phone
            ? `<tr>
                <td style="${fontStack} font-size: 12px; color: ${mutedText};">
                  <span style="font-weight: bold; color: ${darkText};">T:</span> <a href="tel:${phone}" style="color: ${mutedText}; text-decoration: none;">${phone}</a>
                </td>
              </tr>`
            : ""
        }
        <tr>
          <td style="${fontStack} font-size: 12px; color: ${mutedText};">
            <span style="font-weight: bold; color: ${darkText};">E:</span> <a href="mailto:${email}" style="color: ${mutedText}; text-decoration: none;">${email}</a>
          </td>
        </tr>
        ${
          fields.showWebsite && website
            ? `<tr>
                <td style="${fontStack} font-size: 12px; color: ${mutedText};">
                  <span style="font-weight: bold; color: ${darkText};">W:</span> <a href="https://${website.replace(/^https?:\/\//, "")}" target="_blank" style="color: ${mutedText}; text-decoration: none;">${website}</a>
                </td>
              </tr>`
            : ""
        }
        ${socialsHtml ? `<tr><td>${socialsHtml}</td></tr>` : ""}
      </table>
    </td>
  </tr>
</table>
${bannerHtml}
${disclaimerHtml}
`.trim();
  }

  // 2. MODERN MINIMAL (Čistý horizontálny)
  if (templateId === "modern_minimal") {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="${fontStack} color: ${darkText}; font-size: 12px; line-height: 18px;">
  <tr>
    <td valign="middle" style="padding-bottom: 8px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${photoHtml ? `<td style="padding-right: 12px;">${photoHtml}</td>` : ""}
          <td valign="middle" style="padding-right: 14px;">${logoHtml}</td>
          <td valign="middle">
            <span style="${fontStack} font-size: 16px; font-weight: bold; color: ${darkText}; display: block;">${name}</span>
            ${fields.showRole && role ? `<span style="${fontStack} font-size: 12px; color: ${mutedText};">${role} · ${company}</span>` : ""}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="border-top: 2px solid ${primary}; padding-top: 8px;">
      <span style="${fontStack} font-size: 12px; color: ${mutedText};">
        ${fields.showPhone && phone ? `<a href="tel:${phone}" style="color: ${mutedText}; text-decoration: none;">${phone}</a> &nbsp;·&nbsp; ` : ""}
        <a href="mailto:${email}" style="color: ${mutedText}; text-decoration: none;">${email}</a>
        ${fields.showWebsite && website ? ` &nbsp;·&nbsp; <a href="https://${website.replace(/^https?:\/\//, "")}" target="_blank" style="color: ${primary}; font-weight: bold; text-decoration: none;">${website}</a>` : ""}
      </span>
      ${socialsHtml}
    </td>
  </tr>
</table>
${bannerHtml}
${disclaimerHtml}
`.trim();
  }

  // 3. BADGE CARD (Karta so značkovým pásikom)
  if (templateId === "badge_card") {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="${fontStack} width: 420px; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden; background-color: #ffffff;">
  <tr>
    <td style="height: 4px; background-color: ${primary}; line-height: 4px; font-size: 4px;">&nbsp;</td>
  </tr>
  <tr>
    <td style="padding: 16px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="top">
            <div style="${fontStack} font-size: 16px; font-weight: bold; color: ${darkText};">${name}</div>
            ${fields.showRole && role ? `<div style="${fontStack} font-size: 12px; color: ${primary}; font-weight: 600; margin-top: 2px;">${role}</div>` : ""}
            <div style="${fontStack} font-size: 11px; color: ${mutedText}; margin-bottom: 10px;">${company}</div>

            <div style="${fontStack} font-size: 12px; line-height: 18px; color: ${mutedText};">
              ${fields.showPhone && phone ? `<div>Tel: <a href="tel:${phone}" style="color: ${darkText}; text-decoration: none; font-weight: 500;">${phone}</a></div>` : ""}
              <div>Email: <a href="mailto:${email}" style="color: ${darkText}; text-decoration: none; font-weight: 500;">${email}</a></div>
              ${fields.showWebsite && website ? `<div>Web: <a href="https://${website.replace(/^https?:\/\//, "")}" target="_blank" style="color: ${darkText}; text-decoration: none; font-weight: 500;">${website}</a></div>` : ""}
            </div>
            ${socialsHtml}
          </td>
          <td valign="top" align="right" style="padding-left: 12px;">
            ${photoHtml ? `<div style="margin-bottom: 8px; text-align: right;">${photoHtml}</div>` : ""}
            <div style="text-align: right;">${logoHtml}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
${bannerHtml}
${disclaimerHtml}
`.trim();
  }

  // 4. COMPACT INLINE (Úsporný riadkový pre mobil)
  if (templateId === "compact_inline") {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="${fontStack} color: ${darkText}; font-size: 12px; line-height: 16px;">
  <tr>
    <td style="padding-bottom: 4px;">
      <span style="${fontStack} font-size: 14px; font-weight: bold; color: ${darkText};">${name}</span>
      ${fields.showRole && role ? ` <span style="color: ${mutedText}; font-size: 12px;">(${role})</span>` : ""}
    </td>
  </tr>
  <tr>
    <td style="padding-bottom: 6px;">
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          ${photoHtml ? `<td style="padding-right: 8px;">${photoHtml}</td>` : ""}
          <td valign="middle" style="padding-right: 8px;">${logoHtml}</td>
          <td valign="middle" style="${fontStack} font-size: 12px; font-weight: bold; color: ${darkText};">
            ${company}
          </td>
        </tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="${fontStack} font-size: 11px; color: ${mutedText};">
      ${fields.showPhone && phone ? `<a href="tel:${phone}" style="color: ${mutedText}; text-decoration: none;">${phone}</a> &nbsp;|&nbsp; ` : ""}
      <a href="mailto:${email}" style="color: ${mutedText}; text-decoration: none;">${email}</a>
      ${fields.showWebsite && website ? ` &nbsp;|&nbsp; <a href="https://${website.replace(/^https?:\/\//, "")}" target="_blank" style="color: ${mutedText}; text-decoration: none;">${website}</a>` : ""}
    </td>
  </tr>
  ${socialsHtml ? `<tr><td>${socialsHtml}</td></tr>` : ""}
</table>
${bannerHtml}
${disclaimerHtml}
`.trim();
  }

  // 5. CREATIVE SPLIT (Kreatívny štúdiový blok)
  if (templateId === "creative_split") {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="${fontStack} width: 440px; border: 1px solid #1e293b; border-radius: 6px; overflow: hidden; background-color: #ffffff;">
  <tr>
    <td valign="middle" align="center" style="width: 120px; background-color: #0e161d; padding: 18px 12px; text-align: center;">
      ${photoHtml ? `<div style="margin-bottom: 10px;">${photoHtml}</div>` : ""}
      <div>${logoHtml}</div>
    </td>
    <td valign="top" style="padding: 16px 18px; background-color: #ffffff;">
      <div style="${fontStack} font-size: 17px; font-weight: 800; color: #0e161d; letter-spacing: -0.3px;">${name}</div>
      ${fields.showRole && role ? `<div style="${fontStack} font-size: 12px; font-weight: 600; color: ${primary}; text-transform: uppercase; margin-top: 2px; margin-bottom: 8px;">${role}</div>` : ""}
      
      <div style="${fontStack} font-size: 12px; line-height: 18px; color: ${mutedText};">
        ${fields.showPhone && phone ? `<div>M: <a href="tel:${phone}" style="color: #0e161d; text-decoration: none; font-weight: 500;">${phone}</a></div>` : ""}
        <div>E: <a href="mailto:${email}" style="color: #0e161d; text-decoration: none; font-weight: 500;">${email}</a></div>
        ${fields.showWebsite && website ? `<div>W: <a href="https://${website.replace(/^https?:\/\//, "")}" target="_blank" style="color: ${primary}; font-weight: bold; text-decoration: none;">${website}</a></div>` : ""}
      </div>
      ${socialsHtml}
    </td>
  </tr>
</table>
${bannerHtml}
${disclaimerHtml}
`.trim();
  }

  // 6. PROMO BANNER
  if (templateId === "promo_banner") {
    return `
<table cellpadding="0" cellspacing="0" border="0" style="${fontStack} color: ${darkText}; font-size: 12px; line-height: 18px; width: 440px;">
  <tr>
    <td valign="middle" style="padding-right: 14px; width: 64px;">
      ${photoHtml || logoHtml}
    </td>
    <td valign="top" style="border-left: 2px solid ${primary}; padding-left: 14px;">
      <div style="${fontStack} font-size: 16px; font-weight: bold; color: ${darkText};">${name}</div>
      ${fields.showRole && role ? `<div style="${fontStack} font-size: 12px; font-weight: 600; color: ${primary};">${role} · ${company}</div>` : ""}
      <div style="${fontStack} font-size: 12px; color: ${mutedText}; margin-top: 4px;">
        ${fields.showPhone && phone ? `<a href="tel:${phone}" style="color: ${mutedText}; text-decoration: none;">${phone}</a> &nbsp;·&nbsp; ` : ""}
        <a href="mailto:${email}" style="color: ${mutedText}; text-decoration: none;">${email}</a>
      </div>
      ${fields.showWebsite && website ? `<div style="${fontStack} font-size: 12px; color: ${mutedText};"><a href="https://${website.replace(/^https?:\/\//, "")}" target="_blank" style="color: ${mutedText}; text-decoration: none;">${website}</a></div>` : ""}
      ${socialsHtml}
    </td>
  </tr>
  ${
    promoBannerUrl
      ? `<tr>
          <td colspan="2" style="padding-top: 14px;">
            <a href="${promoBannerLink || "#"}" target="_blank" style="text-decoration: none; display: block;">
              <img src="${promoBannerUrl}" alt="Campaign Banner" width="440" style="width: 100%; max-width: 440px; height: auto; border-radius: 4px; display: block; border: 0;" />
            </a>
          </td>
        </tr>`
      : `<tr>
          <td colspan="2" style="padding-top: 14px;">
            <div style="background-color: #f1f5f9; border: 1px dashed #cbd5e1; border-radius: 4px; padding: 12px; text-align: center; color: #64748b; font-size: 11px;">
              [Promo Banner Priestor: Nahrajte banner v nastaveniach modulu]
            </div>
          </td>
        </tr>`
  }
</table>
${disclaimerHtml}
`.trim();
  }

  // 7. EXECUTIVE ELEGANT (Manažérsky)
  return `
<table cellpadding="0" cellspacing="0" border="0" style="font-family: Georgia, Garamond, serif; color: ${darkText}; font-size: 13px; line-height: 20px; max-width: 460px;">
  <tr>
    <td valign="top" style="padding-bottom: 8px;">
      <div style="font-size: 18px; font-weight: normal; letter-spacing: 0.5px; color: #0f172a;">${name}</div>
      ${fields.showRole && role ? `<div style="font-family: Arial, sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: ${mutedText}; margin-top: 2px;">${role}</div>` : ""}
      <div style="font-family: Arial, sans-serif; font-size: 11px; font-weight: bold; color: ${primary}; margin-top: 1px;">${company}</div>
    </td>
  </tr>
  <tr>
    <td style="border-top: 1px solid #cbd5e1; padding-top: 8px; padding-bottom: 8px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%">
        <tr>
          <td valign="middle" style="font-family: Arial, sans-serif; font-size: 11px; color: ${mutedText};">
            ${fields.showPhone && phone ? `<div>Tel: <a href="tel:${phone}" style="color: ${darkText}; text-decoration: none;">${phone}</a></div>` : ""}
            <div>Email: <a href="mailto:${email}" style="color: ${darkText}; text-decoration: none;">${email}</a></div>
            ${fields.showWebsite && website ? `<div>Web: <a href="https://${website.replace(/^https?:\/\//, "")}" target="_blank" style="color: ${darkText}; text-decoration: none;">${website}</a></div>` : ""}
            ${socialsHtml}
          </td>
          <td valign="middle" align="right" style="padding-left: 14px;">
            ${photoHtml ? `<div style="margin-bottom: 6px; text-align: right;">${photoHtml}</div>` : ""}
            <div style="text-align: right;">${logoHtml}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
${bannerHtml}
${disclaimerHtml}
`.trim();
}

/**
 * Plain text representation for clipboard text/plain fallback
 */
function generateSignaturePlainText(data: any): string {
  const parts = [
    data.name,
    data.role ? `${data.role} | ${data.company}` : data.company,
    data.phone ? `Tel: ${data.phone}` : "",
    data.email ? `Email: ${data.email}` : "",
    data.website ? `Web: ${data.website}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}

export default function M22EmailPodpisModule({
  id: moduleId,
  moduleType = "M22_EmailPodpis",
  showH3 = false,
  h3Title,
  config,
  locale = "en",
  isEditor = false,
  onConfigChange,
}: ModuleRenderProps<BaseModuleConfig>) {
  const { resolveRadius, resolveColor, resolveStyles } = useBrandCascade();
  const brandRadius = resolveRadius();
  const brandPrimaryColor = resolveColor(undefined, "primary") || "#c8d400";
  const params = useParams();
  const brandId = (params?.brandId as string) || "";

  // Safe parse config
  const parsedConfig = useMemo(() => {
    const res = m22EmailSignatureSchema.safeParse(config);
    if (res.success) return res.data;
    return {
      mode: "preset_template" as const,
      templateId: "classic_corporate" as const,
      customHtml: null,
      fields: {
        showPhoto: true,
        showRole: true,
        showPhone: true,
        showSocials: true,
        showWebsite: true,
        showDisclaimer: false,
      },
      defaults: {
        name: "John Doe",
        role: "Creative Director",
        phone: "+421 900 123 456",
        email: "john.doe@company.com",
        website: "www.logobook.sk",
        company: "Logobook Studio",
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80",
        logoUrl: "/logo/logo-symbol-light.svg",
        primaryColor: "#c8d400",
      },
      disclaimerText: {
        en: "This message and any attachments are confidential and intended solely for the addressee. If you are not the intended recipient, please notify the sender and delete this message.",
        sk: "Táto správa a jej prílohy sú dôverné a určené výhradne adresátovi. Ak nie ste určeným príjemcom, informujte odosielateľa a správu vymažte.",
        cs: "Tato zpráva a její přílohy jsou důvěrné a určené výhradně adresátovi. Pokud nejste určeným příjemcem, informujte odesílatele a zprávu vymažte.",
      },
      socialLinks: [
        { id: "soc-1", platform: "linkedin" as const, url: "https://linkedin.com/company/logobook" },
        { id: "soc-2", platform: "web" as const, url: "https://logobook.sk" },
      ],
      promoBannerUrl: null,
      promoBannerLink: null,
    };
  }, [config]);

  const [cfg, setCfg] = useState<M22EmailSignatureConfig>(parsedConfig);

  // Live Employee Input States (pre-filled with John Doe as requested!)
  const [employeeName, setEmployeeName] = useState(parsedConfig.defaults.name || "John Doe");
  const [employeeRole, setEmployeeRole] = useState(parsedConfig.defaults.role || "Creative Director");
  const [employeePhone, setEmployeePhone] = useState(parsedConfig.defaults.phone || "+421 900 123 456");
  const [employeeEmail, setEmployeeEmail] = useState(parsedConfig.defaults.email || "john.doe@company.com");
  const [employeePhotoUrl, setEmployeePhotoUrl] = useState(parsedConfig.defaults.photoUrl || "");

  // UI state
  const [isCopiedHtml, setIsCopiedHtml] = useState(false);
  const [isCopiedCode, setIsCopiedCode] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [modalTab, setModalTab] = useState<"templates" | "fields" | "custom_code">("templates");
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const photoFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setCfg(parsedConfig);
  }, [parsedConfig]);

  // Load brand assets for logo picker
  useEffect(() => {
    if (brandId && isEditor) {
      getBrandAssetsAction(brandId)
        .then((res) => {
          if (res?.success && res.assets) {
            setBrandAssets(res.assets);
          }
        })
        .catch((err) => console.error("Failed to load brand assets in M22:", err));
    }
  }, [brandId, isEditor]);

  // Save config handler
  const handleSaveConfig = async (newConfig: M22EmailSignatureConfig) => {
    setCfg(newConfig);
    if (onConfigChange) {
      onConfigChange(newConfig as unknown as BaseModuleConfig);
    }
    if (isEditor && moduleId) {
      try {
        await updateModuleConfigAction(moduleId, newConfig as unknown as Record<string, unknown>);
      } catch (err) {
        console.error("Failed to save M22 config:", err);
      }
    }
  };

  // Upload employee photo
  const handlePhotoUpload = async (file: File) => {
    setIsUploadingPhoto(true);
    try {
      if (brandId) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("fileName", file.name);
        formData.append("fileType", "IMAGE");
        const res = await uploadMediaAction(brandId, formData);
        if (res.success && res.asset?.fileUrl) {
          setEmployeePhotoUrl(res.asset.fileUrl);
          return;
        }
      }

      // Offline / fallback data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (dataUrl) setEmployeePhotoUrl(dataUrl);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Failed to upload employee photo in M22:", err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Prepare data for rendering HTML
  const renderedData = useMemo(() => {
    return {
      name: employeeName || "John Doe",
      role: employeeRole || "",
      company: cfg.defaults.company || "Logobook",
      phone: employeePhone || "",
      email: employeeEmail || "",
      website: cfg.defaults.website || "www.logobook.sk",
      logoUrl: cfg.defaults.logoUrl || "/logo/logo-symbol-light.svg",
      photoUrl: employeePhotoUrl,
      primaryColor: cfg.defaults.primaryColor || brandPrimaryColor,
      socialLinks: cfg.socialLinks,
      promoBannerUrl: cfg.promoBannerUrl,
      promoBannerLink: cfg.promoBannerLink,
      disclaimerText: resolveI18nText(cfg.disclaimerText, locale),
      fields: cfg.fields,
    };
  }, [
    employeeName,
    employeeRole,
    employeePhone,
    employeeEmail,
    employeePhotoUrl,
    cfg,
    brandPrimaryColor,
    locale,
  ]);

  // Generated final HTML string
  const finalHtml = useMemo(() => {
    if (cfg.mode === "custom_html" && cfg.customHtml) {
      // Replace merge tags in custom HTML
      let html = cfg.customHtml;
      html = html.replace(/\{\{name\}\}/gi, renderedData.name);
      html = html.replace(/\{\{role\}\}/gi, renderedData.role);
      html = html.replace(/\{\{company\}\}/gi, renderedData.company);
      html = html.replace(/\{\{phone\}\}/gi, renderedData.phone);
      html = html.replace(/\{\{email\}\}/gi, renderedData.email);
      html = html.replace(/\{\{website\}\}/gi, renderedData.website);
      html = html.replace(/\{\{photo_url\}\}/gi, renderedData.photoUrl);
      html = html.replace(/\{\{logo_url\}\}/gi, renderedData.logoUrl);
      html = html.replace(/\{\{primary_color\}\}/gi, renderedData.primaryColor);
      return html;
    }
    return generateSignatureHtml(cfg.templateId, renderedData);
  }, [cfg.mode, cfg.customHtml, cfg.templateId, renderedData]);

  // Copy rendered rich visual HTML to clipboard (for Outlook / Gmail)
  const handleCopyRichHtml = async () => {
    try {
      const blobHtml = new Blob([finalHtml], { type: "text/html" });
      const blobText = new Blob([generateSignaturePlainText(renderedData)], {
        type: "text/plain",
      });

      if (navigator.clipboard && window.ClipboardItem) {
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": blobHtml,
            "text/plain": blobText,
          }),
        ]);
      } else {
        // Fallback for older browsers
        await navigator.clipboard.writeText(finalHtml);
      }

      setIsCopiedHtml(true);
      setTimeout(() => setIsCopiedHtml(false), 2500);
    } catch (err) {
      console.error("Failed to copy rich HTML to clipboard:", err);
      // Fallback
      try {
        await navigator.clipboard.writeText(finalHtml);
        setIsCopiedHtml(true);
        setTimeout(() => setIsCopiedHtml(false), 2500);
      } catch (e) {
        console.error("Fallback clipboard write failed:", e);
      }
    }
  };

  // Copy raw HTML source code
  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(finalHtml);
      setIsCopiedCode(true);
      setTimeout(() => setIsCopiedCode(false), 2500);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  return (
    <div
      className="relative group/m22 transition-all duration-200"
      style={{
        borderRadius: brandRadius,
        ...resolveStyles(cfg.styleOverrides),
      }}
    >
      {/* Hidden photo file input */}
      <input
        ref={photoFileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handlePhotoUpload(file);
          e.target.value = "";
        }}
      />

      {/* Editor Hover Toolbar */}
      {isEditor && (
        <div className="absolute top-2 right-2 z-30 opacity-0 group-hover/m22:opacity-100 transition-opacity flex items-center gap-1.5 bg-[#070b0f] border border-white/20 px-2.5 py-1.5 rounded-[3px] shadow-md">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="flex items-center gap-1 text-[11px] font-medium text-white/80 hover:text-white transition-colors"
            title="Nastavenia e-mailových šablón"
          >
            <Settings2 className="w-3.5 h-3.5 text-primary" />
            <span>Konfigurovať šablóny</span>
          </button>
        </div>
      )}

      {/* Header section if showH3 */}
      {showH3 && (
        <div className="mb-6 flex items-center justify-between border-b border-border/40 pb-3">
          <h3 className="text-xl font-bold tracking-tight text-foreground">
            {resolveI18nText(h3Title, locale) || "Generátor E-mailových Podpisov"}
          </h3>
        </div>
      )}

      {/* Main 2-Column Generator UI */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ======================================================== */}
        {/* LEFT COLUMN: EMPLOYEE LIVE FORM (~40%)                  */}
        {/* ======================================================== */}
        <div className="lg:col-span-5 bg-card border border-border/60 rounded-xl p-5 sm:p-6 space-y-5 shadow-xs">
          <div className="border-b border-border/40 pb-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-sm sm:text-base text-foreground tracking-tight flex items-center gap-1.5">
                <User className="w-4 h-4 text-primary" />
                <span>Osobné údaje zamestnanca</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setEmployeeName("John Doe");
                  setEmployeeRole("Creative Director");
                  setEmployeePhone("+421 900 123 456");
                  setEmployeeEmail("john.doe@company.com");
                  setEmployeePhotoUrl(cfg.defaults.photoUrl);
                }}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 font-mono"
                title="Resetovať na predvolené údaje John Doe"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset (John Doe)</span>
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Vyplňte svoje údaje a podpis vpravo sa okamžite naživo pre-generuje.
            </p>
          </div>

          <div className="space-y-3.5">
            {/* Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground block">
                Meno a priezvisko:
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder="napr. John Doe"
                className="w-full bg-background border border-border/50 rounded px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            {/* Role / Job Title */}
            {cfg.fields.showRole && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground block">
                  Pracovná pozícia:
                </label>
                <input
                  type="text"
                  value={employeeRole}
                  onChange={(e) => setEmployeeRole(e.target.value)}
                  placeholder="napr. Creative Director"
                  className="w-full bg-background border border-border/50 rounded px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground block">
                Firemný e-mail:
              </label>
              <input
                type="email"
                value={employeeEmail}
                onChange={(e) => setEmployeeEmail(e.target.value)}
                placeholder="john.doe@company.com"
                className="w-full bg-background border border-border/50 rounded px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none font-mono"
              />
            </div>

            {/* Phone */}
            {cfg.fields.showPhone && (
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground block">
                  Telefónne číslo:
                </label>
                <input
                  type="text"
                  value={employeePhone}
                  onChange={(e) => setEmployeePhone(e.target.value)}
                  placeholder="+421 900 123 456"
                  className="w-full bg-background border border-border/50 rounded px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none font-mono"
                />
              </div>
            )}

            {/* Photo / Avatar Upload (Optional in every template) */}
            {cfg.fields.showPhoto && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground block">
                    Fotografia zamestnanca (Voliteľná):
                  </label>
                  {employeePhotoUrl && (
                    <button
                      type="button"
                      onClick={() => setEmployeePhotoUrl("")}
                      className="text-[10px] text-rose-400 hover:underline"
                    >
                      Odstrániť fotku
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-muted border border-border/60 flex items-center justify-center shrink-0">
                    {employeePhotoUrl ? (
                      <img
                        src={employeePhotoUrl}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1">
                    <button
                      type="button"
                      disabled={isUploadingPhoto}
                      onClick={() => photoFileInputRef.current?.click()}
                      className="w-full py-1.5 px-3 bg-muted hover:bg-muted/80 border border-border/50 rounded text-xs font-medium text-foreground flex items-center justify-center gap-1.5 transition-colors"
                    >
                      {isUploadingPhoto ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Nahrávam...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5 text-primary" />
                          <span>Nahrať vlastnú fotku</span>
                        </>
                      )}
                    </button>
                    <span className="text-[10px] text-muted-foreground block">
                      Kruhová fotografia s pomerom 1:1 (JPG alebo PNG).
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ======================================================== */}
        {/* RIGHT COLUMN: LIVE SIMULATED EMAIL CLIENT PREVIEW (~60%) */}
        {/* ======================================================== */}
        <div className="lg:col-span-7 flex flex-col space-y-5">
          {/* Simulated Email Client Frame */}
          <div className="bg-[#ffffff] border border-border/80 rounded-xl overflow-hidden shadow-md flex flex-col">
            {/* Email Client Header (Mockup window bar) */}
            <div className="bg-[#f8fafc] border-b border-border/60 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-400 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-400 inline-block" />
                <span className="text-[11px] font-mono text-slate-500 ml-2">
                  Nová správa · E-mailový podpis
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-primary/20 text-slate-800 border border-primary/30">
                  {TEMPLATE_DEFINITIONS[cfg.templateId]?.title || cfg.templateId}
                </span>
              </div>
            </div>

            {/* Email Message Body Simulation */}
            <div className="p-6 sm:p-8 bg-white min-h-[220px] flex flex-col justify-between text-slate-800">
              {/* Message placeholder body */}
              <div className="space-y-2 mb-6 border-b border-slate-100 pb-4">
                <p className="text-xs text-slate-400 italic">
                  Dobrý deň,<br />
                  posielam vám dohodnuté podklady k nášmu novému brand manuálu. V prípade otázok
                  ma neváhajte kontaktovať.
                </p>
                <p className="text-xs text-slate-400 italic">
                  S pozdravom,
                </p>
              </div>

              {/* RENDERED SIGNATURE CONTAINER */}
              <div
                className="overflow-x-auto select-all"
                dangerouslySetInnerHTML={{ __html: finalHtml }}
              />
            </div>
          </div>

          {/* Action Buttons: Primary Copy for Outlook/Gmail + Secondary Code Copy */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Primary Action Button (Visual HTML Copy) */}
            <button
              type="button"
              onClick={handleCopyRichHtml}
              className={`flex-1 py-3 px-5 rounded-lg font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                isCopiedHtml
                  ? "bg-emerald-500 text-white shadow-emerald-500/20"
                  : "bg-primary text-primary-foreground hover:opacity-90 active:scale-[0.99]"
              }`}
            >
              {isCopiedHtml ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Podpis skopírovaný! Vložte pomocou Ctrl+V do Outlooku / Gmailu</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Kopírovať podpis do schránky (pre Outlook / Gmail / Apple Mail)</span>
                </>
              )}
            </button>

            {/* Secondary Action Button (Raw HTML Code) */}
            <button
              type="button"
              onClick={handleCopyCode}
              className={`py-3 px-4 rounded-lg font-medium text-xs border flex items-center justify-center gap-1.5 transition-all ${
                isCopiedCode
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                  : "bg-muted border-border/60 text-muted-foreground hover:text-foreground hover:border-border"
              }`}
              title="Kopírovať čistý HTML kód pre webmastera a CRM"
            >
              {isCopiedCode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Kód skopírovaný</span>
                </>
              ) : (
                <>
                  <Code className="w-3.5 h-3.5" />
                  <span>HTML kód</span>
                </>
              )}
            </button>
          </div>

          {/* Helper Tips */}
          <div className="bg-muted/40 border border-border/40 rounded-lg p-3 flex items-start gap-2.5 text-xs text-muted-foreground">
            <Sparkles className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <strong className="text-foreground block text-[11px]">
                Ako vložiť podpis do e-mailového klienta:
              </strong>
              <p className="text-[11px] leading-relaxed">
                Kliknite na tlačidlo <em>„Kopírovať podpis do schránky“</em> vyššie, otvorte
                nastavenia podpisu v <strong>Outlooku, Gmaile alebo Apple Maili</strong> a stlačte{" "}
                <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono text-foreground">
                  Ctrl + V
                </kbd>{" "}
                (Cmd + V na Macu). Podpis sa vloží priamo s formátovaním, logom a preklikmi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ADMIN SETTINGS MODAL / SHEET                             */}
      {/* ======================================================== */}
      {isSettingsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 animate-in fade-in duration-150"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.85)" }}
        >
          <div
            className="w-full max-w-3xl bg-[#0e161d] border border-[rgba(63,85,102,0.45)] rounded-[var(--brand-radius,6px)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-[#fafbfc]"
            style={{ backgroundColor: "#0e161d" }}
          >
            {/* Modal Header */}
            <div
              className="flex items-center justify-between px-5 py-4 border-b border-[rgba(63,85,102,0.45)] bg-[#17212a]"
              style={{ backgroundColor: "#17212a" }}
            >
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <h3 className="font-bold text-[#fafbfc] text-sm tracking-tight">
                  Nastavenia e-mailových podpisov (M22)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-[#96abbe] hover:text-[#fafbfc] p-1 rounded hover:bg-[#1f2c36] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div
              className="flex items-center border-b border-[rgba(63,85,102,0.45)] bg-[#17212a] px-5 gap-2 pt-2"
              style={{ backgroundColor: "#17212a" }}
            >
              <button
                type="button"
                onClick={() => setModalTab("templates")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors cursor-pointer ${
                  modalTab === "templates"
                    ? "border-primary text-primary font-bold"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>Šablóny dizajnu (7)</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("fields")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === "fields"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Povolené polia & Firemné dáta</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab("custom_code")}
                className={`px-3 py-2 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-colors ${
                  modalTab === "custom_code"
                    ? "border-primary text-primary"
                    : "border-transparent text-[#96abbe] hover:text-[#fafbfc]"
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Vlastné HTML (PRO)</span>
              </button>
            </div>

            {/* Modal Body */}
            <div
              className="p-5 overflow-y-auto space-y-6 flex-1 bg-[#0e161d]"
              style={{ backgroundColor: "#0e161d" }}
            >
              {/* TAB 1: 7 TEMPLATES SELECTOR */}
              {modalTab === "templates" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#fafbfc] text-xs">
                        Výber štýlu e-mailového podpisu
                      </h4>
                      <p className="text-[11px] text-[#96abbe]">
                        Zvoľte šablónu, ktorá bude platiť pre všetkých zamestnancov značky. Vo všetkých
                        šablónach je firemné logo povinné a fotografia voliteľná.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(TEMPLATE_DEFINITIONS).map((tmpl) => (
                      <button
                        key={tmpl.id}
                        type="button"
                        onClick={() =>
                          handleSaveConfig({
                            ...cfg,
                            mode: "preset_template",
                            templateId: tmpl.id,
                          })
                        }
                        className={`p-3.5 rounded-lg border text-left transition-all relative ${
                          cfg.templateId === tmpl.id && cfg.mode === "preset_template"
                            ? "border-primary bg-primary/10 text-[#fafbfc] ring-1 ring-primary/40 shadow-xs"
                            : "border-[rgba(63,85,102,0.45)] bg-[#17212a] text-[#96abbe] hover:text-[#fafbfc] hover:border-[rgba(63,85,102,0.7)]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-xs text-[#fafbfc]">
                            {tmpl.title}
                          </span>
                          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] text-primary">
                            {tmpl.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#96abbe] leading-relaxed">
                          {tmpl.description}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: FIELDS & COMPANY DATA */}
              {modalTab === "fields" && (
                <div className="space-y-6">
                  {/* Form fields visibility */}
                  <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded p-4 space-y-3">
                    <h4 className="font-semibold text-[#fafbfc] text-xs">
                      Povolené polia vo formulári zamestnanca
                    </h4>
                    <p className="text-[11px] text-[#96abbe]">
                      Určite, ktoré kontaktné údaje môžu zamestnanci do podpisu zadávať.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <label className="flex items-center justify-between p-2.5 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] cursor-pointer">
                        <span className="text-xs text-[#fafbfc]">Povoliť fotografiu zamestnanca</span>
                        <input
                          type="checkbox"
                          checked={cfg.fields.showPhoto}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              fields: { ...cfg.fields, showPhoto: e.target.checked },
                            })
                          }
                          className="rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] cursor-pointer">
                        <span className="text-xs text-[#fafbfc]">Povoliť pracovnú pozíciu</span>
                        <input
                          type="checkbox"
                          checked={cfg.fields.showRole}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              fields: { ...cfg.fields, showRole: e.target.checked },
                            })
                          }
                          className="rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] cursor-pointer">
                        <span className="text-xs text-[#fafbfc]">Povoliť telefónne číslo</span>
                        <input
                          type="checkbox"
                          checked={cfg.fields.showPhone}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              fields: { ...cfg.fields, showPhone: e.target.checked },
                            })
                          }
                          className="rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] cursor-pointer">
                        <span className="text-xs text-[#fafbfc]">Zobraziť sociálne siete firmy</span>
                        <input
                          type="checkbox"
                          checked={cfg.fields.showSocials}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              fields: { ...cfg.fields, showSocials: e.target.checked },
                            })
                          }
                          className="rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-2.5 rounded bg-[#070b0f] border border-[rgba(63,85,102,0.45)] cursor-pointer sm:col-span-2">
                        <span className="text-xs text-[#fafbfc]">
                          Zobraziť právnu doložku o mlčanlivosti (Disclaimer)
                        </span>
                        <input
                          type="checkbox"
                          checked={cfg.fields.showDisclaimer}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              fields: { ...cfg.fields, showDisclaimer: e.target.checked },
                            })
                          }
                          className="rounded border-[rgba(63,85,102,0.6)] bg-[#17212a] text-primary focus:ring-0 w-4 h-4 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Company defaults */}
                  <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded p-4 space-y-3">
                    <h4 className="font-semibold text-[#fafbfc] text-xs">
                      Globálne údaje firmy v podpise
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#96abbe] block">
                          Názov firmy / Štúdia:
                        </label>
                        <input
                          type="text"
                          value={cfg.defaults.company}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              defaults: { ...cfg.defaults, company: e.target.value },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#96abbe] block">
                          Webová adresa firmy:
                        </label>
                        <input
                          type="text"
                          value={cfg.defaults.website}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              defaults: { ...cfg.defaults, website: e.target.value },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[10px] font-mono text-[#96abbe] block">
                          URL adresa loga v podpise (Povinné v každej šablóne):
                        </label>
                        <input
                          type="text"
                          value={cfg.defaults.logoUrl}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              defaults: { ...cfg.defaults, logoUrl: e.target.value },
                            })
                          }
                          className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] focus:border-primary focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Promo Banner Settings */}
                  <div className="bg-[#17212a] border border-[rgba(63,85,102,0.45)] rounded p-4 space-y-3">
                    <h4 className="font-semibold text-[#fafbfc] text-xs">
                      Marketingový promo banner pod podpisom (voliteľné)
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#96abbe] block">
                          URL obrázka banneru:
                        </label>
                        <input
                          type="text"
                          placeholder="https://... URL banneru (cca 440x80px)"
                          value={cfg.promoBannerUrl || ""}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              promoBannerUrl: e.target.value || null,
                            })
                          }
                          className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none font-mono"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-mono text-[#96abbe] block">
                          Cieľový odkaz banneru:
                        </label>
                        <input
                          type="text"
                          placeholder="https://logobook.sk/akcia"
                          value={cfg.promoBannerLink || ""}
                          onChange={(e) =>
                            handleSaveConfig({
                              ...cfg,
                              promoBannerLink: e.target.value || null,
                            })
                          }
                          className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded px-2.5 py-1.5 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 focus:border-primary focus:outline-none font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOM HTML CODE (PRO MODE) */}
              {modalTab === "custom_code" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-[#fafbfc] text-xs">
                        Vlastný HTML e-mailový kód (PRO Mode)
                      </h4>
                      <p className="text-[11px] text-[#96abbe]">
                        Vložte vlastný tabuľkový HTML kód. Kód môže obsahovať zástupné premenné (Merge
                        Tags).
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleSaveConfig({
                          ...cfg,
                          mode: cfg.mode === "custom_html" ? "preset_template" : "custom_html",
                        })
                      }
                      className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                        cfg.mode === "custom_html"
                          ? "bg-primary text-primary-foreground"
                          : "bg-[#070b0f] border border-[rgba(63,85,102,0.45)] text-[#96abbe] hover:text-[#fafbfc]"
                      }`}
                    >
                      {cfg.mode === "custom_html" ? "PRO režim aktívny" : "Aktivovať PRO režim"}
                    </button>
                  </div>

                  {/* Merge Tags Help Box */}
                  <div className="p-3 bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded space-y-1 text-xs">
                    <span className="font-mono text-[10px] uppercase text-primary font-bold block">
                      Dostupné zástupné značky (Merge Tags):
                    </span>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-[#96abbe]">
                      <span className="bg-[#17212a] px-1.5 py-0.5 rounded border border-[rgba(63,85,102,0.45)] text-[#fafbfc]">
                        {"{{name}}"}
                      </span>
                      <span className="bg-[#17212a] px-1.5 py-0.5 rounded border border-[rgba(63,85,102,0.45)] text-[#fafbfc]">
                        {"{{role}}"}
                      </span>
                      <span className="bg-[#17212a] px-1.5 py-0.5 rounded border border-[rgba(63,85,102,0.45)] text-[#fafbfc]">
                        {"{{company}}"}
                      </span>
                      <span className="bg-[#17212a] px-1.5 py-0.5 rounded border border-[rgba(63,85,102,0.45)] text-[#fafbfc]">
                        {"{{email}}"}
                      </span>
                      <span className="bg-[#17212a] px-1.5 py-0.5 rounded border border-[rgba(63,85,102,0.45)] text-[#fafbfc]">
                        {"{{phone}}"}
                      </span>
                      <span className="bg-[#17212a] px-1.5 py-0.5 rounded border border-[rgba(63,85,102,0.45)] text-[#fafbfc]">
                        {"{{website}}"}
                      </span>
                      <span className="bg-[#17212a] px-1.5 py-0.5 rounded border border-[rgba(63,85,102,0.45)] text-[#fafbfc]">
                        {"{{photo_url}}"}
                      </span>
                      <span className="bg-[#17212a] px-1.5 py-0.5 rounded border border-[rgba(63,85,102,0.45)] text-[#fafbfc]">
                        {"{{logo_url}}"}
                      </span>
                      <span className="bg-[#17212a] px-1.5 py-0.5 rounded border border-[rgba(63,85,102,0.45)] text-[#fafbfc]">
                        {"{{primary_color}}"}
                      </span>
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    value={cfg.customHtml || ""}
                    placeholder="<table cellpadding='0' cellspacing='0'>...</table>"
                    onChange={(e) =>
                      handleSaveConfig({
                        ...cfg,
                        customHtml: e.target.value,
                      })
                    }
                    className="w-full bg-[#070b0f] border border-[rgba(63,85,102,0.45)] rounded p-3 text-xs text-[#fafbfc] placeholder:text-[#96abbe]/50 font-mono focus:border-primary focus:outline-none resize-none leading-relaxed"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div
              className="flex items-center justify-end px-5 py-3 border-t border-[rgba(63,85,102,0.45)] bg-[#17212a]"
              style={{ backgroundColor: "#17212a" }}
            >
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-1.5 rounded-[var(--brand-radius,4px)] bg-primary text-primary-foreground font-semibold text-xs hover:opacity-90 transition-opacity"
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
