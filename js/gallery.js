document.addEventListener('DOMContentLoaded', () => {

    // ============ LANGUAGE SWITCHING ============

    let currentLang = localStorage.getItem('kavarna-lang') || 'sl';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('kavarna-lang', lang);
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-lang-sl]').forEach(el => {
            const text = el.getAttribute(`data-lang-${lang}`);
            if (text) el.textContent = text;
        });

        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });
    }

    setLanguage(currentLang);

    document.getElementById('lang-toggle').addEventListener('click', () => {
        setLanguage(currentLang === 'sl' ? 'en' : 'sl');
    });

    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            setLanguage(opt.dataset.lang);
        });
    });

    // ============ MOBILE NAVIGATION TOGGLE ============

    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.classList.toggle('nav-open');
    });

    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.classList.remove('nav-open');
        });
    });

    // ============ GALLERY GRID FROM JSON ============

    const grid = document.getElementById('gallery-grid');
    const filters = document.querySelectorAll('.gallery-filter');
    let activeCategory = 'kavarna';

    async function loadGallery() {
        try {
            const res = await fetch('/content/gallery.json');
            if (!res.ok) return fallback();
            const data = await res.json();
            if (!data.items || !data.items.length) return fallback();

            grid.innerHTML = '';
            data.items.forEach(item => {
                const div = document.createElement('div');
                div.className = 'gallery-full-item';
                div.dataset.category = item.category || 'kavarna';
                div.innerHTML = `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="lazy">`;
                grid.appendChild(div);
            });

            applyFilter(activeCategory);
            initLightbox();
        } catch {
            fallback();
        }
    }

    function fallback() {
        // Keep hardcoded HTML as fallback
        applyFilter(activeCategory);
        initLightbox();
    }

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ============ CATEGORY FILTERING ============

    function applyFilter(category) {
        activeCategory = category;
        filters.forEach(f => f.classList.toggle('active', f.dataset.category === category));

        grid.querySelectorAll('.gallery-full-item').forEach(item => {
            const match = item.dataset.category === category;
            if (match) {
                item.classList.remove('hidden');
                item.classList.add('show');
            } else {
                item.classList.remove('show');
                item.classList.add('hidden');
            }
        });
    }

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            applyFilter(btn.dataset.category);
        });
    });

    // ============ LIGHTBOX ============

    function initLightbox() {
        const lightbox = document.getElementById('lightbox');
        const lightboxImg = document.getElementById('lightbox-img');
        const lightboxCounter = document.getElementById('lightbox-counter');
        const closeBtn = lightbox.querySelector('.lightbox-close');
        const prevBtn = lightbox.querySelector('.lightbox-prev');
        const nextBtn = lightbox.querySelector('.lightbox-next');
        let currentIndex = 0;

        function getVisibleItems() {
            return [...grid.querySelectorAll('.gallery-full-item.show')];
        }

        function openLightbox(index) {
            const visible = getVisibleItems();
            if (index < 0 || index >= visible.length) return;

            currentIndex = index;
            const img = visible[index].querySelector('img');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCounter.textContent = `${index + 1} / ${visible.length}`;

            lightbox.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeLightbox() {
            lightbox.classList.remove('active');
            document.body.style.overflow = '';
        }

        function navigate(direction) {
            const visible = getVisibleItems();
            currentIndex = (currentIndex + direction + visible.length) % visible.length;
            const img = visible[currentIndex].querySelector('img');
            lightboxImg.src = img.src;
            lightboxImg.alt = img.alt;
            lightboxCounter.textContent = `${currentIndex + 1} / ${visible.length}`;
        }

        // Click on gallery item → open lightbox (delegated for dynamic items)
        grid.addEventListener('click', (e) => {
            const item = e.target.closest('.gallery-full-item.show');
            if (!item) return;
            const visible = getVisibleItems();
            const index = visible.indexOf(item);
            if (index !== -1) openLightbox(index);
        });

        closeBtn.addEventListener('click', closeLightbox);
        prevBtn.addEventListener('click', () => navigate(-1));
        nextBtn.addEventListener('click', () => navigate(1));

        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });

        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;
            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowLeft') navigate(-1);
            if (e.key === 'ArrowRight') navigate(1);
        });

        let touchStartX = 0;
        lightbox.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
        }, { passive: true });

        lightbox.addEventListener('touchend', (e) => {
            const diff = touchStartX - e.changedTouches[0].clientX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) navigate(1);
                else navigate(-1);
            }
        }, { passive: true });
    }

    // Load gallery from JSON
    loadGallery();

});
