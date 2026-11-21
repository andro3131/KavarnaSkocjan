// Slike z vpisanim zakonskim opozorilom za alkohol (ime datoteke vsebuje "_opozorilo").
// Trak je na dnu slike, zato ga obrezovanje (object-fit: cover) ne sme odrezati:
// - če je slika ožja od okvirja (obreže se zgoraj/spodaj) → poravnaj na dno,
// - če je širša (obreže se levo/desno) → prikaži celo sliko (contain).
(function () {
    function jeOpozorilo(img) {
        return img.tagName === 'IMG' && /_opozorilo\.[a-z]+(\?|$)/i.test(img.currentSrc || img.src || '');
    }

    function prilagodi(img) {
        if (!jeOpozorilo(img) || !img.naturalWidth) return;
        img.style.objectFit = '';
        img.style.objectPosition = '';
        if (getComputedStyle(img).objectFit !== 'cover') return;
        const w = img.clientWidth, h = img.clientHeight;
        if (!w || !h) return;
        const razmerjeSlike = img.naturalWidth / img.naturalHeight;
        if (razmerjeSlike > w / h + 0.01) {
            img.style.objectFit = 'contain';
            img.style.backgroundColor = '#1a1714';
        } else {
            img.style.objectPosition = 'center bottom';
        }
    }

    function vse() {
        document.querySelectorAll('img').forEach(img => { if (img.complete) prilagodi(img); });
    }

    document.addEventListener('load', e => { if (e.target.tagName === 'IMG') prilagodi(e.target); }, true);
    document.addEventListener('DOMContentLoaded', vse);
    let t;
    window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(vse, 200); });
})();
