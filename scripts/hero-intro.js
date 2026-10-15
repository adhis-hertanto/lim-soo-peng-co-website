/* Hero load reveal: when the page loads (after the page loader's panel leaves, if it plays), the hero's elements rise and fade in once.
   html.intro (set in the head) hides them until this runs. Plain script (no modules), so it works from file://.
   Off under prefers-reduced-motion and with ?static=1 (the head script never adds the class then).
   Motion sets transform and opacity only, with power3.out and short stagger. Values are in CONFIG. */
(function () {
  var CONFIG = {
    delay: 0.1,          // seconds after the trigger (page ready, or the loader's panel leaving)
    text: { y: 32, duration: 0.9, stagger: 0.14 },
    controls: { y: 16, duration: 0.8 },
    photo: { scaleFrom: 1.08, duration: 1.6 },
    circle: { scaleFrom: 0.9, duration: 1.2 },
    nav: { y: -12, duration: 0.8 }
  };

  var root = document.documentElement;
  if (!root.classList.contains("intro")) return;

  function done() { root.classList.remove("intro"); }

  // Without GSAP, show everything straight away.
  if (!window.gsap) { done(); return; }

  var played = false;
  function play() {
    if (played) return;
    played = true;
    var slide = document.querySelector(".hero__slide.is-active");
    var photo = document.querySelector(".hero__photo.is-active");
    var circle = document.querySelector(".hero__circle--b");
    var nav = document.querySelector(".nav");

    var tl = gsap.timeline({ defaults: { ease: "power3.out" }, delay: CONFIG.delay });
    // gsap.from applies its starting state straight away, so removing the class below cannot flash the content.
    if (slide) {
      tl.from(slide.querySelectorAll(".hero__title, .hero__text"), {
        autoAlpha: 0, y: CONFIG.text.y, duration: CONFIG.text.duration, stagger: CONFIG.text.stagger
      }, 0);
    }
    tl.from(".hero__progress .progress, .hero__scroll", {
      autoAlpha: 0, y: CONFIG.controls.y, duration: CONFIG.controls.duration
    }, 0.5);
    if (photo) tl.from(photo, { scale: CONFIG.photo.scaleFrom, duration: CONFIG.photo.duration, ease: "power2.out" }, 0);
    // The circle fades in with the rest. The scroll curtain moves its wrapper (.hero__deco), so the two never fight.
    if (circle) tl.from(circle, { autoAlpha: 0, scale: CONFIG.circle.scaleFrom, duration: CONFIG.circle.duration }, 0.2);
    if (nav) tl.from(nav, { autoAlpha: 0, y: CONFIG.nav.y, duration: CONFIG.nav.duration }, 0.1);


    done();
  }

  // With the page loader, start as its panel leaves (it fires "pageloader:leave" about half way through the slide).
  // The fallback keeps the hero from staying hidden if the loader ever fails.
  if (root.classList.contains("loading") || root.classList.contains("entering")) {
    document.addEventListener("pageloader:leave", play, { once: true });
    setTimeout(play, 9000);
  } else {
    play();
  }
})();
