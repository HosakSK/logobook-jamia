# Logobook Studio 📖✨

> **Open-Core Brand Guidelines & Design System CMS** navrhnutý pre grafických dizajnérov, kreatívne agentúry a moderné značky.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.6-black?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![PocketBase](https://img.shields.io/badge/PocketBase-SQLite-B8DBE4?style=flat&logo=pocketbase)](https://pocketbase.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)

---

## 🌟 Kľúčové funkcie (Features)

- **25 špecializovaných modulov značky (M01 – M25):** Od základných logotypov, symbolov a ochrannej zóny, cez farby, typografiu, mriežky, ikonografiu, až po Tone of Voice a firemné tlačoviny.
- **Interaktívne farebné systémy:** Výpočet HEX, RGB, CMYK, HSLuv, Pantone zhody a dynamická WCAG 2.1 matica kontrastu s overením čitateľnosti (AAA / AA).
- **Typografické pravidlá a živý náhľad:** Integrácia Google Fonts, prispôsobiteľný modular scale, živé textové editory a hierarchy ukážky.
- **Integration & Design Tokens Hub:** Okamžitý export do Figma Tokens (JSON), CSS Custom Properties, Tailwind v4 theme configu a SCSS.
- **AI Context Generator (`llms.txt`):** Export kompletného dizajn manuálu do štandardu `llms.txt` a `ai.md` pre okamžité použitie v AI nástrojoch (Cursor, Claude, ChatGPT, v0, Lovable).
- **Multitenancy & White-Label:** Podpora viacerých značiek a tímov v jednom rozhraní, vlastné subdomény alebo vlastné CNAME domény.
- **Vstavaný GitHub Version Checker:** Automatické overovanie nových verzií z GitHub Releases v reálnom čase bez nutnosti zložitého auto-updatera.
- **Globálne platby s Lemon Squeezy:** Pripravená integrácia pre Merchant of Record predplatné s automatickým vyrovnaním DPH v celej EÚ a vo svete.

---

## 🚀 Rýchly štart: Self-Hosting cez Docker Compose

Vďaka otvorenému Open-Core modelu si môžete Logobook spustiť na vlastnom serveri alebo lokálne za menej ako 2 minúty.

### Požiadavky
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/)

### 1. Naklonovanie repozitára
```bash
git clone https://github.com/HosakSK/logobook-jamia.git
cd logobook-jamia
```

### 2. Príprava prostredia
```bash
cp .env.example .env
```
*(V súbore `.env` môžete upraviť porty alebo prístupy podľa vašich potrieb).*

### 3. Spustenie kontajnerov
```bash
docker compose up -d --build
```

Aplikácia bude dostupná na:
- **Logobook Web CMS:** [http://localhost:3000](http://localhost:3000)
- **PocketBase Admin:** [http://localhost:8080/_/](http://localhost:8080/_/) *(tu si pri prvom spustení vytvoríte administrátorský účet)*

---

## ☁️ Nasadenie na Coolify

Logobook je 100% optimalizovaný pre nasadenie cez [Coolify](https://coolify.io/) na VPS (napr. Oracle Cloud ARM64, Hetzner alebo DigitalOcean):

1. **Forknite repozitár:** Vytvorte si vlastný fork repozitára `HosakSK/logobook-jamia` na vašom GitHube.
2. **Pridajte projekt v Coolify:**
   - Zvoľte **Application** -> **Public/Private GitHub Repository**.
   - Vyberte váš forknutý repozitár a vetvu `main`.
   - Zvoľte Build Pack **Dockerfile** (využije sa optimalizovaný multi-stage Alpine build).
3. **PocketBase služba:**
   - Pridajte službu PocketBase (`ghcr.io/coollabsio/pocketbase:latest`) s perzistentným volume pre `/app/pb_data`.
4. **Nastavte Environment Variables:**
   - Vložte premenné podľa šablóny v `.env.example`.
5. **Kliknite na Deploy:** Coolify automaticky zostaví aplikáciu a vystaví SSL certifikát cez Traefik.

---

## 💻 Lokálny vývoj (Local Development)

Ak chcete vyvíjať na zdrojovom kóde lokálne:

```bash
# Inštalácia závislostí
pnpm install

# Spustenie vývojárskeho servera
pnpm dev

# Produkčný build a type-check
pnpm build
```

---

## ⚙️ Premenné prostredia (.env)

| Premenná | Popis | Predvolená hodnota |
|---|---|---|
| `NEXT_PUBLIC_POCKETBASE_URL` | Verejná URL adresa pre PocketBase API | `http://localhost:8080` |
| `POCKETBASE_INTERNAL_URL` | Interná sieťová adresa pre serverové volania (Docker) | `http://pocketbase:8080` |
| `NEXT_PUBLIC_GITHUB_REPO` | Cieľový repozitár pre GitHub Version Checker | `HosakSK/logobook-jamia` |
| `LEMONSQUEEZY_API_KEY` | API kľúč pre Lemon Squeezy platby (voliteľné) | - |
| `LEMONSQUEEZY_STORE_ID` | ID vášho Lemon Squeezy obchodu | - |
| `LEMONSQUEEZY_WEBHOOK_SECRET` | HMAC secret pre overenie webhookov | - |
| `RESEND_API_KEY` | API kľúč pre transakčné e-maily cez Resend | - |
| `PORT` | Port na ktorom beží Next.js aplikácia | `3000` |

---

## 🔄 Ako aktualizovať vašu Self-Hosted inštanciu

Keď vyjde nová verzia Logobooku, v pätičke administrátorského sidebaru sa rozsvieti limetkový indikátor aktualizácie:

1. Prejdite na váš forknutý repozitár na [GitHube](https://github.com).
2. Kliknite na tlačidlo **Sync fork** -> **Update branch**.
3. **Ak používate Coolify:** Kliknite v rozhraní Coolify na **Redeploy** (alebo sa nasadenie spustí automaticky cez webhook).
4. **Ak používate lokálny Docker Compose:** Spustite:
   ```bash
   git pull origin main
   docker compose up -d --build
   ```

---

## 📄 Licencia

Tento projekt je vyvíjaný pod modelom **Open-Core**:
- Jadro systému a komunitné funkcie sú plne open-source a bezplatne dostupné pre celú komunitu.
- Prémiové agentúrne funkcie (White-labeling, správa viacerých tímov, zákaznícke domény) sú súčasťou komerčného predplatného na [Logobook.sk](https://logobook.sk).
