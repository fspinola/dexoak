import { publication, scenes } from "./site.config.js?v=release-oct15";
import {
  benchmark,
  ablation,
  transfer,
  hardware,
} from "./results.js?v=release-oct15";
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
for (const [id, url] of [["github-link", publication.github]])
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
      v.src = `assets/media/real-${id}.mp4?v=release-oct15`;
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
const metricNames = ["SR_MT", "SR_obj", "ADD-AUC"];
const chartColors = {
  "DexOAK + RL": "#3d9072",
  ManipTrans: "#a15d55",
  SPIDER: "#d18e86",
  DexMachina: "#beaea9",
};
function groupedChart(c, index) {
  const width = 540,
    base = 232,
    scale = 1.7,
    centers = [108, 278, 448],
    bw = 30,
    gap = 7;
  let marks = "";
  for (const value of [0, 25, 50, 75, 100]) {
    const y = base - value * scale;
    marks += `<line x1="42" y1="${y}" x2="524" y2="${y}" class="chart-gridline"/><text x="31" y="${y + 4}" text-anchor="end" class="chart-tick">${value}</text>`;
  }
  centers.forEach((center, metric) =>
    c.methods.forEach((method, i) => {
      const x =
          center - (c.methods.length * (bw + gap) - gap) / 2 + i * (bw + gap),
        value = method.values[metric];
      if (value === null) {
        marks += `<text x="${x + bw / 2}" y="${base - 7}" text-anchor="middle" class="chart-missing"><title>${method.name}: ${metricNames[metric]} not reported</title>—</text>`;
        return;
      }
      marks += `<g class="metric-bar" tabindex="0" aria-label="${method.name}, ${metricNames[metric]}: ${value}%"><title>${method.name} · ${metricNames[metric]}: ${value}%</title><rect x="${x}" y="${base - value * scale}" width="${bw}" height="${value * scale}" rx="3" fill="${chartColors[method.name.replace("*", "")]}"/><text x="${x + bw / 2}" y="${base - value * scale - 8}" text-anchor="middle" class="chart-value">${value.toFixed(1)}</text></g>`;
    }),
  );
  const labels = [
    `SR<tspan baseline-shift="sub" font-size="10">MT</tspan>`,
    `SR<tspan baseline-shift="sub" font-size="10">obj</tspan>`,
    `ADD-AUC`,
  ];
  marks += labels
    .map(
      (label, i) =>
        `<text x="${centers[i]}" y="264" text-anchor="middle" class="chart-metric">${label}</text>`,
    )
    .join("");
  return `<article class="benchmark-card"><div class="benchmark-heading"><h3>${c.dataset}</h3><span>${c.hand}</span></div><svg viewBox="0 0 ${width} 282" role="img" aria-labelledby="benchmark-title-${index}"><title id="benchmark-title-${index}">${c.dataset}, ${c.hand}: SR MT, SR obj and ADD-AUC. Percent, higher is better.</title><text x="42" y="24" class="chart-tick">Score (%) ↑</text>${marks}</svg><p class="chart-gain">${c.gain}</p></article>`;
}
$("#main-charts").innerHTML = benchmark.map(groupedChart).join("");
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
  if (scrollY + innerHeight >= document.documentElement.scrollHeight - 5)
    current = rail[rail.length - 1];
  rail.forEach((a) => {
    a.classList.toggle("active", a === current);
    if (a === current) a.setAttribute("aria-current", "location");
    else a.removeAttribute("aria-current");
  });
}
rail.forEach((a) =>
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    history.pushState(null, "", a.getAttribute("href"));
    target.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      block: "start",
    });
  }),
);
new IntersectionObserver(
  (entries) => {
    if (!entries[0].isIntersecting) $("#paper-video").pause();
  },
  { threshold: 0.05 },
).observe($("#paper-video"));
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
    hero.showHumanTrail = false;
    hero.showRobotTrail = false;
    buildChapters();
    updateFilm();
    select($$("[data-teaser-task]"), $(`[data-teaser-task="${id}"]`));
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
      v.showHumanTrail =
        $("#human-trail-toggle").checked && !$("#human-trail-toggle").disabled;
      v.showRobotTrail = $("#robot-trail-toggle").checked;
      v.showHuman = $("#human-toggle").checked;
      v.showGhost = $("#ghost-toggle").checked;
      v.setProgress(p);
    }
  $("#motion-timeline").value = p * 1000;
  $("#motion-time").textContent =
    `${motionT.toFixed(1)} / ${compareData.duration.toFixed(1)} s`;
}
for (const id of [
  "trail-toggle",
  "human-trail-toggle",
  "robot-trail-toggle",
  "human-toggle",
  "ghost-toggle",
])
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
  if (!d.tracks[`${compareHand}-rl`])
    throw new Error("Missing verified RL pair in scene catalog");
  right = new Scene($("#rollout-scene"), d);
  right.setMode(compareHand, "rl");
  $("#rollout-status").textContent = "Recorded policy rollout";
  const hasHumanPath =
    Object.keys(d.human).length > 0 ||
    Object.keys(d.humanWrist || {}).length > 0;
  $("#human-trail-toggle").disabled = !hasHumanPath;
  $("#human-trail-note").hidden = hasHumanPath;
  select($$("[data-hand]"), $(`[data-hand="${compareHand}"]`));
  $("#human-toggle").disabled = !Object.keys(d.human).length;
  if ($("#human-toggle").disabled) $("#human-toggle").checked = false;
  $("#scene-note").textContent =
    `${d.dataset} · ${d.title} · ${d.duration.toFixed(1)} s`;
  if (d.objects.some((o) => o.rlRecorded === false))
    $("#scene-note").textContent +=
      " · The additional scene object follows its GT motion.";
  motionT = Math.min(motionT, d.duration);
  syncSource = null;
  updateMotion();
  window.dexoak.left = left;
  window.dexoak.right = right;
  window.dexoak.compareData = d;
}
async function loadComparison(id) {
  if (!loadScene) return;
  if (!scenes.some((s) => s.id === id && s.hands.includes(compareHand)))
    id = availableScenes()[0].id;
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
const lastScene = { allegro: "cut", inspire: "uncap" };
function availableScenes(hand = compareHand) {
  return scenes.filter((s) => s.hands.includes(hand));
}
function populateScenes() {
  const choices = availableScenes();
  $("#scene-select").innerHTML = choices
    .map((s) => `<option value="${s.id}">${s.title} · ${s.dataset}</option>`)
    .join("");
  $("#pair-count").textContent = `${choices.length} kinematic + RL comparisons`;
  if (choices.some((s) => s.id === compareId))
    $("#scene-select").value = compareId;
}
$("#scene-select").onchange = (e) => {
  lastScene[compareHand] = e.target.value;
  loadComparison(e.target.value);
};
$$("[data-hand]").forEach(
  (b) =>
    (b.onclick = () => {
      if (b.dataset.hand === compareHand) return;
      lastScene[compareHand] = compareId;
      compareHand = b.dataset.hand;
      const id = availableScenes().some((s) => s.id === compareId)
        ? compareId
        : lastScene[compareHand];
      select($$("[data-hand]"), b);
      populateScenes();
      loadComparison(id);
    }),
);
populateScenes();
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
import("./viewer.js?v=release-oct15")
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
