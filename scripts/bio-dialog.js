/* Lawyer bio dialog: native <dialog> opened with showModal(), so focus moves in and the page behind is inert.
   Esc, a backdrop click, the close button or Back closes it, and focus returns to the plus button.
   The page does not scroll while it is open. On mobile the bottom sheet can be dragged down to close. */
(function () {
  var html = document.documentElement;
  var mobile = window.matchMedia("(max-width: 767px)");
  var openers = Array.prototype.slice.call(document.querySelectorAll("[aria-haspopup='dialog'][aria-controls]"));

  function enableDrag(dialog) {
    var grip = dialog.querySelector("[data-grip]");
    if (!grip) return;
    var startY = null, dy = 0;
    grip.addEventListener("pointerdown", function (e) {
      if (!mobile.matches) return;
      startY = e.clientY; dy = 0;
      grip.setPointerCapture(e.pointerId);
      dialog.classList.add("is-dragging");
    });
    grip.addEventListener("pointermove", function (e) {
      if (startY === null) return;
      dy = Math.max(0, e.clientY - startY);
      dialog.style.translate = "0 " + dy + "px";
    });
    function end() {
      if (startY === null) return;
      startY = null;
      dialog.classList.remove("is-dragging");
      if (dy > dialog.offsetHeight / 4) dialog.close();
      else dialog.style.translate = "";
    }
    grip.addEventListener("pointerup", end);
    grip.addEventListener("pointercancel", end);
  }

  openers.forEach(function (button) {
    var dialog = document.getElementById(button.getAttribute("aria-controls"));
    if (!dialog || typeof dialog.showModal !== "function") return;

    button.addEventListener("click", function () {
      dialog.showModal();
      html.classList.add("is-locked");
      dialog.scrollTop = 0;
      dialog.focus(); // the dialog itself, so the mobile sheet does not jump to the Back button
    });

    dialog.addEventListener("close", function () {
      html.classList.remove("is-locked");
      dialog.style.translate = "";
      button.focus();
    });

    // Keep Tab inside the dialog (native modals let it reach the browser UI).
    dialog.addEventListener("keydown", function (e) {
      if (e.key !== "Tab") return;
      var items = Array.prototype.filter.call(dialog.querySelectorAll("a[href], button:not([disabled])"), function (el) {
        return el.offsetParent !== null;
      });
      if (!items.length) return;
      var first = items[0], last = items[items.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { last.focus(); e.preventDefault(); }
      else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
    });

    dialog.addEventListener("click", function (e) {
      if (e.target.closest("[data-close]")) { dialog.close(); return; }
      if (e.target !== dialog) return;
      var r = dialog.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) dialog.close();
    });

    enableDrag(dialog);
  });
})();
