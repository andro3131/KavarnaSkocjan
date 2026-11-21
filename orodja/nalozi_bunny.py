#!/usr/bin/env python3
"""Naloži slike z opozorilom (orodja/_izhod/opozorilo/<MAPA>/…) na Bunny Storage
v isto mapo kot original. Ključ: BUNNY_KEY v bunny.env (koren repa, ni v gitu).
Po uploadu preveri, da je slika dosegljiva na CDN-ju.
"""
import json
import sys
import urllib.request
from pathlib import Path

KOREN = Path(__file__).resolve().parent.parent
IZHOD = KOREN / "orodja" / "_izhod"
ZONA = "kavarna-skocjan"
CDN = "https://kavarna-skocjan.b-cdn.net"


def kljuc():
    for vrstica in (KOREN / "bunny.env").read_text().splitlines():
        if vrstica.startswith("BUNNY_KEY="):
            return vrstica.split("=", 1)[1].strip()
    sys.exit("BUNNY_KEY manjka v bunny.env")


def main():
    k = kljuc()
    preslikava = json.loads((IZHOD / "preslikava.json").read_text("utf-8"))
    napake = 0
    for star, nov in preslikava.items():
        pot = nov.removeprefix(CDN + "/")          # npr. Ponudba/xxx_opozorilo.jpg
        datoteka = IZHOD / "opozorilo" / pot
        req = urllib.request.Request(
            f"https://storage.bunnycdn.com/{ZONA}/{pot}",
            data=datoteka.read_bytes(), method="PUT",
            headers={"AccessKey": k, "Content-Type": "application/octet-stream"},
        )
        try:
            with urllib.request.urlopen(req, timeout=120) as r:
                ok = r.status in (200, 201)
            with urllib.request.urlopen(urllib.request.Request(nov, method="HEAD", headers={"User-Agent": "Mozilla/5.0"}), timeout=60) as r:
                ok = ok and r.status == 200
        except Exception as e:
            ok = False
            print("  napaka:", e)
        napake += not ok
        print("✓" if ok else "✗", pot)
    print(f"\nNapak: {napake}")
    sys.exit(1 if napake else 0)


if __name__ == "__main__":
    main()
