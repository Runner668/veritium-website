# SphNN Seamless Hero Story Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bilingual, deterministic Hero-to-SphNN scroll story that explains necessary reasoning without monkey/grape imagery and releases seamlessly into the existing academic homepage.

**Architecture:** Preserve the current Three.js Hero and its wheel/touch morph. Add a progressive-enhancement SVG story controlled by one labeled GSAP/ScrollTrigger timeline, with canonical localized HTML as the only copy source. `main.js` coordinates initialization, fail-open cleanup, navigation, and the existing sphere's post-story movement; `sphnnStory.js` owns story DOM and ScrollTrigger; `DemoScene` receives one composed page-presentation state.

**Tech Stack:** Static HTML/CSS, ES modules, Three.js r128, GSAP 3.12.2, ScrollTrigger 3.12.2, Node built-in test runner, Playwright CLI browser checks.

**Design spec:** `docs/superpowers/specs/2026-08-25-sphnn-seamless-hero-story-design.md`

---

## File Structure

- Create `js/sphnnStoryData.js`: ordered stage labels, normalized ranges, and pure progress helpers. No localized text.
- Create `js/sphnnStory.js`: story DOM validation, handoff rendering, GSAP timeline, ScrollTrigger lifecycle, static mode, refresh/update, and idempotent destroy.
- Create `js/pagePresentation.js`: browser-independent academic/footer interpolation math.
- Create `js/pageLifecycle.js`: browser-independent restoration, initial-hash, and post-story progress decisions.
- Modify `js/animations.js`: Hero morph progress callback, immediate completion, native-scroll completion, and destroy.
- Modify `js/demoScene.js`: composed academic/footer presentation and reduced-motion freeze.
- Modify `js/main.js`: readiness boundary, progressive enhancement, restoration/hash/navigation/focus behavior, and presentation coordination.
- Modify `de/index.html` and `en/index.html`: canonical localized copy, shared handoff node, identical decorative SVG, ScrollTrigger script, and programmatically focusable target headings.
- Modify `css/style.css`: remove overflow locking; add story, enhanced/static, responsive, and reduced-motion rules.
- Create `tests/sphnn-story-data.test.mjs`: pure range and stage tests.
- Create `tests/sphnn-story-markup.test.mjs`: bilingual semantic/SVG contract tests.
- Create `tests/sphnn-story-controller.test.mjs`: fake-DOM lifecycle, fallback, and destroy tests.
- Create `tests/hero-controller.test.mjs`: Hero morph input and cleanup contract.
- Create `tests/page-presentation.test.mjs`: pure sphere presentation math.
- Create `tests/page-lifecycle.test.mjs`: pure restoration/hash/progress decisions.
- Create `tests/sphnn-browser-check.sh`: real browser forward/reverse/jump/hash/mobile/failure checks through the bundled Playwright CLI wrapper.

---

## Chunk 1: Contracts and Semantic Structure

### Task 1: Define the deterministic story-state contract

**Files:**
- Create: `js/sphnnStoryData.js`
- Create: `tests/sphnn-story-data.test.mjs`

- [ ] **Step 1: Write failing range and stage-order tests**

Assert the exact ordered labels:

```js
[
  'heroHandoff', 'question', 'experimentSetup', 'hideObjects',
  'revealA', 'necessaryConclusion', 'abstraction', 'modelConstruction',
  'excludeA', 'counterexampleAssumption', 'searchA', 'searchB',
  'searchOutside', 'feasibleEmpty', 'restoreConclusion', 'academicHandoff'
]
```

Assert normalized boundaries are monotonic, start at 0, end at 1, and map representative progress values to stable stage keys.

Use this exact half-open range table; only the final range includes `1`:

```js
heroHandoff:              [0.00, 0.04)
question:                 [0.04, 0.10)
experimentSetup:          [0.10, 0.17)
hideObjects:              [0.17, 0.23)
revealA:                  [0.23, 0.29)
necessaryConclusion:      [0.29, 0.36)
abstraction:              [0.36, 0.43)
modelConstruction:        [0.43, 0.50)
excludeA:                 [0.50, 0.56)
counterexampleAssumption: [0.56, 0.62)
searchA:                  [0.62, 0.68)
searchB:                  [0.68, 0.74)
searchOutside:            [0.74, 0.80)
feasibleEmpty:            [0.80, 0.86)
restoreConclusion:        [0.86, 0.92)
academicHandoff:          [0.92, 1.00]
```

