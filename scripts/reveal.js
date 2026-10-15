/* Scroll reveals (GSAP + ScrollTrigger). Each element rises a short distance and fades in once as it enters the
   viewport. Timing follows entrance practice: 0.7 to 1.1s, power3.out (fast start, soft landing), distances of
   16 to 48px, a 140ms stagger between siblings (up to five steps), no bounce, transform and opacity only, and no reverse.
   Skipped: the footer, the hero, About and What We Do, which have their own scroll choreography (see about-reveal.js,
   scroll-steps.js and hero-carousel.js). The first What We Do slide (Litigation) reveals once, on first arrival. Skipped under prefers-reduced-motion, and if GSAP fails to load,
   so content is always visible. */
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);

  // Blocks that reveal as one unit. Anything inside them is covered by the block.
  var BLOCKS = [
    { sel: "h2, h3", y: 32, dur: 0.9 },
    { sel: "p", y: 24, dur: 0.8 },
    { sel: "ul > li", y: 24, dur: 0.8 },
    { sel: ".btn, .cta", y: 16, dur: 0.7 },
    { sel: "figure, .photo", y: 48, dur: 1.1 },
    { sel: ".card, .lawyer, .contact__block, .accordion__item", y: 32, dur: 0.9 },
    { sel: ".map-wrap__circle", y: 0, dur: 1, scale: 0.9 }
  ];
  var SKIP = "section.hero, section.about, section.practice, .nav, .site-header, dialog, .sprite, .statement";
  var ALL = BLOCKS.map(function (b) { return b.sel; }).join(", ");

  var roots = Array.prototype.slice.call(document.querySelectorAll("main > section")).filter(function (el) {
    return !el.matches(SKIP);
  });

  var seen = new Set();
  roots.forEach(function (root) {
    BLOCKS.forEach(function (block) {
      var stepIndex = new Map(); // siblings in the same parent stagger in order
      Array.prototype.forEach.call(root.querySelectorAll(block.sel), function (el) {
        if (seen.has(el) || el.closest(SKIP)) return;
        // Skip anything nested inside another block that already reveals, so each element moves once.
        var outer = el.parentElement && el.parentElement.closest(ALL);
        if (outer && root.contains(outer)) return;
        seen.add(el);

        var parent = el.parentElement;
        var i = stepIndex.get(parent) || 0;
        stepIndex.set(parent, i + 1);

        gsap.from(el, {
          autoAlpha: 0,
          y: block.y,
          scale: block.scale || 1,
          duration: block.dur,
          ease: "power3.out",
          delay: Math.min(i, 5) * 0.14,
          scrollTrigger: {
            trigger: el,
            start: "top 88%",
            once: true
          }
        });
      });
    });
  });

  // What We Do, first slide (Litigation): plays once, the first time the section comes into view.
  // The slide itself is shown and hidden by scroll-steps.js, so only its contents are animated here.
  var litigation = document.querySelectorAll('.steps [data-step="1"] .eyebrow, .steps [data-step="1"] .step__title, .steps [data-step="1"] .step__body, .steps [data-step="1"] .step__photo');
  if (litigation.length) {
    gsap.from(Array.prototype.slice.call(litigation), {
      autoAlpha: 0,
      y: 32,
      duration: 0.9,
      ease: "power3.out",
      stagger: 0.14,
      scrollTrigger: {
        trigger: ".steps",
        start: "top 75%",
        once: true
      }
    });
  }

  // Layout can shift after fonts and images load: recalculate trigger positions.
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
