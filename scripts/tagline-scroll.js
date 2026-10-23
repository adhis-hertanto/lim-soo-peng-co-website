/* Tagline (Justice, Mercy, Humility): two infinite rows of display words, moving in opposite directions.
   Desktop (1200px and up): scroll-linked, not timed. As the section passes through the viewport, row 1 moves left and
   row 2 moves right, and scrolling back reverses them. GSAP ScrollTrigger drives it, so Lenis (hero-curtain.js) is
   handled the same way as the rest of the page. Each row moves 0.4 of a set's width over the section's full time in view.
   Tablet and mobile (up to 1199px): automatic. Both rows keep moving on their own at AUTO_SPEED, so the loop never stops.
   Offsets wrap with modulo on both paths, so each row loops with no end and no gap.
   Row 2 starts at 0.84 of a set's width (STARTS): chosen so the two rows together show Justice, Mercy and Humility.
   The rows reveal once on entry, like the other sections (scripts/reveal.js).
   Skipped under prefers-reduced-motion and if GSAP fails to load; the static row from the markup stays in view. */
(function () {
  var section = document.querySelector(".tagline");
  if (!section) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  gsap.registerPlugin(ScrollTrigger);

  var rows = Array.prototype.slice.call(section.querySelectorAll(".tagline__row"));
  var setX = rows.map(function (row) { return gsap.quickSetter(row, "x", "px"); });
  var STARTS = [0, 0.84];   // starting offset of each row, as a fraction of one set's width
  var DIRECTION = [-1, 1];  // row 1 left, row 2 right
  var TRAVEL = 0.4;         // desktop: set widths each row moves over the section's time in view
  var AUTO_SPEED = 0.04;    // tablet and mobile: set widths per second (one full set every 25 seconds)
  var setW = 0;
  var scrollTrigger = null; // desktop only

  function measure() {
    setW = rows[0].querySelector(".tagline__set").getBoundingClientRect().width;
  }

  // Each row is three sets wide, so with wrap(-setW, 0) the sets always cover the viewport: setW is at least half the viewport.
  function placeAt(offset) {
    rows.forEach(function (row, i) {
      setX[i](gsap.utils.wrap(-setW, 0, STARTS[i] * setW + DIRECTION[i] * offset * setW));
    });
  }

  // Reveal, as on the rest of the page: the rows rise and fade in once, the first time the section enters.
  gsap.from(rows, {
    autoAlpha: 0,
    y: 32,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.14,
    scrollTrigger: { trigger: section, start: "top 88%", once: true }
  });

  measure();

  var mm = gsap.matchMedia();

  mm.add("(min-width: 1200px)", function () {
    // ScrollTrigger tracks the section's progress; the rows are placed from the frame loop, so every frame reflects the
    // latest progress, including after refreshes and jumps where no onUpdate call is made.
    scrollTrigger = ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "bottom top"
    });
    function tick() { placeAt(scrollTrigger.progress * TRAVEL); }
    gsap.ticker.add(tick);
    return function () {
      gsap.ticker.remove(tick);
      scrollTrigger.kill();
      scrollTrigger = null;
    };
  });

  mm.add("(max-width: 1199px)", function () {
    // gsap.ticker passes seconds since start; the loop is continuous, so no scroll position is needed.
    function tick(time) { placeAt(time * AUTO_SPEED); }
    gsap.ticker.add(tick);
    return function () { gsap.ticker.remove(tick); };
  });

  // Fonts change the set width, so measure again once they are in and whenever ScrollTrigger refreshes (resize, load).
  ScrollTrigger.addEventListener("refresh", function () {
    measure();
    if (scrollTrigger) placeAt(scrollTrigger.progress * TRAVEL);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
})();
