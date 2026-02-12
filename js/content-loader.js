// ========== CONTENT LOADER ==========
// Fetches JSON content files and updates the DOM dynamically.
// Falls back to hardcoded HTML content if fetch fails.

(function () {
    const SECTIONS = ['gallery', 'events', 'about', 'hours', 'contact', 'menus'];

    async function loadAllContent() {
        try {
            const results = await Promise.allSettled(
                SECTIONS.map(section =>
                    fetch(`/content/${section}.json`).then(r => r.ok ? r.json() : null)
                )
            );

            const content = {};
            SECTIONS.forEach((section, i) => {
                if (results[i].status === 'fulfilled' && results[i].value) {
                    content[section] = results[i].value;
                }
            });

            if (content.gallery) applyGallery(content.gallery);
            if (content.events) applyEvents(content.events);
            if (content.about) applyAbout(content.about);
            if (content.hours) applyHours(content.hours);
            if (content.contact) applyContact(content.contact);
            if (content.menus) applyMenus(content.menus);

        } catch (err) {
            console.warn('Content loader: uporaba fallback HTML vsebine', err);
        }
    }

    // --- Helpers ---
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function getCurrentLang() {
        return localStorage.getItem('kavarna-lang') || 'sl';
    }

    // --- GALLERY ---
    function applyGallery(data) {
        // Main page: show only featured items
        const grid = document.querySelector('.gallery-grid');
        if (!grid || !data.items || !data.items.length) return;

        const featured = data.items.filter(item => item.featured);
        if (!featured.length) return;

        grid.innerHTML = '';
        featured.forEach(item => {
            const div = document.createElement('div');
            div.className = 'gallery-item' + (item.large ? ' gallery-item-large' : '');
            div.innerHTML = `<img src="${escapeHtml(item.src)}" alt="${escapeHtml(item.alt)}" loading="lazy">`;
            grid.appendChild(div);
        });

        // Re-observe for scroll animations
        if (window.__scrollObserver) {
            grid.querySelectorAll('.gallery-item').forEach(el => {
                el.classList.add('animate-scale');
                window.__scrollObserver.observe(el);
            });
        }
    }

    // --- EVENTS / BANNERS ---
    function applyEvents(data) {
        // Remove existing event floats
        document.querySelectorAll('.event-float').forEach(el => el.remove());

        if (!data.items || !data.items.length) return;

        const body = document.body;

        data.items.forEach(item => {
            if (!item.enabled) return;

            const float = document.createElement('div');
            float.className = `event-float event-float-${item.position}`;
            float.id = item.id || `event-float-${item.position}`;
            float.innerHTML = `
                <button class="event-float-close" data-close="${float.id}" aria-label="Zapri">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
                <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.alt)}" class="event-float-img">
            `;
            body.appendChild(float);
        });

        // Re-init event float logic
        initEventFloats();
    }

    function initEventFloats() {
        const eventFloats = document.querySelectorAll('.event-float');
        if (!eventFloats.length) return;

        const heroSection = document.querySelector('.hero');
        if (!heroSection) return;

        const floatStates = [];

        eventFloats.forEach(ef => {
            const state = { el: ef, visible: false, dismissed: false };
            floatStates.push(state);

            setTimeout(() => {
                const heroBottom = heroSection.getBoundingClientRect().bottom;
                if (heroBottom > window.innerHeight * 0.5) {
                    state.visible = true;
                    ef.classList.add('active');
                }
            }, 2000);
        });

        const hideThreshold = () => window.innerWidth <= 768
            ? window.innerHeight * 0.85
            : window.innerHeight * 0.5;

        window.addEventListener('scroll', () => {
            const heroBottom = heroSection.getBoundingClientRect().bottom;
            floatStates.forEach(s => {
                if (s.dismissed) return;
                if (heroBottom < hideThreshold() && s.visible) {
                    s.el.classList.remove('active');
                } else if (heroBottom >= hideThreshold() && s.visible) {
                    s.el.classList.add('active');
                }
            });
        }, { passive: true });

        document.querySelectorAll('.event-float-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-close');
                const target = document.getElementById(targetId);
                const state = floatStates.find(s => s.el === target);
                if (state) state.dismissed = true;
                if (target) {
                    target.classList.remove('active');
                    target.classList.add('hiding');
                    setTimeout(() => target.remove(), 500);
                }
            });
        });
    }

    // --- ABOUT ---
    function applyAbout(data) {
        const lang = getCurrentLang();
        const textEl = document.querySelector('.about-text');
        const imageEl = document.querySelector('.about-image img');

        if (textEl && data.paragraphs) {
            textEl.innerHTML = '';
            data.paragraphs.forEach(p => {
                const pEl = document.createElement('p');
                pEl.setAttribute('data-lang-sl', p.sl);
                pEl.setAttribute('data-lang-en', p.en);
                pEl.textContent = lang === 'en' ? p.en : p.sl;
                textEl.appendChild(pEl);
            });
        }

        if (imageEl && data.image) {
            imageEl.src = data.image;
        }
    }

    // --- HOURS ---
    function applyHours(data) {
        const lang = getCurrentLang();
        const tbody = document.querySelector('.hours-table tbody');
        const noteEl = document.querySelector('.hours-note');

        if (tbody && data.rows) {
            tbody.innerHTML = '';
            data.rows.forEach(row => {
                const tr = document.createElement('tr');
                const tdDays = document.createElement('td');
                tdDays.setAttribute('data-lang-sl', row.daysSl);
                tdDays.setAttribute('data-lang-en', row.daysEn);
                tdDays.textContent = lang === 'en' ? row.daysEn : row.daysSl;

                const tdTime = document.createElement('td');
                tdTime.textContent = row.time;

                tr.appendChild(tdDays);
                tr.appendChild(tdTime);
                tbody.appendChild(tr);
            });
        }

        if (noteEl) {
            noteEl.setAttribute('data-lang-sl', data.noteSl);
            noteEl.setAttribute('data-lang-en', data.noteEn);
            noteEl.textContent = lang === 'en' ? data.noteEn : data.noteSl;
        }
    }

    // --- CONTACT ---
    function applyContact(data) {
        // Email
        const emailLink = document.querySelector('a[href^="mailto:"]');
        if (emailLink && data.email) {
            emailLink.href = 'mailto:' + data.email;
            emailLink.textContent = data.email;
        }

        // Social links
        const fbLink = document.querySelector('.contact-social a[aria-label="Facebook"]');
        if (fbLink && data.facebook) fbLink.href = data.facebook;

        const igLink = document.querySelector('.contact-social a[aria-label="Instagram"]');
        if (igLink && data.instagram) igLink.href = data.instagram;
    }

    // --- MENUS ---
    function applyMenus(data) {
        if (!data.books || !data.books.length) return;

        const lang = getCurrentLang();

        // Update tabs
        const tabsContainer = document.querySelector('.menu-tabs');
        if (tabsContainer) {
            tabsContainer.innerHTML = '';
            data.books.forEach((book, i) => {
                const btn = document.createElement('button');
                btn.className = 'menu-tab' + (i === 0 ? ' active' : '');
                btn.dataset.book = book.id;
                const span = document.createElement('span');
                span.setAttribute('data-lang-sl', book.nameSl);
                span.setAttribute('data-lang-en', book.nameEn);
                span.textContent = lang === 'en' ? book.nameEn : book.nameSl;
                btn.appendChild(span);
                tabsContainer.appendChild(btn);
            });
        }

        // Update flipbook containers
        const wrapper = document.querySelector('.flipbook-wrapper');
        if (!wrapper) return;

        // Remove existing containers
        wrapper.querySelectorAll('.flipbook-container').forEach(c => c.remove());

        // Insert new containers before the next button
        const nextBtn = wrapper.querySelector('.flipbook-next');

        data.books.forEach((book, i) => {
            const container = document.createElement('div');
            container.className = 'flipbook-container';
            container.id = book.id;
            if (i > 0) container.style.display = 'none';

            book.pages.forEach((pageUrl, j) => {
                const page = document.createElement('div');
                page.className = 'flipbook-page';
                page.innerHTML = `<img src="${escapeHtml(pageUrl)}" alt="${escapeHtml(lang === 'en' ? book.nameEn : book.nameSl)} ${j + 1}">`;
                container.appendChild(page);
            });

            wrapper.insertBefore(container, nextBtn);
        });

        // Re-init flipbooks after replacing containers
        if (window.__reinitFlipbooks) {
            window.__reinitFlipbooks();
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllContent);
    } else {
        loadAllContent();
    }
})();
