// Transcribed from DexOak___ICRA2027.pdf, Tables I, III, IV and V.
// Null means unreported; never draw a missing result as a measured zero.
export const benchmark = {
  arctic: {
    inspire: [
      {
        title: "Object tracking",
        metric: "ADD-AUC (%) ↑",
        rows: [
          ["DexMachina", 62.7],
          ["DexOAK + RL", 77.9, "ours"],
        ],
        gain: "+15.2 percentage points",
      },
      {
        title: "Object success",
        metric: "Object-only success, SRobj (%) ↑",
        rows: [
          ["SPIDER", 42],
          ["DexMachina", 67.1],
          ["DexOAK + RL", 83.4, "ours"],
        ],
        gain: "83.4% object success",
      },
    ],
    allegro: [
      {
        title: "Object tracking",
        metric: "ADD-AUC (%) ↑",
        rows: [
          ["DexMachina", 83.4],
          ["DexOAK + RL", 92.1, "ours"],
        ],
        gain: "+8.7 percentage points",
      },
      {
        title: "Manipulation success",
        metric: "Success rate (%) ↑ · separate success criteria",
        rows: [
          ["DexOAK · SRMT", 67.2, "ours"],
          ["DexOAK · SRobj", 97.3, "secondary"],
        ],
        note: "SRMT and SRobj use different criteria. No baseline is reported for these two metrics in this setting.",
        gain: "Two criteria, reported separately",
      },
    ],
  },
  oakink: {
    inspire: [
      {
        title: "Manipulation success",
        metric: "Strict success, SRMT (%) ↑",
        rows: [
          ["ManipTrans", 39.5],
          ["DexOAK + RL", 48.4, "ours"],
        ],
        gain: "+8.9 percentage points",
      },
      {
        title: "Object success",
        metric: "Object-only success, SRobj (%) ↑",
        rows: [
          ["SPIDER*", 47.9],
          ["DexOAK + RL", 58.7, "ours"],
        ],
        gain: "58.7% object success",
      },
    ],
    allegro: [
      {
        title: "Object success",
        metric: "Object-only success, SRobj (%) ↑",
        rows: [
          ["SPIDER*", 45.9],
          ["DexOAK + RL", 64.1, "ours"],
        ],
        gain: "64.1% object success",
      },
      {
        title: "Tracking & strict success",
        metric: "Separate metrics (%) ↑",
        rows: [
          ["DexOAK · ADD-AUC", 61.5, "ours"],
          ["DexOAK · SRMT", 58.6, "secondary"],
        ],
        note: "ADD-AUC and SRMT measure different properties. No baseline is reported for these metrics in this setting.",
        gain: "End-to-end DexOAK results",
      },
    ],
  },
};
export const ablation = [
  ["AnyTeleop · Vector", 18.3],
  ["AnyTeleop · Position", 11.1],
  ["AnyTeleop · DexPilot", 0],
  ["GeoRT", 0.8],
  ["ManipTrans", 20.6],
  ["IG optimizer", 43.2, "secondary"],
  ["+ Supervised", 43.6, "secondary"],
  ["+ Object-aware FT", 48.2, "ours"],
];
export const transfer = [
  ["DexMachina", 83.4],
  ["IG · in-domain", 88.9],
  ["DexOAK · in-domain", 91.3],
  ["DexOAK · zero-shot", 87.9, "secondary"],
  ["DexOAK · + FT", 90, "ours"],
];
export const hardware = [
  ["Take out", 12, 12, 6, 12],
  ["Close gate", 12, 12, 12, 12],
  ["Pour", 10, 12, 8, 12],
  ["Unplug", 8, 12, 0, 4],
  ["Cut", 4, 8, null, null],
];
