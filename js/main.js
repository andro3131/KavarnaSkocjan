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

    // ============ NAVBAR SCROLL BEHAVIOR ============

    const navbar = document.getElementById('navbar');

    function handleNavScroll() {
        navbar.classList.toggle('scrolled', window.scrollY > 50);
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });
    handleNavScroll();

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

    document.querySelectorAll('.section, .menu-card, .contact-item, .gallery-item').forEach(el => {
        el.classList.add('animate-on-scroll');
        observer.observe(el);
    });

});
