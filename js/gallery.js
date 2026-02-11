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

    // ============ CATEGORY FILTERING ============

    const filters = document.querySelectorAll('.gallery-filter');
    const items = document.querySelectorAll('.gallery-full-item');

    filters.forEach(btn => {
        btn.addEventListener('click', () => {
            const category = btn.dataset.category;

            filters.forEach(f => f.classList.remove('active'));
            btn.classList.add('active');

            items.forEach(item => {
                const match = item.dataset.category === category;
                if (match) {
                    item.classList.remove('hidden');
                    item.classList.add('show');
                } else {
                    item.classList.remove('show');
                    item.classList.add('hidden');
                }
            });
        });
    });

    // Initial state — show kavarna
    items.forEach(item => {
        if (item.dataset.category === 'kavarna') {
            item.classList.add('show');
        } else {
            item.classList.add('hidden');
        }
    });

    // ============ LIGHTBOX ============

    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCounter = document.getElementById('lightbox-counter');
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    let currentIndex = 0;

    function getVisibleItems() {
        return [...document.querySelectorAll('.gallery-full-item.show')];
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

    // Click on gallery item → open lightbox
    items.forEach(item => {
        item.addEventListener('click', () => {
            const visible = getVisibleItems();
            const index = visible.indexOf(item);
            if (index !== -1) openLightbox(index);
        });
    });

    closeBtn.addEventListener('click', closeLightbox);
    prevBtn.addEventListener('click', () => navigate(-1));
    nextBtn.addEventListener('click', () => navigate(1));

    // Click outside image to close
    lightbox.addEventListener('click', (e) => {
        if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
            closeLightbox();
        }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (!lightbox.classList.contains('active')) return;
        if (e.key === 'Escape') closeLightbox();
        if (e.key === 'ArrowLeft') navigate(-1);
        if (e.key === 'ArrowRight') navigate(1);
    });

    // Swipe support for mobile lightbox
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

});
