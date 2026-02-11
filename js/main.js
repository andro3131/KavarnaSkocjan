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

    // ============ FLIPBOOK ============

    const flipbookContainer = document.getElementById('book-general');
    if (flipbookContainer && window.St && window.St.PageFlip) {
        const pageFlip = new St.PageFlip(flipbookContainer, {
            width: 400,
            height: 560,
            size: 'stretch',
            maxShadowOpacity: 0.3,
            showCover: true,
            mobileScrollSupport: true,
            flippingTime: 800,
            useMouseEvents: true,
            swipeDistance: 30,
            clickEventForward: true,
            autoSize: true,
        });

        pageFlip.loadFromHTML(document.querySelectorAll('#book-general .flipbook-page'));

        const currentEl = document.getElementById('flipbook-current');
        const totalEl = document.getElementById('flipbook-total');
        totalEl.textContent = pageFlip.getPageCount();

        pageFlip.on('flip', (e) => {
            currentEl.textContent = e.data + 1;
        });

        document.querySelector('.flipbook-prev').addEventListener('click', () => {
            pageFlip.flipPrev();
        });

        document.querySelector('.flipbook-next').addEventListener('click', () => {
            pageFlip.flipNext();
        });
    }

    // ============ EVENT FLOATING CARD ============

    const eventFloat = document.getElementById('event-float');
    if (eventFloat) {
        let eventFloatVisible = false;
        let eventFloatDismissed = false;

        setTimeout(() => {
            eventFloatVisible = true;
            eventFloat.classList.add('active');
        }, 2000);

        // Hide when scrolling past hero
        const heroSection = document.querySelector('.hero');
        window.addEventListener('scroll', () => {
            if (eventFloatDismissed) return;
            const heroBottom = heroSection.getBoundingClientRect().bottom;
            if (heroBottom < 0 && eventFloatVisible) {
                eventFloat.classList.remove('active');
            } else if (heroBottom >= 0 && eventFloatVisible) {
                eventFloat.classList.add('active');
            }
        }, { passive: true });

        document.getElementById('event-float-close').addEventListener('click', () => {
            eventFloatDismissed = true;
            eventFloat.classList.remove('active');
            eventFloat.classList.add('hiding');
            setTimeout(() => eventFloat.remove(), 500);
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
