/**
 * First-screen animation only. The homepage stays locked to one viewport;
 * the mouse wheel controls the particle field's cloud-to-sphere progress.
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

    let targetProgress = 0;
    let displayedProgress = 0;
    let animationFrame = null;
    // Reduce wheel sensitivity so the first-screen morph unfolds more slowly.
    const wheelProgressScale = 0.0006;

    const animateMorph = () => {
        displayedProgress += (targetProgress - displayedProgress) * 0.09;
        if (threeScene.setMorphProgress) threeScene.setMorphProgress(displayedProgress);

        if (Math.abs(targetProgress - displayedProgress) > 0.001) {
            animationFrame = window.requestAnimationFrame(animateMorph);
        } else {
            displayedProgress = targetProgress;
            animationFrame = null;
        }
    };

    const onWheel = (event) => {
        // The homepage has no scrollable content: use the wheel as the
        // interaction while preventing the browser's native page movement.
        if (event.ctrlKey) return;
        event.preventDefault();

        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
        const delta = event.deltaY * unit;
        targetProgress = Math.max(0, Math.min(1, targetProgress + delta * wheelProgressScale));

        if (animationFrame === null) animationFrame = window.requestAnimationFrame(animateMorph);
    };

    window.addEventListener('wheel', onWheel, { passive: false });
}
