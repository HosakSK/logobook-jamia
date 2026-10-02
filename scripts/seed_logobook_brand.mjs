import fs from 'fs';
import path from 'path';

const PB_URL = 'http://pocketbase-slkwd3bakl5khufyiyd27tth.89.168.121.252.sslip.io';
const BRAND_ID = 'w93g3ux3rkybxxa'; // Brand "Logobook"

async function request(endpoint, options = {}) {
  const url = `${PB_URL}${endpoint}`;
  const res = await fetch(url, options);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} ${res.statusText} (${endpoint}): ${text}`);
  }
  return res.json();
}

async function uploadFile(endpoint, formData, token) {
  const url = `${PB_URL}${endpoint}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: token
    },
    body: formData
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP ${res.status} Upload Error (${endpoint}): ${text}`);
  }
  return res.json();
}

async function main() {
  console.log('🚀 Začínam seeding manuálu Logobook pre Logobook...');

  // 1. Admin Auth
  const authRes = await request('/api/collections/_superusers/auth-with-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identity: 'jakub@jamia.sk', password: 'pFex97EeDQuF7wzaPBXZRbpNn5wf' })
  });
  const token = authRes.token;
  const authHeader = { Authorization: token, 'Content-Type': 'application/json' };
  console.log('✅ PocketBase superuser prihlásený.');

  // 2. Vyčistenie starých dát pre brand (ak existujú)
  console.log('🧹 Čistím existujúce dáta brandu...');
  const collectionsToClean = ['modules', 'columns', 'containers', 'pages', 'assetFiles', 'assets', 'mediaAssets', 'globalColors', 'globalShapes'];
  for (const col of collectionsToClean) {
    try {
      const records = await request(`/api/collections/${col}/records?filter=(brand='${BRAND_ID}')&perPage=500`, { headers: { Authorization: token } });
      for (const item of records.items) {
        await fetch(`${PB_URL}/api/collections/${col}/records/${item.id}`, { method: 'DELETE', headers: { Authorization: token } });
      }
      console.log(`  Vyčistená kolekcia ${col}: ${records.items.length} záznamov.`);
    } catch (e) {
      // Ignoruj
    }
  }

  // Vyčistenie kontajnerov a stĺpcov napriamo
  try {
    const containers = await request('/api/collections/containers/records?perPage=500', { headers: { Authorization: token } });
    for (const c of containers.items) {
      await fetch(`${PB_URL}/api/collections/containers/records/${c.id}`, { method: 'DELETE', headers: { Authorization: token } });
    }
    const cols = await request('/api/collections/columns/records?perPage=500', { headers: { Authorization: token } });
    for (const c of cols.items) {
      await fetch(`${PB_URL}/api/collections/columns/records/${c.id}`, { method: 'DELETE', headers: { Authorization: token } });
    }
    const mods = await request('/api/collections/modules/records?perPage=500', { headers: { Authorization: token } });
    for (const m of mods.items) {
      await fetch(`${PB_URL}/api/collections/modules/records/${m.id}`, { method: 'DELETE', headers: { Authorization: token } });
    }
  } catch (e) {
    console.log('  Poznámka k čisteniu:', e.message);
  }

  // 3. Update Brandu
  console.log('🎨 Nastavujem parametre značky Logobook...');
  await request(`/api/collections/brands/records/${BRAND_ID}`, {
    method: 'PATCH',
    headers: authHeader,
    body: JSON.stringify({
      name: 'Logobook',
      slug: 'logobook',
      status: 'LIVE',
      defaultLocale: 'sk',
      enabledLocales: ['sk', 'cs', 'en'],
      hideLogobookBadge: true,
      description: {
        en: 'The definitive design system and official brand manual for Logobook.sk.',
        sk: 'Oficiálny dizajn manuál a vizuálna identita platformy Logobook.sk.',
        cs: 'Oficiální design manuál a vizuální identita platformy Logobook.sk.'
      }
    })
  });

  // 4. Seeding Global Colors
  console.log('🌈 Nahrávam globálnu paletu farieb...');
  const colorsData = [
    {
      name: { en: 'Brand Lime', sk: 'Limetkovo žltá', cs: 'Limetkově žlutá' },
      role: 'PRIMARY',
      hex: '#C8D400',
      rgb: '200, 212, 0',
      cmykC: 20, cmykM: 0, cmykY: 100, cmykK: 0,
      pantoneC: '389 C', pantoneU: '389 U', pantoneTCX: '13-0650 TCX', ral: '1016',
      order: 1
    },
    {
      name: { en: 'Brick Red', sk: 'Teplá červená', cs: 'Teplá červená' },
      role: 'SECONDARY',
      hex: '#BB4934',
      rgb: '187, 73, 52',
      cmykC: 15, cmykM: 80, cmykY: 85, cmykK: 5,
      pantoneC: '7598 C', pantoneU: '7598 U', pantoneTCX: '18-1449 TCX', ral: '3002',
      order: 2
    },
    {
      name: { en: 'Emerald Teal', sk: 'Smaragdovo zelená', cs: 'Smaragdově zelená' },
      role: 'ACCENT',
      hex: '#009F80',
      rgb: '0, 159, 128',
      cmykC: 85, cmykM: 10, cmykY: 60, cmykK: 0,
      pantoneC: '3272 C', pantoneU: '3272 U', pantoneTCX: '17-5126 TCX', ral: '6016',
      order: 3
    },
    {
      name: { en: 'Abyss Dark', sk: 'Hlboký Abyss', cs: 'Hluboký Abyss' },
      role: 'NEUTRAL',
      hex: '#070B0F',
      rgb: '7, 11, 15',
      cmykC: 80, cmykM: 70, cmykY: 60, cmykK: 90,
      pantoneC: 'Black 6 C', pantoneU: 'Black 6 U', pantoneTCX: '19-4007 TCX', ral: '9005',
      order: 4
    },
    {
      name: { en: 'Deep Navy', sk: 'Tmavorodá Deep', cs: 'Tmavorodá Deep' },
      role: 'NEUTRAL',
      hex: '#0E161D',
      rgb: '14, 22, 29',
      cmykC: 75, cmykM: 65, cmykY: 55, cmykK: 80,
      pantoneC: 'Black 7 C', pantoneU: 'Black 7 U', pantoneTCX: '19-4015 TCX', ral: '7021',
      order: 5
    },
    {
      name: { en: 'Raised Surface', sk: 'Vystúpená Raised', cs: 'Vystoupená Raised' },
      role: 'NEUTRAL',
      hex: '#17212A',
      rgb: '23, 33, 42',
      cmykC: 70, cmykM: 60, cmykY: 50, cmykK: 75,
      pantoneC: '433 C', pantoneU: '433 U', pantoneTCX: '19-4215 TCX', ral: '7016',
      order: 6
    },
    {
      name: { en: 'Elevated Panel', sk: 'Zvýraznená Elevated', cs: 'Zvýrazněná Elevated' },
      role: 'NEUTRAL',
      hex: '#1F2C36',
      rgb: '31, 44, 54',
      cmykC: 65, cmykM: 50, cmykY: 45, cmykK: 65,
      pantoneC: '432 C', pantoneU: '432 U', pantoneTCX: '19-4024 TCX', ral: '7015',
      order: 7
    },
    {
      name: { en: 'Surface Dialog', sk: 'Povrch Surface', cs: 'Povrch Surface' },
      role: 'NEUTRAL',
      hex: '#2B3B48',
      rgb: '43, 59, 72',
      cmykC: 60, cmykM: 45, cmykY: 40, cmykK: 50,
      pantoneC: '431 C', pantoneU: '431 U', pantoneTCX: '18-4016 TCX', ral: '7031',
      order: 8
    },
    {
      name: { en: 'Light Canvas', sk: 'Svetlé plátno', cs: 'Světlé plátno' },
      role: 'NEUTRAL',
      hex: '#FAFBFC',
      rgb: '250, 251, 252',
      cmykC: 1, cmykM: 1, cmykY: 0, cmykK: 0,
      pantoneC: 'Bright White', pantoneU: 'Bright White', pantoneTCX: '11-0601 TCX', ral: '9003',
      order: 9
    },
    {
      name: { en: 'Pure White', sk: 'Čistá biela', cs: 'Čistá bílá' },
      role: 'NEUTRAL',
      hex: '#FFFFFF',
      rgb: '255, 255, 255',
      cmykC: 0, cmykM: 0, cmykY: 0, cmykK: 0,
      pantoneC: 'White', pantoneU: 'White', pantoneTCX: '11-4001 TCX', ral: '9016',
      order: 10
    }
  ];

  const createdColors = [];
  for (const c of colorsData) {
    const created = await request('/api/collections/globalColors/records', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({ ...c, brand: BRAND_ID })
    });
    createdColors.push(created);
  }
  console.log(`✅ Vytvorených ${createdColors.length} farieb v palete.`);

  // 5. Seeding Global Shapes
  console.log('📐 Nastavujem geometrické pravidlá značky...');
  await request('/api/collections/globalShapes/records', {
    method: 'POST',
    headers: authHeader,
    body: JSON.stringify({
      brand: BRAND_ID,
      radiusMode: 'ROUNDED',
      customRadiusPx: 8,
      borderWidthPx: 1,
      semanticSuccess: '#009F80',
      semanticWarning: '#C8D400',
      semanticDanger: '#BB4934',
      semanticInfo: '#1F2C36'
    })
  });

  // 6. Seeding Global Typography (Plus Jakarta Sans)
  console.log('🔤 Konfigurujem globálnu typografiu Plus Jakarta Sans...');
  const existingTypo = await request(`/api/collections/globalTypography/records?filter=(brand='${BRAND_ID}')`, { headers: { Authorization: token } });
  let typoId = existingTypo.items[0]?.id;
  if (!typoId) {
    const createdTypo = await request('/api/collections/globalTypography/records', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        brand: BRAND_ID,
        name: 'Plus Jakarta Sans',
        role: 'HEADING',
        fontSource: 'GOOGLE_FONTS',
        googleFontFamily: 'Plus Jakarta Sans',
        fontFamilyName: 'Plus Jakarta Sans',
        licenseConfirmed: true,
        licenseAllowsOfflineDistribution: true,
        order: 1,
        settings: {
          weights: [300, 600, 800],
          isVariable: true
        }
      })
    });
    typoId = createdTypo.id;
  }

  // 7. Nahrávanie oficiálnych SVG lôg a formátov
  console.log('📂 Nahrávam oficiálne logotypy a formáty na Cloudflare R2...');
  const logoBasePath = 'c:/git/logobook-sk/docs/media/logo';

  const logoAssetsDefs = [
    {
      name: { en: 'Horizontal Logo (Dark Background)', sk: 'Horizontálne logo (Tmavý podklad)', cs: 'Horizontální logo (Tmavý podklad)' },
      medium: 'DIGITAL_RGB',
      orientation: 'HORIZONTAL',
      hasClaim: false,
      background: 'DARK',
      svgFile: 'RGB/SVG/Logobook_logo_width_RGB_D.svg',
      formats: [
        { file: 'RGB/PNG/Logobook_logo_width_RGB_D.png', format: 'PNG' },
        { file: 'CMYK/PDF/Logobook_logo_width_CMYK_D.pdf', format: 'PDF' },
        { file: 'CMYK/EPS/Logobook_logo_width_CMYK_D.eps', format: 'EPS' },
        { file: 'CMYK/AI/Logobook_logo_width_CMYK_D.ai', format: 'AI' }
      ]
    },
    {
      name: { en: 'Horizontal Logo (Light Background)', sk: 'Horizontálne logo (Svetlý podklad)', cs: 'Horizontální logo (Světlý podklad)' },
      medium: 'DIGITAL_RGB',
      orientation: 'HORIZONTAL',
      hasClaim: false,
      background: 'LIGHT',
      svgFile: 'RGB/SVG/Logobook_logo_width_RGB_W.svg',
      formats: [
        { file: 'RGB/PNG/Logobook_logo_width_RGB_W.png', format: 'PNG' },
        { file: 'CMYK/PDF/Logobook_logo_width_CMYK_W.pdf', format: 'PDF' },
        { file: 'CMYK/EPS/Logobook_logo_width_CMYK_W.eps', format: 'EPS' },
        { file: 'CMYK/AI/Logobook_logo_width_CMYK_W.ai', format: 'AI' }
      ]
    },
    {
      name: { en: 'Brand Symbol (Dark Background)', sk: 'Symbol loga (Tmavý podklad)', cs: 'Symbol loga (Tmavý podklad)' },
      medium: 'DIGITAL_RGB',
      orientation: 'SYMBOL',
      hasClaim: false,
      background: 'DARK',
      svgFile: 'RGB/SVG/Logobook_logo_symbol_RGB_D.svg',
      formats: [
        { file: 'RGB/PNG/Logobook_logo_symbol_RGB_D.png', format: 'PNG' },
        { file: 'CMYK/PDF/Logobook_logo_symbol_CMYK_D.pdf', format: 'PDF' },
        { file: 'CMYK/EPS/Logobook_logo_symbol_CMYK_D.eps', format: 'EPS' },
        { file: 'CMYK/AI/Logobook_logo_symbol_CMYK_D.ai', format: 'AI' }
      ]
    },
    {
      name: { en: 'Brand Symbol (Light Background)', sk: 'Symbol loga (Svetlý podklad)', cs: 'Symbol loga (Světlý podklad)' },
      medium: 'DIGITAL_RGB',
      orientation: 'SYMBOL',
      hasClaim: false,
      background: 'LIGHT',
      svgFile: 'RGB/SVG/Logobook_logo_symbol_RGB_W.svg',
      formats: [
        { file: 'RGB/PNG/Logobook_logo_symbol_RGB_W.png', format: 'PNG' },
        { file: 'CMYK/PDF/Logobook_logo_symbol_CMYK_W.pdf', format: 'PDF' },
        { file: 'CMYK/EPS/Logobook_logo_symbol_CMYK_W.eps', format: 'EPS' },
        { file: 'CMYK/AI/Logobook_logo_symbol_CMYK_W.ai', format: 'AI' }
      ]
    },
    {
      name: { en: 'Horizontal Logo with Claim (Dark)', sk: 'Logo na šírku s claimom (Tmavé)', cs: 'Logo na šířku s claimem (Tmavé)' },
      medium: 'DIGITAL_RGB',
      orientation: 'HORIZONTAL',
      hasClaim: true,
      background: 'DARK',
      svgFile: 'RGB/SVG/Logobook_logo_width_claim_RGB_D.svg',
      formats: [
        { file: 'RGB/PNG/Logobook_logo_width_claim_RGB_D.png', format: 'PNG' },
        { file: 'CMYK/PDF/Logobook_logo_width_claim_CMYK_D.pdf', format: 'PDF' },
        { file: 'CMYK/AI/Logobook_logo_width_claim_CMYK_D.ai', format: 'AI' }
      ]
    },
    {
      name: { en: 'Horizontal Logo with Claim (Light)', sk: 'Logo na šírku s claimom (Svetlé)', cs: 'Logo na šířku s claimem (Světlé)' },
      medium: 'DIGITAL_RGB',
      orientation: 'HORIZONTAL',
      hasClaim: true,
      background: 'LIGHT',
      svgFile: 'RGB/SVG/Logobook_logo_width_claim_RGB_W.svg',
      formats: [
        { file: 'RGB/PNG/Logobook_logo_width_claim_RGB_W.png', format: 'PNG' },
        { file: 'CMYK/PDF/Logobook_logo_width_claim_CMYK_W.pdf', format: 'PDF' },
        { file: 'CMYK/AI/Logobook_logo_width_claim_CMYK_W.ai', format: 'AI' }
      ]
    },
    {
      name: { en: 'Vertical Logo (Dark)', sk: 'Logo na výšku (Tmavé)', cs: 'Logo na výšku (Tmavé)' },
      medium: 'DIGITAL_RGB',
      orientation: 'VERTICAL',
      hasClaim: false,
      background: 'DARK',
      svgFile: 'RGB/SVG/Logobook_logo_height_RGB_D.svg',
      formats: [
        { file: 'RGB/PNG/Logobook_logo_height_RGB_D.png', format: 'PNG' },
        { file: 'CMYK/PDF/Logobook_logo_height_CMYK_D.pdf', format: 'PDF' },
        { file: 'CMYK/AI/Logobook_logo_height_CMYK_D.ai', format: 'AI' }
      ]
    },
    {
      name: { en: 'Vertical Logo (Light)', sk: 'Logo na výšku (Svetlé)', cs: 'Logo na výšku (Světlé)' },
      medium: 'DIGITAL_RGB',
      orientation: 'VERTICAL',
      hasClaim: false,
      background: 'LIGHT',
      svgFile: 'RGB/SVG/Logobook_logo_height_RGB_W.svg',
      formats: [
        { file: 'RGB/PNG/Logobook_logo_height_RGB_W.png', format: 'PNG' },
        { file: 'CMYK/PDF/Logobook_logo_height_CMYK_W.pdf', format: 'PDF' },
        { file: 'CMYK/AI/Logobook_logo_height_CMYK_W.ai', format: 'AI' }
      ]
    }
  ];

  const createdAssets = [];
  let orderIndex = 1;

  for (const def of logoAssetsDefs) {
    const fullSvgPath = path.join(logoBasePath, def.svgFile);
    let svgContent = '';
    if (fs.existsSync(fullSvgPath)) {
      svgContent = fs.readFileSync(fullSvgPath, 'utf-8');
    }

    const assetFormData = new FormData();
    assetFormData.append('brand', BRAND_ID);
    assetFormData.append('name', JSON.stringify(def.name));
    assetFormData.append('medium', def.medium);
    assetFormData.append('orientation', def.orientation);
    assetFormData.append('hasClaim', String(def.hasClaim));
    assetFormData.append('background', def.background);
    assetFormData.append('svgContent', svgContent);
    assetFormData.append('clearanceZone', JSON.stringify({ rectangular: { enabled: true, dimension: 'width', percentage: 20 }, circular: { enabled: false } }));
    assetFormData.append('minSize', JSON.stringify({ printMm: { width: 25 }, digitalPx: { width: 100 } }));
    assetFormData.append('order', String(orderIndex++));

    // Upload asset record
    const assetRecord = await uploadFile('/api/collections/assets/records', assetFormData, token);
    createdAssets.push({ ...def, id: assetRecord.id, svgContent });
    console.log(`  ✓ Vytvorené logo: ${def.name.sk} (${assetRecord.id})`);

    // Upload initial SVG format
    if (fs.existsSync(fullSvgPath)) {
      const svgBuffer = fs.readFileSync(fullSvgPath);
      const svgBlob = new Blob([svgBuffer], { type: 'image/svg+xml' });
      const fData = new FormData();
      fData.append('asset', assetRecord.id);
      fData.append('fileFormat', 'SVG');
      fData.append('file', svgBlob, path.basename(fullSvgPath));
      await uploadFile('/api/collections/assetFiles/records', fData, token);
    }

    // Upload other formats
    for (const fmt of def.formats) {
      const fmtPath = path.join(logoBasePath, fmt.file);
      if (fs.existsSync(fmtPath)) {
        const fileBuf = fs.readFileSync(fmtPath);
        let mime = 'application/octet-stream';
        if (fmt.format === 'PNG') mime = 'image/png';
        if (fmt.format === 'PDF') mime = 'application/pdf';
        if (fmt.format === 'EPS') mime = 'application/postscript';
        if (fmt.format === 'AI') mime = 'application/illustrator';

        const blob = new Blob([fileBuf], { type: mime });
        const fData = new FormData();
        fData.append('asset', assetRecord.id);
        fData.append('fileFormat', fmt.format);
        fData.append('file', blob, path.basename(fmtPath));
        await uploadFile('/api/collections/assetFiles/records', fData, token);
      }
    }
  }

  // Nahratie headerLogo a favicon do mediaAssets a prepojenie na Brand
  console.log('🖼️ Nahrávam header logo a favicon do mediaAssets...');
  const headerLogoPath = path.join(logoBasePath, 'RGB/SVG/Logobook_logo_width_RGB_D.svg');
  const faviconPath = path.join(logoBasePath, 'RGB/SVG/Logobook_logo_symbol_RGB_D.svg');

  let headerMediaId = null;
  let faviconMediaId = null;

  if (fs.existsSync(headerLogoPath)) {
    const hBuf = fs.readFileSync(headerLogoPath);
    const hBlob = new Blob([hBuf], { type: 'image/svg+xml' });
    const hData = new FormData();
    hData.append('brand', BRAND_ID);
    hData.append('fileName', 'Logobook_logo_header.svg');
    hData.append('fileType', 'IMAGE');
    hData.append('altText', 'Logobook Logo');
    hData.append('mimeType', 'image/svg+xml');
    hData.append('fileSize', String(hBuf.length));
    hData.append('order', '1');
    hData.append('file', hBlob, 'Logobook_logo_header.svg');
    const hRec = await uploadFile('/api/collections/mediaAssets/records', hData, token);
    headerMediaId = hRec.id;
  }

  if (fs.existsSync(faviconPath)) {
    const fBuf = fs.readFileSync(faviconPath);
    const fBlob = new Blob([fBuf], { type: 'image/svg+xml' });
    const fData = new FormData();
    fData.append('brand', BRAND_ID);
    fData.append('fileName', 'Logobook_favicon.svg');
    fData.append('fileType', 'ICON');
    fData.append('altText', 'Logobook Favicon');
    fData.append('mimeType', 'image/svg+xml');
    fData.append('fileSize', String(fBuf.length));
    fData.append('order', '2');
    fData.append('file', fBlob, 'Logobook_favicon.svg');
    const fRec = await uploadFile('/api/collections/mediaAssets/records', fData, token);
    faviconMediaId = fRec.id;
  }

  if (headerMediaId || faviconMediaId) {
    await request(`/api/collections/brands/records/${BRAND_ID}`, {
      method: 'PATCH',
      headers: authHeader,
      body: JSON.stringify({
        headerLogo: headerMediaId || null,
        favicon: faviconMediaId || null
      })
    });
  }

  // 8. Tvorba stromu stránok a modulov
  console.log('📑 Vytváram štruktúru stránok a modulov PageBuildera...');

  // Pomocná funkcia na vytvorenie stránky
  async function createFullPage(pageData) {
    const pageRec = await request('/api/collections/pages/records', {
      method: 'POST',
      headers: authHeader,
      body: JSON.stringify({
        brand: BRAND_ID,
        title: pageData.title,
        slug: pageData.slug,
        isInMenu: true,
        menuStyle: 'main',
        order: pageData.order,
        parent: pageData.parent || null
      })
    });

    let contOrder = 1;
    for (const container of pageData.containers) {
      const contRec = await request('/api/collections/containers/records', {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({
          page: pageRec.id,
          order: contOrder++,
          layoutType: container.layoutType || 'FULL',
          columnCount: container.columns.length,
          columnWidths: container.columnWidths || [12],
          showH2: Boolean(container.h2Title),
          h2Title: container.h2Title || null,
          heightMode: 'AUTO'
        })
      });

      let colOrder = 1;
      for (const col of container.columns) {
        const colRec = await request('/api/collections/columns/records', {
          method: 'POST',
          headers: authHeader,
          body: JSON.stringify({
            container: contRec.id,
            order: colOrder++
          })
        });

        let modOrder = 1;
        for (const mod of col.modules) {
          await request('/api/collections/modules/records', {
            method: 'POST',
            headers: authHeader,
            body: JSON.stringify({
              column: colRec.id,
              moduleType: mod.type,
              order: modOrder++,
              showH3: Boolean(mod.h3Title),
              h3Title: mod.h3Title || null,
              config: mod.config,
              linkGroupId: mod.linkGroupId || null
            })
          });
        }
      }
    }

    console.log(`  ✓ Vytvorená stránka: ${pageData.title.sk} (/${pageData.slug})`);
    return pageRec;
  }

  // --- STRÁNKA 1: Úvod ---
  await createFullPage({
    title: { en: 'Introduction', sk: 'Úvod', cs: 'Úvod' },
    slug: 'uvod',
    order: 1,
    containers: [
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M01_Nadpis',
                config: {
                  level: 'h1',
                  align: 'left',
                  showAccentLine: true,
                  accentColor: '#C8D400',
                  text: {
                    en: 'Logobook Design System & Identity',
                    sk: 'Logobook Dizajn Systém a Vizuálna Identita',
                    cs: 'Logobook Design Systém a Vizuální Identita'
                  }
                }
              },
              {
                type: 'M03_Banner',
                config: {
                  variant: 'accent',
                  icon: { source: 'lucide', iconId: 'Sparkles', position: 'left' },
                  title: {
                    en: 'Official Identity Manual 2026',
                    sk: 'Oficiálny dizajn manuál značky 2026',
                    cs: 'Oficiální design manuál značky 2026'
                  },
                  content: {
                    en: 'This digital brand manual contains all vector assets, colour palettes, typography standards and production guidelines for the Logobook.sk platform.',
                    sk: 'Tento digitálny brand manuál obsahuje všetky vektorové assety, farebné palety, typografické štandardy a produkčné pravidlá pre platformu Logobook.sk.',
                    cs: 'Tento digitální brand manuál obsahuje veškeré vektorové assety, barevné palety, typografické standardy a produkční pravidla pro platformu Logobook.sk.'
                  },
                  button: { show: false }
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M02_RichText',
                config: {
                  size: 'lead',
                  maxWidth: 'full',
                  editorMode: 'rich_text',
                  content: {
                    en: '<p>Logobook is built on the philosophy of <strong>precision, clarity, and instant accessibility</strong>. Our visual language combines a high-contrast dark environment with sharp neon accents, modern sans-serif typography, and clean grid layouts.</p><p>All team members, partners, and media are requested to strictly adhere to the guidelines presented in this manual to ensure consistent brand representation across digital and print media.</p>',
                    sk: '<p>Platforma Logobook stavia na filozofii <strong>precíznosti, čistoty a okamžitej dostupnosti</strong>. Náš vizuálny jazyk spája vysoko kontrastné tmavé prostredie s ostrými neónovými akcentmi, modernou sans-serif typografiou a prehľadným mriežkovým rozložením.</p><p>Všetkých členov tímu, partnerov a médiá žiadame o dôsledné dodržiavanie pravidiel uvedených v tomto manuáli, čím spoločne zabezpečíme jednotnú a reprezentatívnu prezentáciu značky v digitálnom aj tlačovom svete.</p>',
                    cs: '<p>Platforma Logobook staví na filosofii <strong>preciznosti, čistoty a okamžité dostupnosti</strong>. Náš vizuální jazyk spojuje vysoce kontrastní tmavé prostředí s ostrými neonovými akcenty, moderní sans-serif typografií a přehledným mřížkovým rozložením.</p><p>Všechny členy týmu, partnery a média žádáme o důsledné dodržování pravidel uvedených v tomto manuálu, čímž společně zajistíme jednotnou a reprezentativní prezentaci značky v digitálním i tiskovém světě.</p>'
                  }
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M04_Razcestnik',
                config: {
                  layout: 3,
                  hoverEffect: 'lift',
                  clickableEntireCard: true,
                  cards: [
                    {
                      id: 'c1',
                      title: { en: 'Brand Logos', sk: 'Logotypy a symbol', cs: 'Logotypy a symbol' },
                      description: { en: 'Vector SVGs, clearance zones, and format downloads.', sk: 'Vektorové SVG, ochranné zóny a balíky formátov.', cs: 'Vektorové SVG, ochranné zóny a balíčky formátů.' },
                      linkType: 'internal',
                      targetUrl: '/logo',
                      icon: { source: 'lucide', iconId: 'FileImage', position: 'left' }
                    },
                    {
                      id: 'c2',
                      title: { en: 'Color System', sk: 'Farebná paleta', cs: 'Barevná paleta' },
                      description: { en: 'WCAG 2.1 contrast swatches, RAL codes, and token exports.', sk: 'WCAG 2.1 kontrast, RAL kódy a export dizajnových tokenov.', cs: 'WCAG 2.1 kontrast, RAL kódy a export designových tokenů.' },
                      linkType: 'internal',
                      targetUrl: '/farby',
                      icon: { source: 'lucide', iconId: 'Palette', position: 'left' }
                    },
                    {
                      id: 'c3',
                      title: { en: 'Typography', sk: 'Typografia a písmo', cs: 'Typografie a písmo' },
                      description: { en: 'Plus Jakarta Sans hierarchy, pangrams, and type tester.', sk: 'Plus Jakarta Sans, rezy písma, pangramy a živý tester.', cs: 'Plus Jakarta Sans, řezy písma, pangramy a živý tester.' },
                      linkType: 'internal',
                      targetUrl: '/typografia',
                      icon: { source: 'lucide', iconId: 'Type', position: 'left' }
                    }
                  ]
                }
              }
            ]
          }
        ]
      }
    ]
  });

  // --- STRÁNKA 2: Logo a Pravidlá ---
  await createFullPage({
    title: { en: 'Logos & Identity', sk: 'Logotyp a Symbol', cs: 'Logotyp a Symbol' },
    slug: 'logo',
    order: 2,
    containers: [
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M01_Nadpis',
                config: {
                  level: 'h1',
                  align: 'left',
                  showAccentLine: true,
                  accentColor: '#C8D400',
                  text: {
                    en: 'Primary Brand Logo',
                    sk: 'Hlavný logotyp značky',
                    cs: 'Hlavní logotyp značky'
                  }
                }
              },
              {
                type: 'M07_ZobrazenieLoga',
                config: {
                  sourceMode: 'library',
                  assetId: createdAssets[0]?.id,
                  directPreview: {
                    svgUrl: '',
                    backgroundColor: '#070B0F',
                    showCopySvg: true
                  },
                  formats: [
                    { id: 'f1', format: 'SVG', fileName: 'Logobook_logo_width_RGB_D.svg', customDescription: 'Vektorový master pre digitál a web' },
                    { id: 'f2', format: 'PDF', fileName: 'Logobook_logo_width_CMYK_D.pdf', customDescription: 'Tlačový vektorový formát' },
                    { id: 'f3', format: 'PNG', fileName: 'Logobook_logo_width_RGB_D.png', customDescription: 'Rastrový náhľad s priehľadnosťou' },
                    { id: 'f4', format: 'EPS', fileName: 'Logobook_logo_width_CMYK_D.eps', customDescription: 'Otvorený postscript pre DTP' },
                    { id: 'f5', format: 'AI', fileName: 'Logobook_logo_width_CMYK_D.ai', customDescription: 'Adobe Illustrator zdroj' }
                  ],
                  downloadAll: { enabled: true, mode: 'zip_client' }
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'HALF_HALF',
        columns: [
          {
            modules: [
              {
                type: 'M08_OchrannaZonaLoga',
                config: {
                  svgSource: 'library',
                  assetId: createdAssets[0]?.id,
                  zones: {
                    rectangular: { enabled: true, dimension: 'width', percentage: 20 },
                    circular: { enabled: false }
                  },
                  ruleText: {
                    en: 'Clearance zone is strictly 20% of logo width around all edges.',
                    sk: 'Ochranná zóna predstavuje 20 % zo šírky loga po všetkých stranách. Do tohto priestoru nesmú zasahovať žiadne texty ani rušivé prvky.',
                    cs: 'Ochranná zóna představuje 20 % ze šířky loga po všech stranách. Do tohoto prostoru nesmí zasahovat žádné texty ani rušivé prvky.'
                  }
                }
              }
            ]
          },
          {
            modules: [
              {
                type: 'M09_MinimalnaVelkostLoga',
                config: {
                  mediumMode: 'both',
                  printMm: { width: 25 },
                  digitalPx: { width: 100 },
                  svgSource: 'library',
                  assetId: createdAssets[0]?.id,
                  ruleText: {
                    en: 'Minimum size ensures optical legibility on small print items and mobile displays.',
                    sk: 'Minimálna povolená veľkosť zaručuje bezchybnú optickú čitateľnosť logotypu na tlačovinách aj na displejoch smartfónov.',
                    cs: 'Minimální povolená velikost zaručuje bezchybnou optickou čitelnost logotypu na tiskovinách i na displejích smartphonů.'
                  }
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M20_DosAndDonts',
                config: {
                  columns: 4,
                  badgePosition: 'top-left',
                  showFilter: true,
                  items: [
                    {
                      id: 'r1',
                      type: 'DO',
                      title: { en: 'High Contrast Background', sk: 'Vysoký kontrast podkladu', cs: 'Vysoký kontrast podkladu' },
                      description: { en: 'Always place white logo on dark surfaces and dark logo on light surfaces.', sk: 'Vždy používajte biele logo na tmavom pozadí a tmavé logo na svetlom pozadí.', cs: 'Vždy používejte bílé logo na tmavém pozadí a tmavé logo na světlém pozadí.' },
                      imageSource: 'preset_svg',
                      presetSvgId: 'correct'
                    },
                    {
                      id: 'r2',
                      type: 'DONT',
                      title: { en: 'Never Stretch or Distort', sk: 'Nedeformovať proporcie', cs: 'Nedeformovat proporce' },
                      description: { en: 'Do not squeeze, stretch, or alter the aspect ratio of the logo.', sk: 'Nikdy nemeňte pomer strán, nerozťahujte a nedeformujte proporcie loga.', cs: 'Nikdy neměňte poměr stran, neroztahujte a nedeformujte proporce loga.' },
                      imageSource: 'preset_svg',
                      presetSvgId: 'distort'
                    },
                    {
                      id: 'r3',
                      type: 'DONT',
                      title: { en: 'Never Alter Colors', sk: 'Nezamieňať farby', cs: 'Nezaměňovat barvy' },
                      description: { en: 'Do not invent new color schemes or gradients outside official specifications.', sk: 'Nikdy nenahrádzajte akcentové pásiky inými farbami ani prechodmi.', cs: 'Nikdy nenahrazujte akcentové proužky jinými barvami ani přechody.' },
                      imageSource: 'preset_svg',
                      presetSvgId: 'recolor'
                    },
                    {
                      id: 'r4',
                      type: 'DONT',
                      title: { en: 'No Drop Shadows', sk: 'Nepridávať tiene', cs: 'Nepřidávat stíny' },
                      description: { en: 'Do not apply drop shadows, outlines, or 3D extrusions to vector assets.', sk: 'Nepoužívajte vrhané tiene, vonkajšie žiara ani 3D plastické efekty.', cs: 'Nepoužívejte vržené stíny, vnější záře ani 3D plastické efekty.' },
                      imageSource: 'preset_svg',
                      presetSvgId: 'shadow'
                    }
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M11_MaticaLogotypov',
                config: {
                  dataSource: 'auto',
                  allowedFilters: ['medium', 'orientation', 'claim', 'background'],
                  columns: 4
                }
              }
            ]
          }
        ]
      }
    ]
  });

  // --- STRÁNKA 3: Farby ---
  const colorIds = createdColors.map(c => c.id);
  await createFullPage({
    title: { en: 'Color Palette', sk: 'Farebný Systém', cs: 'Barevný Systém' },
    slug: 'farby',
    order: 3,
    containers: [
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M01_Nadpis',
                config: {
                  level: 'h1',
                  align: 'left',
                  showAccentLine: true,
                  accentColor: '#C8D400',
                  text: {
                    en: 'Brand Color Palette',
                    sk: 'Farebná paleta a akcenty',
                    cs: 'Barevná paleta a akcenty'
                  }
                }
              },
              {
                type: 'M13_PaletaFarieb',
                config: {
                  colorIds: colorIds.slice(0, 8),
                  layout: 'tiles',
                  displaySystems: { hex: true, rgb: true, cmyk: true, pantoneC: true }
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'THREE_EQUAL',
        columns: [
          {
            modules: [
              {
                type: 'M12_KartaFarby',
                config: {
                  globalColorId: createdColors[0]?.id,
                  displaySystems: { hex: true, rgb: true, cmyk: true, pantoneC: true, ral: true, wcag: true }
                }
              }
            ]
          },
          {
            modules: [
              {
                type: 'M12_KartaFarby',
                config: {
                  globalColorId: createdColors[1]?.id,
                  displaySystems: { hex: true, rgb: true, cmyk: true, pantoneC: true, ral: true, wcag: true }
                }
              }
            ]
          },
          {
            modules: [
              {
                type: 'M12_KartaFarby',
                config: {
                  globalColorId: createdColors[2]?.id,
                  displaySystems: { hex: true, rgb: true, cmyk: true, pantoneC: true, ral: true, wcag: true }
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M14_TonalSteps',
                config: {
                  baseColorIds: [createdColors[0]?.id, createdColors[3]?.id],
                  generationMode: 'hsluv_auto',
                  showContrastRule: true,
                  showUiExamples: true
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M15_NeutralneASystemovePodklady',
                config: {
                  assetIdToTest: createdAssets[0]?.id,
                  surfaces: [
                    { id: 's1', name: 'Pure White (#FFFFFF)', description: 'Karty a modálne okná', customHex: '#FFFFFF', textColor: '#070B0F' },
                    { id: 's2', name: 'Light Canvas (#FAFBFC)', description: 'Hlavná svetlá plocha logobooku', customHex: '#FAFBFC', textColor: '#0E161D' },
                    { id: 's3', name: 'Muted Neutral (#EDF0F3)', description: 'Sekundárne panely a polia', customHex: '#EDF0F3', textColor: '#1F2C36' },
                    { id: 's4', name: 'Abyss Root (#070B0F)', description: 'Tmavé plátno homepage a administrácie', customHex: '#070B0F', textColor: '#FAFBFC' },
                    { id: 's5', name: 'Deep Container (#0E161D)', description: 'Pozadie kontajnerov a sekcií', customHex: '#0E161D', textColor: '#FAFBFC' },
                    { id: 's6', name: 'Raised Card (#17212A)', description: 'Vystúpené navigačné a funkčné karty', customHex: '#17212A', textColor: '#FAFBFC' }
                  ]
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'HALF_HALF',
        columns: [
          {
            modules: [
              {
                type: 'M16_VzorkovnikyAPaletyNaStiahnutie',
                config: {
                  title: { en: 'Digital Design Tokens', sk: 'Dizajnové tokeny a vzorkovníky', cs: 'Designové tokeny a vzorníky' },
                  items: [
                    { id: 'i1', title: 'Figma Design Tokens (W3C JSON)', description: 'Pre plugin Tokens Studio a Style Dictionary', buttonLabel: 'Stiahnuť tokens.json', badgeText: 'JSON', autoGenerateType: 'tokens_json' },
                    { id: 'i2', title: 'CSS Theme Variables', description: 'CSS premenné pre web a Tailwind integráciu', buttonLabel: 'Stiahnuť theme.css', badgeText: 'CSS', autoGenerateType: 'css_variables' }
                  ]
                }
              }
            ]
          },
          {
            modules: [
              {
                type: 'M17_UniverzalnaEdukativnaTabulka',
                config: {
                  enabledRows: { hex: true, rgb: true, cmyk: true, pantoneC: true, pantoneU: true, pantoneTcx: true, ral: true }
                }
              }
            ]
          }
        ]
      }
    ]
  });

  // --- STRÁNKA 4: Typografia ---
  await createFullPage({
    title: { en: 'Typography', sk: 'Typografia', cs: 'Typografie' },
    slug: 'typografia',
    order: 4,
    containers: [
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M01_Nadpis',
                config: {
                  level: 'h1',
                  align: 'left',
                  showAccentLine: true,
                  accentColor: '#C8D400',
                  text: {
                    en: 'Brand Typography & Hierarchy',
                    sk: 'Typografický systém a rezy písma',
                    cs: 'Typografický systém a řezy písma'
                  }
                }
              },
              {
                type: 'M18_Typografia',
                config: {
                  typographyId: typoId,
                  license: 'SIL Open Font License 1.1',
                  authors: 'Tokotype, Google Fonts',
                  selectedWeights: [300, 600, 800],
                  isVariableFont: true,
                  showTypeTester: true,
                  showGlyphSet: true,
                  showHierarchyTable: true,
                  hierarchy: {
                    h1: { size: '36px', weight: '800 (ExtraBold)', lineHeight: '1.15' },
                    h2: { size: '26px', weight: '600 (SemiBold)', lineHeight: '1.25' },
                    h3: { size: '20px', weight: '600 (SemiBold)', lineHeight: '1.3' },
                    body: { size: '15px', weight: '300 (Light)', lineHeight: '1.6' }
                  }
                }
              }
            ]
          }
        ]
      }
    ]
  });

  // --- STRÁNKA 5: Aplikácie a Tlačoviny ---
  await createFullPage({
    title: { en: 'Brand Assets', sk: 'Firemné Materiály', cs: 'Firemní Materiály' },
    slug: 'aplikacie',
    order: 5,
    containers: [
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M01_Nadpis',
                config: {
                  level: 'h1',
                  align: 'left',
                  showAccentLine: true,
                  accentColor: '#C8D400',
                  text: {
                    en: 'Corporate Print & Applications',
                    sk: 'Firemné tlačoviny a šablóny',
                    cs: 'Firemní tiskoviny a šablony'
                  }
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'HALF_HALF',
        columns: [
          {
            modules: [
              {
                type: 'M21_FiremnaVizitka',
                config: {
                  productType: 'business_card',
                  dimensions: { standard: 'EU_90x50', width: 90, height: 50, bleed: 2, safeZone: 4 },
                  technicalOverlay: { mode: 'generated', showByDefault: false },
                  paperSpecs: { weightGsm: 350, finish: 'Matná laminácia soft-touch s parciálnym UV lakom' },
                  downloads: [
                    { id: 'd1', label: 'Tlačové PDF so spadávkou (90x50 + 2mm)', format: 'PDF' },
                    { id: 'd2', label: 'Adobe InDesign zdroj (.idml)', format: 'ZIP' }
                  ]
                }
              }
            ]
          },
          {
            modules: [
              {
                type: 'M22_EmailPodpis',
                config: {
                  mode: 'preset_template',
                  templateId: 'classic_corporate',
                  fields: { showPhoto: false, showRole: true, showPhone: true, showSocials: true, showWebsite: true, showDisclaimer: true },
                  defaults: {
                    name: 'Jakub Hošák',
                    role: 'Founder & Product Lead',
                    phone: '+421 900 000 000',
                    email: 'jakub@jamia.sk',
                    website: 'https://logobook.sk',
                    company: 'Logobook.sk / Jamia s.r.o.'
                  }
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M23_SocialMedia',
                config: {
                  platforms: ['INSTAGRAM', 'LINKEDIN', 'FACEBOOK', 'YOUTUBE', 'TWITTER'],
                  showDownloadAllZip: true
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M24_FiremneTapetyAPozadia',
                config: {
                  gridColumns: 3,
                  showDeviceFrames: true,
                  showDownloadAllZip: true
                }
              }
            ]
          }
        ]
      },
      {
        layoutType: 'FULL',
        columns: [
          {
            modules: [
              {
                type: 'M25_KniznicaIkon',
                config: {
                  layout: 'grid_medium',
                  enableSearch: true,
                  showCategories: true,
                  showColorPicker: true,
                  defaultColor: '#C8D400',
                  showDownloadAllZip: true
                }
              }
            ]
          }
        ]
      }
    ]
  });

  // 9. Publikovanie Brand Snapshotu (Atomic Snapshot)
  console.log('📦 Zostavujem a publikujem finálny snapshot do brands.publishedConfig...');

  // Načítaj všetky stránky nanovo
  const allPages = await request(`/api/collections/pages/records?filter=(brand='${BRAND_ID}')&sort=order`, { headers: { Authorization: token } });
  const publishedPages = [];

  for (const p of allPages.items) {
    const conts = await request(`/api/collections/containers/records?filter=(page='${p.id}')&sort=order`, { headers: { Authorization: token } });
    const publishedConts = [];

    for (const c of conts.items) {
      const cols = await request(`/api/collections/columns/records?filter=(container='${c.id}')&sort=order`, { headers: { Authorization: token } });
      const publishedCols = [];

      for (const col of cols.items) {
        const mods = await request(`/api/collections/modules/records?filter=(column='${col.id}')&sort=order`, { headers: { Authorization: token } });
        publishedCols.push({
          id: col.id,
          order: col.order,
          backgroundColor: col.backgroundColor || undefined,
          modules: mods.items.map(m => ({
            id: m.id,
            moduleType: m.moduleType,
            order: m.order,
            showH3: m.showH3,
            h3Title: m.h3Title,
            config: m.config || {},
            linkGroupId: m.linkGroupId || undefined
          }))
        });
      }

      publishedConts.push({
        id: c.id,
        order: c.order,
        layoutType: c.layoutType,
        columnCount: c.columnCount,
        columnWidths: c.columnWidths,
        showH2: c.showH2,
        h2Title: c.h2Title,
        backgroundColor: c.backgroundColor,
        heightMode: c.heightMode,
        columns: publishedCols
      });
    }

    publishedPages.push({
      id: p.id,
      slug: p.slug,
      title: p.title,
      parent: p.parent || undefined,
      isInMenu: p.isInMenu,
      menuStyle: p.menuStyle,
      order: p.order,
      containers: publishedConts
    });
  }

  const snapshot = {
    brandId: BRAND_ID,
    publishedAt: new Date().toISOString(),
    version: 1,
    brand: {
      id: BRAND_ID,
      name: 'Logobook',
      slug: 'logobook',
      description: {
        en: 'The definitive design system and official brand manual for Logobook.sk.',
        sk: 'Oficiálny dizajn manuál a vizuálna identita platformy Logobook.sk.',
        cs: 'Oficiální design manuál a vizuální identita platformy Logobook.sk.'
      },
      defaultLocale: 'sk',
      enabledLocales: ['sk', 'cs', 'en'],
      headerLogo: headerMediaId || undefined,
      favicon: faviconMediaId || undefined,
      hideLogobookBadge: true
    },
    pages: publishedPages
  };

  await request(`/api/collections/brands/records/${BRAND_ID}`, {
    method: 'PATCH',
    headers: authHeader,
    body: JSON.stringify({
      publishedConfig: snapshot,
      status: 'LIVE'
    })
  });

  console.log('🎉 Hotovo! Manuál Logobook pre Logobook bol úspešne vygenerovaný a publikovaný.');
  console.log(`🔗 URL Manuálu: http://qgfd3o69bvxi73ybe3lzqwiy.89.168.121.252.sslip.io/m/logobook`);
}

main().catch(err => {
  console.error('❌ Chyba pri seedovaní:', err);
  process.exit(1);
});
