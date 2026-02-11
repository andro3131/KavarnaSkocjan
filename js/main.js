document.addEventListener('DOMContentLoaded', () => {

    // ============ LANGUAGE SWITCHING ============

    let currentLang = localStorage.getItem('kavarna-lang') || 'sl';

    function setLanguage(lang) {
        currentLang = lang;
        localStorage.setItem('kavarna-lang', lang);
        document.documentElement.lang = lang;

        document.querySelectorAll('[data-lang-sl]').forEach(el => {
            const text = el.getAttribute(`data-lang-${lang}`);
            if (text) {
                el.textContent = text;
            }
        });

        // Update meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc) {
            const descriptions = {
                sl: 'Kavarna Škocjan – Izjemna kava, najboljša vina in prijazna postrežba v Kulturnem centru Škocjan.',
                en: 'Café Škocjan – Exceptional coffee, best wines, and friendly service in the Cultural Centre Škocjan.'
            };
            metaDesc.setAttribute('content', descriptions[lang]);
        }

        // Update active state on toggle
        document.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.toggle('active', opt.dataset.lang === lang);
        });
    }

    // Initialize
    setLanguage(currentLang);

    // Toggle button
    document.getElementById('lang-toggle').addEventListener('click', () => {
        setLanguage(currentLang === 'sl' ? 'en' : 'sl');
    });

    // Individual language labels
    document.querySelectorAll('.lang-option').forEach(opt => {
        opt.addEventListener('click', (e) => {
            e.stopPropagation();
            setLanguage(opt.dataset.lang);
        });
    });

    // ============ HERO ENTRANCE ANIMATION ============

    const hero = document.querySelector('.hero');
    // Small delay to let browser paint, then trigger entrance
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            hero.classList.add('loaded');
        });
    });

    // ============ NAVBAR — SCROLL + HIDE ON SCROLL DOWN ============

    const navbar = document.getElementById('navbar');
    let lastScrollY = window.scrollY;
    let ticking = false;

    function handleNavbar() {
        const currentScrollY = window.scrollY;

        // Add/remove solid background
        navbar.classList.toggle('scrolled', currentScrollY > 50);

        // Hide on scroll down, show on scroll up (only after hero)
        if (currentScrollY > window.innerHeight) {
            if (currentScrollY > lastScrollY && currentScrollY - lastScrollY > 5) {
                navbar.classList.add('hidden');
            } else if (lastScrollY - currentScrollY > 5) {
                navbar.classList.remove('hidden');
            }
        } else {
            navbar.classList.remove('hidden');
        }

        lastScrollY = currentScrollY;
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(handleNavbar);
            ticking = true;
        }
    }, { passive: true });

    handleNavbar();

    // ============ MOBILE NAVIGATION TOGGLE ============

    const navToggle = document.getElementById('nav-toggle');
    const navLinks = document.getElementById('nav-links');

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navLinks.classList.toggle('open');
        document.body.classList.toggle('nav-open');
    });

    // Close mobile menu on link click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navLinks.classList.remove('open');
            document.body.classList.remove('nav-open');
        });
    });

    // ============ SMOOTH SCROLL WITH OFFSET ============

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const navHeight = navbar.offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });

    // ============ PARALLAX ON HERO BACKGROUND ============

    const heroBg = document.querySelector('.hero .hero-bg-img');
    if (heroBg) {
        window.addEventListener('scroll', () => {
            if (window.scrollY < window.innerHeight) {
                heroBg.style.transform = `scale(1.08) translateY(${window.scrollY * 0.3}px)`;
            }
        }, { passive: true });
    }

    // ============ PARALLAX ON HOURS BACKGROUND ============

    const hoursSection = document.querySelector('.hours');
    const hoursBg = hoursSection ? hoursSection.querySelector('.hero-bg-img') : null;
    if (hoursBg) {
        window.addEventListener('scroll', () => {
            const rect = hoursSection.getBoundingClientRect();
            if (rect.top < window.innerHeight && rect.bottom > 0) {
                const progress = (window.innerHeight - rect.top) / (window.innerHeight + rect.height);
                hoursBg.style.transform = `translateY(${(progress - 0.5) * 60}px)`;
            }
        }, { passive: true });
    }

    // ============ SCROLL-TRIGGERED ANIMATIONS ============

    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Section titles — animate with decoration line
    document.querySelectorAll('.section-title.has-decoration').forEach(el => {
        observer.observe(el);
    });

    // Sections — fade up
    document.querySelectorAll('.section').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });

    // About text — slide from left
    document.querySelectorAll('.about-text').forEach(el => {
        el.classList.add('animate-slide-left');
        observer.observe(el);
    });

    // About image — slide from right
    document.querySelectorAll('.about-image').forEach(el => {
        el.classList.add('animate-slide-right');
        observer.observe(el);
    });

    // Gallery items — scale up
    document.querySelectorAll('.gallery-item').forEach(el => {
        el.classList.add('animate-scale');
        observer.observe(el);
    });

    // Contact items — slide from left
    document.querySelectorAll('.contact-item').forEach(el => {
        el.classList.add('animate-slide-left');
        observer.observe(el);
    });

    // Hours table — fade up
    document.querySelectorAll('.hours-table-wrapper').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });

    // ============ FLIPBOOK / SLIDER ============

    const currentEl = document.getElementById('flipbook-current');
    const totalEl = document.getElementById('flipbook-total');
    const prevBtn = document.querySelector('.flipbook-prev');
    const nextBtn = document.querySelector('.flipbook-next');
    const isMobile = window.innerWidth <= 768;
    const books = {};
    let activeBook = null;

    function initBook(containerId) {
        const container = document.getElementById(containerId);
        if (!container || books[containerId]) return books[containerId];

        const pages = container.querySelectorAll('.flipbook-page');
        const book = { container, pages, id: containerId };

        if (!isMobile && window.St && window.St.PageFlip) {
            const pageFlip = new St.PageFlip(container, {
                width: 550,
                height: 770,
                size: 'stretch',
                maxShadowOpacity: 0.3,
                showCover: false,
                mobileScrollSupport: false,
                flippingTime: 800,
                useMouseEvents: true,
                swipeDistance: 30,
                autoSize: true,
            });
            pageFlip.loadFromHTML(pages);
            book.pageFlip = pageFlip;
            book.totalPages = pageFlip.getPageCount();

            pageFlip.on('flip', (e) => {
                const p = e.data;
                const left = p + 1;
                const right = Math.min(p + 2, book.totalPages);
                currentEl.textContent = left === right ? left : left + '–' + right;
            });
        } else {
            container.classList.add('slider-mode');
            book.currentPage = 0;
            book.totalPages = pages.length;
            pages.forEach((p, i) => { p.style.display = i === 0 ? 'block' : 'none'; });

            // Swipe support
            let touchStartX = 0;
            container.addEventListener('touchstart', (e) => {
                touchStartX = e.touches[0].clientX;
            }, { passive: true });
            container.addEventListener('touchend', (e) => {
                const diff = touchStartX - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 40) {
                    if (diff > 0 && book.currentPage < pages.length - 1) showBookPage(book, book.currentPage + 1);
                    else if (diff < 0 && book.currentPage > 0) showBookPage(book, book.currentPage - 1);
                }
            }, { passive: true });
        }

        books[containerId] = book;
        return book;
    }

    function showBookPage(book, index) {
        book.pages.forEach((p, i) => { p.style.display = i === index ? 'block' : 'none'; });
        book.currentPage = index;
        currentEl.textContent = index + 1;
    }

    function switchBook(bookId) {
        // Hide all containers
        document.querySelectorAll('.flipbook-container').forEach(c => c.style.display = 'none');

        const book = initBook(bookId);
        book.container.style.display = '';
        activeBook = book;

        // Update indicator
        totalEl.textContent = book.totalPages;
        if (book.pageFlip) {
            currentEl.textContent = '1–2';
            book.pageFlip.turnToPage(0);
        } else {
            showBookPage(book, 0);
        }
    }

    // Init first book
    switchBook('book-general');

    // Tab click handlers
    document.querySelectorAll('.menu-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.disabled) return;
            document.querySelectorAll('.menu-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            switchBook(tab.dataset.book);
        });
    });

    // Prev / Next buttons
    prevBtn.addEventListener('click', () => {
        if (!activeBook) return;
        if (activeBook.pageFlip) {
            activeBook.pageFlip.flipPrev();
        } else if (activeBook.currentPage > 0) {
            showBookPage(activeBook, activeBook.currentPage - 1);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (!activeBook) return;
        if (activeBook.pageFlip) {
            activeBook.pageFlip.flipNext();
        } else if (activeBook.currentPage < activeBook.pages.length - 1) {
            showBookPage(activeBook, activeBook.currentPage + 1);
        }
    });

    // ============ EVENT FLOATING CARD ============

    const eventFloats = document.querySelectorAll('.event-float');
    if (eventFloats.length) {
        const heroSection = document.querySelector('.hero');
        const floatStates = [];

        eventFloats.forEach((ef) => {
            const state = { el: ef, visible: false, dismissed: false };
            floatStates.push(state);

            setTimeout(() => {
                // Only show if user is still near top of page
                const heroBottom = heroSection.getBoundingClientRect().bottom;
                if (heroBottom > window.innerHeight * 0.5) {
                    state.visible = true;
                    ef.classList.add('active');
                }
            }, 2000);
        });

        // Hide when scrolling past ~half of hero
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

        // Close buttons
        document.querySelectorAll('.event-float-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const targetId = btn.getAttribute('data-close');
                const target = document.getElementById(targetId);
                const state = floatStates.find(s => s.el === target);
                if (state) state.dismissed = true;
                target.classList.remove('active');
                target.classList.add('hiding');
                setTimeout(() => target.remove(), 500);
            });
        });
    }

    // ============ ACTIVE NAV LINK ON SCROLL ============

    const sections = document.querySelectorAll('section[id]');
    const navLinkItems = document.querySelectorAll('.nav-links a');

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinkItems.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
                });
            }
        });
    }, { root: null, rootMargin: '-30% 0px -70% 0px', threshold: 0 });

    sections.forEach(section => {
        sectionObserver.observe(section);
    });

});
