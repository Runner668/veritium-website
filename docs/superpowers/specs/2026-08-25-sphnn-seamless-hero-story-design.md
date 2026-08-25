# Veritium SphNN Seamless Hero Story Design

## Status

Approved direction supplied by the user in the implementation brief. This document maps that direction onto commit `a842221` of the current static site.

## Existing Architecture

- Static bilingual pages live at `de/index.html` and `en/index.html`.
- The Hero uses a fixed Three.js canvas implemented by `js/demoScene.js`.
- `js/animations.js` converts wheel and touch input into deterministic cloud-to-sphere morph progress while the body has the `homepage` class.
- Native page scrolling begins only after the sphere is complete.
- GSAP 3.12.2 is already loaded globally. ScrollTrigger is not currently loaded.
- The existing academic content begins at `#science`, followed by `#conferences`.
- The current visual system is dark charcoal texture, ivory type, muted gold, Playfair Display, and Inter.

## Design Decision

Keep the Hero implementation and its interaction model. Add a separate SVG story section immediately between the Hero and `#science`, but make the Hero, story, and academic content look continuous.

Use GSAP and ScrollTrigger for one labeled, scrubbed master timeline for the native-scroll story. Use SVG for all reasoning geometry. Do not extend the Three.js scene into the explanation.

Hero morph progress and story scroll progress are two consecutive deterministic domains:

- `js/animations.js` owns only the existing Hero particle morph while Hero input capture is active and reports displayed morph progress through `onMorphProgress(progress)`.
- The ScrollTrigger timeline owns the story only after native scrolling begins.
- `js/sphnnStory.js` is the sole DOM owner of the handoff object. `main.js` forwards Hero morph progress to `storyController.setHeroProgress(progress)` before the story starts; the ScrollTrigger timeline takes over that same controller at the trigger start. Ownership returns to `setHeroProgress` only when native scroll returns to the top and Hero input capture resumes.

Use one real fixed DOM node, `#sphnn-handoff-object`, from the final Hero morph through the first experiment movement. When it becomes fully occluded by the A/B board, crossfade to the SVG's internal A/B object while both are invisible. The SVG object then remains the identity carrier through `g` and the counterexample search. This isolates WebGL from SVG without a visible identity break.

## Hero Handoff

`js/animations.js` will expose displayed morph progress through an `onMorphProgress` callback. During progress 0.82-1.00:

- Hero title, subtitle, CTA, and SCROLL cue recede without being removed.
- A minimal gold handoff point and the first question appear in the existing Hero composition.
- The background, texture, navigation, and canvas remain unchanged.
- Reversing the morph restores the original Hero deterministically.

The fixed handoff object uses a canonical viewport coordinate rather than an element inside the scrolling Hero: desktop `72vw / 46vh`, mobile `50vw / 42vh`. CSS media queries define those coordinates. It remains fixed while native scroll brings the immediately adjacent story to its pin start. There is no blank transition section. At story progress 0.17-0.28, the same node moves to an SVG anchor behind the A/B board and disappears under the opaque board. The internal SVG object takes over only while both are hidden.

The canonical Hero coordinate is recalculated only from current viewport dimensions and never from the Hero's scrolled `getBoundingClientRect()`. The SVG board target is derived from its current bounding rectangle. On ScrollTrigger refresh, resize, or orientation change, the story timeline invalidates function-based coordinates and immediately seeks back to the current scroll-derived progress, preventing a visible jump.

## Story Structure

Add `SphNNReasoningStory` markup to both localized homepages:

- real HTML copy with one active short text block per stage;
- one decorative `aria-hidden` SVG;
- a static reduced-motion explanation;
- a final academic handoff heading inside the story stage.

The desktop ScrollTrigger pins the story stage for approximately 600vh. Mobile uses approximately 480vh and a recomposed copy-above-geometry layout. The trigger starts at `story top = viewport top`, pins the stage with `pinSpacing: true`, and ends at the configured scroll distance. The story section follows the 100vh Hero directly with no margin, spacer, or extra handoff band before the pin.

The master timeline labels are:

