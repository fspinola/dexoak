import { publication } from "./site.config.js";
import { benchmark, ablation, transfer, hardware } from "./results.js";
const $ = (s) => document.querySelector(s),
  $$ = (s) => [...document.querySelectorAll(s)];
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const select = (items, active) =>
  items.forEach((b) => {
    const on = b === active;
    b.classList.toggle("active", on);
    b.setAttribute("aria-pressed", String(on));
  });
const aff = [...new Set(publication.authors.map((a) => a.affiliation))];
$("#authors").innerHTML =
  publication.authors
    .map(
      (a) =>
        `<span>${a.name}<sup>${aff.indexOf(a.affiliation) + 1}</sup></span>`,
    )
    .join('<span class="author-separator">·</span>') +
  `<div class="affiliations">${aff.map((a, i) => `<span><sup>${i + 1}</sup> ${a}</span>`).join("")}</div>`;
for (const [id, url] of [
  ["github-link", publication.github],
  ["huggingface-link", publication.huggingface],
])
  if (url) {
    const a = $("#" + id);
    a.href = url;
    a.target = "_blank";
    a.rel = "noopener";
    a.classList.remove("pending");
    a.removeAttribute("aria-disabled");
    a.removeAttribute("title");
    a.querySelector("small")?.remove();
  }
if (publication.arxiv)
  $$('a[href="assets/paper.pdf"]').forEach((a) => (a.href = publication.arxiv));
$("#citation").textContent = publication.bibtex;
$("#copy-citation").onclick = async () => {
  try {
    await navigator.clipboard.writeText($("#citation").textContent);
    $("#copy-citation").textContent = "Copied ✓";
    setTimeout(() => ($("#copy-citation").textContent = "Copy BibTeX"), 2200);
  } catch {
    const r = document.createRange();
    r.selectNodeContents($("#citation"));
    getSelection().removeAllRanges();
    getSelection().addRange(r);
    $("#citation-status").textContent =
      "Citation selected. Press Ctrl+C (or ⌘C) to copy.";
  }
};
// Only real hardware recordings use HTML video. All simulation is live geometry.
const realClips = [
  ["cut", "Cut fruit", "4 / 8 successful replays"],
  ["unplug", "Unplug", "8 / 12 successful replays"],
  ["pour", "Pour", "10 / 12 successful replays"],
  ["take-out", "Take out", "12 / 12 successful replays"],
  ["close-gate", "Close gate", "12 / 12 successful replays"],
  ["laptop", "Close laptop", "10 / 12 · held-out interaction"],
  ["button", "Press button", "10 / 12 · held-out interaction"],
];
$("#hardware-list").innerHTML = realClips
  .map(
    ([id, title, note], i) =>
      `<button class="hardware-choice ${i === 0 ? "active" : ""}" data-clip="${id}" aria-pressed="${i === 0}" aria-label="Show ${title} hardware experiment"><img src="assets/media/real-${id}.webp" alt="" loading="lazy"><span><strong>${title}</strong><small>${note}</small></span></button>`,
  )
  .join("");
$$("[data-clip]").forEach(
  (b) =>
    (b.onclick = () => {
      const [id, title, note] = realClips.find((c) => c[0] === b.dataset.clip),
        v = $("#hardware-video");
      v.pause();
      v.src = `assets/media/real-${id}.mp4?v=spoon3`;
      v.poster = `assets/media/real-${id}.webp`;
      v.setAttribute(
        "aria-label",
        `Real-robot ${title.toLowerCase()} experiment`,
      );
      v.load();
      v.play().catch(() => {});
      $("#hardware-title").textContent = title;
      $("#hardware-note").textContent = note;
      $("#hardware-kicker").textContent = ["laptop", "button"].includes(id)
        ? "HELD OUT FROM RETARGETER TRAINING"
        : "UR5 + ALLEGRO";
      select($$("[data-clip]"), b);
    }),
);
new IntersectionObserver(
  (e) => {
    if (!e[0].isIntersecting) $("#hardware-video").pause();
  },
  { threshold: 0.05 },
).observe($("#hardware-video"));
// Manuscript numbers, without changing the metric definitions.
function bars(rows, max = 100) {
  return (
    rows
      .map(
        ([name, value, type = ""]) =>
          `<div class="bar-row ${type}" role="img" aria-label="${name}: ${value} percent"><span class="bar-label">${name}</span><div class="bar-track"><div class="bar-fill" style="--width:${(value / max) * 100}%"></div></div><span class="bar-value">${value.toFixed(1)}</span></div>`,
      )
      .join("") +
    `<div class="axis"><span>0</span><span>${max / 4}</span><span>${max / 2}</span><span>${max * 0.75}</span><span>${max}</span></div>`
  );
}
let dataset = "arctic",
  resultHand = "inspire";
