// Fill these when release metadata is confirmed. Never guess author order or public URLs.
export const publication = {
  authors: [
    {
      name: "Federica Spinola",
      affiliation: "Inria",
      url: "https://sites.google.com/view/fede-spi/",
    },
    {
      name: "Robert Katzschmann",
      affiliation: "ETH Zürich",
      url: "https://srl.ethz.ch/the-group/prof-robert-katzschmann.html",
    },
    {
      name: "Cordelia Schmid",
      affiliation: "Inria",
      url: "https://cordeliaschmid.github.io",
    },
  ],
  github: "https://github.com/fspinola/dexoak",
  video: "#video",
  arxiv: null,
  bibtex: `@misc{spinola2026dexoak,
  title = {DexOAK: Object-Aware Kinematic Retargeting},
  author = {Spinola, Federica and Katzschmann, Robert
            and Schmid, Cordelia},
  year = {2026},
  note = {Preprint; arXiv identifier forthcoming}
}`,
};
export const palette = {
  green: "#3d9072",
  greenInk: "#287153",
  rose: "#d18e86",
  roseInk: "#a15d55",
  mint: "#3d9072",
  ink: "#233b31",
  paper: "#ffffff",
};

export const scenes = [
  {
    id: "cut",
    title: "Cut fruit",
    dataset: "OakInk-v2",
    hands: ["allegro"],
  },
  {
    id: "uncap",
    title: "Uncap alcohol lamp",
    dataset: "OakInk-v2",
    hands: ["inspire"],
  },
  {
    id: "place",
    title: "Place inside",
    dataset: "OakInk-v2",
    hands: ["allegro"],
  },
  {
    id: "spoon",
    title: "Rearrange spoon",
    dataset: "OakInk-v2",
    hands: ["allegro"],
  },
  {
    id: "shake",
    title: "Shake bottle",
    dataset: "OakInk-v2",
    hands: ["allegro"],
  },
  {
    id: "box",
    title: "Open box",
    dataset: "ARCTIC",
    hands: ["allegro", "inspire"],
  },
  {
    id: "mixer",
    title: "Use mixer",
    dataset: "ARCTIC",
    hands: ["allegro", "inspire"],
  },
  {
    id: "ketchup",
    title: "Squeeze ketchup",
    dataset: "ARCTIC",
    hands: ["allegro", "inspire"],
  },
  {
    id: "notebook",
    title: "Close notebook",
    dataset: "ARCTIC",
    hands: ["allegro", "inspire"],
  },
  {
    id: "waffleiron",
    title: "Open waffle iron",
    dataset: "ARCTIC",
    hands: ["allegro", "inspire"],
  },
  {
    id: "fail-shake",
    title: "Shake lab container",
    dataset: "OakInk-v2",
    hands: ["allegro"],
    group: "failure",
    summary: "Grasp lost during shaking.",
  },
  {
    id: "fail-heat",
    title: "Heat beaker",
    dataset: "OakInk-v2",
    hands: ["allegro"],
    group: "failure",
    summary: "Object drops during transport.",
  },
  {
    id: "fail-pour",
    title: "Pour into beaker",
    dataset: "OakInk-v2",
    hands: ["inspire"],
    group: "failure",
    summary: "Unstable bimanual grasp.",
  },
  {
    id: "fail-cut",
    title: "Cut fruit",
    dataset: "OakInk-v2",
    hands: ["inspire"],
    group: "failure",
    summary: "Contact breaks during cutting.",
  },
];
