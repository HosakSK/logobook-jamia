import { PageTemplateStructure } from "@/lib/types/template";

/**
 * Predefined System Templates (Seed Blueprints)
 * Specifically aligned with 15_02 Dimension Matrix & Blueprint rules
 */
export const DEFAULT_SYSTEM_TEMPLATES: Array<{
  name: Record<string, string>;
  description: Record<string, string>;
  category: string;
  structure: PageTemplateStructure;
}> = [
  {
    name: {
      en: "Logo Presentation (Official Blueprint)",
      sk: "Prezentácia loga (Oficiálny Blueprint)",
      cs: "Prezentace loga (Oficiální Blueprint)",
    },
    description: {
      en: "Standard 5-container logo layout: Header, Viewer, Safe Zone, Minimum Size, Do's & Don'ts, and Gallery.",
      sk: "Oficiálny 5-kontajnerový layout: Nadpis, Náhľad, Ochranná zóna, Minimálna veľkosť, Do's & Don'ts a Mockup galéria.",
      cs: "Oficiální 5-kontejnerový layout: Nadpis, Náhled, Ochranná zóna, Minimální velikost, Do's & Don'ts a Mockup galerie.",
    },
    category: "Logo",
    structure: {
      containers: [
        {
          order: 0,
          layoutType: "FULL",
          showH2: false,
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M01_Nadpis",
                  showH3: false,
                  config: {
                    title: {
                      en: "Official Logo {{brand_name}}",
                      sk: "Oficiálne logo {{brand_name}}",
                      cs: "Oficiální logo {{brand_name}}",
                    },
                    level: "h1",
                  },
                },
              ],
            },
          ],
        },
        {
          order: 1,
          layoutType: "FULL",
          showH2: true,
          h2Title: {
            en: "Primary Logo Display",
            sk: "Zobrazenie logotypu",
            cs: "Zobrazení logotypu",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M07_ZobrazenieLoga",
                  showH3: true,
                  h3Title: {
                    en: "Vector Artwork & Downloads",
                    sk: "Vektorový podklad a stiahnutie",
                    cs: "Vektorový podklad a stažení",
                  },
                  config: {},
                },
              ],
            },
          ],
        },
        {
          order: 2,
          layoutType: "HALF_HALF",
          showH2: true,
          h2Title: {
            en: "Construction & Dimension Rules",
            sk: "Konštrukcia a pravidlá rozmerov",
            cs: "Konstrukce a pravidla rozměrů",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M08_OchrannaZonaLoga",
                  showH3: true,
                  h3Title: {
                    en: "Clear Safe Space",
                    sk: "Ochranná zóna",
                    cs: "Ochranná zóna",
                  },
                  config: {},
                },
              ],
            },
            {
              order: 1,
              modules: [
                {
                  order: 0,
                  moduleType: "M09_MinimalnaVelkostLoga",
                  showH3: true,
                  h3Title: {
                    en: "Minimum Reproduction Size",
                    sk: "Minimálna veľkosť",
                    cs: "Minimální velikost",
                  },
                  config: {},
                },
              ],
            },
          ],
        },
        {
          order: 3,
          layoutType: "FULL",
          showH2: true,
          h2Title: {
            en: "Correct & Incorrect Usage",
            sk: "Správne a nesprávne použitie",
            cs: "Správné a nesprávné použití",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M20_DosAndDonts",
                  showH3: true,
                  h3Title: {
                    en: "Do's & Don'ts Guidelines",
                    sk: "Pravidlá Do's & Don'ts",
                    cs: "Pravidla Do's & Don'ts",
                  },
                  config: {},
                },
              ],
            },
          ],
        },
        {
          order: 4,
          layoutType: "FULL",
          showH2: true,
          h2Title: {
            en: "Real World Mockups & Application",
            sk: "Aplikácia v praxi a mockupy",
            cs: "Aplikace v praxi a mockupy",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M10_ObrazokGaleria",
                  showH3: true,
                  h3Title: {
                    en: "Context Gallery",
                    sk: "Kontextová galéria",
                    cs: "Kontextová galerie",
                  },
                  config: {},
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: {
      en: "Navigation Hub (Category Index)",
      sk: "Navigačný rázcestník (Kategória)",
      cs: "Navigační rozcestník (Kategorie)",
    },
    description: {
      en: "Category landing page with M04 button box linking to subpages.",
      sk: "Úvodná stránka kategórie s modulom M04 Rázcestník odkazujúcim na podstránky.",
      cs: "Úvodní stránka kategorie s modulem M04 Rozcestník odkazujícím na podstránky.",
    },
    category: "Všeobecné",
    structure: {
      containers: [
        {
          order: 0,
          layoutType: "FULL",
          showH2: false,
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M01_Nadpis",
                  showH3: false,
                  config: {
                    title: {
                      en: "Brand Sections {{brand_name}}",
                      sk: "Prehľad sekcií {{brand_name}}",
                      cs: "Přehled sekcí {{brand_name}}",
                    },
                    level: "h1",
                  },
                },
              ],
            },
          ],
        },
        {
          order: 1,
          layoutType: "FULL",
          showH2: true,
          h2Title: {
            en: "Choose Chapter",
            sk: "Vyberte kapitolu",
            cs: "Vyberte kapitolu",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M04_Razcestnik",
                  showH3: false,
                  config: {},
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: {
      en: "Color Identity & Swatches",
      sk: "Farebná identita značky",
      cs: "Barevná identita značky",
    },
    description: {
      en: "Primary swatch cards, secondary palette, tonal 10-step scale, and usage guide.",
      sk: "Karty primárnych farieb, sekundárna paleta, tonálna stupnica a prevodová tabuľka.",
      cs: "Karty primárních barev, sekundární paleta, tonální stupnice a převodní tabulka.",
    },
    category: "Farby",
    structure: {
      containers: [
        {
          order: 0,
          layoutType: "FULL",
          showH2: false,
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M01_Nadpis",
                  showH3: false,
                  config: {
                    title: {
                      en: "Brand Color System {{brand_name}}",
                      sk: "Systém firemných farieb {{brand_name}}",
                      cs: "Systém firemních barev {{brand_name}}",
                    },
                    level: "h1",
                  },
                },
              ],
            },
          ],
        },
        {
          order: 1,
          layoutType: "HALF_HALF",
          showH2: true,
          h2Title: {
            en: "Primary & Secondary Palette",
            sk: "Základná a doplnková paleta",
            cs: "Základní a doplňková paleta",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M12_KartaFarby",
                  showH3: true,
                  h3Title: { en: "Primary Color", sk: "Hlavná farba", cs: "Hlavní barva" },
                  config: {},
                },
              ],
            },
            {
              order: 1,
              modules: [
                {
                  order: 0,
                  moduleType: "M13_PaletaFarieb",
                  showH3: true,
                  h3Title: { en: "Supporting Colors", sk: "Doplnkové farby", cs: "Doplňkové barvy" },
                  config: {},
                },
              ],
            },
          ],
        },
        {
          order: 2,
          layoutType: "FULL",
          showH2: true,
          h2Title: {
            en: "Tonal Nuances & Shades",
            sk: "Tonálne odtiene a škála",
            cs: "Tonální odstíny a škála",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M14_TonalSteps",
                  showH3: true,
                  h3Title: { en: "10-Step Luminance Scale", sk: "10-kroková stupnica svetlosti", cs: "10-kroková stupnice světlosti" },
                  config: {},
                },
              ],
            },
          ],
        },
        {
          order: 3,
          layoutType: "FULL",
          showH2: true,
          h2Title: {
            en: "Format Reproduction Guide",
            sk: "Edukačná tabuľka použitia farieb",
            cs: "Edukační tabulka použití barev",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M17_UniverzalnaEdukativnaTabulka",
                  showH3: false,
                  config: {},
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: {
      en: "Typography & Fonts",
      sk: "Firemná typografia a písmo",
      cs: "Firemní typografie a písmo",
    },
    description: {
      en: "Font hierarchy, interactive type-tester, weights, and character sets.",
      sk: "Typografická hierarchia, interaktívny type-tester, rezy a znaková sada.",
      cs: "Typografická hierarchie, interaktivní type-tester, řezy a znaková sada.",
    },
    category: "Typografia",
    structure: {
      containers: [
        {
          order: 0,
          layoutType: "FULL",
          showH2: false,
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M01_Nadpis",
                  showH3: false,
                  config: {
                    title: {
                      en: "Brand Typography & Typefaces",
                      sk: "Firemná typografia a písmo",
                      cs: "Firemní typografie a písmo",
                    },
                    level: "h1",
                  },
                },
              ],
            },
          ],
        },
        {
          order: 1,
          layoutType: "FULL",
          showH2: true,
          h2Title: {
            en: "Primary Typeface & Live Tester",
            sk: "Hlavné písmo a interaktívny tester",
            cs: "Hlavní písmo a interaktivní tester",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M18_Typografia",
                  showH3: true,
                  h3Title: { en: "Type Tester & Weights", sk: "Testovacie plátno a rezy", cs: "Testovací plátno a řezy" },
                  config: {},
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: {
      en: "Business Card & Stationery",
      sk: "Firemná vizitka a tlač",
      cs: "Firemní vizitka a tisk",
    },
    description: {
      en: "3D interactive flip preview, bleed guidelines, and production downloads.",
      sk: "3D interaktívny flip náhľad, orezové čiary spadávky a produkčné dáta.",
      cs: "3D interaktivní flip náhled, ořezové čáry spadávky a produkční data.",
    },
    category: "Materiály",
    structure: {
      containers: [
        {
          order: 0,
          layoutType: "FULL",
          showH2: false,
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M01_Nadpis",
                  showH3: false,
                  config: {
                    title: {
                      en: "Corporate Business Card {{brand_name}}",
                      sk: "Firemná vizitka {{brand_name}}",
                      cs: "Firemní vizitka {{brand_name}}",
                    },
                    level: "h1",
                  },
                },
              ],
            },
          ],
        },
        {
          order: 1,
          layoutType: "FULL",
          showH2: true,
          h2Title: {
            en: "3D Preview & Print Specifications",
            sk: "3D Náhľad a tlačové špecifikácie",
            cs: "3D Náhled a tiskové specifikace",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M21_FiremnaVizitka",
                  showH3: true,
                  h3Title: { en: "Standard EU Card", sk: "Štandardná EU vizitka", cs: "Standardní EU vizitka" },
                  config: {},
                },
              ],
            },
          ],
        },
      ],
    },
  },
  {
    name: {
      en: "Icon & Pictogram Library",
      sk: "Knižnica ikon a piktogramov",
      cs: "Knihovna ikon a piktogramů",
    },
    description: {
      en: "Searchable brand vector icon grid with live color recoloring and SVG/PNG exports.",
      sk: "Vyhľadávateľná knižnica vektorových ikon s prefarbovaním a exportom SVG/PNG.",
      cs: "Vyhledávatelná knihovna vektorových ikon s přebarvováním a exportem SVG/PNG.",
    },
    category: "Materiály",
    structure: {
      containers: [
        {
          order: 0,
          layoutType: "FULL",
          showH2: false,
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M01_Nadpis",
                  showH3: false,
                  config: {
                    title: {
                      en: "Official Icon Library {{brand_name}}",
                      sk: "Oficiálna knižnica ikon {{brand_name}}",
                      cs: "Oficiální knihovna ikon {{brand_name}}",
                    },
                    level: "h1",
                  },
                },
              ],
            },
          ],
        },
        {
          order: 1,
          layoutType: "FULL",
          showH2: true,
          h2Title: {
            en: "System Icons Grid",
            sk: "Mriežka systémových ikon",
            cs: "Mřížka systémových ikon",
          },
          columns: [
            {
              order: 0,
              modules: [
                {
                  order: 0,
                  moduleType: "M25_KniznicaIkon",
                  showH3: true,
                  h3Title: { en: "Icon Assets", sk: "Ikony značky", cs: "Ikony značky" },
                  config: {},
                },
              ],
            },
          ],
        },
      ],
    },
  },
];