function renderResults() {
  $("#main-charts").innerHTML = benchmark[dataset][resultHand]
    .map(
      (c) =>
        `<article class="chart-card"><div class="chart-card-heading"><span class="eyebrow">${dataset === "arctic" ? "ARCTIC" : "OAKINK-V2"} · ${resultHand.toUpperCase()}</span><span>TABLE IV</span></div><h3>${c.title}</h3><p class="chart-subtitle">${c.metric}</p><div class="bars">${bars(c.rows)}</div><div class="chart-gain">↗ ${c.gain}</div>${c.note ? `<p class="chart-note">${c.note}</p>` : ""}</article>`,
    )
    .join("");
  $("#results-note").textContent =
    "Table IV · End-to-end pipelines use their own dynamic refinement; DexOAK uses residual RL. " +
    (dataset === "oakink"
      ? "* SPIDER evaluates more OakInk-v2 sequences, so that comparison is indicative. "
      : "") +
    "Unreported metrics are omitted.";
}
$$("[data-dataset]").forEach(
  (b) =>
    (b.onclick = () => {
      dataset = b.dataset.dataset;
      select($$("[data-dataset]"), b);
      renderResults();
    }),
);
$$("[data-result-hand]").forEach(
  (b) =>
    (b.onclick = () => {
      resultHand = b.dataset.resultHand;
      select($$("[data-result-hand]"), b);
      renderResults();
    }),
);
renderResults();
$("#ablation-bars").innerHTML = bars(ablation, 60);
$("#transfer-bars").innerHTML = bars(transfer);
$("#hardware-bars").innerHTML =
  hardware
    .map(
      ([name, a, n, b, m]) =>
        `<div class="hw-row" role="img" aria-label="${name}: DexOAK ${a} of ${n}; ManipTrans ${b === null ? "no successful simulation rollout" : `${b} of ${m}`}"><span>${name}</span><div class="hw-tracks"><span style="width:${(a / n) * 100}%"></span><span style="width:${b === null ? 0 : (b / m) * 100}%"></span></div><div class="hw-values">${a}/${n}<span>${b === null ? "—" : `${b}/${m}`}</span></div></div>`,
    )
    .join("") +
  '<p class="hardware-note">— no successful simulation rollout to replay. Held-out Close Laptop and Press Button: 10/12 each, separate from the 46/56 total.</p>';
const method = [
  [
    "L Vrobot ≈ L Vhuman",
    "Human keypoints and object anchors form a shared interaction graph. Optimizing robot joints and wrist pose to match its Laplacian coordinates preserves the local hand–object relationship.",
  ],
  [
    "Many solves → one forward pass",
    "A feed-forward retargeter learns the optimized trajectories. Human keypoints, object features and the previous robot state predict the next wrist pose and joint configuration.",
  ],
  [
    "Contact · Geometry · Temporal coherence",
    "Fine-tuning uses surface contact, object-part conditioning and temporal coherence to improve the learned kinematic references before physics enters the picture.",
  ],
  [
    "Reference + residual → robot action",
    "A residual reinforcement-learning policy follows the object-aware reference while learning the corrections needed for contact dynamics and task execution.",
  ],
];
$$("[data-method]").forEach(
  (b) =>
    (b.onclick = () => {
      select($$("[data-method]"), b);
      const i = Number(b.dataset.method);
      $("#method-equation").textContent = method[i][0];
      $("#method-description").textContent = method[i][1];
      $(".method-flow").dataset.step = i;
    }),
);
const rail = $$(".page-rail a");
function updateRail() {
  let current = rail[0];
  for (const a of rail) {
    if (
      $(a.getAttribute("href")).getBoundingClientRect().top <
      innerHeight * 0.42
    )
      current = a;
  }
  rail.forEach((a) => {
    a.classList.toggle("active", a === current);
    if (a === current) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  });
}
addEventListener("scroll", updateRail, { passive: true });
updateRail();

