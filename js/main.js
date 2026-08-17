
import { DemoScene } from './demoScene.js';
import { initAnimations } from './animations.js';
import { initI18n } from './i18n.js';

/**
 * Main Entry Point
 * Initializes smooth scroll (Lenis), 3D Scene, and Animations.
 */

document.addEventListener('DOMContentLoaded', () => {
    initI18n();
    // 1. Initialize Smooth Scroll (Lenis)
    // Adjusted for faster response, less "lag" feeling
    const lenis = new Lenis({
        duration: 0.8, // Reduced from 1.2
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Keep smooth easing
        direction: 'vertical',
        gestureDirection: 'vertical',
        smooth: true,
        mouseMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
    });

    // 7. Nav Brand Click (Scroll to Top)
    const navBrand = document.querySelector('.nav-brand');
    if (navBrand) {
        navBrand.addEventListener('click', (e) => {
            e.preventDefault();
            lenis.scrollTo(0);
        });
    }

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const nav = document.querySelector('.nav');
    const compactClassName = 'nav--compact';
    const compactThreshold = 120;
    const activeClassName = 'is-active';
    const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
    const navLinkSections = navLinks
        .map((link) => {
            const targetId = link.getAttribute('href');
            if (!targetId) return null;
            const section = document.querySelector(targetId);
            if (!section) return null;
            return { link, section };
        })
        .filter(Boolean);

    const updateNavState = (scrollY) => {
        if (!nav) return;
        if (scrollY > compactThreshold) {
            nav.classList.add(compactClassName);
        } else {
            nav.classList.remove(compactClassName);
        }
    };

    const updateActiveNavLink = () => {
        if (navLinkSections.length === 0) return;
        const focusLine = window.scrollY + window.innerHeight * 0.35;
        let current = null;

        for (const item of navLinkSections) {
            const top = item.section.offsetTop;
            const bottom = top + item.section.offsetHeight;
            if (focusLine >= top && focusLine < bottom) {
                current = item;
                break;
            }
        }
        
        // If no current section found but scrolled to top, set first item active
        if (!current && window.scrollY < 100) {
             // current = navLinkSections[0];
        }

        navLinks.forEach((link) => link.classList.remove(activeClassName));
        document.querySelectorAll('.dropdown-trigger').forEach(trigger => trigger.classList.remove(activeClassName));

        if (current) {
            current.link.classList.add(activeClassName);
            
            // If the active link is inside a dropdown, highlight the dropdown trigger
            const parentNavItem = current.link.closest('.nav-item');
            if (parentNavItem) {
                const trigger = parentNavItem.querySelector('.dropdown-trigger');
                if (trigger) {
                    trigger.classList.add(activeClassName);
                }
            }
        } else if (navLinkSections.length > 0) {
            // Default to first item if no section is active
            // navLinkSections[0].link.classList.add(activeClassName);
        }
    };

    updateNavState(window.scrollY);
    updateActiveNavLink();
    window.addEventListener('scroll', () => {
        updateNavState(window.scrollY);
        updateActiveNavLink();
    });
    window.addEventListener('resize', updateActiveNavLink);

    // Mobile Menu Toggle
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navLinksContainer = document.querySelector('.nav-links');
    
    if (mobileBtn && navLinksContainer) {
        mobileBtn.addEventListener('click', () => {
            mobileBtn.classList.toggle('active');
            navLinksContainer.classList.toggle('active');
            
            // Optional: Toggle body scroll lock
            if (navLinksContainer.classList.contains('active')) {
                document.body.style.overflow = 'hidden';
                lenis.stop();
            } else {
                document.body.style.overflow = 'auto';
                lenis.start();
            }
        });

        // Close menu when a link is clicked
        const links = navLinksContainer.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', () => {
                if (window.getComputedStyle(mobileBtn).display !== 'none') {
                    mobileBtn.classList.remove('active');
                    navLinksContainer.classList.remove('active');
                    document.body.style.overflow = 'auto';
                    lenis.start();
                }
            });
        });
    }

    // 2. Initialize 3D Scene
    const threeScene = new DemoScene('canvas-container');

    // 3. Initialize Animations (GSAP)
    // We pass the threeScene instance so GSAP can control it
    initAnimations(threeScene, {
        onIntroComplete: () => {}
    });

    // 4. Handle "Reduce Motion" preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mediaQuery.matches) {
        // Disable Lenis
        lenis.destroy();
        // Pause Three.js loop or simplify
        // (In a real app, we might stop the requestAnimationFrame in ThreeScene)
        console.log("Reduced motion detected: Animations simplified.");
    }

    // 5. Founder Slider
    const slides = document.querySelectorAll('.founder-slide');
    const dots = document.querySelectorAll('.slider-dot');
    let currentSlide = 0;
    let slideInterval;

    if (slides.length > 0) {
        const showSlide = (index) => {
            slides.forEach(slide => slide.classList.remove('active'));
            dots.forEach(dot => dot.classList.remove('active'));
            
            if(slides[index]) slides[index].classList.add('active');
            if(dots[index]) dots[index].classList.add('active');
            currentSlide = index;
        };

        const nextSlide = () => {
            let next = (currentSlide + 1) % slides.length;
            showSlide(next);
        };

        let isHovering = false;

        const startSlideShow = () => {
            if (slides.length > 1 && !isHovering) {
                // Clear any existing interval to avoid multiples
                clearInterval(slideInterval);
                slideInterval = setInterval(nextSlide, 10000);
            }
        };

        const stopSlideShow = () => {
            clearInterval(slideInterval);
        };

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                stopSlideShow();
                showSlide(index);
                startSlideShow();
            });
        });

        // Pause on hover
        const sliderContainer = document.querySelector('.founder-slider');
        if (sliderContainer) {
            sliderContainer.addEventListener('mouseenter', () => {
                isHovering = true;
                stopSlideShow();
            });
            sliderContainer.addEventListener('mouseleave', () => {
                isHovering = false;
                startSlideShow();
            });
        }

        // Auto-start only when in view
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    startSlideShow();
                } else {
                    stopSlideShow();
                }
            });
        }, { threshold: 0.2 });

        const founderSection = document.getElementById('founder');
        if (founderSection) {
            observer.observe(founderSection);
        }
    }

    // 6. Modal Logic
    const modals = document.querySelectorAll('.modal');
    const triggers = document.querySelectorAll('.legal-trigger');
    const closeButtons = document.querySelectorAll('.close-modal');

    triggers.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const modalId = trigger.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            if (modal) {
                modal.style.display = "block";
                // Prevent body scroll and pause Lenis
                document.body.style.overflow = "hidden";
                lenis.stop();
                
                // Re-enable scroll for modal content specifically
                // This is needed because Lenis might capture wheel events globally
                const modalContent = modal.querySelector('.modal-body');
                if (modalContent) {
                    modalContent.onwheel = (e) => e.stopPropagation();
                    modalContent.ontouchmove = (e) => e.stopPropagation();
                }
            }
        });
    });

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => {
                modal.style.display = "none";
            });
            document.body.style.overflow = "auto";
            lenis.start();
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = "none";
            document.body.style.overflow = "auto";
            lenis.start();
        }
    });

    // 8. Back to Top Button
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        const toggleBackToTop = () => {
            if (window.scrollY > window.innerHeight) {
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        };

        window.addEventListener('scroll', toggleBackToTop);
        // Also check on init
        toggleBackToTop();

        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            lenis.scrollTo(0);
        });
    }
});
