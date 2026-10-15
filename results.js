// SR_MT, SR_obj and ADD-AUC (%) from the supplied manuscript. null = unreported.
export const benchmark = [
  {
    dataset: "OakInk-v2",
    hand: "Inspire",
    methods: [
      { name: "ManipTrans", values: [39.5, null, null] },
      { name: "SPIDER*", values: [null, 47.9, null] },
      { name: "DexOAK + RL", values: [48.4, 58.7, 55.1] },
    ],
    gain: "+8.9 pp SR<sub>MT</sub> over ManipTrans",
  },
  {
    dataset: "OakInk-v2",
    hand: "Allegro",
    methods: [
      { name: "SPIDER*", values: [null, 45.9, null] },
      { name: "DexOAK + RL", values: [58.6, 64.1, 61.5] },
    ],
    gain: "64.1% SR<sub>obj</sub> · 61.5 ADD-AUC",
  },
  {
    dataset: "ARCTIC",
    hand: "Inspire",
    methods: [
      { name: "DexMachina", values: [null, 67.1, 62.7] },
      { name: "SPIDER", values: [null, 42, null] },
      { name: "DexOAK + RL", values: [58.3, 83.4, 77.9] },
    ],
    gain: "+15.2 pp ADD-AUC over DexMachina",
  },
  {
    dataset: "ARCTIC",
    hand: "Allegro",
    methods: [
      { name: "DexMachina", values: [null, null, 83.4] },
      { name: "DexOAK + RL", values: [67.2, 97.3, 92.1] },
    ],
    gain: "+8.7 pp ADD-AUC over DexMachina",
  },
];
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
