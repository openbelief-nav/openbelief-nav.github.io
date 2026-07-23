/* ============================================================
   page-behaviors.js — generic, content-agnostic page chrome:
   scroll-reveal, table bar-chart animation, sticky-nav active
   state, image lightbox, and BibTeX copy.

   Each behavior is a standalone function that wires exactly one
   concern from a CSS selector. None of them know about the
   scene graph or the widgets, and main.js only calls the ones a
   given page actually needs.
============================================================ */
(function (global) {
  "use strict";

  function initRevealOnScroll(selector = ".reveal") {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("visible"); io.unobserve(en.target); }
      });
    }, { threshold: .12 });
    document.querySelectorAll(selector).forEach(el => io.observe(el));
  }

  function initTableBarAnimation(cardSelector = ".tbl-card", barSelector = ".cellbar .bar i") {
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          en.target.querySelectorAll(barSelector).forEach(b => { b.style.width = b.dataset.w + "%"; });
          io.unobserve(en.target);
        }
      });
    }, { threshold: .2 });
    document.querySelectorAll(cardSelector).forEach(el => io.observe(el));
  }

  function initNavActiveState(sectionIds, navLinkSelector = ".nav-links a") {
    const navLinks = [...document.querySelectorAll(navLinkSelector)];
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) {
          navLinks.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + en.target.id));
        }
      });
    }, { rootMargin: "-30% 0px -60% 0px" });
    sectionIds.forEach(id => { const el = document.getElementById(id); if (el) io.observe(el); });
  }

  function initLightbox(lightboxEl, imgEl, triggerSelector = "img.zoomable") {
    document.querySelectorAll(triggerSelector).forEach(img => {
      img.addEventListener("click", () => {
        imgEl.src = img.src;
        lightboxEl.classList.add("open");
      });
    });
    lightboxEl.addEventListener("click", () => lightboxEl.classList.remove("open"));
    document.addEventListener("keydown", e => { if (e.key === "Escape") lightboxEl.classList.remove("open"); });
  }

  /** Chrome only exposes navigator.clipboard in secure contexts (https/localhost),
   *  not when a page is opened via file:// — fall back to a hidden-textarea copy. */
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise((resolve, reject) => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy") ? resolve() : reject(new Error("execCommand copy failed"));
      } catch (err) {
        reject(err);
      } finally {
        document.body.removeChild(ta);
      }
    });
  }

  function initCopyButton(buttonEl, sourceEl) {
    buttonEl.addEventListener("click", () => {
      copyText(sourceEl.textContent).then(() => {
        buttonEl.textContent = "Copied ✓";
        buttonEl.classList.add("done");
        setTimeout(() => { buttonEl.textContent = "Copy"; buttonEl.classList.remove("done"); }, 1800);
      }).catch(() => {
        buttonEl.textContent = "Select & copy manually";
        setTimeout(() => { buttonEl.textContent = "Copy"; }, 2200);
      });
    });
  }

  global.OBN = global.OBN || {};
  global.OBN.PageBehaviors = {
    initRevealOnScroll,
    initTableBarAnimation,
    initNavActiveState,
    initLightbox,
    initCopyButton
  };
})(window);
