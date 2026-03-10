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

        // Re-render cards with correct language
        if (noviceData && noviceData.items) renderAllNovice(noviceData.items);
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

    // ============ NOVICE FROM JSON ============

    const grid = document.getElementById('novice-full-grid');
    const emptyEl = document.getElementById('novice-empty');
    let noviceData = null;

    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d)) return dateStr;
        return d.toLocaleDateString('sl-SI', { day: 'numeric', month: 'long', year: 'numeric' });
    }

    async function loadNovice() {
        try {
            const res = await fetch('/content/novice.json');
            if (!res.ok) return;
            const data = await res.json();
            noviceData = data;

            if (!data.items || !data.items.length) {
                emptyEl.style.display = 'block';
                return;
            }

            renderAllNovice(data.items);
        } catch {
            // Keep empty state
        }
    }

    function renderAllNovice(items) {
        // Sort by date descending
        const sorted = [...items].sort((a, b) => new Date(b.date) - new Date(a.date));

        grid.innerHTML = '';
        sorted.forEach((item, i) => {
            grid.appendChild(createNovicaCard(item, i));
        });

        emptyEl.style.display = sorted.length ? 'none' : 'block';
    }

    function createNovicaCard(item, index) {
        const div = document.createElement('div');
        div.className = 'novica-card';
        div.dataset.index = index;

        const title = currentLang === 'en' ? (item.titleEn || item.titleSl) : item.titleSl;
        const text = currentLang === 'en' ? (item.textEn || item.textSl) : item.textSl;
        const mainImage = item.images && item.images.length ? item.images[0] : '';
        const hasVideo = item.youtube || item.video;

        let mediaHtml = '';
        if (mainImage) {
            mediaHtml = `<div class="novica-card-media">
                <img src="${escapeHtml(mainImage)}" alt="${escapeHtml(title)}" loading="lazy">
                ${hasVideo ? '<div class="novica-card-play"><svg width="32" height="32" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>' : ''}
            </div>`;
        }

        div.innerHTML = `
            ${mediaHtml}
            <div class="novica-card-body">
                <span class="novica-card-date">${formatDate(item.date)}</span>
                <h3 class="novica-card-title">${escapeHtml(title)}</h3>
                <p class="novica-card-text">${escapeHtml(text)}</p>
                <span class="novica-card-more" data-lang-sl="Preberi več" data-lang-en="Read more">${currentLang === 'en' ? 'Read more' : 'Preberi več'}</span>
            </div>
        `;

        div.addEventListener('click', () => openNovicaModal(item));
        return div;
    }

    // ============ MODAL ============

    const modal = document.getElementById('novice-modal');
    const modalBody = document.getElementById('novice-modal-body');
    const modalClose = document.getElementById('novice-modal-close');
    const modalOverlay = modal.querySelector('.novice-modal-overlay');

    function openNovicaModal(item) {
        const title = currentLang === 'en' ? (item.titleEn || item.titleSl) : item.titleSl;
        const content = currentLang === 'en' ? (item.contentEn || item.contentSl || item.textEn || item.textSl) : (item.contentSl || item.textSl);

        let html = `<span class="novica-modal-date">${formatDate(item.date)}</span>`;
        html += `<h2 class="novica-modal-title">${escapeHtml(title)}</h2>`;

        // Build media items array (images + videos)
        const mediaItems = [];

        if (item.youtube) {
            const ytId = extractYouTubeId(item.youtube);
            if (ytId) {
                mediaItems.push({ type: 'youtube', id: ytId, thumb: `https://img.youtube.com/vi/${ytId}/mqdefault.jpg` });
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
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        // Stop any playing videos
        modalBody.querySelectorAll('iframe, video').forEach(el => {
            if (el.tagName === 'IFRAME') el.src = el.src;
            if (el.tagName === 'VIDEO') el.pause();
        });
    }

    function extractYouTubeId(url) {
        if (!url) return null;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|shorts\/))([a-zA-Z0-9_-]{11})/);
        return match ? match[1] : null;
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    // Load novice
    loadNovice();
});