1. `heroHandoff`
2. `question`
3. `experimentSetup`
4. `hideObjects`
5. `revealA`
6. `necessaryConclusion`
7. `abstraction`
8. `modelConstruction`
9. `excludeA`
10. `counterexampleAssumption`
11. `searchA`
12. `searchB`
13. `searchOutside`
14. `feasibleEmpty`
15. `restoreConclusion`
16. `academicHandoff`

All critical story state derives from timeline progress. Use `scrub: true`, not a smoothing duration, so a scrollbar jump seeks the exact corresponding state. No timers, autoplay clocks, or mutable stage counters are used.

## Geometry and Semantics

The physical scene contains exactly four containers and two boards. The original containers remain behind the boards; no duplicate set appears. One gold object belongs to A/B and a second to C/D. Both are actually occluded while the boards are down.

Container A lifts far enough to expose an empty footprint. The A/B object is then revealed inside B.

During abstraction:

- C and D fade away early;
- the existing A and B container shapes animate into two disjoint rounded regions;
- the A/B gold object becomes instance `g`;
- the feasible fill begins in both A and B.

Applying `g ∉ A` removes A's feasible fill and subdues its outline. B remains feasible.

Counterexample search introduces `g ∉ B`, then moves `g` through three controlled attempts:

- inside A, rejected by `g ∉ A`;
- inside B, rejected by the counter-assumption `g ∉ B`;
- outside both regions, rejected by `g ∈ A ∪ B`.

No large red X and no strike-through on `g` are used. The feasible fill reduces visually from `A ∪ B` to `B` to `∅`. Removing the counter-assumption restores B, and `g` settles inside it.

## Academic Handoff

At the end of the same timeline:

- process labels and constraints fade;
- clean A/B geometry remains in 2D;
- the heading `Sphere Neural Networks` and subtitle `A geometric approach to machine reasoning.` enter;
- the existing Three.js sphere crossfades back in at the same right-side composition while the SVG geometry fades;
- the pin releases directly into the existing `#science` section without a gap or background change.

The heading exists only inside the final pinned story state. It scrolls out naturally when the pin releases; `#science` retains its existing localized `Scientific Foundation` heading and starts immediately after the ScrollTrigger pin spacer. There is no duplicate academic bridge section.

Navigation links still complete the existing Hero sphere morph before scrolling to their original targets. Direct navigation may bypass the story; ScrollTrigger immediately seeks its end state from the resulting scroll position.

## Existing Three.js Canvas Contract

Adding a 480-600vh pinned story must not retime the existing sphere's journey to the footer.

- Before the story trigger starts, the canvas remains in its existing Hero state.
- During story progress 0.00-0.12, the WebGL canvas fades out while its sphere remains frozen at `setScrollProgress(0)`.
- During the reasoning stages, the canvas stays frozen and invisible.
- During `academicHandoff`, the canvas fades back in at the same restrained right-side composition as the outgoing SVG geometry.
- After the story trigger ends, `main.js` maps scroll progress from `trigger.end` to the document's maximum scroll and blends continuously from the academic anchor into the existing footer path.

The story controller exposes `getScrollEnd()` and `getProgress()` so `main.js` can apply this mapping without measuring the whole story on every scroll event. In static/reduced-motion mode, `getScrollEnd()` returns the rendered story section's document-bottom coordinate rather than a ScrollTrigger end value.

`main.js` is the sole coordinator of all Three.js presentation values. The story timeline never writes to `DemoScene` or the canvas. On scroll/update, `main.js` reads story progress and post-story progress, computes canvas opacity and academic/normal-path weights, and calls one new API: `DemoScene.setPagePresentation({ academicWeight, contentProgress, immediate })`.

The DemoScene render loop only applies the supplied presentation state. Position is one interpolation from the responsive academic anchor to the existing footer target using `contentProgress`. At the pin end the state is `{ academicWeight: 1, contentProgress: 0 }`; the first post-story update begins from that exact position, so no second owner or centered-origin jump exists. This API adds no geometry or separate 3D effect. Version 1 adds no depth treatment beyond reusing the existing sphere.

## Localization

The stage-copy map is fixed for Version 1:

| Stage | German | English |
| --- | --- | --- |
| question | Kann KI tatsächlich schlussfolgern? / Beginnen wir mit einem einfachen Problem. | Can AI actually reason? / Let us begin with a simple problem. |
| experimentSetup | Ein Objekt befindet sich in A oder B. / Ein weiteres befindet sich in C oder D. | One object is in A or B. / Another object is in C or D. |
| revealA | A ist leer. / Wo muss sich das Objekt befinden? | A is empty. / Where must the object be? |
| necessaryConclusion | Es muss in B sein. / Nicht nur wahrscheinlich. / Notwendig. | It must be in B. / Not merely probable. / Necessary. |
| abstraction | Kann KI dasselbe tun? / Sphere Neural Networks können das. | Can AI do the same? / Sphere Neural Networks can. |
| modelConstruction | MODELLKONSTRUKTION / SphNN konstruiert ein Modell dessen, was wahr sein könnte. / Das Objekt muss in A oder B sein. / A ist leer. | MODEL CONSTRUCTION / SphNN constructs a model of what could be true. / The object must be in A or B. / A is empty. |
| counterexampleAssumption | GEGENBEISPIELSUCHE / Anstatt B einfach zu akzeptieren, versucht SphNN, die Schlussfolgerung zu widerlegen. / Nehmen wir an, g ist nicht in B. | COUNTEREXAMPLE SEARCH / Instead of simply accepting B, SphNN tries to refute the conclusion. / Assume g is not in B. |
| feasibleEmpty | Kein konsistentes Modell existiert. / Kein Gegenbeispiel lässt sich konstruieren. | No consistent model exists. / No counterexample can be constructed. |
| restoreConclusion | Daher muss g in B liegen. / Nicht nur wahrscheinlich. / Notwendig. | Therefore g must be in B. / Not merely probable. / Necessary. |
| academicHandoff | Das ist das grundlegende Schlussfolgerungsprinzip von SphNN. | This is the fundamental reasoning principle of SphNN. |

The small formulas are fixed as `g ∈ A ∪ B`, `g ∉ A`, and `g ∉ B`. Technical labels are localized as shown above.

## Reduced Motion and Failure Mode

Animated markup is progressive enhancement. The HTML body does not contain the `homepage` state class. The static sequential explanation is visible and native scrolling is enabled by default. `main.js` adds the state and enhancement classes only after GSAP, ScrollTrigger, the Hero scene, and story targets initialize successfully and initial scroll restoration has been observed.

The `homepage` class no longer applies `overflow: hidden`. It marks only that wheel and single-touch input still belongs to the existing Hero morph controller. Wheel and touch listeners may prevent their own events while the morph is incomplete, but the document itself remains natively scrollable. Keyboard scrolling, scrollbar dragging, assistive technology, and browser scroll restoration are never intercepted. If native scroll leaves the top while the Hero morph is incomplete, `main.js` completes the morph immediately, removes the Hero state class, and updates ScrollTrigger from the resulting scroll position.

When `prefers-reduced-motion: reduce` is active:

- the Hero scene is set immediately to its completed sphere state, Hero text remains fully readable, continuous rotation/shimmer is disabled through `threeScene.setReducedMotion(true)`, and Hero input capture is not enabled;
- the pinned animation is disabled;
- a static sequential explanation shows experiment, model, counter-assumption, empty feasible set, and conclusion;
- all academic content remains in normal document flow.

The static story controller reports its rendered bottom as the story-end boundary. `main.js` maps the remaining document scroll after that boundary into `setPagePresentation({ ..., immediate: true })`. The sphere does not interpolate, rotate, or shimmer; presentation changes follow scroll position without an independent animation clock, so the extra static story height does not retime the footer endpoint.

`main.js` owns one readiness/error boundary around Three.js construction, story initialization, and Hero animation initialization. Both animation controllers expose idempotent `destroy()` methods. `sphnnStory.destroy()` kills its timeline and ScrollTrigger, removes pin spacing through ScrollTrigger teardown, unregisters lifecycle listeners, restores all story copy, resets the handoff object, and removes enhancement classes. If any dependency, import, constructor, or initialization step fails, `main.js` calls available disposers in reverse creation order, never enables Hero input capture, restores Hero content styles, and leaves the semantic story in static flow.

## Restoration and Jump Contract

