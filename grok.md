# Kavarna Škocjan — handoff (Grok)

> Spletna stran kavarne. Statični HTML/JS + JSON vsebina, Vercel, Bunny CDN.  
> Zadnja posodobitev: **2026-07-26**.

---

## Projekt

| | |
|---|---|
| Repo | `github.com/andro3131/KavarnaSkocjan` |
| Lokalno | `Andrej_Codespaces/KavarnaSkocjan/` |
| Stack | HTML/CSS/JS, `content/*.json`, Vercel API (`api/`) |
| CDN | `https://kavarna-skocjan.b-cdn.net/` |
| Admin | `admin/` (JWT + content API) |
| Jezika | SL + EN v novicah in promo |

**Push na `main`** → Vercel deploy. Ni Next build (statično).

---

## Vsebina (JSON)

| Datoteka | Kaj |
|----------|-----|
| `content/novice.json` | Novice (`items[]`) |
| `content/gallery.json` | Galerija (`items[]`, category: kavarna/ponudba/dogodki) |
| `content/promo.json` | Plavajoči strip „Novo v ponudbi“ |
| `content/events.json` | Dogodki |
| `content/menus.json`, `hours.json`, `about.json`, `contact.json` | Ostalo |

### Format novice
```json
{
  "date": "YYYY-MM-DD",
  "titleSl": "...", "textSl": "...", "contentSl": "...",
  "images": ["https://kavarna-skocjan.b-cdn.net/..."],
  "youtube": "", "video": "",
  "titleEn": "...", "textEn": "...", "contentEn": "..."
}
```
Novejše: vrh seznama (sort po `date` desc).

### Format galerija
```json
{ "src": "...", "alt": "...", "category": "dogodki|ponudba|kavarna", "featured": false, "large": false }
```

### Promo strip (`promo.json`)
```json
{
  "enabled": true,
  "items": [{
    "image": "...",
    "imagePosition": "center 72%",
    "badgeSl/En", "title", "textSl/En", "ctaSl/En"
  }]
}
```
`imagePosition` (opcijsko) → `object-position` na hero/mobile sliki (Ožujsko: `center 72%`).

**Trenutni promo (5):** Spritz z okusom · Brezglutenski rogljiček · Točeno Ožujsko · Latte macchiato · Sladoled

---

## Seja 2026-07-26 — dodane novice

| Datum | Naslov |
|-------|--------|
| 2026-07-18 | Akustični večer na terasi |
| 2026-06-30 | Brezglutenski rogljiček z ribezom |
| 2026-06-16 | Vabilo: Zan Ograjšek & Gorazd Laznik |
| 2026-06-15 | Točeno Ožujsko |
| 2026-06-06 | Aperol Spritz |
| 2026-06-04 | Ljubitelji mehurčkov |
| 2026-05-29 | Spritz z okusom Monin |

Slike iz novic → tudi v `gallery.json`.

---

## Workflow nove novice

1. Prilepek + CDN URL-ji  
2. Vnos v `novice.json` (+ EN)  
3. Slike v `gallery.json`  
4. Po potrebi `promo.json`  
5. `git commit` + `push origin main`

Detajli: `MEMORY.md`.
