/**
 * First-screen animation only. The homepage intentionally contains no
 * scroll-driven content beyond the hero, so there are no section triggers.
 */
export function initAnimations(threeScene, options = {}) {
    const onIntroComplete = typeof options.onIntroComplete === 'function'
        ? options.onIntroComplete
        : null;

    if (threeScene.setMorphProgress) {
        threeScene.setMorphProgress(0);
    }

    const subtitle = document.querySelector('.hero-subtitle-text');
    if (subtitle) subtitle.classList.add('is-marked');

    if (typeof gsap === 'undefined' || !threeScene.mainGroup) {
        if (onIntroComplete) onIntroComplete();
        return;
    }

    const timeline = gsap.timeline({
        onComplete: onIntroComplete || undefined
    });

    gsap.set(threeScene.mainGroup.position, { z: 20, y: 0, x: 0 });
    gsap.set(threeScene.mainGroup.scale, { x: 3, y: 3, z: 3 });

    timeline
        .to(threeScene.mainGroup.position, {
            z: 0,
            duration: 2.5,
            ease: 'power4.out'
        }, 0)
        .to(threeScene.mainGroup.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 2.5,
            ease: 'power4.out'
        }, 0);
}
