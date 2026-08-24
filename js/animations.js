/**
 * First-screen animation only. While the homepage is locked to one viewport,
 * the mouse wheel and touch swipe control the particle field's cloud-to-sphere
 * progress. Completing the sphere or clicking a section link unlocks native
 * page scrolling.
 */
export function initAnimations(threeScene, options = {}) {
    const onIntroComplete = typeof options.onIntroComplete === 'function'
        ? options.onIntroComplete
        : null;
    const onSphereComplete = typeof options.onSphereComplete === 'function'
        ? options.onSphereComplete
        : null;

    if (threeScene.setMorphProgress) {
        threeScene.setMorphProgress(0);
    }

    const subtitle = document.querySelector('.hero-subtitle-text');
    if (subtitle) subtitle.classList.add('is-marked');

    if (typeof gsap === 'undefined' || !threeScene.mainGroup) {
        if (onIntroComplete) onIntroComplete();
        return {
            animateToSphere: (onComplete) => {
                if (typeof onComplete === 'function') onComplete();
            }
        };
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
    // Slow the first-screen morph another 50% on top of the previous
    // reduction so the cloud-to-sphere transition unfolds even more gently.
    const wheelProgressScale = 0.0003;
    // Touch swipes use a slightly higher scale because mobile deltaY values
    // tend to be larger than the per-tick deltas a mouse wheel reports.
    const touchProgressScale = 0.0015;
    let activeTouchId = null;
    let lastTouchY = null;
    let pendingSphereCompletion = null;

    const animateMorph = () => {
        displayedProgress += (targetProgress - displayedProgress) * 0.09;
        if (threeScene.setMorphProgress) threeScene.setMorphProgress(displayedProgress);

        if (Math.abs(targetProgress - displayedProgress) > 0.001) {
            animationFrame = window.requestAnimationFrame(animateMorph);
        } else {
            displayedProgress = targetProgress;
            animationFrame = null;

            if (pendingSphereCompletion && displayedProgress >= 1) {
                const onComplete = pendingSphereCompletion;
                pendingSphereCompletion = null;
                onComplete();
            }
        }
    };

    const animateToSphere = (onComplete) => {
        pendingSphereCompletion = typeof onComplete === 'function' ? onComplete : null;
        targetProgress = 1;

        if (displayedProgress >= 1) {
            const complete = pendingSphereCompletion;
            pendingSphereCompletion = null;
            if (complete) complete();
            return;
        }

        if (animationFrame === null) animationFrame = window.requestAnimationFrame(animateMorph);
    };

    const onWheel = (event) => {
        // Once the user has entered the page content, native scrolling takes
        // over and this listener becomes a no-op.
        if (!document.body.classList.contains('homepage')) return;
        if (event.ctrlKey) return;

        const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1;
        const delta = event.deltaY * unit;

        // The first downward gesture after the sphere is complete hands
        // control back to the browser so the page can begin scrolling.
        if (delta > 0 && targetProgress >= 1) {
            pendingSphereCompletion = null;
            if (onSphereComplete) onSphereComplete();
            // Apply this same wheel delta immediately; otherwise the browser
            // has already decided not to scroll while the homepage was locked.
            event.preventDefault();
            window.scrollBy(0, delta);
            return;
        }

        event.preventDefault();

        targetProgress = Math.max(0, Math.min(1, targetProgress + delta * wheelProgressScale));

        if (animationFrame === null) animationFrame = window.requestAnimationFrame(animateMorph);
    };

    const onTouchStart = (event) => {
        if (!document.body.classList.contains('homepage')) return;
        if (event.touches.length !== 1) return;
        const touch = event.touches[0];
        activeTouchId = touch.identifier;
        lastTouchY = touch.clientY;
    };

    const onTouchMove = (event) => {
        if (!document.body.classList.contains('homepage')) {
            activeTouchId = null;
            lastTouchY = null;
            return;
        }
        if (activeTouchId === null) return;
        const touch = Array.from(event.touches).find((t) => t.identifier === activeTouchId);
        if (!touch) {
            activeTouchId = null;
            lastTouchY = null;
            return;
        }
        if (lastTouchY === null) {
            lastTouchY = touch.clientY;
            return;
        }
        // Match the wheel direction convention: scrolling down advances the morph.
        const delta = lastTouchY - touch.clientY;
        lastTouchY = touch.clientY;

        if (delta > 0 && targetProgress >= 1) {
            activeTouchId = null;
            lastTouchY = null;
            pendingSphereCompletion = null;
            if (onSphereComplete) onSphereComplete();
            return;
        }

        targetProgress = Math.max(0, Math.min(1, targetProgress + delta * touchProgressScale));
        if (animationFrame === null) animationFrame = window.requestAnimationFrame(animateMorph);
    };

    const onTouchEnd = (event) => {
        const remaining = Array.from(event.touches || []).some((t) => t.identifier === activeTouchId);
        if (!remaining) {
            activeTouchId = null;
            lastTouchY = null;
        } else {
            const touch = Array.from(event.touches).find((t) => t.identifier === activeTouchId);
            lastTouchY = touch ? touch.clientY : null;
        }
    };

    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd, { passive: true });
    window.addEventListener('touchcancel', onTouchEnd, { passive: true });

    return { animateToSphere };
}
