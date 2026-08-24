import { DemoScene } from './demoScene.js';
import { initAnimations } from './animations.js';

document.addEventListener('DOMContentLoaded', () => {
    const mobileButton = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    const body = document.body;
    let hasLeftTop = false;
    let animationControls = null;

    const closeMobileMenu = () => {
        if (!mobileButton || !navLinks) return;
        mobileButton.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
    };

    const unlockHomepage = (target = null) => {
        if (body.classList.contains('homepage')) {
            // Keep the first screen's wheel/touch morph until the sphere is
            // complete or the user explicitly chooses a content link.
            body.classList.remove('homepage');
            hasLeftTop = false;
        }

        if (target) {
            window.requestAnimationFrame(() => {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    };

    const sectionLinks = document.querySelectorAll('a[href^="#science"], a[href^="#conferences"]');
    sectionLinks.forEach((link) => {
        link.addEventListener('click', (event) => {
            const target = document.querySelector(link.getAttribute('href'));
            if (!target) return;

            event.preventDefault();
            closeMobileMenu();

            const navigate = () => unlockHomepage(target);
            if (animationControls) {
                animationControls.animateToSphere(navigate);
            } else {
                navigate();
            }
        });
    });

    window.addEventListener('scroll', () => {
        if (body.classList.contains('homepage')) return;

        if (window.scrollY > 2) {
            hasLeftTop = true;
            return;
        }

        // Re-lock only after the user has genuinely entered the page and then
        // returned to the top, avoiding a lock during the initial smooth jump.
        if (hasLeftTop) {
            hasLeftTop = false;
            body.classList.add('homepage');
            window.scrollTo(0, 0);
        }
    }, { passive: true });

    if (mobileButton && navLinks) {
        mobileButton.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            mobileButton.classList.toggle('active', isOpen);
            document.body.style.overflow = isOpen ? 'hidden' : '';
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', closeMobileMenu);
        });
    }

    const threeScene = new DemoScene('canvas-container');
    animationControls = initAnimations(threeScene, {
        onIntroComplete: () => {},
        onSphereComplete: () => unlockHomepage()
    });

    const updateSceneScroll = () => {
        const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
        const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0;
        threeScene.setScrollProgress(progress);
    };

    window.addEventListener('scroll', updateSceneScroll, { passive: true });
    window.addEventListener('resize', updateSceneScroll);
    updateSceneScroll();

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.info('Reduced motion preference detected.');
    }
});
