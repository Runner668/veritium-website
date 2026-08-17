import { DemoScene } from './demoScene.js';
import { initAnimations } from './animations.js';

document.addEventListener('DOMContentLoaded', () => {
    const mobileButton = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    const closeMobileMenu = () => {
        if (!mobileButton || !navLinks) return;
        mobileButton.classList.remove('active');
        navLinks.classList.remove('active');
        document.body.style.overflow = '';
    };

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
    initAnimations(threeScene, { onIntroComplete: () => {} });

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        console.info('Reduced motion preference detected.');
    }
});
