/* ============================================================
   scene-builder.js — builds the three.js geometry for the
   scene-graph hero: the static room shell, the metric point
   cloud, per-object boxes, and the Hydra-style hierarchy layer
   (object nodes → room nodes → building node) with a spread
   control.

   Single Responsibility: this class only constructs and updates
   three.js geometry from OBN.SceneGraphData. It exposes the
   pickable meshes and per-object entries but has no opinion on
   picking, panels, or camera control — those are composed by
   the viewer.
============================================================ */
(function (global) {
  "use strict";

  class SceneGraphBuilder {
    /**
     * @param {THREE.Scene} scene
     * @param {{ROOMS:object, OBJECTS:object[]}} data
     */
    constructor(scene, data) {
      this.scene = scene;
      this.rooms = data.ROOMS;
      this.objects = data.OBJECTS;

      /** @type {THREE.Object3D[]} everything that participates in raycasting */
      this.pickables = [];
      /** @type {Object<string,{obj:object, mesh:THREE.Mesh, edge:THREE.LineSegments, node:THREE.Mesh, topY:number}>} */
      this.objEntries = {};
      this.roomNodes = {};

      this._dynamicLines = [];
      this._spread = 0.62;

      this._buildLighting();
      this._buildStaticShell();
      this._buildPointCloud();
      this._buildObjects();
      this._buildHierarchy();
      this._buildLabels();
      this._buildGoalRing();

      this.updateHierarchy();
    }

    // ---- layer heights, driven by the spread slider ----
    get objLayerY() { return 1.7 + this._spread * 2.1; }
    get roomLayerY() { return 3.1 + this._spread * 3.4; }
    get bldgLayerY() { return 4.3 + this._spread * 5.2; }

    setSpread(spread01) {
      this._spread = spread01;
      this.updateHierarchy();
    }

    _buildLighting() {
      this.scene.add(new THREE.HemisphereLight(0xBBD0F5, 0x0A1122, 0.95));
      const dir = new THREE.DirectionalLight(0xFFFFFF, 0.75);
      dir.position.set(6, 12, 4);
      this.scene.add(dir);
      const dir2 = new THREE.DirectionalLight(0x6D8BC8, 0.3);
      dir2.position.set(-8, 6, -6);
      this.scene.add(dir2);
    }

    _buildStaticShell() {
      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(13.4, 0.16, 9.4),
        new THREE.MeshStandardMaterial({ color: 0x121D38, roughness: .9 })
      );
      slab.position.y = -0.08;
      this.scene.add(slab);

      const grid = new THREE.GridHelper(13, 26, 0x2A3C60, 0x1A2846);
      grid.position.y = 0.004;
      grid.material.transparent = true;
      grid.material.opacity = 0.55;
      this.scene.add(grid);

      const wallMat = new THREE.MeshStandardMaterial({
        color: 0x223154, roughness: .8, transparent: true, opacity: .85
      });
      // [cx, cz, len, alongX] — outer shell + interior partitions with door gaps
      const wallDefs = [
        [0, 4.6, 13.2, true], [0, -4.6, 13.2, true],
        [-6.6, 0, 9.2, false], [6.6, 0, 9.2, false],
        [-3.9, 0, 4.6, true], [3.9, 0, 4.6, true],
        [0, 3.35, 1.9, false], [0, -3.35, 1.9, false]
      ];
      wallDefs.forEach(([cx, cz, len, alongX]) => {
        const g = alongX ? new THREE.BoxGeometry(len, .5, .1) : new THREE.BoxGeometry(.1, .5, len);
        const m = new THREE.Mesh(g, wallMat);
        m.position.set(cx, .25, cz);
        this.scene.add(m);
      });
    }

    _buildPointCloud() {
      const pts = [];
      for (let i = 0; i < 1400; i++) {
        pts.push((Math.random() - .5) * 12.6, Math.random() * .05, (Math.random() - .5) * 8.6);
      }
      this.objects.forEach(o => {
        for (let i = 0; i < 90; i++) {
          pts.push(
            o.pos[0] + (Math.random() - .5) * (o.size[0] + .7),
            Math.random() * .07,
            o.pos[1] + (Math.random() - .5) * (o.size[2] + .7)
          );
        }
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
      const mat = new THREE.PointsMaterial({ color: 0x4A6396, size: .035, transparent: true, opacity: .55 });
      this.scene.add(new THREE.Points(geo, mat));
    }

    _buildObjects() {
      this.objects.forEach(o => {
        const [w, h, d] = o.size;
        const yBase = o.yBase || 0;
        const mesh = new THREE.Mesh(
          new THREE.BoxGeometry(w, h, d),
          new THREE.MeshStandardMaterial({
            color: o.color, roughness: .55, metalness: .05, transparent: true, opacity: .93
          })
        );
        mesh.position.set(o.pos[0], yBase + h / 2, o.pos[1]);
        mesh.userData.objId = o.id;
        this.scene.add(mesh);
        this.pickables.push(mesh);

        const edge = new THREE.LineSegments(
          new THREE.EdgesGeometry(mesh.geometry),
          new THREE.LineBasicMaterial({
            color: new THREE.Color(o.color).lerp(new THREE.Color(0xffffff), .45),
            transparent: true, opacity: .8
          })
        );
        edge.position.copy(mesh.position);
        this.scene.add(edge);

        this.objEntries[o.id] = { obj: o, mesh, edge, node: null, topY: yBase + h };
      });
    }

    _addLine(fromFn, toFn, color, opacity) {
      const geo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]);
      const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
      this.scene.add(line);
      this._dynamicLines.push({ line, fromFn, toFn });
      return line;
    }

    _buildHierarchy() {
      const sphereGeo = new THREE.SphereGeometry(1, 20, 16);

      this.objects.forEach(o => {
        const e = this.objEntries[o.id];
        const rc = this.rooms[o.room].color;
        const node = new THREE.Mesh(
          sphereGeo,
          new THREE.MeshStandardMaterial({ color: rc, emissive: rc, emissiveIntensity: .45, roughness: .4 })
        );
        node.scale.setScalar(.085);
        node.userData.objId = o.id;
        this.scene.add(node);
        this.pickables.push(node);
        e.node = node;

        this._addLine(
          () => new THREE.Vector3(o.pos[0], e.topY + .04, o.pos[1]),
          () => new THREE.Vector3(o.pos[0], this.objLayerY, o.pos[1]),
          rc, .32
        );
        this._addLine(
          () => new THREE.Vector3(o.pos[0], this.objLayerY, o.pos[1]),
          () => new THREE.Vector3(this.rooms[o.room].center[0], this.roomLayerY, this.rooms[o.room].center[1]),
          rc, .2
        );
      });

      Object.entries(this.rooms).forEach(([id, r]) => {
        const node = new THREE.Mesh(
          sphereGeo,
          new THREE.MeshStandardMaterial({ color: r.color, emissive: r.color, emissiveIntensity: .55, roughness: .4 })
        );
        node.scale.setScalar(.17);
        this.scene.add(node);
        this.roomNodes[id] = node;
        this._addLine(
          () => new THREE.Vector3(r.center[0], this.roomLayerY, r.center[1]),
          () => new THREE.Vector3(0, this.bldgLayerY, 0),
          0xAFC3E8, .28
        );
      });

      // room-room adjacency ring
      const ring = ["living", "kitchen", "office", "bedroom"];
      ring.forEach((id, i) => {
        const a = this.rooms[id], b = this.rooms[ring[(i + 1) % ring.length]];
        this._addLine(
          () => new THREE.Vector3(a.center[0], this.roomLayerY, a.center[1]),
          () => new THREE.Vector3(b.center[0], this.roomLayerY, b.center[1]),
          0x5F7196, .18
        );
      });

      this.bldgNode = new THREE.Mesh(
        sphereGeo,
        new THREE.MeshStandardMaterial({ color: 0xF0F4FC, emissive: 0xBBD0F5, emissiveIntensity: .5, roughness: .35 })
      );
      this.bldgNode.scale.setScalar(.23);
      this.scene.add(this.bldgNode);
    }

    _makeLabelSprite(text) {
      const c = document.createElement("canvas");
      c.width = 512; c.height = 112;
      const ctx = c.getContext("2d");
      ctx.font = "600 44px 'IBM Plex Mono', monospace";
      ctx.fillStyle = "rgba(148,170,215,0.85)";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 12, 56);
      const tex = new THREE.CanvasTexture(c);
      tex.minFilter = THREE.LinearFilter;
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: .9 }));
      sp.scale.set(2.6, .57, 1);
      this.scene.add(sp);
      return sp;
    }

    _buildLabels() {
      this._labelX = -8.1;
      this._labelZ = 3.4;
      this.labels = {
        metric: this._makeLabelSprite("METRIC"),
        objects: this._makeLabelSprite("OBJECTS"),
        rooms: this._makeLabelSprite("ROOMS"),
        building: this._makeLabelSprite("BUILDING")
      };
    }

    _buildGoalRing() {
      this.goalRing = new THREE.Mesh(
        new THREE.RingGeometry(.3, .4, 40),
        new THREE.MeshBasicMaterial({ color: 0x4ADE9C, transparent: true, opacity: 0, side: THREE.DoubleSide })
      );
      this.goalRing.rotation.x = -Math.PI / 2;
      this.goalRing.position.y = .02;
      this.scene.add(this.goalRing);
    }

    /** Recompute every layer-dependent position after a spread change. */
    updateHierarchy() {
      this.objects.forEach(o => {
        this.objEntries[o.id].node.position.set(o.pos[0], this.objLayerY, o.pos[1]);
      });
      Object.entries(this.rooms).forEach(([id, r]) => {
        this.roomNodes[id].position.set(r.center[0], this.roomLayerY, r.center[1]);
      });
      this.bldgNode.position.set(0, this.bldgLayerY, 0);

      this._dynamicLines.forEach(({ line, fromFn, toFn }) => {
        const pos = line.geometry.attributes.position;
        const a = fromFn(), b = toFn();
        pos.setXYZ(0, a.x, a.y, a.z);
        pos.setXYZ(1, b.x, b.y, b.z);
        pos.needsUpdate = true;
      });

      this.labels.metric.position.set(this._labelX, .35, this._labelZ);
      this.labels.objects.position.set(this._labelX, this.objLayerY, this._labelZ);
      this.labels.rooms.position.set(this._labelX, this.roomLayerY, this._labelZ);
      this.labels.building.position.set(this._labelX, this.bldgLayerY, this._labelZ);
    }

    /** Position the goal ring just outside an object's boundary, toward its room center. */
    placeGoalRingNear(objId) {
      const o = this.objEntries[objId].obj;
      const rc = this.rooms[o.room].center;
      const dx = rc[0] - o.pos[0], dz = rc[1] - o.pos[1];
      const n = Math.hypot(dx, dz) || 1;
      this.goalRing.position.set(
        o.pos[0] + (dx / n) * (o.size[0] / 2 + .55),
        .02,
        o.pos[1] + (dz / n) * (o.size[2] / 2 + .55)
      );
    }
  }

  global.OBN = global.OBN || {};
  global.OBN.SceneGraphBuilder = SceneGraphBuilder;
})(window);
