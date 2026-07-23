/* ============================================================
   orbit-controls.js — a small reusable orbit/zoom/pinch camera
   controller for a three.js canvas.

   Single Responsibility: this class knows nothing about scene
   graphs, objects, or panels. It only (a) eases a camera around
   a target on drag/wheel/pinch, and (b) tells its owner about
   taps vs. drags vs. hovers through injected callbacks, so any
   picking/highlighting logic stays outside this class.
============================================================ */
(function (global) {
  "use strict";

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  class OrbitController {
    /**
     * @param {HTMLCanvasElement} canvas
     * @param {THREE.PerspectiveCamera} camera
     * @param {THREE.Vector3} target
     * @param {object} [opts]
     * @param {number} [opts.yaw] initial yaw (radians)
     * @param {number} [opts.pitch] initial pitch (radians)
     * @param {number} [opts.radius] initial distance from target
     * @param {[number,number]} [opts.pitchRange]
     * @param {[number,number]} [opts.radiusRange]
     * @param {boolean} [opts.autoRotate]
     * @param {number} [opts.autoRotateSpeed] radians/frame
     */
    constructor(canvas, camera, target, opts = {}) {
      this.canvas = canvas;
      this.camera = camera;
      this.target = target;

      this.yaw = this.yawT = opts.yaw ?? 0.85;
      this.pitch = this.pitchT = opts.pitch ?? 0.62;
      this.radius = this.radiusT = opts.radius ?? 15.5;
      this._pitchRange = opts.pitchRange ?? [0.12, 1.35];
      this._radiusRange = opts.radiusRange ?? [7, 30];
      this.autoRotate = opts.autoRotate ?? false;
      this._autoRotateSpeed = opts.autoRotateSpeed ?? 0.0018;

      this._onTap = null;
      this._onHover = null;
      this._onFirstInteract = null;

      this._dragging = false;
      this._lastX = 0; this._lastY = 0;
      this._downX = 0; this._downY = 0;
      this._pinchDist = 0;
      this._activePointers = new Map();

      this._bindEvents();
    }

    /** Fired with (clientX, clientY) on a click/tap that wasn't a drag. */
    onTap(fn) { this._onTap = fn; return this; }
    /** Fired with (clientX, clientY) on pointer movement while not dragging. */
    onHover(fn) { this._onHover = fn; return this; }
    /** Fired once, the first time the user drags or scrolls. */
    onFirstInteract(fn) { this._onFirstInteract = fn; return this; }

    setAutoRotate(on) { this.autoRotate = on; }

    _stopAuto() {
      if (this.autoRotate) {
        this.autoRotate = false;
        if (this._onFirstInteract) this._onFirstInteract();
      }
    }

    _bindEvents() {
      const c = this.canvas;
      c.addEventListener("pointerdown", e => {
        this._activePointers.set(e.pointerId, [e.clientX, e.clientY]);
        c.setPointerCapture(e.pointerId);
        this._dragging = true;
        this._lastX = this._downX = e.clientX;
        this._lastY = this._downY = e.clientY;
        this._stopAuto();
      });

      c.addEventListener("pointermove", e => {
        if (this._activePointers.has(e.pointerId)) this._activePointers.set(e.pointerId, [e.clientX, e.clientY]);

        if (this._activePointers.size === 2) {
          const [p1, p2] = [...this._activePointers.values()];
          const d = Math.hypot(p1[0] - p2[0], p1[1] - p2[1]);
          if (this._pinchDist > 0) {
            this.radiusT = clamp(this.radiusT * this._pinchDist / d, ...this._radiusRange);
          }
          this._pinchDist = d;
          return;
        }

        if (this._dragging) {
          this.yawT -= (e.clientX - this._lastX) * 0.0062;
          this.pitchT = clamp(this.pitchT + (e.clientY - this._lastY) * 0.005, ...this._pitchRange);
          this._lastX = e.clientX; this._lastY = e.clientY;
        } else if (this._onHover) {
          this._onHover(e.clientX, e.clientY);
        }
      });

      const endPointer = e => {
        this._activePointers.delete(e.pointerId);
        this._pinchDist = 0;
        if (this._dragging && Math.hypot(e.clientX - this._downX, e.clientY - this._downY) < 6 && this._onTap) {
          this._onTap(e.clientX, e.clientY);
        }
        this._dragging = this._activePointers.size > 0;
      };
      c.addEventListener("pointerup", endPointer);
      c.addEventListener("pointercancel", endPointer);

      c.addEventListener("wheel", e => {
        e.preventDefault();
        this._stopAuto();
        this.radiusT = clamp(this.radiusT * (1 + Math.sign(e.deltaY) * 0.09), ...this._radiusRange);
      }, { passive: false });
    }

    /** Ease toward target orbit state, apply to the camera, and step auto-rotate. */
    update() {
      if (this.autoRotate) this.yawT += this._autoRotateSpeed;

      this.yaw += (this.yawT - this.yaw) * 0.12;
      this.pitch += (this.pitchT - this.pitch) * 0.12;
      this.radius += (this.radiusT - this.radius) * 0.14;

      const t = this.target;
      this.camera.position.set(
        t.x + this.radius * Math.cos(this.pitch) * Math.sin(this.yaw),
        t.y + this.radius * Math.sin(this.pitch),
        t.z + this.radius * Math.cos(this.pitch) * Math.cos(this.yaw)
      );
      this.camera.lookAt(t);
    }
  }

  global.OBN = global.OBN || {};
  global.OBN.OrbitController = OrbitController;
})(window);
