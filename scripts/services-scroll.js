/* What we do: one pinned, scrubbed GSAP ScrollTrigger timeline. The section pins for eight viewport heights.
   1. The entry photo starts as a small rectangle in the middle of the stage (it scrolls into view in the flow, as the About
      cards end) and grows to full bleed, with its wash fading in.
   2. The one-liner fades in, centred, over it, then fades out before the services start.
   3. One service per photo: each photo rises from the bottom. As it rises, the previous service's circle fades out and
      the next one fades in, on the left.
   The pin releases after the third service. Built with gsap.matchMedia, so it is torn down and rebuilt at each breakpoint
   and removed under prefers-reduced-motion. Without GSAP, or with reduced motion, the section stays stacked (see the CSS). */
(function () {
  var section = document.querySelector("[data-services]");
  if (!section) return;
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var MOTION = "(prefers-reduced-motion: no-preference)";
  var DISTANCE = 8;                              // scroll distance in viewport heights; the timeline spans the same 8 units
  var FRAME = "inset(36% 38% 36% 38%)";          // the entry photo as a small rectangle in the middle of the stage
  var FULL = "inset(0% 0% 0% 0%)";
  var HIDDEN_BOTTOM = "inset(100% 0% 0% 0%)";    // clipped away from the bottom, so the reveal rises from the bottom
  var BEAT_START = 2.9;                          // timeline position of the first service
  var BEAT_GAP = 1.5;                            // timeline units between services: each one holds for about 1.5 viewport heights, as the intro does

  var trigger = null;                            // the live ScrollTrigger (null until built, and under reduced motion)
  var listeners = [];                            // scroll callbacks registered through window.ServicesScroll.onUpdate

  var stage = section.querySelector(".services__stage");
  var entry = section.querySelector("[data-entry]");
  var entryImg = entry.querySelector("img");
  var shade = entry.querySelector(".services__shade");
  var line = section.querySelector("[data-line]");
  var beats = Array.prototype.slice.call(section.querySelectorAll("[data-beat]"));
  var rows = Array.prototype.slice.call(section.querySelectorAll("[data-service]"));

  function build() {
    section.classList.add("is-pinned");

    var tl = gsap.timeline({
      defaults: { ease: "power2.inOut" },
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: function () { return "+=" + window.innerHeight * DISTANCE; },
        pin: stage,
        scrub: true,
        invalidateOnRefresh: true,   // recalculates the distance on resize and when fonts load
        anticipatePin: 1,
        onUpdate: function () { listeners.forEach(function (fn) { fn(); }); }
      }
    });

    // 1. Entry: the frame grows to full bleed, the photo settles from 112% to 100%, the wash fades in over it.
    tl.fromTo(entry, { clipPath: FRAME }, { clipPath: FULL, duration: 1.1 }, 0);
    tl.fromTo(entryImg, { scale: 1.12 }, { scale: 1, duration: 1.1 }, 0);
    tl.fromTo(shade, { opacity: 0.4 }, { opacity: 1, duration: 1.1 }, 0);

    // 2. One-liner, centred over the full-bleed photo, gone before the first service.
    tl.fromTo(line, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5 }, 1.0);
    // The one-liner holds for about 1.5 viewport heights of scroll before it goes.
    tl.to(line, { opacity: 0, duration: 0.25 }, 2.6);

    // 3. One service per photo. Each photo rises from the bottom; as it arrives, the previous service's text
    //    fades out and the next one fades in, with its divider drawn and its name revealed from the bottom.
    beats.forEach(function (beat, i) {
      var at = BEAT_START + i * BEAT_GAP;
      var row = rows[i];
      tl.fromTo(beat, { clipPath: HIDDEN_BOTTOM }, { clipPath: FULL, duration: 0.6 }, at);
      // The service text fades in as its image masks up, and the previous service's text fades out with it.
      if (i > 0) tl.to(rows[i - 1], { opacity: 0, duration: 0.6 }, at);
      tl.fromTo(row, { opacity: 0 }, { opacity: 1, duration: 0.6 }, at);
    });

    // The last service holds for about 1.5 viewport heights, then the pin releases.
    tl.to({}, { duration: 0 }, DISTANCE);

    trigger = tl.scrollTrigger;

    // Returned to gsap.matchMedia, which runs it when the query stops matching (breakpoint change or reduced motion).
    return function () { trigger = null; section.classList.remove("is-pinned"); };
  }

  // Read by cursor.js, so the timeline positions live here only. Stops are timeline positions: the entry one-liner fully
  // visible (2) and each service (BEAT_START + i * BEAT_GAP).
  window.ServicesScroll = {
    section: section,
    stage: stage,
    distance: DISTANCE,
    entryStop: 2,
    firstService: BEAT_START,
    stops: [2].concat(beats.map(function (b, i) { return BEAT_START + i * BEAT_GAP; })),
    trigger: function () { return trigger; },
    onUpdate: function (fn) { listeners.push(fn); }
  };

  var mm = gsap.matchMedia();
  mm.add("(min-width: 768px) and " + MOTION, build);
  mm.add("(max-width: 767px) and " + MOTION, build);

  // Images load after the script runs, which moves the pin points: measure again once the page has loaded.
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
