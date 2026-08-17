/**
 * 动画管理器 / Animation Manager
 * 使用 GSAP 和 ScrollTrigger 编排页面动画和 3D 场景交互。
 * Orchestrates page animations and 3D scene interactions using GSAP and ScrollTrigger.
 */
export function initAnimations(threeScene, options = {}) {
    const onIntroComplete = typeof options.onIntroComplete === "function" ? options.onIntroComplete : null;
    gsap.registerPlugin(ScrollTrigger);

    const isMobile = window.innerWidth < 768;

    // --- 1. Initial State ---
    // Start as Cloud (morphProgress = 0)
    if (threeScene.setMorphProgress) {
        threeScene.setMorphProgress(0);
    }

    // Initial Position (Fly-in Setup)
    // Start VERY close to camera (high Z) and spread out (high scale)
    // to simulate "flying through" or "emerging from viewer"
    gsap.set(threeScene.mainGroup.position, { z: 20, y: 0, x: 0 }); // Start behind camera or very close
    gsap.set(threeScene.mainGroup.scale, { x: 3, y: 3, z: 3 }); // Start massive
    
    // --- 2. Hero Text Animations (On Load) ---
    const tlHero = gsap.timeline({
        onComplete: () => {
            if (onIntroComplete) onIntroComplete();
        }
    });

    // Mark subtitle immediately since we removed fade-in
    const subtitle = document.querySelector(".hero-subtitle-text");
    if (subtitle) {
        subtitle.classList.add("is-marked");
    }

    // Fly-in Animation: Move from close/big to normal position/scale
    tlHero.to(threeScene.mainGroup.position, {
        z: 0,
        duration: 2.5,
        ease: "power4.out" // Strong ease-out for "whoosh" feeling
    }, 0)
    .to(threeScene.mainGroup.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 2.5,
        ease: "power4.out"
    }, 0);
    
    // Removed text fade-in animations as requested
    // Text is now visible from the start via CSS (or default browser behavior)

    // --- 3. Cloud to Sphere Transformation (Scroll Driven) ---
    // As user scrolls from top of page down past the Hero section,
    // the cloud collapses into the sphere.
    // We extend the duration a bit into the 'Values' section so it feels gradual.
    
    ScrollTrigger.create({
        trigger: "body",
        start: "top top",
        end: "1000px top", // Adjust this pixel value to control how fast it morphs
        scrub: 1,
        onUpdate: (self) => {
            if (threeScene.setMorphProgress) {
                threeScene.setMorphProgress(self.progress);
            }
        }
    });

    // --- 4. Values Section Animations ---
    const valuesTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: "#values",
            start: "top 80%",
            end: "bottom 70%",
            scrub: 0.3
        }
    });

    valuesTimeline
        .from(".values-word--explainable", { opacity: 0, y: 24, duration: 1, ease: "none" })
        .from(".values-word--deterministic", { opacity: 0, y: 24, duration: 1, ease: "none" }, "-=0.2")
        .from(".values-word--geometric", { opacity: 0, y: 24, duration: 1, ease: "none" }, "-=0.2");

    // --- 5. Paradigm Section (Sphere Interaction) ---
    // Maybe rotate the sphere or move it slightly to show it's now a solid object
    gsap.timeline({
        scrollTrigger: {
            trigger: "#paradigm",
            start: "top bottom",
            end: "bottom top",
            scrub: 0.5
        }
    })
    .to(threeScene.mainGroup.rotation, {
        x: 0.2, // Tilt slightly
        duration: 1
    });

    // --- 6. Architecture Section (Move to Side) ---
    // Move the sphere to the side to make room for the diagram
    
    gsap.timeline({
        scrollTrigger: {
            trigger: "#architecture",
            start: "top bottom",
            end: "bottom top", // Keep it on side while scrolling through
            scrub: 0.5,
            invalidateOnRefresh: true
        }
    })
    .to(threeScene.mainGroup.position, {
        x: isMobile ? 0 : 6, // Move right
        y: isMobile ? 0 : 0,
        z: 0,
        ease: "none"
    })
    .to(threeScene.mainGroup.scale, {
        x: isMobile ? 0.6 : 1, // Shrink on mobile?
        y: isMobile ? 0.6 : 1,
        z: isMobile ? 0.6 : 1,
        ease: "none"
    }, "<"); // Run at start

    // --- 7. DOM Element Animations (Fade Ups) ---
    const sections = document.querySelectorAll(".section");
    
    sections.forEach(section => {
        const title = section.querySelector(".section-title");
        const cards = section.querySelectorAll(".paradigm-card, .feature-item, .demo-box");
        
        if (title) {
            gsap.from(title, {
                scrollTrigger: {
                    trigger: section,
                    start: "top 80%"
                },
                y: 50,
                opacity: 0,
                duration: 1,
                ease: "power3.out"
            });
        }

        if (cards.length > 0) {
            gsap.from(cards, {
                scrollTrigger: {
                    trigger: section,
                    start: "top 75%"
                },
                y: 50,
                opacity: 0,
                duration: 0.8,
                stagger: 0.1,
                ease: "power3.out"
            });
        }
    });

    // --- 8. Paper Cards Animation ---
    const paperGrids = document.querySelectorAll(".papers-grid");
    if (paperGrids.length > 0) {
        gsap.set(".paper-card", { y: 100, opacity: 0 });
        
        paperGrids.forEach(grid => {
            const cards = grid.querySelectorAll(".paper-card");
            if (cards.length > 0) {
                gsap.to(cards, {
                    scrollTrigger: {
                        trigger: grid,
                        start: "top 85%",
                        end: "bottom 90%",
                        scrub: 1
                    },
                    y: 0,
                    opacity: 1,
                    stagger: 0.2,
                    ease: "power2.out"
                });
            }
        });
    }

    // --- 9. Architecture Diagram Animation ---
    const diagramTimeline = gsap.timeline({
        scrollTrigger: {
            trigger: "#architecture",
            start: "top 50%",
            end: "bottom 85%",
            scrub: 0.3
        }
    });

    diagramTimeline
        .from(".diagram-layer.system-1", { y: 30, opacity: 0, duration: 1, ease: "none" })
        .from(".diagram-arrow.arrow-1", { opacity: 0, scaleY: 0, transformOrigin: "top center", duration: 0.6, ease: "none" }, "-=0.2")
        .from(".diagram-layer.knowledge", { y: 30, opacity: 0, duration: 1, ease: "none" }, "-=0.15")
        .from(".diagram-arrow.arrow-2", { opacity: 0, scaleY: 0, transformOrigin: "top center", duration: 0.6, ease: "none" }, "-=0.2")
        .from(".diagram-layer.system-2", { y: 30, opacity: 0, duration: 1, ease: "none" }, "-=0.15");
}