let Scene, loadScene, hero, left, right, heroData, compareData;
let filmPlaying = !reduced,
  filmTime = 0,
  chapter = -1,
  teaserTask = "cut";
let motionPlaying = false,
  motionT = 0,
  motionSpeed = 1,
  compareHand = "allegro",
  compareId = "cut",
  referenceStage = "ft",
  compareToken = 0,
  teaserToken = 0,
  syncSource = null;
const chapterSet = {
  cut: [
    {
      name: "Human motion",
      stage: "blend",
      title: 'One intent.<br><span class="green">Many hands.</span>',
      text: "A human demonstrates a delicate, coordinated interaction. The robot’s anatomy is different. The task stays the same.",
      detail: "Bimanual cutting · OakInk-v2",
    },
    {
      name: "Interaction graph",
      stage: "graph",
      title: 'Capture what<br><span class="rose">connects them.</span>',
      text: "Hand keypoints and object anchors become a shared graph. It describes the interaction the robot needs to preserve.",
      detail: "Surface anchors → Delaunay edges → local geometry",
    },
    {
      name: "Optimization",
      stage: "solve",
      title: 'Find a pose.<br><span class="green">Keep the intent.</span>',
      text: "Optimize the wrist and fingers to match the human–object relationship.",
      detail: "Single-frame graph re-solve · actual SLSQP iterations",
    },
    {
      name: "Fine-tuning",
      stage: "ft",
      title: 'Bring the contact<br><span class="green">into focus.</span>',
      text: "Learn the optimized references, then refine them with object-aware losses for contact, geometry and temporal coherence.",
      detail: "Recorded object-aware fine-tuned reference",
    },
    {
      name: "Residual RL",
      stage: "rl",
      title: 'Make the motion<br><span class="green">physical.</span>',
      text: "Residual reinforcement learning turns the reference into an executed interaction. Follow the object’s achieved path against its ground truth.",
      detail: "Recorded Allegro policy rollout · selected example",
    },
  ],
  uncap: [
    {
      name: "Human motion",
      stage: "blend",
      title: 'A small cap.<br><span class="rose">A precise interaction.</span>',
      text: "Two hands coordinate to uncap an alcohol lamp. The motion transfers from the human to the five-finger Inspire embodiment.",
      detail: "Bimanual uncapping · OakInk-v2",
    },
    {
      name: "Fine-tuning",
      stage: "ft",
      title:
        'A different hand.<br><span class="green">The same relationship.</span>',
      text: "Object-aware kinematic retargeting preserves the coordinated hand–object motion across embodiments.",
      detail: "Recorded Inspire kinematic reference",
    },
    {
      name: "Residual RL",
      stage: "rl",
      title: 'Lift the cap.<br><span class="green">Follow through.</span>',
      text: "Inspect the recorded DexOAK policy. Ground-truth and achieved object trajectories remain visible throughout the interaction.",
      detail: "Verified bimanual Inspire rollout · selected example",
    },
  ],
};
function buildChapters() {
  chapter = -1;
  $("#chapters").innerHTML = chapterSet[teaserTask]
    .map(
      (c, i) =>
        `<button data-chapter="${i}" aria-pressed="false"><b>${String(i + 1).padStart(2, "0")}</b>${c.name}</button>`,
    )
    .join("");
  $$("[data-chapter]").forEach(
    (b) =>
      (b.onclick = () => {
        filmTime = Number(b.dataset.chapter) * 8;
        changeChapter(Number(b.dataset.chapter));
        updateFilm();
      }),
  );
}
function changeChapter(i) {
  if (i === chapter || !hero) return;
  chapter = i;
  const c = chapterSet[teaserTask][i];
  $("#film-kicker").textContent =
    `${String(i + 1).padStart(2, "0")} / ${c.name.toUpperCase()}`;
  $("#film-title").innerHTML = c.title.replaceAll("<br>", "<br> ");
  if (!reduced)
    $(".film-copy").animate(
      [
        { opacity: 0, transform: "translateY(5px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 420, easing: "ease-out" },
    );
  $("#film-description").textContent = c.text;
  $("#film-detail").textContent = c.detail;
  $("#teaser").dataset.stage = c.stage;
  $("#solve-card").hidden = c.stage !== "solve";
  select($$("[data-chapter]"), $(`[data-chapter="${i}"]`));
  hero.setMode(heroData.defaultHand, c.stage);
}
function setFilmPlay(on) {
  filmPlaying = on;
  $("#film-play").textContent = on ? "Ⅱ" : "▷";
  $("#film-play").setAttribute(
    "aria-label",
    on ? "Pause teaser" : "Play teaser",
  );
}
$("#film-play").onclick = () => setFilmPlay(!filmPlaying);
setFilmPlay(!reduced);
function updateFilm() {
  if (!hero) return;
  const total = chapterSet[teaserTask].length * 8,
    i = Math.min(chapterSet[teaserTask].length - 1, Math.floor(filmTime / 8)),
    local = (filmTime % 8) / 8;
  changeChapter(i);
  hero.blend = Math.max(0, (local - 0.2) / 0.6);
  hero.graphGrowth = Math.min(1, local * 1.6);
  hero.solveProgress = local;
  const stage = chapterSet[teaserTask][i].stage;
  hero.showTrails = stage !== "blend";
  hero.setProgress(
    stage === "graph"
      ? 0.414
      : teaserTask === "cut"
        ? 0.14 + local * 0.42
        : local,
  );
  $("#film-time").textContent =
    `${String(Math.floor(filmTime)).padStart(2, "0")} / ${total} s`;
  $$("[data-chapter]").forEach((b, j) =>
    b.style.setProperty(
      "--progress",
      `${j < i ? 100 : j === i ? local * 100 : 0}%`,
    ),
  );
  if (stage === "solve" && heroData.optimization) {
    const it = heroData.optimization.iterations,
      n = Math.min(it.length - 1, Math.floor(local * (it.length - 1))),
      max = it[0].loss,
      points = it
        .map(
          (x, k) =>
            `${(k / (it.length - 1)) * 234 + 3},${60 - Math.min(1, x.loss / max) * 55}`,
        )
        .join(" ");
    $("#solve-chart").innerHTML =
      `<path d="M3 60H237" stroke="#e3e8df" fill="none"/><polyline points="${points}" fill="none" stroke="#c7d7ca" stroke-width="1.5"/><polyline points="${points
        .split(" ")
        .slice(0, n + 1)
        .join(
          " ",
        )}" fill="none" stroke="#3d9072" stroke-width="2"/><circle cx="${(n / (it.length - 1)) * 234 + 3}" cy="${60 - Math.min(1, it[n].loss / max) * 55}" r="3" fill="#a15d55"/>`;
    $("#solve-loss").textContent = it[n].loss.toFixed(3);
    $("#solve-step").textContent =
      `Iteration ${n} / ${it.length - 1} · graph objective only`;
  }
}
function failure(host, e) {
  console.error(e);
  host.innerHTML =
    '<div class="empty-scene"><span class="eyebrow">3D unavailable</span><p>The live renderer could not load. Enable WebGL and reload to explore this scene.</p></div>';
}
async function setTeaser(id) {
  const token = ++teaserToken;
  $$("[data-teaser-task]").forEach((b) => (b.disabled = true));
  try {
    const d = await loadScene(id);
    if (token !== teaserToken) return;
    hero?.dispose();
    heroData = d;
    hero = new Scene($("#hero-scene"), d, { cinematic: true });
    teaserTask = id;
    filmTime = 0;
    hero.showTrails = false;
    buildChapters();
    updateFilm();
    select($$("[data-teaser-task]"), $(`[data-teaser-task="${id}"]`));
    $("#teaser-provenance").textContent =
      id === "cut"
        ? "Actual recorded stages · graph visualization & single-frame re-solve"
        : "Verified DexOAK Inspire rollout · actual meshes & recorded motion";
    window.dexoak.hero = hero;
    window.dexoak.heroData = d;
  } catch (e) {
    failure($("#hero-scene"), e);
  } finally {
    $$("[data-teaser-task]").forEach((b) => (b.disabled = false));
  }
}
$$("[data-teaser-task]").forEach(
  (b) => (b.onclick = () => setTeaser(b.dataset.teaserTask)),
);
function setMotionPlay(on) {
  motionPlaying = on;
  $("#motion-play").textContent = on ? "Ⅱ" : "▷";
  $("#motion-play").setAttribute(
    "aria-label",
    on ? "Pause comparison" : "Play comparison",
  );
}
$("#motion-play").onclick = () => setMotionPlay(!motionPlaying);
$("#motion-timeline").oninput = (e) => {
  setMotionPlay(false);
  motionT = (Number(e.target.value) / 1000) * (compareData?.duration || 1);
  updateMotion();
};
$("#motion-speed").onchange = (e) => (motionSpeed = Number(e.target.value));
function updateMotion() {
  if (!compareData) return;
  const p = motionT / compareData.duration;
  for (const v of [left, right])
    if (v) {
      v.showTrails = $("#trail-toggle").checked;
      v.showHuman = $("#human-toggle").checked;
      v.showGhost = $("#ghost-toggle").checked;
      v.setProgress(p);
    }
  $("#motion-timeline").value = p * 1000;
  $("#motion-time").textContent =
    `${motionT.toFixed(1)} / ${compareData.duration.toFixed(1)} s`;
}
for (const id of ["trail-toggle", "human-toggle", "ghost-toggle"])
  $("#" + id).onchange = updateMotion;
$("#reset-view").onclick = () => {
  left?.reset();
  right?.reset();
};
for (const [id, key] of [
  ["reference-scene", "left"],
  ["rollout-scene", "right"],
])
  $("#" + id).addEventListener("orbitstart", () => (syncSource = key));
function refreshComparison() {
  if (!compareData) return;
  const d = compareData;
  left?.dispose();
  right?.dispose();
  right = null;
  if (!d.meshes[compareHand]) compareHand = d.defaultHand;
  const haveGraph = !!d.tracks[`${compareHand}-graph`];
  $('#reference-stage option[value="graph"]').disabled = !haveGraph;
  if (!haveGraph) referenceStage = "ft";
  $("#reference-stage").value = referenceStage;
  left = new Scene($("#reference-scene"), d);
  left.setMode(
    compareHand,
    referenceStage === "graph" ? "seed" : referenceStage,
  );
  if (d.tracks[`${compareHand}-rl`]) {
    right = new Scene($("#rollout-scene"), d);
    right.setMode(compareHand, "rl");
    $("#rollout-status").textContent = "Recorded policy rollout";
  } else {
    $("#rollout-status").textContent = "No verified rollout";
    $("#rollout-scene").innerHTML =
      '<div class="empty-scene"><span class="eyebrow">Rollout unavailable</span><p>No verified DexOAK RL recording for this hand–task pairing.</p><button class="text-button" id="open-uncap">Explore Inspire uncapping ↗</button></div>';
    $("#open-uncap").onclick = () => {
      $("#scene-select").value = "uncap";
      loadComparison("uncap");
    };
  }
  $$("[data-hand]").forEach((b) => {
    b.disabled = !d.meshes[b.dataset.hand];
  });
  select($$("[data-hand]"), $(`[data-hand="${compareHand}"]`));
  $("#human-toggle").disabled = !Object.keys(d.human).length;
  if ($("#human-toggle").disabled) $("#human-toggle").checked = false;
  $("#scene-note").textContent =
    `${d.source} · ${d.reference.length} sampled frames, interpolated for display. ${d.dataset === "ARCTIC" ? "Articulated objects and recorded residual-policy states. No matched human mesh in these windows." : compareId === "uncap" ? "Original figure time mapping and object-relative alignment." : "Original fixed sim-to-demo alignment; no per-frame fitting."}`;
  if (d.objects.some((o) => o.rlRecorded === false))
    $("#scene-note").textContent +=
      " The additional scene object follows its ground-truth motion.";
  motionT = Math.min(motionT, d.duration);
  syncSource = null;
  updateMotion();
  window.dexoak.left = left;
  window.dexoak.right = right;
  window.dexoak.compareData = d;
}
async function loadComparison(id) {
  if (!loadScene) return;
  $("#scene-select").value = id;
  const token = ++compareToken;
  setMotionPlay(false);
  $("#scene-select").disabled = true;
  $("#motion-play").disabled = true;
  $("#scene-note").textContent = "Loading meshes and recorded trajectories…";
  try {
    const d = await loadScene(id);
    if (token !== compareToken) return;
    compareData = d;
    compareId = id;
    motionT = d.duration * 0.12;
    refreshComparison();
  } catch (e) {
    failure($("#reference-scene"), e);
    $("#scene-note").textContent =
      "This scene could not load. Select another interaction or reload the page.";
  } finally {
    if (token === compareToken) {
      $("#scene-select").disabled = false;
      $("#motion-play").disabled = false;
    }
  }
}
$(".film-footnote a").addEventListener("click", () => {
  compareHand = heroData?.defaultHand || compareHand;
  loadComparison(teaserTask);
});
$("#scene-select").onchange = (e) => loadComparison(e.target.value);
$$("[data-hand]").forEach(
  (b) =>
    (b.onclick = () => {
      compareHand = b.dataset.hand;
      refreshComparison();
    }),
);
$("#reference-stage").onchange = (e) => {
  referenceStage = e.target.value;
  left?.setMode(
    compareHand,
    referenceStage === "graph" ? "seed" : referenceStage,
  );
  updateMotion();
};
window.dexoak = {
  setTeaser,
  loadComparison,
  setFilmPlay,
  setMotionPlay,
  setFilmTime: (t) => {
    filmTime = t;
    updateFilm();
  },
  setChapter: (i) => {
    filmTime = i * 8;
    updateFilm();
  },
  get state() {
    return {
      teaserTask,
      chapter,
      filmTime,
      filmPlaying,
      compareId,
      compareHand,
      motionT,
      motionPlaying,
      referenceStage,
    };
  },
};
import("./viewer.js?v=spoon3")
  .then(async (module) => {
    Scene = module.MotionViewer;
    loadScene = module.loadScene;
    await setTeaser("cut");
    await loadComparison("cut");
  })
  .catch((e) => {
    for (const id of ["hero-scene", "reference-scene", "rollout-scene"])
      failure($("#" + id), e);
    setFilmPlay(false);
    $("#film-play").disabled = true;
    $("#motion-play").disabled = true;
  });
let last = performance.now();
function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (!document.hidden) {
    if (hero?.visible) {
      if (filmPlaying) {
        filmTime = (filmTime + dt) % (chapterSet[teaserTask].length * 8);
        updateFilm();
      }
      hero.render();
    }
    if (left?.visible || right?.visible) {
      if (motionPlaying) {
        motionT = (motionT + dt * motionSpeed) % compareData.duration;
        updateMotion();
      }
      if (syncSource === "left" && left && right) {
        left.render();
        right.copyCamera(left);
        right.render(true);
      } else if (syncSource === "right" && left && right) {
        right.render();
        left.copyCamera(right);
        left.render(true);
      } else {
        left?.render();
        right?.render();
      }
    }
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
