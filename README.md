<p align="center"><img src="assets/dexoak-logo.svg" width="360" alt="DexOAK"></p>
<h2 align="center">Object-Aware Kinematic Retargeting</h2>
<p align="center">Federica Spinola · Robert Katzschmann · Cordelia Schmid<br>Inria · ETH Zürich · Inria</p>
<p align="center"><a href="https://fspinola.github.io/dexoak/">Project website</a> · <a href="https://fspinola.github.io/dexoak/assets/paper.pdf">Paper</a> · <a href="https://fspinola.github.io/dexoak/#video">Video</a> · <a href="https://fspinola.github.io/dexoak/#explore">Interactive results</a></p>
<p align="center"><img src="https://img.shields.io/badge/code-coming_soon-3D9072?style=flat-square" alt="Code coming soon"></p>
<p align="center"><img src="assets/spoon-sequence.webp" width="800" alt="Human spoon transport retargeted to Allegro"></p>

DexOAK learns reusable, object-aware robot-hand references from human hand–object motion. Interaction-graph optimization supplies training seeds; supervised learning and contact-aware fine-tuning produce a retargeter that transfers to new demonstrations without per-frame optimization. Residual RL refines the references for physical execution.

- **Object-aware kinematics:** preserve the demonstrated hand–object interaction across different hand geometries.
- **Reusable retargeting:** improve downstream RL and transfer from OakInk-v2 to ARCTIC zero-shot or with fine-tuning.
- **Simulation and hardware:** Allegro and Inspire evaluations, plus 46/56 open-loop hardware replays across five tasks.

<p align="center"><img src="assets/method.svg" width="1000" alt="DexOAK method: interaction-graph seeds, supervised training and object-aware fine-tuning"></p>

## Code release

Research code and checkpoints are not released yet. This branch contains the project overview and figures. Release materials and licensing information will be added here when available.

## Citation

The arXiv identifier is forthcoming; current citation metadata is provisional.

```bibtex
@misc{spinola2026dexoak,
  title = {DexOAK: Object-Aware Kinematic Retargeting},
  author = {Spinola, Federica and Katzschmann, Robert
            and Schmid, Cordelia},
  year = {2026},
  note = {Preprint; arXiv identifier forthcoming}
}
```
