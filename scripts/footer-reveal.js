/* Footer reveal: from 1200px the footer is pinned under the page (CSS sticky) and uncovered as the last section
   scrolls away. This script only supports that:
   - .is-tall when the footer is taller than the viewport, so it stays a normal footer and its top is reachable;
   - when a footer link takes keyboard focus while the footer is still covered, scroll to the end so it is visible;
   - optional polish: the footer content eases from -10% to 0 while it is uncovered (GSAP ScrollTrigger, scrubbed).
   Plain script (no modules), so it works from file://. No polish under prefers-reduced-motion or with ?static=1.
   Every number is in CONFIG. */
(function () {
  var CONFIG = {
    minWidth: 1200,                    // below this the footer is a normal footer (it is taller than the viewport)
    content: { fromYPercent: -10, toYPercent: 0 }
  };

  var footer = document.querySelector(".footer");
  var main = document.querySelector(".page__main");
  var inner = footer && footer.querySelector(".footer__inner");
  if (!footer || !main) return;

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
  var wide = window.matchMedia("(min-width: " + CONFIG.minWidth + "px)");
  var isStatic = new URLSearchParams(window.location.search).get("static") === "1";
  var ctx = null;

  function pinned() {
    return wide.matches && !reduce.matches && !footer.classList.contains("is-tall");
  }

  function build() {
    if (ctx) { ctx.revert(); ctx = null; }
    footer.classList.toggle("is-tall", footer.offsetHeight > window.innerHeight);
    if (!pinned() || isStatic || !inner || !window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    ctx = gsap.context(function () {
      gsap.fromTo(inner,
        { yPercent: CONFIG.content.fromYPercent },
        {
          yPercent: CONFIG.content.toYPercent,
          ease: "none",
          scrollTrigger: {
            trigger: main,
            start: "bottom bottom",                                   // the end of the page begins to lift
            end: function () { return "+=" + footer.offsetHeight; },  // done once the footer is fully uncovered
            scrub: true,
            invalidateOnRefresh: true
          }
        });
    });
  }

  // A covered footer must never hold focus unseen: bring it into view.
  footer.addEventListener("focusin", function () {
    if (!pinned()) return;
    var end = document.documentElement.scrollHeight - window.innerHeight;
    if (window.scrollY < end - 2) {
      if (window.HeroCurtain && window.HeroCurtain.scrollTo) window.HeroCurtain.scrollTo(end);
      else window.scrollTo(0, end);
    }
  });

  var timer = 0;
  window.addEventListener("resize", function () {
    clearTimeout(timer);
    timer = setTimeout(build, 150);
  });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  build();
})();
