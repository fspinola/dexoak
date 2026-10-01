import * as THREE from "three";
import { OrbitControls } from "./assets/vendor/OrbitControls.js";
const cache = new Map();
export function loadScene(id = "cut") {
  if (!cache.has(id))
    cache.set(
      id,
      (async () => {
        let data;
        if ("DecompressionStream" in window) {
          const r = await fetch(`assets/scenes/${id}.json.gz?v=spoon3`);
          if (!r.ok) throw new Error(`Scene ${id}: HTTP ${r.status}`);
          // Static hosts differ: some return gzip bytes, others decode them
          // through Content-Encoding before exposing the fetch response.
          const bytes = new Uint8Array(await r.arrayBuffer());
          const compressed = bytes[0] === 0x1f && bytes[1] === 0x8b;
          data = compressed
            ? await new Response(
                new Blob([bytes])
                  .stream()
                  .pipeThrough(new DecompressionStream("gzip")),
              ).json()
            : JSON.parse(new TextDecoder().decode(bytes));
        } else {
          const r = await fetch(`assets/scenes/${id}.json?v=spoon3`);
          if (!r.ok) throw new Error(`Scene ${id}: HTTP ${r.status}`);
          data = await r.json();
        }
        if (data.version !== 2) throw new Error("Unsupported scene format");
        return data;
      })().catch((e) => {
        cache.delete(id);
        throw e;
      }),
    );
  return cache.get(id);
}
const rose = 0xd18e86,
  green = 0x3d9072;
const v3 = (a) => new THREE.Vector3().fromArray(a);
const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
const smooth = (x) => {
  x = clamp(x);
  return x * x * (3 - 2 * x);
};
function geometry(d, colors = false) {
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(d.positions, 3));
  g.setIndex(d.faces);
  g.computeVertexNormals();
  if (colors && d.colors)
    g.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(
        d.colors.map((x) =>
          x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4),
        ),
        3,
      ),
    );
  return g;
}
const p0 = new THREE.Vector3(),
  p1 = new THREE.Vector3(),
  q0 = new THREE.Quaternion(),
  q1 = new THREE.Quaternion();
