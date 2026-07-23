/* ============================================================
   scene-graph-viewer.js — composition root for the interactive
   hero: wires OrbitController (camera), SceneGraphBuilder
   (geometry), EvidencePanel (side panel), and RetrievalEngine
   (query resolution) together with picking, hover, and the
   query-chip / spread-slider controls.

   Each collaborator above is independently defined and doesn't
   know this class exists; SceneGraphViewer only coordinates
   them, so swapping any one piece (e.g. a different picking
   strategy, a different panel renderer) doesn't require
   touching the others.
============================================================ */
(function (global) {
  "use strict";

  class SceneGraphViewer {
    /**
     * @param {object} els DOM elements: stage, canvas, tooltip, hint,
     *   spreadInput, clearBtn, queryChips (NodeList)
     * @param {{ROOMS:object, OBJECTS:object[]}} data
     * @param {import('./evidence-panel.js').EvidencePanel} panel
     * @param {import('./retrieval-engine.js').RetrievalEngine} retrieval
     */
    constructor(els, data, panel, retrieval) {
      this.els = els;
      this.data = data;
      this.panel = panel;
      this.retrieval = retrieval;
      this.reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      this.renderer = new THREE.WebGLRenderer({
        canvas: els.canvas, antialias: true, alpha: true,
        // Matches the detection check in main.js: allow a software-rendered
        // context rather than refusing to render on GPU-constrained devices.
        failIfMajorPerformanceCaveat: false
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

      this.scene = new THREE.Scene();
      this.scene.fog = new THREE.Fog(0x0A1122, 26, 46);
      this.camera = new THREE.PerspectiveCamera(40, 1, 0.1, 120);

      this.builder = new global.OBN.SceneGraphBuilder(this.scene, data);

      const orbitTarget = new THREE.Vector3(0, 1.9, 0);
      this.orbit = new global.OBN.OrbitController(els.canvas, this.camera, orbitTarget, {
        autoRotate: !this.reducedMotion
      });
      this.orbit.onFirstInteract(() => els.hint.classList.add("fade"));
      this.orbit.onHover((x, y) => this._handleHover(x, y));
      this.orbit.onTap((x, y) => this._handleTap(x, y));

      this._raycaster = new THREE.Raycaster();
      this._mouse = new THREE.Vector2();
      this._hoveredId = null;
      this._selectedId = null;
      /** @type {{query:string, winnerId:string|null}|null} */
      this._activeQuery = null;

      this._bindSpreadSlider();
      this._bindQueryChips();
      this._bindClearButton();
      this._bindResize();

      this.panel.showDefault(this._summary());
      this._startLoop();
    }

    _summary() {
      return {
        rooms: Object.keys(this.data.ROOMS).length,
        objectNodes: this.data.OBJECTS.length,
        observationsKept: this.data.OBJECTS.reduce((s, o) => s + o.obs, 0)
      };
    }

    _bindSpreadSlider() {
      this.els.spreadInput.addEventListener("input", e => {
        this.builder.setSpread(e.target.value / 100);
      });
    }

    _bindClearButton() {
      this.els.clearBtn.addEventListener("click", () => this._clearSelection(true));
    }

    _bindQueryChips() {
      const chips = [...this.els.queryChips];
      chips.forEach(chip => {
        chip.addEventListener("click", () => {
          const query = chip.dataset.q;
          const alreadyActive = chip.classList.contains("active");
          chips.forEach(c => c.classList.remove("active"));

          if (alreadyActive) { this._clearSelection(true); return; }

          chip.classList.add("active");
          this._selectedId = null;
          this._runQuery(query);
        });
      });
      this._chips = chips;
    }

    _runQuery(query) {
      const result = this.retrieval.resolve(query);
      this._activeQuery = { query, winnerId: result.winnerId };

      if (result.winnerId) {
        this.builder.placeGoalRingNear(result.winnerId);
        this._goalActive = true;
      } else {
        this._goalActive = false;
        this.builder.goalRing.material.opacity = 0;
      }

      this.panel.showQueryResult(result, this.data.ROOMS);
      this._refreshHighlights();
    }

    _clearSelection(resetPanel) {
      this._activeQuery = null;
      this._goalActive = false;
      this.builder.goalRing.material.opacity = 0;
      this._chips.forEach(c => c.classList.remove("active"));
      if (resetPanel) {
        this._selectedId = null;
        this.panel.showDefault(this._summary());
      }
      this._refreshHighlights();
    }

    _pick(clientX, clientY) {
      const r = this.els.canvas.getBoundingClientRect();
      this._mouse.x = ((clientX - r.left) / r.width) * 2 - 1;
      this._mouse.y = -((clientY - r.top) / r.height) * 2 + 1;
      this._raycaster.setFromCamera(this._mouse, this.camera);
      const hits = this._raycaster.intersectObjects(this.builder.pickables);
      return hits.length ? hits[0].object.userData.objId : null;
    }

    _handleHover(clientX, clientY) {
      const id = this._pick(clientX, clientY);
      if (id !== this._hoveredId) {
        this._hoveredId = id;
        this.els.canvas.style.cursor = id ? "pointer" : "grab";
        this._refreshHighlights();
      }
      if (id) {
        const o = this.builder.objEntries[id].obj;
        const stageRect = this.els.stage.getBoundingClientRect();
        this.els.tooltip.innerHTML =
          '<div class="tt-name">' + o.belief[0][0] + ' <span style="opacity:.6">' + o.belief[0][1].toFixed(2) + "</span></div>" +
          '<div class="tt-sub">' + o.obs + " obs · " + o.trust + " · click for evidence</div>";
        this.els.tooltip.style.left = Math.min(clientX - stageRect.left + 14, stageRect.width - 180) + "px";
        this.els.tooltip.style.top = (clientY - stageRect.top - 12) + "px";
        this.els.tooltip.classList.add("show");
      } else {
        this.els.tooltip.classList.remove("show");
      }
    }

    _handleTap(clientX, clientY) {
      const id = this._pick(clientX, clientY);
      if (id) {
        this._selectedId = id;
        this._clearSelection(false);
        this.panel.showObject(this.builder.objEntries[id].obj, this.data.ROOMS[this.builder.objEntries[id].obj.room]);
      }
      this._refreshHighlights();
    }

    _refreshHighlights() {
      const activeQ = this._activeQuery;
      this.data.OBJECTS.forEach(o => {
        const e = this.builder.objEntries[o.id];
        const isHover = o.id === this._hoveredId;
        const isSel = o.id === this._selectedId;
        const isWinner = !!(activeQ && activeQ.winnerId === o.id);
        const dim = activeQ ? (!isWinner && !isHover) : false;

        e.mesh.material.opacity = dim ? .22 : .93;
        e.mesh.material.emissive.set(isWinner ? 0x2FCB93 : (isSel ? 0x8B7CF7 : (isHover ? 0xFFFFFF : 0x000000)));
        e.mesh.material.emissiveIntensity = isWinner ? .5 : (isSel ? .42 : (isHover ? .28 : 0));
        e.edge.material.opacity = dim ? .18 : .8;
        e.node.material.emissiveIntensity = (isSel || isWinner) ? 1.0 : .45;
      });
    }

    _bindResize() {
      const resize = () => {
        const w = this.els.stage.clientWidth, h = this.els.stage.clientHeight;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
      };
      new ResizeObserver(resize).observe(this.els.stage);
      resize();
    }

    _startLoop() {
      const clock = new THREE.Clock();
      const loop = () => {
        requestAnimationFrame(loop);
        const t = clock.getElapsedTime();
        this.orbit.update();
        if (this._goalActive) {
          this.builder.goalRing.material.opacity = .55 + .3 * Math.sin(t * 3.4);
          const s = 1 + .12 * Math.sin(t * 3.4);
          this.builder.goalRing.scale.set(s, s, 1);
        }
        this.renderer.render(this.scene, this.camera);
      };
      loop();
    }
  }

  global.OBN = global.OBN || {};
  global.OBN.SceneGraphViewer = SceneGraphViewer;
})(window);