`clampStoryProgress()` maps finite values below/above the domain to `0`/`1`; `NaN`, infinities, missing values, and non-numeric inputs map to `0`. `stageForProgress()` clamps first and selects the range whose start is inclusive.

Assert this exact frozen 16-stage-to-10-copy map so every progress value has one active canonical HTML block:

```js
heroHandoff -> question
question -> question
experimentSetup -> experimentSetup
hideObjects -> experimentSetup
revealA -> revealA
necessaryConclusion -> necessaryConclusion
abstraction -> abstraction
modelConstruction -> modelConstruction
excludeA -> modelConstruction
counterexampleAssumption -> counterexampleAssumption
searchA -> counterexampleAssumption
searchB -> counterexampleAssumption
searchOutside -> counterexampleAssumption
feasibleEmpty -> feasibleEmpty
restoreConclusion -> restoreConclusion
academicHandoff -> academicHandoff
```

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/sphnn-story-data.test.mjs`

Expected: FAIL because `js/sphnnStoryData.js` does not exist.

- [ ] **Step 3: Implement the pure data module**

Export:

```js
export const STORY_STAGES = Object.freeze([...]);
export const STORY_RANGES = Object.freeze({...});
export const STORY_COPY_STAGE = Object.freeze({...});
export function clampStoryProgress(value) {...}
export function stageForProgress(value) {...}
export function copyStageForProgress(value) {...}
```

Use the brief's approximate timeline and subdivide the counterexample interval for three placement attempts without changing logical order.

- [ ] **Step 4: Run the test and verify GREEN**

Run: `node --test tests/sphnn-story-data.test.mjs`

Expected: all tests pass.

- [ ] **Step 5: Commit**

```bash
git add js/sphnnStoryData.js tests/sphnn-story-data.test.mjs
git commit -m "test: define SphNN story progress contract"
```

### Task 2: Add canonical bilingual semantic markup

**Files:**
- Modify: `de/index.html`
- Modify: `en/index.html`
- Create: `tests/sphnn-story-markup.test.mjs`

- [ ] **Step 1: Write failing markup tests**

Assert both pages:

- place `#sphnn-reasoning-story` directly after `#hero` and before `#science`;
- omit `homepage` from the static `<body>` class;
- load ScrollTrigger after GSAP;
- contain exactly one localized HTML block for each canonical copy stage;
- contain `#sphnn-handoff-object`, four containers A-D, two boards, two object nodes, disjoint A/B regions, feasible fills, instance `g`, attempt paths, empty-set result, and academic handoff;
- mark the SVG `aria-hidden="true"`;
- mark the visual handoff object/question `aria-hidden="true"` while retaining the equivalent `question` copy block in reading order;
- contain no monkey, grape, mascot, video, or raster animation sequence;
- make the real headings inside `#science` and `#conferences` programmatically focusable with `tabindex="-1"`.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/sphnn-story-markup.test.mjs`

Expected: FAIL because the story markup is absent.

- [ ] **Step 3: Add shared structure and localized copy**

Insert the same structural IDs and `data-story-copy` keys in both pages. Use the exact German and English copy table from the design spec. Keep all copy visible by default and use one semantic set for both animated and static modes.

Use these exact controller hooks in both documents:

```text
#sphnn-reasoning-story
#sphnn-story-stage
#sphnn-handoff-object
#sphnn-handoff-question
[data-story-copy="question|experimentSetup|revealA|necessaryConclusion|abstraction|modelConstruction|counterexampleAssumption|feasibleEmpty|restoreConclusion|academicHandoff"]
#sphnn-story-svg
#sphnn-container-a, #sphnn-container-b, #sphnn-container-c, #sphnn-container-d
#sphnn-board-ab, #sphnn-board-cd
#sphnn-object-ab, #sphnn-object-cd
#sphnn-region-a, #sphnn-region-b
#sphnn-feasible-a, #sphnn-feasible-b
#sphnn-instance-g
#sphnn-constraint-union, #sphnn-constraint-not-a, #sphnn-constraint-not-b
#sphnn-attempt-a, #sphnn-attempt-b, #sphnn-attempt-outside
#sphnn-empty-result
#sphnn-academic-handoff
```

Use simple SVG primitives:

- A/B/C/D as rounded `<rect>` containers;
- opaque board rects painted after containers/objects;
- `clipPath`/mask for object reveal;
- A/B abstract regions as the same A/B rects after attribute animation;
- separate feasible-fill nodes;
- one instance `g`, never a region and never crossed out.

The canonical HTML copy, not the decorative SVG, must also expose readable equivalents of `g ∈ A ∪ B`, `g ∉ A`, and `g ∉ B` inside the relevant model/counterexample blocks.

- [ ] **Step 4: Run markup and existing syntax checks**

Run: `node --test tests/sphnn-story-markup.test.mjs && node --check js/sphnnStoryData.js && xmllint --html --noout de/index.html en/index.html`

The markup test must also reject duplicate IDs and malformed Hero -> story -> science ordering; `xmllint` supplies the independent HTML parse check.

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add de/index.html en/index.html tests/sphnn-story-markup.test.mjs
git commit -m "feat: add bilingual SphNN story structure"
```