function interpolate(mesh, a, b, t) {
  p0.fromArray(a);
  p1.fromArray(b);
  mesh.position.copy(p0).lerp(p1, t);
  q0.fromArray(a, 3);
  q1.fromArray(b, 3);
  mesh.quaternion.copy(q0).slerp(q1, t);
}
function alpha(group, value) {
  group.visible = value > 0.005;
  group.traverse((o) => {
    if (o.isMesh) {
      o.material.opacity = value;
      o.material.transparent = value < 0.995;
      o.material.depthWrite = value > 0.65;
      o.castShadow = value > 0.65;
    }
  });
}
export class MotionViewer {
  constructor(
    host,
    data,
    { vignette = false, interactive = true, cinematic = false } = {},
  ) {
    this.host = host;
    this.vignette = vignette;
    this.cinematic = cinematic;
    this.autoFollow = true;
    this.data = data;
    this.hand = data.defaultHand;
    this.stage = "ft";
    this.progress = 0;
    this.visible = true;
    this.showTrails = true;
    this.showHuman = false;
    this.showGhost = true;
    this.graphGrowth = 1;
    this.blend = 0.5;
    this.solveProgress = 0;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
    this.renderer.setClearColor(0xffffff, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    host.replaceChildren(this.renderer.domElement);
    this.renderer.domElement.setAttribute(
      "aria-label",
      `${data.title}: interactive 3D rendering`,
    );
    this.renderer.domElement.setAttribute("role", "img");
    this.scene = new THREE.Scene();
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0xd8dfd6, 1.7));
    const light = new THREE.DirectionalLight(0xfff8f3, 2.5);
    light.position.set(1, -0.7, 2);
    light.castShadow = true;
    light.shadow.mapSize.set(1024, 1024);
    light.shadow.camera.left = -1;
    light.shadow.camera.right = 1;
    light.shadow.camera.top = 1;
    light.shadow.camera.bottom = -1;
    light.shadow.bias = -0.0003;
    light.shadow.normalBias = 0.001;
    this.scene.add(light);
    const fill = new THREE.DirectionalLight(0xddeee7, 1.1);
    fill.position.set(-1, 0.5, 1);
    this.scene.add(fill);
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.001, 20);
    this.camera.up.set(0, 0, 1);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.enablePan = true;
    this.controls.minZoom = 0.45;
    this.controls.maxZoom = 4;
    this.controls.maxPolarAngle = Math.PI * 0.85;
    this.controls.enabled = interactive;
    this.controls.addEventListener("start", () => {
      this.autoFollow = false;
      this.host.dispatchEvent(new CustomEvent("orbitstart"));
    });
    this.floor = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 10),
      new THREE.ShadowMaterial({ opacity: 0.08 }),
    );
    this.floor.receiveShadow = true;
    this.scene.add(this.floor);
    this.content = new THREE.Group();
    this.scene.add(this.content);
    this.build(data);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(host);
    this.observer = new IntersectionObserver(
      (e) => {
        this.visible = e[0].isIntersecting;
      },
      { rootMargin: "80px" },
    );
    this.observer.observe(host);
    this.resize();
    this.reset();
    this.setProgress(0.12);
  }
  build(data) {
    this.data = data;
    this.hand = data.defaultHand;
    this.groups = {};
    this.humans = {};
    this.objectMeshes = [];
    this.ghostMeshes = [];
    this.humanGroup = new THREE.Group();
    this.content.add(this.humanGroup);
    for (const [side, h] of Object.entries(data.human)) {
      const g = geometry({ positions: h.positions[0], faces: h.faces });
      g.attributes.position.setUsage(THREE.DynamicDrawUsage);
      const m = new THREE.Mesh(
        g,
        new THREE.MeshStandardMaterial({
          color: rose,
          roughness: 0.57,
          metalness: 0.04,
          side: THREE.DoubleSide,
        }),
      );
      m.castShadow = true;
      m.receiveShadow = true;
      m.frustumCulled = false;
      this.humans[side] = m;
      this.humanGroup.add(m);
    }
    for (const [kind, defs] of Object.entries(data.meshes)) {
      const group = new THREE.Group();
      this.groups[kind] = group;
      this.content.add(group);
      defs.forEach((d) => {
        const tone = d.tone;
        const color =
          tone > 0.69 ? 0xe5eee8 : tone > 0.48 ? 0x81aa96 : 0x284f40;
        const m = new THREE.Mesh(
          geometry(d, true),
          new THREE.MeshStandardMaterial({
            color: d.colors ? 0xffffff : color,
            vertexColors: !!d.colors,
            side: THREE.DoubleSide,
            roughness: 0.48,
            metalness: 0.12,
          }),
        );
        m.castShadow = true;
        m.receiveShadow = true;
        group.add(m);
      });
    }
    this.objGroup = new THREE.Group();
    this.ghostGroup = new THREE.Group();
    this.content.add(this.objGroup, this.ghostGroup);
    data.objects.forEach((d) => {
      const g = geometry(d, true);
      const m = new THREE.Mesh(
        g,
        new THREE.MeshStandardMaterial({
          color: d.colors ? 0xffffff : 0xd8c4a0,
          vertexColors: !!d.colors,
          roughness: 0.46,
          metalness: 0.12,
          side: THREE.DoubleSide,
        }),
      );
      m.castShadow = true;
      m.receiveShadow = true;
      this.objectMeshes.push(m);
      this.objGroup.add(m);
      const ghost = new THREE.Mesh(
        g,
        new THREE.MeshBasicMaterial({
          color: rose,
          wireframe: true,
          transparent: true,
          opacity: 0.15,
          depthWrite: false,
        }),
      );
      this.ghostMeshes.push(ghost);
      this.ghostGroup.add(ghost);
    });
    this.graphGroup = new THREE.Group();
    this.content.add(this.graphGroup);
    this.graphDraw = {};
    for (const side of Object.keys(data.human)) {
      const points = new THREE.InstancedMesh(
        new THREE.SphereGeometry(data.radius * 0.007, 8, 6),
        new THREE.MeshStandardMaterial({ color: green, roughness: 0.4 }),
        256,
      );
      points.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      points.frustumCulled = false;
      const hg = new THREE.BufferGeometry();
      hg.setAttribute(
        "position",
        new THREE.BufferAttribute(new Float32Array(18000), 3).setUsage(
          THREE.DynamicDrawUsage,
        ),
      );
      hg.setAttribute(
        "color",
        new THREE.BufferAttribute(new Float32Array(18000), 3),
      );
      const lines = new THREE.LineSegments(
        hg,
        new THREE.LineBasicMaterial({
          vertexColors: true,
          transparent: true,
          opacity: 0.4,
          depthWrite: false,
        }),
      );
      lines.frustumCulled = false;
      this.graphDraw[side] = { points, lines };
      this.graphGroup.add(lines, points);
    }
    this.paths = new THREE.Group();
    this.content.add(this.paths);
    this.pathSets = {};
    this.createTrails();
    this.floor.position.z = data.floor;
  }
  createTrails() {
    const d = this.data;
    const make = (pts, color, dashed = false) => {
      if (pts.length < 2) return null;
      const points = pts.map(v3);
      let line;
      if (dashed) {
        const g = new THREE.BufferGeometry().setFromPoints(points);
        line = new THREE.Line(
          g,
          new THREE.LineDashedMaterial({
            color,
            dashSize: d.radius * 0.04,
            gapSize: d.radius * 0.022,
            transparent: true,
            opacity: 0.75,
            depthWrite: false,
          }),
        );
        line.computeLineDistances();
        line.userData.factor = 1;
      } else {
        class RecordedCurve extends THREE.Curve {
          getPoint(t, target = new THREE.Vector3()) {
            const f = clamp(t) * (points.length - 1),
              i = Math.floor(f);
            return target
              .copy(points[i])
              .lerp(points[Math.min(i + 1, points.length - 1)], f - i);
          }
        }
        const g = new THREE.TubeGeometry(
          new RecordedCurve(),
          (points.length - 1) * 2,
          d.radius * 0.003,
          5,
          false,
        );
        line = new THREE.Mesh(
          g,
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.72,
            depthWrite: false,
          }),
        );
        line.userData.factor = 60;
      }
      line.frustumCulled = false;
      this.paths.add(line);
      return line;
    };
    this.pathSets.gt = d.objects.map((o, j) =>
      make(
        d.reference.map((fr) => fr[j].slice(0, 3)),
        rose,
      ),
    );
    this.pathSets.hand = Object.values(d.human).map((h) =>
      make(
        h.keypoints.map((k) => k[0]),
        rose,
        true,
      ),
    );
    for (const key of Object.keys(d.tracks).filter((k) => k.endsWith("-rl")))
      this.pathSets[key] = d.objects.flatMap((o, j) =>
        o.rlRecorded === false
          ? []
          : [
              make(
                d.tracks[key].map((fr) => fr.objects[j].slice(0, 3)),
                green,
              ),
            ],
      );
  }
  setMode(hand, stage) {
    if (!this.data.meshes[hand]) return false;
    if (
      ["ft", "rl", "graph"].includes(stage) &&
      stage !== "graph" &&
      !this.data.tracks[`${hand}-${stage}`]
    )
      return false;
    this.hand = hand;
    this.stage = stage;
    this.setProgress(this.progress);
    return true;
  }
  setProgress(value) {
    this.progress = clamp(value);
    const d = this.data,
      n = d.reference.length;
    let f = this.progress * (n - 1);
    if (this.stage === "solve" && d.optimization) f = d.optimization.frame;
    const i = Math.floor(f),
      j = Math.min(i + 1, n - 1),
      t = f - i;
    let key = `${this.hand}-${this.stage === "rl" ? "rl" : ["solve", "seed"].includes(this.stage) ? "graph" : "ft"}`;
    if (!d.tracks[key]) key = `${this.hand}-ft`;
    const track = d.tracks[key],
      fr = track[i],
      next = track[j];
    for (const [kind, group] of Object.entries(this.groups))
      group.visible = kind === this.hand;
    const group = this.groups[this.hand];
    group.children.forEach((m, k) =>
      interpolate(m, fr.links[k], next.links[k], t),
    );
    this.objectMeshes.forEach((m, k) =>
      interpolate(m, fr.objects[k], next.objects[k], t),
    );
    this.ghostMeshes.forEach((m, k) =>
      interpolate(m, d.reference[i][k], d.reference[j][k], t),
    );
    this.ghostGroup.visible = this.stage === "rl" && this.showGhost;
    let humanOpacity = this.showHuman ? 0.16 : 0,
      robotOpacity = 1;
    if (this.stage === "human") {
      humanOpacity = 1;
      robotOpacity = 0;
    }
    if (this.stage === "graph") {
      humanOpacity = 0.35;
      robotOpacity = 0;
    }
    if (this.stage === "blend") {
      humanOpacity = 1 - smooth(this.blend);
      robotOpacity = smooth(this.blend);
    }
    if (this.stage === "solve") {
      humanOpacity = 0.075;
      robotOpacity = 1;
    }
    alpha(this.humanGroup, humanOpacity);
    alpha(group, robotOpacity);
    if (humanOpacity > 0.005)
      for (const [side, m] of Object.entries(this.humans)) {
        const h = d.human[side],
          out = m.geometry.attributes.position.array,
          A = h.positions[i],
          B = h.positions[j];
        for (let k = 0; k < out.length; k++) out[k] = A[k] + (B[k] - A[k]) * t;
        m.geometry.attributes.position.needsUpdate = true;
        m.geometry.computeVertexNormals();
      }
    this.graphGroup.visible =
      ["graph", "solve"].includes(this.stage) && !!d.graph;
    let opt = null;
    if (this.stage === "solve" && d.optimization) {
      const o = d.optimization;
      opt =
        o.iterations[
          Math.min(
            o.iterations.length - 1,
            Math.floor(clamp(this.solveProgress) * (o.iterations.length - 1)),
          )
        ];
      let k = 0;
      d.meshes[this.hand].forEach((def, idx) => {
        if (def.side === o.side && this.hand === d.defaultHand) {
          interpolate(group.children[idx], opt.links[k], opt.links[k], 0);
          k++;
        }
      });
    }
    if (this.graphGroup.visible) {
      for (const [side, g] of Object.entries(this.graphDraw)) {
        const source = d.graph[i][side];
        let nodes = source.nodes;
        if (this.stage === "solve" && opt && side === d.optimization.side)
          nodes = opt.nodes;
        else if (this.stage === "solve")
          nodes = [...fr.nodes[side], ...source.nodes.slice(d.graphHandNodes)];
        const grow = this.stage === "graph" ? clamp(this.graphGrowth) : 1,
          count = Math.floor(nodes.length * clamp(grow * 2));
        const dummy = new THREE.Object3D();
        g.points.count = count;
        for (let k = 0; k < count; k++) {
          dummy.position.fromArray(nodes[k]);
          dummy.updateMatrix();
          g.points.setMatrixAt(k, dummy.matrix);
          g.points.setColorAt(
            k,
            new THREE.Color(k < d.graphHandNodes ? rose : green),
          );
        }
        g.points.instanceMatrix.needsUpdate = true;
        if (g.points.instanceColor) g.points.instanceColor.needsUpdate = true;
        const positions = g.lines.geometry.attributes.position.array,
          colors = g.lines.geometry.attributes.color.array;
        const limit = Math.floor(
          (source.edges.length / 2) * clamp((grow - 0.2) / 0.8),
        );
        for (let e = 0; e < limit; e++)
          for (let v = 0; v < 2; v++) {
            const idx = source.edges[e * 2 + v],
              p = nodes[idx];
            positions.set(p, e * 6 + v * 3);
            const color = new THREE.Color(
              source.edges[e * 2] < d.graphHandNodes ? rose : green,
            );
            colors.set([color.r, color.g, color.b], e * 6 + v * 3);
          }
        g.lines.geometry.setDrawRange(0, limit * 2);
        g.lines.geometry.attributes.position.needsUpdate = true;
        g.lines.geometry.attributes.color.needsUpdate = true;
      }
    }
    this.paths.visible =
      this.showTrails && !["graph", "solve"].includes(this.stage);
    for (const [k, ls] of Object.entries(this.pathSets))
      for (const l of ls) {
        l.visible =
          k === "gt" ||
          k === "hand" ||
          (this.stage === "rl" && k === `${this.hand}-rl`);
        l.geometry.setDrawRange(0, Math.max(2, i + 1) * l.userData.factor);
      }
    this.currentFrame = i;
    this.currentSolve = opt;
    // Camera following uses the reference only; it never changes the scene alignment.
    if (this.autoFollow) {
      let pts = [];
      if (
        this.vignette ||
        (this.cinematic &&
          ["blend", "human", "graph", "solve"].includes(this.stage))
      ) {
        for (const h of Object.values(d.human)) {
          const v = h.positions[i];
          for (let k = 0; k < v.length; k += 15) pts.push(v.slice(k, k + 3));
        }
      }
      if (!pts.length)
        pts = d.tracks[`${this.hand}-ft`][i].links.map((p) => p.slice(0, 3));
      pts.push(...d.reference[i].map((p) => p.slice(0, 3)));
      const lo = [0, 1, 2].map((k) => Math.min(...pts.map((p) => p[k]))),
        hi = [0, 1, 2].map((k) => Math.max(...pts.map((p) => p[k])));
      this.followTarget = new THREE.Vector3(
        ...lo.map((v, k) => (v + hi[k]) / 2),
      );
      this.viewRadius =
        this.vignette ||
        (this.cinematic &&
          ["blend", "human", "graph", "solve"].includes(this.stage))
          ? Math.max(...hi.map((v, k) => v - lo[k])) * 0.69
          : Math.max(
              d.radius * 0.66,
              Math.max(...hi.map((v, k) => v - lo[k])) * 0.78,
            );
    }
  }
  resize() {
    const w = this.host.clientWidth,
      h = this.host.clientHeight;
    if (!w || !h) return;
    this.renderer.setSize(w, h, false);
    const r =
        (this.viewRadius || this.data.radius) * (this.vignette ? 1.04 : 1.2),
      aspect = w / h;
    // Fit the full trajectory in both orientations without clipping on phones.
    const vertical = r / Math.min(aspect, 1.55);
    this.camera.left = -vertical * aspect;
    this.camera.right = vertical * aspect;
    this.camera.top = vertical;
    this.camera.bottom = -vertical;
    this.camera.updateProjectionMatrix();
  }
  reset() {
    this.autoFollow = true;
    const c = this.followTarget?.clone() || v3(this.data.center),
      r = this.data.radius;
    this.camera.position
      .copy(c)
      .add(new THREE.Vector3(0.7, -1.18, 0.8).multiplyScalar(r * 3));
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.controls.target.copy(c);
    this.controls.update();
  }
  copyCamera(other) {
    this.autoFollow = false;
    this.camera.position.copy(other.camera.position);
    this.camera.quaternion.copy(other.camera.quaternion);
    this.camera.zoom = other.camera.zoom;
    this.controls.target.copy(other.controls.target);
    this.camera.updateProjectionMatrix();
  }
  render(synchronized = false) {
    if (!synchronized && this.autoFollow && this.followTarget) {
      const delta = this.followTarget
        .clone()
        .sub(this.controls.target)
        .multiplyScalar(0.12);
      this.controls.target.add(delta);
      this.camera.position.add(delta);
      this.resize();
    }
    if (!synchronized) this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
  dispose() {
    this.resizeObserver.disconnect();
    this.observer.disconnect();
    this.controls.dispose();
    const gs = new Set(),
      ms = new Set();
    this.scene.traverse((o) => {
      if (o.geometry) gs.add(o.geometry);
      if (o.material) ms.add(o.material);
    });
    gs.forEach((g) => g.dispose());
    ms.forEach((m) => m.dispose());
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    this.host.replaceChildren();
  }
}
