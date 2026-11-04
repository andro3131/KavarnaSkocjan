# Kavarna Škocjan — MEMORY

Poln handoff. Kratek status: **`grok.md`**. Krovni workspace: `../grok.md`.

Zadnja posodobitev: **2026-07-26**.

---

## Projekt

- **Ime:** Kavarna Škocjan (kavarna + dogodki, Škocjan / okolica)
- **Repo:** https://github.com/andro3131/KavarnaSkocjan
- **Lokalno:** `~/Documents/Andrej_Codespaces/KavarnaSkocjan` (klon 2026-07-26)
- **Deploy:** Vercel, auto na `main`
- **CDN:** `kavarna-skocjan.b-cdn.net` (Kavarna/, Ponudba/, DOGODKI/, UPLOAD/, Ostalo/)
- **Jezik UI:** SL/EN (toggle v nav)

### Tehnologija
Statični site: `index.html`, `novice.html`, `galerija.html` + `css/`, `js/`.  
Vsebina: **JSON** v `content/`, ne markdown.  
Admin panel + API (`api/auth.js`, `content.js`, `upload.js`) z JWT.

Ni `npm run build` za vsebino — samo JSON + push.

---

## Kako delujejo novice

- Vir: `content/novice.json` → `items[]`
- Domov: `#novice-grid` prek `js/content-loader.js` (`applyNovice`)
- Stran: `novice.html` + `js/novice.js`
- Sortiranje: po `date` padajoče (ob dodajanju re-sort)

### Polja
`date`, `titleSl/En`, `textSl/En` (kartica), `contentSl/En` (modal), `images[]`, `youtube`, `video`

### Dodano v seji 2026-07-26
1. **2026-07-18** — Akustični večer na terasi (6 slik DOGODKI)  
2. **2026-06-30** — Brezglutenski rogljiček z ribezom (2 sliki Ponudba)  
3. **2026-06-16** — Vabilo akustični večer Zan Ograjšek & Gorazd Laznik (1 plakat)  
4. **2026-06-15** — Točeno Ožujsko (1 slika)  
5. **2026-06-06** — Aperol Spritz (1 slika)  
6. **2026-06-04** — Mehurčkaste pijače (2 sliki)  
7. **2026-05-29** — Spritz z okusom Monin (pasijonka, malina, jagoda, breskev, bezeg, meta)

---

## Galerija

- `content/gallery.json` → `items[]`
- Kategorije: **`kavarna`**, **`ponudba`**, **`dogodki`**
- Polja: `src`, `alt`, `category`, `featured`, `large`
- Novice-slike dodajamo tudi sem (na začetek seznama)

---

## Promo strip („Novo v ponudbi“)

- `content/promo.json` → `enabled` + `items[]`
- Prikaz: **hero** (desktop, plavajoča kartica) + **mobile-promo** (mobilni strip)
- Rotacija med `items` v `content-loader.js` (`applyPromo`)
- Opcijsko **`imagePosition`**: CSS `object-position` (npr. Ožujsko `"center 72%"` da se ne reže dno kozarca)

### Trenutni promo items (vrstni red)
1. Spritz z okusom 🍹 (`imagePosition: center 35%`)  
2. Brezglutenski rogljiček 🥐  
3. Točeno Ožujsko 🍺 (`imagePosition: center 72%`)  
4. Latte macchiato z okusom  
5. Sladoled je tu! 🍦  

JS ob zamenjavi kartice nastavi `img.style.objectPosition = item.imagePosition || 'center center'`.

---

## Odločitve / konvencije

- Novice vedno **SL + EN**
- Slike na CDN, ne v gitu
- Ob novici: **novice.json + gallery.json** (+ promo če je „novo v ponudbi“)
- Commit sporočila v slovenščini + Co-Authored-By po želji
- FB grepanje ni zanesljivo — prilepek od Andreja

---

## Checklist nove novice

1. Besedilo + datum + CDN URL-ji  
2. Vnos v `novice.json` (sort by date)  
3. Slike v `gallery.json` (category dogodki/ponudba)  
4. Po potrebi `promo.json`  
5. `git add` + commit + `push origin main`  

---

## Odprto

- [ ] Nadaljnje FB/objave po prilepku  
- [ ] Admin panel že obstaja — vsebina se lahko ureja tudi prek admina (ne podvajati konfliktov)

---

## Seja 2026-07-26 — zaključeno

- Novice + gallery + promo narejeno; promo **Spritz prvi**, nato rogljiček, Ožujsko.
- Zadnji push (vrstni red promo): `31db92f` na `main`.
- **Status: mir** — nadaljevanje šele ob novem prilepku/naročilu.


---

## Hitre poti

```bash
cd ~/Documents/Andrej_Codespaces/KavarnaSkocjan
# uredi content/*.json
git add content/ && git commit -m "..." && git push origin main
```

---

## 2026-11-04 — zakonsko opozorilo za alkohol (prijava)

- Pravna podlaga: **15.b člen ZZUZIS** — oglas za alkohol mora imeti opozorilo ministra za zdravje (≥10 % površine, jasno ločeno od ozadja).
- Besedilo na strani: **»Minister za zdravje opozarja: Prekomerno pitje alkohola škoduje zdravju!«** (EN prevod v JS).
- Polje **`"alkohol": true`** v `novice.json`, `gallery.json`, `promo.json` → izriše trak (`.alkohol-opozorilo`, svetlo zlat `--color-accent-light`, temno besedilo).
  - novice: trak pod sliko na kartici (majhen, 0.68rem) + večji v modalu (novice.html in prva stran)
  - galerija: trak čez spodnji rob sličice + pod sliko v lightboxu; prva stran (featured) tudi
  - promo: trak v hero kartici in mobilnem stripu (prikaz glede na item)
  - cenik: stalno opozorilo pod flipbookom
- **Admin:** dodano stikalo »Alkohol – prikaži zakonsko opozorilo« (novice, galerija, promo) + polje `imagePosition` pri promo — brez tega bi shranjevanje prek admina polja pobrisalo.
- Pri novih objavah o alkoholu **vedno vklopi stikalo**.
- Odprto/tveganje: French 75 (gin, >15 %?), slike z osebami, ki pijejo (Laško happy hour), hero ozadje s tablo »Špricer, Buteljčna vina«, opis »najboljša vina«. FB urejajo sami.
- **Umaknjeno 2026-11-04** (sporno po 15.b ZZUZIS): novica *French 75* (gin, 25. 3. 2026), fotka *Laško happy hour* z dekletom s špricerjem (galerija + rezervni HTML), hero ozadje `kavarnafinal_yhp7jw.jpg` (tabla »Špricer, Buteljčna vina«) → zamenjano s `kavarna-okno_cvp99f.jpg` (tudi og:image). Za vrnitev glej git zgodovino.
- Hero ozadje + og:image **vrnjena** na `kavarnafinal_yhp7jw.jpg` (Andrej ni bil zadovoljen z oknom) — čaka morebitna obdelana fotka brez table.