- Bootstrap always waits for `pageshow` and then two animation frames before reading restored `scrollY`. If `pageshow` occurred before module bootstrap, it still waits two frames from bootstrap. It stores the restored numeric scroll position before adding pin spacing.
- On initial load without a hash, initialize the story, call `ScrollTrigger.refresh()`, restore the captured numeric scroll position, wait one frame, call `ScrollTrigger.update()`, and only enable Hero input capture when the restored position is `<= 2`.
- On an initial `#science` or `#conferences` hash, initialize and refresh the pinned layout first, complete the Hero morph without animation, keep Hero input capture disabled, explicitly call `target.scrollIntoView({ block: 'start' })`, then call `ScrollTrigger.update()`.
- Navigation smooth-scroll uses the existing Hero completion path; ScrollTrigger derives the story end state from the resulting scroll position.
- On `pageshow`, including bfcache restoration, call refresh and update.
- When the document becomes visible after a tab switch, call update.
- On resize or orientation change, request one animation frame, invalidate timeline measurements, then refresh and update.
- After every Hero input-capture state change, request one frame and call refresh/update so pin and handoff measurements cannot remain stale.
- ScrollTrigger's progress is the sole source of story state after initialization; no saved stage index is restored.

## Accessibility

- All explanatory content is HTML.
- SVG is decorative and `aria-hidden="true"`.
- The localized HTML stage blocks are the only copy source. Enhanced mode marks inactive blocks `hidden`; static and reduced-motion modes show the same blocks sequentially. There is no duplicated fallback copy.
- The visual fixed handoff question is `aria-hidden`; its equivalent canonical stage block remains in the story's semantic reading order.
- Hero CTA links, headings, and supporting text remain in the accessibility tree and tab order at every morph opacity. The visual handoff never hides the currently focused element.
- Activating a Hero or navigation section link completes the Hero morph, scrolls to the target, and moves focus to that section's programmatically focusable heading without a second scroll. Reverse morphing never changes `document.activeElement`.
- Native keyboard and scrollbar scrolling are always preserved. Native wheel and touch scrolling resume after the existing Hero morph completes.
- No keyboard event is intercepted for story control.
- Contrast follows the current ivory/gold/charcoal system.

## Performance

- SVG transform, opacity, stroke, mask, clip-path, and attribute animation only.
- No video, raster sequence, additional WebGL scene, or per-frame layout framework state.
- Geometry measurements are refreshed on ScrollTrigger refresh/resize, not continuously in scroll handlers.

## Module Boundaries

- `js/animations.js`: existing Hero input and morph controller; adds `onMorphProgress` and immediate completion. It never owns the story DOM.
- `js/sphnnStoryData.js`: pure normalized ranges and timeline labels only; it contains no localized copy.
- `js/sphnnStory.js`: sole handoff-object DOM owner, SVG timeline factory, ScrollTrigger lifecycle, static fallback activation, and `setHeroProgress()` / `getScrollEnd()` / `getProgress()`.
- `js/main.js`: one readiness/error boundary, bootstrap coordination, navigation/hash handling, reduced-motion branch, and remapped Three.js post-story scroll progress.
- `js/demoScene.js`: adds the single page-presentation API and reduced-motion behavior to the existing sphere only.
- `css/style.css`: existing visual system plus story, responsive, enhanced, fallback, and reduced-motion rules.
- `de/index.html` and `en/index.html`: the canonical localized semantic copy and identical decorative SVG contracts.

## Verification

- Static contract tests for bilingual markup, copy, IDs, disjoint regions, absence of monkey/grape content, and reduced-motion fallback.
- Unit tests for ordered timeline labels and normalized stage ranges.
- Browser checks for Hero morph preservation, matched handoff, pinning, forward/reverse/fast scroll, scrollbar jumps, mobile composition, no horizontal overflow, and academic release.
- Failure-path browser checks for no JavaScript, blocked GSAP/ScrollTrigger, initialization exceptions, initial content hashes, reload mid-story, and bfcache/pageshow restoration.
- Lifecycle checks assert that partial initialization followed by `destroy()` leaves no ScrollTrigger, pin spacer, listener, hidden copy block, modified Hero presentation style, or state/enhancement class.
- Accessibility checks assert one canonical localized copy set, correct inactive-block `hidden` state, persistent Hero-link focusability, target-heading focus after same-page navigation, and native keyboard scrolling.
- Visual screenshots at question, reveal B, model construction, empty feasible region, restored conclusion, academic handoff, and mobile layout.