### Task 3: Add progressive-enhancement and responsive CSS

**Files:**
- Modify: `css/style.css`
- Test: `tests/sphnn-story-markup.test.mjs`

- [ ] **Step 1: Extend the markup test with CSS contract assertions**

Assert CSS contains:

- no `overflow: hidden` on `body.homepage`;
- default static story flow;
- `.sphnn-story-enhanced` animated-stage rules;
- mobile copy-above-geometry recomposition;
- `prefers-reduced-motion: reduce` rules that restore static presentation and show all copy.

The JavaScript controller, not CSS, owns the `600vh` desktop / `480vh` mobile ScrollTrigger distance and prevents ScrollTrigger creation in reduced-motion mode.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/sphnn-story-markup.test.mjs`

Expected: FAIL on missing CSS contracts.

- [ ] **Step 3: Implement CSS using existing variables**

Keep the existing charcoal texture, Playfair/Inter, ivory, muted gold, and line weights. Use no card container, new background band, neon glow, large red X, or hard transition margin.

Define the handoff object with canonical coordinates:

```css
.sphnn-handoff-object {
  position: fixed;
  left: 72vw;
  top: 46vh;
  transform: translate(-50%, -50%);
  pointer-events: none;
}
@media (max-width: 768px) {
  .sphnn-handoff-object { left: 50vw; top: 42vh; }
}
```

- [ ] **Step 4: Run tests and `git diff --check`**

Run: `node --test tests/*.test.mjs && git diff --check`

Expected: all tests pass; no whitespace errors.

- [ ] **Step 5: Commit**

```bash
git add css/style.css tests/sphnn-story-markup.test.mjs
git commit -m "style: compose seamless SphNN story stage"
```

---

## Chunk 2: Timeline and Lifecycle

### Task 4: Implement the story controller and rollback contract

**Files:**
- Create: `js/sphnnStory.js`
- Create: `tests/sphnn-story-controller.test.mjs`

- [ ] **Step 1: Write failing controller tests with fake DOM/GSAP objects**

Cover:

- missing root or dependency returns a static controller with no enhancement class, all canonical copy visible, and `getScrollEnd()` equal to the story section's rendered document-bottom coordinate;
- successful init exposes `setHeroProgress`, `getProgress`, `getScrollEnd`, `refresh`, `update`, and `destroy`;
- Hero progress below 0.82 leaves content intact, then fades visual content and reveals handoff deterministically;
- `applyStageState(progress)` derives the one active localized copy block from `copyStageForProgress()` for forward, reverse, and direct jumps across all 16 timeline stages; inactive copy blocks are `hidden` only in enhanced mode;
- ownership transfer follows fixed DOM object visible -> fixed object occluded -> both representations invisible -> SVG object becomes identity carrier;
- refresh stores current scroll-derived progress, invalidates function-based viewport/board measurements, and reseeks that same progress immediately;
- destroy is idempotent and restores all copy/classes/styles;
- partial initialization followed by destroy kills timeline/trigger and removes listeners.

- [ ] **Step 2: Run the test and verify RED**

Run: `node --test tests/sphnn-story-controller.test.mjs`

Expected: FAIL because the controller is absent.

- [ ] **Step 3: Implement validation, static mode, and disposer stack**

Build a controller that validates all required nodes before adding enhancement classes. Register every created listener/timeline/trigger in a local disposer stack. `destroy()` drains it in reverse order and can run repeatedly.

Implement `applyStageState(progress)` as the single copy/semantic-state synchronizer. The GSAP timeline owns geometry, while this function updates `hidden` attributes and `data-story-stage` from the same clamped progress for onUpdate, reverse scroll, and direct ScrollTrigger jumps.

- [ ] **Step 4: Build the labeled GSAP timeline**

Use `timeline.addLabel(name, STORY_RANGES[name].start)` and explicit `fromTo`/`to` calls with `ease: 'none'` for scroll-owned state. Animate:

- Hero handoff object to the board anchor;
- fixed handoff ownership crossfade only while the board fully occludes both the fixed and SVG object;
- A-D and boards;
- A lift and B reveal;
- C/D removal;
- A/B rect attributes into disjoint regions;
- feasible fill `A ∪ B → B → ∅`;
- controlled `g` attempts in A, B, and outside;
- counter-assumption removal and B restoration;
- clean 2D academic composition.

Create ScrollTrigger with ID `sphnn-story`, `scrub: true`, `pin: true`, `pinSpacing: true`, `anticipatePin: 1`, `invalidateOnRefresh: true`, and an end function of approximately `+=600vh` desktop / `+=480vh` at `max-width: 768px`. All board/handoff coordinates are function-based. On refresh, preserve and immediately reseek the scroll-derived progress so resize/orientation cannot produce a visible jump.

- [ ] **Step 5: Run controller and data tests**

Run: `node --test tests/sphnn-story-data.test.mjs tests/sphnn-story-controller.test.mjs`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/sphnnStory.js tests/sphnn-story-controller.test.mjs
git commit -m "feat: implement deterministic SphNN story timeline"
```

### Task 5: Extend the existing Hero controller safely

**Files:**
- Modify: `js/animations.js`
- Create: `tests/hero-controller.test.mjs`

- [ ] **Step 1: Add failing Hero-controller contract tests**

Test `onMorphProgress`, `completeImmediately()`, `animateToSphere()`, and idempotent `destroy()`. Verify the controller intercepts wheel/single-touch only while `homepage` input capture is active and never handles keyboard events.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/hero-controller.test.mjs`

Expected: FAIL on missing API.

- [ ] **Step 3: Implement minimal API changes**

Report displayed progress after every morph update. `completeImmediately()` sets target/displayed/scene progress to one synchronously. `destroy()` cancels rAF and removes wheel/touch listeners. Remove reliance on CSS overflow locking.

- [ ] **Step 4: Run tests and syntax check**

Run: `node --test tests/hero-controller.test.mjs && node --check js/animations.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/animations.js tests/hero-controller.test.mjs
git commit -m "refactor: expose deterministic Hero morph lifecycle"
```

### Task 6: Add composed Three.js page presentation

**Files:**
- Create: `js/pagePresentation.js`
- Modify: `js/demoScene.js`
- Create: `tests/page-presentation.test.mjs`

- [ ] **Step 1: Add failing pure presentation assertions**

Test a browser-independent helper that confirms:

- `academicWeight = 0` preserves the existing Hero presentation;
- `academicWeight = 1, contentProgress = 0` reaches the responsive academic anchor;
- story progress `0.00 -> 0.12` maps canvas opacity `1 -> 0`, reasoning progress `0.12 -> 0.92` keeps opacity `0`, and `academicHandoff` progress `0.92 -> 1.00` maps opacity `0 -> 1`;
- scene scroll progress stays frozen at `0` for the entire pinned story and only post-story `contentProgress` advances the sphere toward the footer;
- story reasoning freezes at the academic anchor;
- post-story content progress begins from the same anchor;
- content progress one reaches the existing footer target;
- reduced motion applies state immediately and freezes time-driven rotation/shimmer.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/page-presentation.test.mjs`

Expected: FAIL on missing presentation API/helper.

- [ ] **Step 3: Implement `setPagePresentation` and `setReducedMotion`**

Implement pure interpolation and the exact canvas-opacity/frozen-scene schedule in `js/pagePresentation.js`, then consume it from `demoScene.js`. `academicWeight` blends the existing Hero pose into one responsive academic anchor; `contentProgress` continues from that exact anchor to the existing footer target. Preserve uniform sphere scale. In reduced motion, stop time-driven material/rotation changes and snap supplied presentation values. `demoScene.js` remains the only canvas renderer, while `main.js` remains the only presentation coordinator.

- [ ] **Step 4: Run tests and syntax check**

Run: `node --test tests/page-presentation.test.mjs && node --check js/pagePresentation.js && node --check js/demoScene.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/pagePresentation.js js/demoScene.js tests/page-presentation.test.mjs
git commit -m "feat: coordinate sphere with academic handoff"
```

### Task 7: Coordinate bootstrap, restoration, navigation, and cleanup

**Files:**
- Create: `js/pageLifecycle.js`
- Modify: `js/main.js`
- Create: `tests/page-lifecycle.test.mjs`

- [ ] **Step 1: Add failing bootstrap contract tests**

Cover pure helpers for post-story progress, already-fired/future `pageshow` readiness, initial-hash selection, and Hero input ownership. Assert reverse-order cleanup of partial controllers without leaving `homepage`/enhancement classes.

Test leave-top, return-top, initial-hash, and reduced-motion ownership cases. Returning to `scrollY <= 2` may re-enable Hero input capture and reconnect `setHeroProgress()` only when no content hash/reduced-motion state forbids it and the Hero morph is not already complete.

Test the exact initial content-hash sequence: initialize story pinning -> refresh -> complete Hero immediately -> keep input capture disabled -> `scrollIntoView({ block: 'start' })` -> ScrollTrigger update. Test ordinary restored-scroll initialization separately.

- [ ] **Step 2: Run test and verify RED**

Run: `node --test tests/page-lifecycle.test.mjs`

Expected: FAIL on missing bootstrap behavior.

- [ ] **Step 3: Implement main coordination**

Import `initSphNNStory`. Use `js/pageLifecycle.js` for a readiness promise that resolves for both a future `pageshow` and the case where `pageshow` already occurred, then always waits two animation frames before capturing restored scroll. Initialize/refresh story, restore scroll, then enable Hero input capture only at the top without a content hash.

On native keyboard/scrollbar movement away from top, complete the Hero immediately and release input capture. When native scroll returns to the top, restore Hero ownership only under the tested eligibility conditions. Route every actual `homepage` input-capture class transition through one helper that schedules a requestAnimationFrame followed by story refresh/update. On same-page navigation, complete Hero, refresh the pinned layout, scroll to target, focus its heading, and update ScrollTrigger. On pageshow, visibility, resize, and orientation events, refresh/update per the spec.

Compute Three.js presentation only in `main.js` from story progress, story end, and remaining document progress. Use explicit success ownership: collect disposers as each controller succeeds, drain them in reverse order only on failure or teardown, and never dispose successful initialization from `finally`.

- [ ] **Step 4: Run unit and syntax checks**

Run: `node --test tests/page-lifecycle.test.mjs && node --check js/pageLifecycle.js && node --check js/main.js`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/pageLifecycle.js js/main.js tests/page-lifecycle.test.mjs
git commit -m "feat: connect Hero story and page lifecycle"
```

---

## Chunk 3: Browser Verification and Polish

### Task 8: Add real-browser deterministic regression checks

**Files:**
- Create: `tests/sphnn-browser-check.sh`
- Modify if required by findings: `js/sphnnStory.js`, `js/main.js`, `js/animations.js`, `js/demoScene.js`, `css/style.css`, `de/index.html`, `en/index.html`

- [ ] **Step 1: Write the browser check before visual tuning**

Use `/Users/feng/.codex/skills/playwright/scripts/playwright_cli.sh` after asserting `command -v npx`. The script must:

- select a free loopback port with Python, launch `python3 -m http.server` in the background, store its PID, and install an EXIT/INT/TERM trap before any browser call;
- poll the localized page with bounded `curl --max-time` attempts and fail clearly if readiness is not reached;
- create one named Playwright CLI session, close it in the trap, and enforce a total shell timeout;
- assign the trigger ID `sphnn-story` and expose a shell `seek_story(progress)` helper that reads `window.ScrollTrigger.getById('sphnn-story').start/end`, scrolls to `start + progress * (end - start)`, waits two animation frames plus one `ScrollTrigger.update()`, and only then asserts state;
- write temporary screenshots beneath a `mktemp -d` directory and remove that directory in the trap; copy only intentionally reviewed final images to `output/playwright/` outside automated verification.

Verify:

- normal top load is enhanced and initially captures only wheel/touch;
- Hero morph still reaches the sphere;
- keyboard PageDown/native `window.scrollTo` leaves the top and yields a valid story state;
- handoff object, boards, hidden object, A lift, B reveal, disjoint model, feasible reduction, each `g` attempt, empty set, restored B, academic handoff, and pin release at representative progress values;
- reverse scroll and direct scrollbar jumps render correct state;
- initial `#science` and `#conferences` land at the correct post-pin targets;
- same-page navigation focuses the target heading without a second scroll, while Hero CTA links remain focusable at every visual opacity;
- inactive canonical copy blocks have `hidden`, and static/reduced modes expose every block;
- `destroy()` removes pin spacers and restores static copy;
- 390x844 mobile has no horizontal overflow and uses copy-above-geometry;
- reduced motion shows sequential copy and no pin;
- blocked ScrollTrigger, no JavaScript, and injected initialization exception remain scrollable with static copy;
- reload at a mid-story scroll position, bfcache-style `pageshow`, resize, and orientation refresh preserve scroll-derived state without a jump.

- [ ] **Step 2: Run the check and verify failures identify incomplete behavior**

Run: `bash tests/sphnn-browser-check.sh`

Expected before fixes: one or more targeted assertions fail.

- [ ] **Step 3: Fix only browser-observed contract gaps**

Keep changes scoped. Do not add new visual concepts.

- [ ] **Step 4: Run full verification**

Run:

```bash
node --test tests/*.test.mjs
node --check js/main.js
node --check js/animations.js
node --check js/sphnnStoryData.js
node --check js/sphnnStory.js
node --check js/demoScene.js
bash tests/sphnn-browser-check.sh
git diff --check
```

Expected: all commands exit zero.

- [ ] **Step 5: Commit**

```bash
git add tests/sphnn-browser-check.sh
# Add only the exact implementation files changed by observed failures.
git commit -m "test: verify seamless SphNN scroll story"
```

### Task 9: Perform screenshot-based visual acceptance

**Files:**
- Modify only if required: `css/style.css`, `de/index.html`, `en/index.html`, `js/sphnnStory.js`
- Generated for manual inspection only: `output/playwright/*.png`

- [ ] **Step 1: Capture required desktop and mobile states**

Capture question, containers covered, A lifted, B conclusion, model construction, attempt A/B/outside, empty feasible set, restored conclusion, academic handoff, and mobile model/search states.

- [ ] **Step 2: Inspect every screenshot**

Reject any frame with:

- hard background boundary or blank gap;
- duplicate containers;
- object visible through a board;
- overlapping A/B regions;
- `g` in an intersection or crossed out;
- copy/geometry/nav/cookie overlap;
- giant red X, neon glow, cartoon styling, or generic AI motif;
- stretched geometry or mobile overflow;
- pin-release jump or duplicate academic heading.

- [ ] **Step 3: Tune only timing, spacing, opacity, and line weight**

Do not change the approved logical sequence or add 3D effects.

- [ ] **Step 4: Re-run full verification and inspect final diff**

Run the complete Task 8 command set plus:

```bash
git status --short
git diff --stat a842221..HEAD
git diff --check
```

After inspection, remove generated screenshots or leave them intentionally ignored so `git status --short` reports only deliberate source changes.

- [ ] **Step 5: Commit final polish**

If visual tuning changed tracked files, stage only those exact files and commit them as `style: refine SphNN reasoning continuity`. If no tracked visual tuning was required, record the acceptance result and skip the empty commit.
