#!/usr/bin/env python3
"""Vpiše zakonsko opozorilo za alkohol (15.b člen ZZUZIS) neposredno v slike.

Trak je enak kot na strani (.alkohol-opozorilo): bež podlaga #dfc9a3,
temno besedilo #1a1714, pisava Outfit SemiBold, sredinsko poravnano.
Trak se doda POD sliko (višina slike se poveča), zato se iz slike nič ne odreže.

Uporaba:
    python3 orodja/vpisi_opozorilo.py              # vse slike z alkohol: true + ceniki
    python3 orodja/vpisi_opozorilo.py URL [URL…]   # samo izbrane

Izhod: orodja/_izhod/opozorilo/<ime>_opozorilo.jpg (originali v _izhod/original/).
"""
import json
import sys
import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps

KOREN = Path(__file__).resolve().parent.parent
IZHOD = KOREN / "orodja" / "_izhod"
PISAVA = KOREN / "orodja" / "fonts" / "Outfit.ttf"

BESEDILO = "Minister za zdravje opozarja: Prekomerno pitje alkohola škoduje zdravju!"
PODLAGA = (0xDF, 0xC9, 0xA3)
CRKE = (0x1A, 0x17, 0x14)

# Ceniki z alkoholnimi pijačami (flipbook v index.html)
CENIKI = (
    [f"https://kavarna-skocjan.b-cdn.net/CENIKI/Cenik_splosni{i}.jpg" for i in (1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12)]
    + ["https://kavarna-skocjan.b-cdn.net/CENIKI/cenik_splosni3-nov.jpg"]
    + [f"https://kavarna-skocjan.b-cdn.net/CENIKI/vinski{i}.jpg" for i in range(1, 5)]
    + [f"https://kavarna-skocjan.b-cdn.net/CENIKI/Koktajli{i}.jpg" for i in (1, 2)]
)


def url_alkohol():
    urls = []
    for ime in ("novice", "gallery", "promo"):
        podatki = json.loads((KOREN / "content" / f"{ime}.json").read_text("utf-8"))
        for it in podatki.get("items", []):
            if not it.get("alkohol"):
                continue
            for u in (it.get("images") or []) + [it.get("src"), it.get("image")]:
                if isinstance(u, str) and u and "_opozorilo." not in u and u not in urls:
                    urls.append(u)
    return urls


def pisava(velikost):
    f = ImageFont.truetype(str(PISAVA), velikost)
    f.set_variation_by_name("SemiBold")
    return f


def razbij(besedilo, f, sirina):
    """Razbije besedilo v vrstice, ki so ožje od `sirina`."""
    vrstice, trenutna = [], ""
    for beseda in besedilo.split():
        poskus = f"{trenutna} {beseda}".strip()
        if f.getlength(poskus) <= sirina or not trenutna:
            trenutna = poskus
        else:
            vrstice.append(trenutna)
            trenutna = beseda
    vrstice.append(trenutna)
    return vrstice


def vpisi(slika: Image.Image) -> Image.Image:
    slika = ImageOps.exif_transpose(slika).convert("RGB")
    w, h = slika.size
    rob = round(w * 0.04)
    uporabno = w - 2 * rob

    # Velikost črk: cilj ~3,2 % daljše stranice, a največ 2 vrstici
    vel = max(14, round(max(w, h) * 0.032))
    while True:
        f = pisava(vel)
        vrstice = razbij(BESEDILO, f, uporabno)
        if len(vrstice) <= 2 or vel <= 14:
            break
        vel -= 1
    # Vrstici naj bosta čim bolj enakomerni
    if len(vrstice) == 2:
        besede = BESEDILO.split()
        najboljse = min(
            (( " ".join(besede[:i]), " ".join(besede[i:]) ) for i in range(1, len(besede))),
            key=lambda p: max(f.getlength(p[0]), f.getlength(p[1])),
        )
        if max(f.getlength(x) for x in najboljse) <= uporabno:
            vrstice = list(najboljse)

    asc, desc = f.getmetrics()
    visina_vrstice = round((asc + desc) * 1.15)
    pad = round(vel * 0.7)
    trak = pad * 2 + visina_vrstice * len(vrstice)
    # Zakon: opozorilo vsaj 10 % površine → trak vsaj 11 % končne višine
    min_trak = -(-11 * h // 89)
    if trak < min_trak:
        pad += (min_trak - trak + 1) // 2
        trak = pad * 2 + visina_vrstice * len(vrstice)

    nova = Image.new("RGB", (w, h + trak), PODLAGA)
    nova.paste(slika, (0, 0))
    d = ImageDraw.Draw(nova)
    y = h + pad
    for v in vrstice:
        d.text((w / 2, y + visina_vrstice / 2), v, font=f, fill=CRKE, anchor="mm")
        y += visina_vrstice
    return nova


def prenesi(url: Path | str, cilj: Path):
    if cilj.exists():
        return
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        cilj.write_bytes(r.read())


def main():
    urls = sys.argv[1:] or (url_alkohol() + CENIKI)
    (IZHOD / "original").mkdir(parents=True, exist_ok=True)
    (IZHOD / "opozorilo").mkdir(parents=True, exist_ok=True)
    preslikava = {}
    for url in urls:
        mapa, ime = url.split("/")[-2], url.split("/")[-1]
        stem = ime.rsplit(".", 1)[0]
        orig = IZHOD / "original" / f"{mapa}__{ime}"
        prenesi(url, orig)
        izhod = IZHOD / "opozorilo" / mapa / f"{stem}_opozorilo.jpg"
        izhod.parent.mkdir(parents=True, exist_ok=True)
        vpisi(Image.open(orig)).save(izhod, "JPEG", quality=90, optimize=True, progressive=True)
        nov_url = url.rsplit("/", 1)[0] + f"/{stem}_opozorilo.jpg"
        preslikava[url] = nov_url
        print("✓", mapa, ime)
    (IZHOD / "preslikava.json").write_text(json.dumps(preslikava, indent=2, ensure_ascii=False), "utf-8")
    print(f"\n{len(preslikava)} slik → {IZHOD / 'opozorilo'}")


if __name__ == "__main__":
    main()
