// ========== CONTENT LOADER ==========
// Fetches JSON content files and updates the DOM dynamically.
// Falls back to hardcoded HTML content if fetch fails.

(function () {
    const SECTIONS = ['gallery', 'events', 'promo', 'about', 'hours', 'contact', 'menus', 'novice'];

    async function loadAllContent() {
        try {
            const results = await Promise.allSettled(
                SECTIONS.map(section =>
                    fetch(`/content/${section}.json?t=${Date.now()}`).then(r => r.ok ? r.json() : null)
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
            applyPromo(content.promo);
            if (content.about) applyAbout(content.about);
            if (content.hours) applyHours(content.hours);
            if (content.contact) applyContact(content.contact);
            if (content.menus) applyMenus(content.menus);
            if (content.novice) applyNovice(content.novice);

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

    // --- PROMO ---
    function applyPromo(data) {
        const heroPromo = document.querySelector('.hero-promo');
        const mobilePromo = document.querySelector('.mobile-promo');
        const sectionPromo = document.querySelector('.promo-card');

        // Support both old (single object) and new (items array) format
        let items = [];
        if (data && data.items && data.items.length > 0) {
            items = data.items;
        } else if (data && data.enabled && data.image) {
            items = [data]; // legacy single promo
        }

        // If no data, disabled, or no items, hide all
        if (!data || !data.enabled || items.length === 0) {
            if (heroPromo) heroPromo.style.display = 'none';
            if (mobilePromo) mobilePromo.style.display = 'none';
            if (sectionPromo) sectionPromo.style.display = 'none';
            return;
        }

        // Hide section promo card (kept only as hero/mobile banner)
        if (sectionPromo) sectionPromo.style.display = 'none';

        let currentIndex = 0;

        function showPromoItem(index, animate) {
            const item = items[index];
            const lang = getCurrentLang();
            const badge = lang === 'en' ? item.badgeEn : item.badgeSl;
            const text = lang === 'en' ? item.textEn : item.textSl;
            const cta = lang === 'en' ? item.ctaEn : item.ctaSl;
            const imgSrc = item.image;
            const title = item.title;

            // Desktop hero promo
            if (heroPromo) {
                if (animate) heroPromo.classList.add('promo-fade-out');

                const applyDesktop = () => {
                    const img = heroPromo.querySelector('.hero-promo-img');
                    const badgeEl = heroPromo.querySelector('.hero-promo-badge');
                    const titleEl = heroPromo.querySelector('.hero-promo-title');
                    const descEl = heroPromo.querySelector('.hero-promo-desc');
                    const ctaEl = heroPromo.querySelector('.hero-promo-cta');

                    if (img) img.src = imgSrc;
                    if (badgeEl) {
                        badgeEl.textContent = badge;
                        badgeEl.setAttribute('data-lang-sl', item.badgeSl);
                        badgeEl.setAttribute('data-lang-en', item.badgeEn);
                    }
                    if (titleEl) titleEl.textContent = title;
                    if (descEl) {
                        descEl.textContent = text;
                        descEl.setAttribute('data-lang-sl', item.textSl);
                        descEl.setAttribute('data-lang-en', item.textEn);
                    }
                    if (ctaEl) {
                        ctaEl.textContent = cta;
                        ctaEl.setAttribute('data-lang-sl', item.ctaSl);
                        ctaEl.setAttribute('data-lang-en', item.ctaEn);
                    }

                    if (animate) {
                        heroPromo.classList.remove('promo-fade-out');
                        heroPromo.classList.add('promo-fade-in');
                        setTimeout(() => heroPromo.classList.remove('promo-fade-in'), 500);
                    }
                };

                if (animate) {
                    setTimeout(applyDesktop, 500);
                } else {
                    applyDesktop();
                }
            }

            // Mobile promo strip
            if (mobilePromo) {
                if (animate) mobilePromo.classList.add('promo-fade-out');

                const applyMobile = () => {
                    const img = mobilePromo.querySelector('.mobile-promo-img');
                    const strong = mobilePromo.querySelector('.mobile-promo-text strong');
                    const span = mobilePromo.querySelector('.mobile-promo-text span');

                    if (img) img.src = imgSrc;
                    if (strong) {
                        strong.textContent = badge;
                        strong.setAttribute('data-lang-sl', item.badgeSl);
                        strong.setAttribute('data-lang-en', item.badgeEn);
                    }
                    if (span) {
                        span.textContent = lang === 'en'
                            ? title + ' – ' + item.textEn
                            : title + ' – ' + item.textSl;
                        span.setAttribute('data-lang-sl', title + ' – ' + item.textSl);
                        span.setAttribute('data-lang-en', title + ' – ' + item.textEn);
                    }

                    if (animate) {
                        mobilePromo.classList.remove('promo-fade-out');
                        mobilePromo.classList.add('promo-fade-in');
                        setTimeout(() => mobilePromo.classList.remove('promo-fade-in'), 500);
                    }
                };

                if (animate) {
                    setTimeout(applyMobile, 500);
                } else {
                    applyMobile();
                }
            }
        }

        // Show first item immediately
        showPromoItem(0, false);

        // Rotate every 5 seconds if more than one item
        if (items.length > 1) {
            setInterval(() => {
                currentIndex = (currentIndex + 1) % items.length;
                showPromoItem(currentIndex, true);
            }, 5000);
        }
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

    // --- NOVICE ---
    function applyNovice(data) {
        const grid = document.querySelector('#novice-grid');
        const emptyEl = document.querySelector('#novice-empty');
        if (!grid) return;

        if (!data.items || !data.items.length) {
            if (emptyEl) emptyEl.style.display = 'block';
            grid.style.display = 'none';
            // Hide the CTA button too
            const cta = document.querySelector('.novice-cta');
            if (cta) cta.style.display = 'none';
            return;
        }

        const lang = getCurrentLang();

        // Sort by date descending, take first 3
        const sorted = [...data.items].sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = sorted.slice(0, 3);

        grid.innerHTML = '';
        latest.forEach(item => {
            const title = lang === 'en' ? (item.titleEn || item.titleSl) : item.titleSl;
            const text = lang === 'en' ? (item.textEn || item.textSl) : item.textSl;
            const mainImage = item.images && item.images.length ? item.images[0] : '';
            const hasVideo = item.youtube || item.video;

            const card = document.createElement('div');
            card.className = 'novica-card';

            let mediaHtml = '';
            if (mainImage) {
                mediaHtml = `<div class="novica-card-media">
                    <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(title)}" loading="lazy">
                    ${hasVideo ? '<div class="novica-card-play"><svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>' : ''}
                </div>`;
            }

            const date = formatNoviceDate(item.date);

            card.innerHTML = `
                ${mediaHtml}
                <div class="novica-card-body">
                    <span class="novica-card-date">${date}</span>
                    <h3 class="novica-card-title">${escapeHtml(title)}</h3>
                    <p class="novica-card-text">${escapeHtml(text)}</p>
                    <span class="novica-card-more" data-lang-sl="Preberi več" data-lang-en="Read more">${lang === 'en' ? 'Read more' : 'Preberi več'}</span>
                </div>
            `;

            card.addEventListener('click', () => openNovicaModal(item, lang));
            grid.appendChild(card);
        });

        if (emptyEl) emptyEl.style.display = 'none';
    }

    function formatNoviceDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    function openNovicaModal(item, lang) {
        const modal = document.getElementById('novice-modal');
        const modalBody = document.getElementById('novice-modal-body');
        if (!modal || !modalBody) return;

        const title = lang === 'en' ? (item.titleEn || item.titleSl) : item.titleSl;
        const content = lang === 'en' ? (item.contentEn || item.contentSl || item.textEn || item.textSl) : (item.contentSl || item.textSl);

        let html = `<span class="novica-modal-date">${formatNoviceDate(item.date)}</span>`;
        html += `<h2 class="novica-modal-title">${escapeHtml(title)}</h2>`;

        // Build media items array (images + videos)
        const mediaItems = [];

        if (item.youtube) {
            const ytMatch = item.youtube.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
            if (ytMatch) {
                mediaItems.push({ type: 'youtube', id: ytMatch[1], thumb: `https://img.youtube.com/vi/${ytMatch[1]}/mqdefault.jpg` });
            }
        }

        if (item.video && !item.youtube) {
            mediaItems.push({ type: 'video', src: item.video, thumb: (item.images && item.images[0]) || '' });
        }

        if (item.images && item.images.length) {
            item.images.forEach(img => {
                mediaItems.push({ type: 'image', src: img });
            });
        }

        // Gallery with main viewer + thumbnails
        if (mediaItems.length) {
            html += '<div class="novica-modal-gallery">';
            html += '<div class="novica-modal-main-media" id="novica-main-media"></div>';
            if (mediaItems.length > 1) {
                html += '<div class="novica-modal-thumbs">';
                mediaItems.forEach((m, i) => {
                    const thumbSrc = m.type === 'youtube' ? m.thumb : (m.type === 'video' ? (m.thumb || '') : m.src);
                    const playIcon = (m.type === 'youtube' || m.type === 'video') ? '<div class="novica-modal-thumb-play"><svg viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>' : '';
                    html += `<div class="novica-modal-thumb${i === 0 ? ' active' : ''}" data-media-index="${i}">
                        ${thumbSrc ? `<img src="${escapeHtml(thumbSrc)}" alt="" loading="lazy">` : ''}
                        ${playIcon}
                    </div>`;
                });
                html += '</div>';
            }
            html += '</div>';
        }

        // Content text
        if (content) {
            const paragraphs = content.split('\n').filter(p => p.trim());
            html += '<div class="novica-modal-text">';
            paragraphs.forEach(p => {
                html += `<p>${escapeHtml(p)}</p>`;
            });
            html += '</div>';
        }

        modalBody.innerHTML = html;

        // Gallery interaction
        if (mediaItems.length) {
            const mainMedia = document.getElementById('novica-main-media');
            const thumbs = modalBody.querySelectorAll('.novica-modal-thumb');

            function showMedia(index) {
                const m = mediaItems[index];
                if (m.type === 'youtube') {
                    mainMedia.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${m.id}?autoplay=1" frameborder="0" allowfullscreen></iframe>`;
                } else if (m.type === 'video') {
                    mainMedia.innerHTML = `<video controls autoplay preload="metadata"><source src="${escapeHtml(m.src)}"></video>`;
                } else {
                    mainMedia.innerHTML = `<img src="${escapeHtml(m.src)}" alt="${escapeHtml(title)}">`;
                }
                thumbs.forEach((t, i) => t.classList.toggle('active', i === index));
            }

            showMedia(0);
            thumbs.forEach(t => {
                t.addEventListener('click', () => showMedia(parseInt(t.dataset.mediaIndex)));
            });
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Close handlers (only bind once)
        if (!modal.__noviceBound) {
            modal.__noviceBound = true;

            const closeModal = () => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                modalBody.querySelectorAll('iframe, video').forEach(el => {
                    if (el.tagName === 'IFRAME') el.src = el.src;
                    if (el.tagName === 'VIDEO') el.pause();
                });
            };

            document.getElementById('novice-modal-close').addEventListener('click', closeModal);
            modal.querySelector('.novice-modal-overlay').addEventListener('click', closeModal);
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
            });
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', loadAllContent);
    } else {
        loadAllContent();
    }
})();
