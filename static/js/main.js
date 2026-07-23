/* ============================================================
   main.js — page entry point. Collects DOM elements, wires the
   scene-graph viewer and the two teaching widgets, and turns on
   the generic page behaviors.

   This is the only file that queries the DOM by id/selector and
   `new`s up the composition roots; every class it touches
   (OBN.*) is independently defined in its own file and knows
   nothing about this bootstrap.
============================================================ */
(function () {
  "use strict";

  const OBN = window.OBN;

  function bootSceneGraph() {
    const els = {
      stage: document.getElementById("sg-stage"),
      canvas: document.getElementById("sg-canvas"),
      tooltip: document.getElementById("sg-tooltip"),
      hint: document.getElementById("sg-hint"),
      fallback: document.getElementById("sg-fallback"),
      spreadInput: document.getElementById("spread"),
      clearBtn: document.getElementById("sg-clear"),
      queryChips: document.querySelectorAll(".q-chip")
    };

    const panel = new OBN.EvidencePanel(
      document.getElementById("sg-panel-title"),
      document.getElementById("sg-panel-body"),
      els.clearBtn
    );

    const data = OBN.SceneGraphData;
    const showFallback = reason => {
      const reasonEl = document.getElementById("sg-fallback-reason");
      if (reasonEl && reason) reasonEl.textContent = reason;
      els.fallback.classList.add("show");
      panel.showDefault({
        rooms: Object.keys(data.ROOMS).length,
        objectNodes: data.OBJECTS.length,
        observationsKept: data.OBJECTS.reduce((s, o) => s + o.obs, 0)
      });
    };

    if (!window.THREE) {
      showFallback("Couldn't load the 3D engine (three.js failed to load).");
      return;
    }

    // failIfMajorPerformanceCaveat:false explicitly opts into a software-rendered
    // (SwiftShader) context on devices without usable GPU acceleration — some
    // Chrome builds refuse WebGL entirely unless a page asks for this.
    const CONTEXT_ATTRS = { failIfMajorPerformanceCaveat: false, antialias: true, alpha: true };
    let webglOk = false;
    try {
      const testCanvas = document.createElement("canvas");
      webglOk = !!(
        testCanvas.getContext("webgl2", CONTEXT_ATTRS) ||
        testCanvas.getContext("webgl", CONTEXT_ATTRS) ||
        testCanvas.getContext("experimental-webgl", CONTEXT_ATTRS)
      );
    } catch (e) { webglOk = false; }
    if (!webglOk) {
      showFallback("Your browser or device doesn't support WebGL.");
      return;
    }

    try {
      const retrieval = new OBN.RetrievalEngine(data);
      // eslint-disable-next-line no-new
      new OBN.SceneGraphViewer(els, data, panel, retrieval);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("OpenBelief-Nav scene graph failed to initialize:", err);
      showFallback("The interactive scene graph hit an error — see the browser console for details.");
    }
  }

  function bootBeliefLab() {
    new OBN.BeliefLabWidget({
      obsList: document.getElementById("obs-list"),
      conceptRows: document.getElementById("concept-rows"),
      verdict: document.getElementById("lab-verdict"),
      playBtn: document.getElementById("lab-play"),
      resetBtn: document.getElementById("lab-reset"),
      consolidateToggle: document.getElementById("lab-consolidate"),
      alphaSlider: document.getElementById("lab-alpha"),
      alphaLabel: document.getElementById("lab-alpha-v")
    });
  }

  function bootCorrectionStepper() {
    new OBN.CorrectionStepper({
      robot: document.getElementById("ep-robot"),
      cand1: document.getElementById("cand1"),
      cand2: document.getElementById("cand2"),
      cand1Label: document.getElementById("cand1-label"),
      cand2Label: document.getElementById("cand2-label"),
      path1: document.getElementById("path1"),
      path2: document.getElementById("path2"),
      xMarkA: document.getElementById("x1a"),
      xMarkB: document.getElementById("x1b"),
      label: document.getElementById("ep-label"),
      title: document.getElementById("ep-title"),
      body: document.getElementById("ep-body"),
      pipsBox: document.getElementById("ep-pips"),
      prevBtn: document.getElementById("ep-prev"),
      nextBtn: document.getElementById("ep-next")
    });
  }

  function bootPageBehaviors() {
    const B = OBN.PageBehaviors;
    B.initRevealOnScroll();
    B.initTableBarAnimation();
    B.initNavActiveState([
      "scenegraph", "overview", "method", "belief-lab",
      "correction", "results", "realworld", "bibtex"
    ]);
    B.initLightbox(document.getElementById("lightbox"), document.getElementById("lightbox-img"));
    B.initCopyButton(document.getElementById("copy-bib"), document.getElementById("bib-text"));
  }

  document.addEventListener("DOMContentLoaded", () => {
    bootSceneGraph();
    bootBeliefLab();
    bootCorrectionStepper();
    bootPageBehaviors();
  });
})();
