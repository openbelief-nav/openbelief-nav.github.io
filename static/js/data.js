/* ============================================================
   data.js — scene-graph content: rooms, object nodes, and the
   canned free-form queries used by the retrieval demo.

   This module owns data only. Nothing here touches the DOM or
   three.js, so the content can change (add a room, add an
   object, add a query) without touching any rendering code —
   Open/Closed in practice.
============================================================ */
(function (global) {
  "use strict";

  const ROOMS = {
    living:  { name: "living room", color: 0x5B8DEF, css: "#5B8DEF", center: [-3.1, 2.2] },
    kitchen: { name: "kitchen",     color: 0x2FB380, css: "#2FB380", center: [3.1, 2.2] },
    bedroom: { name: "bedroom",     color: 0x9A7BFF, css: "#9A7BFF", center: [-3.1, -2.2] },
    office:  { name: "office",      color: 0xE8A33D, css: "#E8A33D", center: [3.1, -2.2] }
  };

  // size: [w, h, d] in meters; pos: [x, z]; yBase: bottom height (for stacked objects)
  const OBJECTS = [
    { id: "sofa", room: "living", name: "sofa", color: 0xE07B54, size: [2.0, .85, .85], pos: [-4.6, 1.1],
      belief: [["sofa · couch", .62], ["chair", .24], ["bench", .14]], obs: 9, trust: "trusted" },
    { id: "coffee-table", room: "living", name: "coffee table", color: 0xB08968, size: [1.15, .42, .6], pos: [-4.5, 2.6],
      belief: [["coffee table", .58], ["desk", .27], ["bench", .15]], obs: 5, trust: "trusted" },
    { id: "tv", room: "living", name: "tv", color: 0x22304A, size: [.18, .9, 1.5], pos: [-.55, 1.35], yBase: .35,
      belief: [["tv · monitor", .74], ["picture frame", .26]], obs: 6, trust: "trusted" },
    { id: "plant", room: "living", name: "potted plant", color: 0x3E8E5A, size: [.42, 1.1, .42], pos: [-5.7, 3.7],
      belief: [["potted plant", .55], ["vase", .45]], obs: 2, trust: "degraded" },
    { id: "bookshelf", room: "living", name: "bookshelf", color: 0x8A5A44, size: [1.5, 1.7, .35], pos: [-3.0, 3.95],
      belief: [["bookshelf", .68], ["cabinet", .32]], obs: 4, trust: "trusted" },

    { id: "fridge", room: "kitchen", name: "refrigerator", color: 0xBFC9D9, size: [.75, 1.85, .75], pos: [5.6, 3.6],
      belief: [["refrigerator", .88], ["cabinet", .12]], obs: 7, trust: "trusted" },
    { id: "counter", room: "kitchen", name: "kitchen counter", color: 0x9AA7BD, size: [2.6, .95, .65], pos: [2.6, 3.9],
      belief: [["kitchen counter", .61], ["table", .39]], obs: 5, trust: "trusted" },
    { id: "microwave", room: "kitchen", name: "microwave", color: 0x36415C, size: [.55, .35, .4], pos: [3.3, 3.9], yBase: .95,
      belief: [["microwave", .50], ["oven", .30], ["box", .20]], obs: 2, trust: "degraded" },
    { id: "dining-table", room: "kitchen", name: "dining table", color: 0xC9A26B, size: [1.5, .78, .95], pos: [2.9, 1.5],
      belief: [["dining table", .72], ["desk", .28]], obs: 6, trust: "trusted" },
    { id: "chair-1", room: "kitchen", name: "chair", color: 0xD9B08C, size: [.45, .9, .45], pos: [2.2, .75],
      belief: [["chair", .58], ["stool", .42]], obs: 3, trust: "degraded" },
    { id: "chair-2", room: "kitchen", name: "chair", color: 0xD9B08C, size: [.45, .9, .45], pos: [3.6, .75],
      belief: [["chair", .64], ["armchair", .36]], obs: 4, trust: "trusted" },

    { id: "bed", room: "bedroom", name: "bed", color: 0x7B9ED9, size: [1.9, .62, 1.5], pos: [-4.4, -2.6],
      belief: [["bed", .84], ["sofa", .16]], obs: 8, trust: "trusted" },
    { id: "nightstand", room: "bedroom", name: "nightstand", color: 0xA07E5E, size: [.5, .55, .45], pos: [-5.85, -1.4],
      belief: [["nightstand", .46], ["table", .34], ["box", .20]], obs: 2, trust: "degraded" },
    { id: "wardrobe", room: "bedroom", name: "wardrobe", color: 0x6E5B8E, size: [.6, 1.9, 1.4], pos: [-.85, -3.3],
      belief: [["wardrobe · closet", .66], ["cabinet", .34]], obs: 5, trust: "trusted" },

    { id: "desk", room: "office", name: "desk", color: 0x8F7A66, size: [1.6, .76, .7], pos: [4.6, -3.6],
      belief: [["desk", .70], ["table", .30]], obs: 6, trust: "trusted" },
    { id: "monitor", room: "office", name: "monitor", color: 0x1E293B, size: [.65, .42, .08], pos: [4.6, -3.78], yBase: .76,
      belief: [["monitor", .62], ["tv", .38]], obs: 4, trust: "trusted" },
    { id: "office-chair", room: "office", name: "office chair", color: 0x4A5A78, size: [.55, 1.0, .55], pos: [4.4, -2.7],
      belief: [["chair", .47], ["stool", .29], ["sofa", .24]], obs: 3, trust: "degraded" },
    { id: "fire-extinguisher", room: "office", name: "fire extinguisher", color: 0xD6453D, size: [.22, .55, .22], pos: [.75, -.95],
      belief: [["fire extinguisher", .77], ["bottle", .23]], obs: 4, trust: "trusted" },
    { id: "filing-cabinet", room: "office", name: "filing cabinet", color: 0x5E6B84, size: [.5, 1.1, .6], pos: [5.75, -1.2],
      belief: [["cabinet", .52], ["drawer", .31], ["box", .17]], obs: 3, trust: "degraded" }
  ];

  const QUERIES = {
    "sofa": {
      top: [["sofa", .86], ["office-chair", .42], ["bed", .33]],
      note: "trusted belief → λ = 0.2, the text head carries the match."
    },
    "fire extinguisher": {
      top: [["fire-extinguisher", .81], ["plant", .24], ["filing-cabinet", .19]],
      note: "an open-vocabulary target no benchmark list contains — preserved phrases match it directly."
    },
    "somewhere to sit": {
      top: [["sofa", .71], ["office-chair", .66], ["chair-2", .61]],
      note: "free-form intent, no category name required — resolved against the same evidence."
    },
    "washing machine": {
      top: [["fridge", .24], ["counter", .21], ["wardrobe", .19]],
      note: "retrieval always returns its best-scoring candidate — arrival verification, not query-time scoring, is what catches a wrong one."
    }
  };

  global.OBN = global.OBN || {};
  global.OBN.SceneGraphData = { ROOMS, OBJECTS, QUERIES };
})(window);
