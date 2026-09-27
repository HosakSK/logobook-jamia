/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const brands = app.findCollectionByNameOrId("brands");

  // 1. globalColors
  const globalColors = new Collection({
    name: "globalColors",
    type: "base",
    fields: [
      new RelationField({ name: "brand", collectionId: brands.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new JSONField({ name: "name", required: true }),
      new SelectField({ name: "role", values: ["PRIMARY", "SECONDARY", "ACCENT", "NEUTRAL", "CUSTOM"], maxSelect: 1, required: true }),
      new TextField({ name: "hex", required: true }),
      new TextField({ name: "rgb", required: false }),
      new NumberField({ name: "cmykC", required: false }),
      new NumberField({ name: "cmykM", required: false }),
      new NumberField({ name: "cmykY", required: false }),
      new NumberField({ name: "cmykK", required: false }),
      new TextField({ name: "pantoneC", required: false }),
      new TextField({ name: "pantoneU", required: false }),
      new TextField({ name: "pantoneTCX", required: false }),
      new TextField({ name: "ral", required: false }),
      new NumberField({ name: "order", required: false }),
    ],
    indexes: ["CREATE INDEX idx_globalColors_brand ON globalColors (brand)"],
    listRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "brand.status = 'LIVE' || (@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
    updateRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(globalColors);

  // 2. globalShapes
  const globalShapes = new Collection({
    name: "globalShapes",
    type: "base",
    fields: [
      new RelationField({ name: "brand", collectionId: brands.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new SelectField({ name: "radiusMode", values: ["SQUARE", "ROUNDED", "PILL"], maxSelect: 1, required: true }),
      new NumberField({ name: "customRadiusPx", required: false }),
      new NumberField({ name: "borderWidthPx", required: false }),
      new TextField({ name: "semanticSuccess", required: false }),
      new TextField({ name: "semanticWarning", required: false }),
      new TextField({ name: "semanticDanger", required: false }),
      new TextField({ name: "semanticInfo", required: false }),
    ],
    indexes: ["CREATE UNIQUE INDEX idx_globalShapes_brand ON globalShapes (brand)"],
    listRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "brand.status = 'LIVE' || (@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
    updateRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(globalShapes);

  // 3. globalTypography
  const globalTypography = new Collection({
    name: "globalTypography",
    type: "base",
    fields: [
      new RelationField({ name: "brand", collectionId: brands.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new TextField({ name: "name", required: true }),
      new SelectField({ name: "role", values: ["HEADING", "BODY", "DISPLAY", "MONOSPACE", "EMAIL"], maxSelect: 1, required: true }),
      new SelectField({ name: "fontSource", values: ["GOOGLE_FONTS", "CUSTOM_UPLOAD", "ADOBE_FONTS"], maxSelect: 1, required: true }),
      new TextField({ name: "googleFontFamily", required: false }),
      new TextField({ name: "adobeProjectId", required: false }),
      new TextField({ name: "fontFamilyName", required: false }),
      new FileField({ name: "customFont", maxSelect: 1, maxSize: 15728640, mimeTypes: ["font/woff2", "font/woff", "font/ttf", "font/otf", "application/font-woff2"], required: false }),
      new BoolField({ name: "licenseConfirmed", required: false }),
      new BoolField({ name: "licenseAllowsOfflineDistribution", required: false }),
      new JSONField({ name: "settings", required: false }),
      new JSONField({ name: "sampleText", required: false }),
      new NumberField({ name: "order", required: false }),
    ],
    indexes: ["CREATE INDEX idx_globalTypography_brand ON globalTypography (brand)"],
    listRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "brand.status = 'LIVE' || (@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
    updateRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(globalTypography);

  // 4. mediaAssets
  const mediaAssets = new Collection({
    name: "mediaAssets",
    type: "base",
    fields: [
      new RelationField({ name: "brand", collectionId: brands.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new FileField({ name: "file", maxSelect: 1, required: true }),
      new TextField({ name: "fileName", required: true }),
      new SelectField({ name: "fileType", values: ["IMAGE", "ICON", "PATTERN", "DOCUMENT"], maxSelect: 1, required: true }),
      new TextField({ name: "altText", required: false }),
    ],
    indexes: ["CREATE INDEX idx_mediaAssets_brand ON mediaAssets (brand)"],
    listRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "brand.status = 'LIVE' || (@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    updateRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(mediaAssets);

  // 5. assets
  const assets = new Collection({
    name: "assets",
    type: "base",
    fields: [
      new RelationField({ name: "brand", collectionId: brands.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new JSONField({ name: "name", required: true }),
      new SelectField({ name: "medium", values: ["DIGITAL_RGB", "PRINT_CMYK", "UNIVERSAL"], maxSelect: 1, required: true }),
      new SelectField({ name: "orientation", values: ["HORIZONTAL", "VERTICAL", "SYMBOL"], maxSelect: 1, required: true }),
      new BoolField({ name: "hasClaim", required: false }),
      new SelectField({ name: "background", values: ["LIGHT", "DARK", "MONOCHROME", "INVERSE", "TRANSPARENT"], maxSelect: 1, required: true }),
      new TextField({ name: "svgContent", required: false }),
      new FileField({ name: "preview", maxSelect: 1, required: false }),
      new JSONField({ name: "clearanceZone", required: false }),
      new JSONField({ name: "minSize", required: false }),
      new NumberField({ name: "order", required: false }),
    ],
    indexes: ["CREATE INDEX idx_assets_brand ON assets (brand)"],
    listRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "brand.status = 'LIVE' || (@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    updateRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(assets);

  // 6. assetFiles
  const assetFiles = new Collection({
    name: "assetFiles",
    type: "base",
    fields: [
      new RelationField({ name: "asset", collectionId: assets.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new FileField({ name: "file", maxSelect: 1, required: true }),
      new SelectField({ name: "fileFormat", values: ["SVG", "PDF", "EPS", "AI", "PNG", "ZIP"], maxSelect: 1, required: true }),
      new NumberField({ name: "order", required: false }),
    ],
    indexes: ["CREATE INDEX idx_assetFiles_asset ON assetFiles (asset)"],
    listRule: "@request.auth.id != '' && (asset.brand.user = @request.auth.id || @collection.teamMembers.brand ?= asset.brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "asset.brand.status = 'LIVE' || (@request.auth.id != '' && (asset.brand.user = @request.auth.id || @collection.teamMembers.brand ?= asset.brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (asset.brand.user = @request.auth.id || @collection.teamMembers.brand ?= asset.brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    updateRule: "@request.auth.id != '' && (asset.brand.user = @request.auth.id || @collection.teamMembers.brand ?= asset.brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (asset.brand.user = @request.auth.id || @collection.teamMembers.brand ?= asset.brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(assetFiles);

  // 7. pages
  const pages = new Collection({
    name: "pages",
    type: "base",
    fields: [
      new RelationField({ name: "brand", collectionId: brands.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new JSONField({ name: "title", required: true }),
      new TextField({ name: "slug", required: true }),
      new BoolField({ name: "isInMenu", required: false }),
      new SelectField({ name: "menuStyle", values: ["main", "submenu", "hidden"], maxSelect: 1, required: true }),
      new NumberField({ name: "order", required: false }),
      new TextField({ name: "templateId", required: false }),
    ],
    indexes: [
      "CREATE INDEX idx_pages_brand ON pages (brand)",
      "CREATE UNIQUE INDEX idx_pages_brand_slug ON pages (brand, slug)",
    ],
    listRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "brand.status = 'LIVE' || (@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    updateRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (brand.user = @request.auth.id || @collection.teamMembers.brand ?= brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(pages);

  // Add self-referential parent to pages
  pages.fields.add(new RelationField({
    name: "parent",
    collectionId: pages.id,
    maxSelect: 1,
    cascadeDelete: true,
    required: false,
  }));
  app.save(pages);

  // 8. containers
  const containers = new Collection({
    name: "containers",
    type: "base",
    fields: [
      new RelationField({ name: "page", collectionId: pages.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new NumberField({ name: "order", required: false }),
      new SelectField({ name: "layoutType", values: ["FULL", "HALF_HALF", "ONE_THIRD_TWO_THIRDS", "TWO_THIRDS_ONE_THIRD", "THREE_EQUAL", "CUSTOM"], maxSelect: 1, required: true }),
      new NumberField({ name: "columnCount", required: false }),
      new JSONField({ name: "columnWidths", required: false }),
      new BoolField({ name: "showH2", required: false }),
      new JSONField({ name: "h2Title", required: false }),
      new TextField({ name: "backgroundColor", required: false }),
      new SelectField({ name: "heightMode", values: ["AUTO", "FIXED"], maxSelect: 1, required: false }),
      new NumberField({ name: "fixedHeight", required: false }),
    ],
    indexes: ["CREATE INDEX idx_containers_page ON containers (page)"],
    listRule: "@request.auth.id != '' && (page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= page.brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "page.brand.status = 'LIVE' || (@request.auth.id != '' && (page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= page.brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= page.brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    updateRule: "@request.auth.id != '' && (page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= page.brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= page.brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(containers);

  // 9. columns
  const columns = new Collection({
    name: "columns",
    type: "base",
    fields: [
      new RelationField({ name: "container", collectionId: containers.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new NumberField({ name: "order", required: false }),
      new TextField({ name: "backgroundColor", required: false }),
    ],
    indexes: ["CREATE INDEX idx_columns_container ON columns (container)"],
    listRule: "@request.auth.id != '' && (container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "container.page.brand.status = 'LIVE' || (@request.auth.id != '' && (container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    updateRule: "@request.auth.id != '' && (container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(columns);

  // 10. modules
  const modulesList = [
    "M01_Nadpis", "M02_RichText", "M03_Banner", "M04_Razcestnik", "M05_DownloadTlacidlo",
    "M06_OddelovacMedzera", "M07_ZobrazenieLoga", "M08_OchrannaZonaLoga", "M09_MinimalnaVelkostLoga",
    "M10_ObrazokGaleria", "M11_MaticaLogotypov", "M12_KartaFarby", "M13_PaletaFarieb",
    "M14_TonalSteps", "M15_NeutralneASystemovePodklady", "M16_VzorkovnikyAPaletyNaStiahnutie",
    "M17_UniverzalnaEdukativnaTabulka", "M18_Typografia", "M19_Patterny", "M20_DosAndDonts",
    "M21_FiremnaVizitka", "M22_EmailPodpis", "M23_SocialMedia", "M24_FiremneTapetyAPozadia", "M25_KniznicaIkon"
  ];

  const modules = new Collection({
    name: "modules",
    type: "base",
    fields: [
      new RelationField({ name: "column", collectionId: columns.id, maxSelect: 1, cascadeDelete: true, required: true }),
      new SelectField({ name: "moduleType", values: modulesList, maxSelect: 1, required: true }),
      new NumberField({ name: "order", required: false }),
      new BoolField({ name: "showH3", required: false }),
      new JSONField({ name: "h3Title", required: false }),
      new JSONField({ name: "config", required: false }),
      new TextField({ name: "linkGroupId", required: false }),
    ],
    indexes: [
      "CREATE INDEX idx_modules_column ON modules (column)",
      "CREATE INDEX idx_modules_linkGroupId ON modules (linkGroupId)",
    ],
    listRule: "@request.auth.id != '' && (column.container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= column.container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id)",
    viewRule: "column.container.page.brand.status = 'LIVE' || (@request.auth.id != '' && (column.container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= column.container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id))",
    createRule: "@request.auth.id != '' && (column.container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= column.container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    updateRule: "@request.auth.id != '' && (column.container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= column.container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id && (@collection.teamMembers.role ?= 'OWNER' || @collection.teamMembers.role ?= 'EDITOR'))",
    deleteRule: "@request.auth.id != '' && (column.container.page.brand.user = @request.auth.id || @collection.teamMembers.brand ?= column.container.page.brand.id && @collection.teamMembers.user ?= @request.auth.id && @collection.teamMembers.role ?= 'OWNER')",
  });
  app.save(modules);
}, (app) => {
  const collections = ["modules", "columns", "containers", "pages", "assetFiles", "assets", "mediaAssets", "globalTypography", "globalShapes", "globalColors"];
  for (const name of collections) {
    try {
      const col = app.findCollectionByNameOrId(name);
      app.delete(col);
    } catch (_) {}
  }
});
