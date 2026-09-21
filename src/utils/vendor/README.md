# Homepage fluid renderer

Adapted from https://github.com/SimonAKing/HomePage/blob/master/src/js/background.js
on 2026-09-21. The original file includes Pavel Dobryakov's MIT license,
retained in homepageFluid.js. Upstream simulation:
https://github.com/PavelDoGreat/WebGL-Fluid-Simulation

Integration changes: module-local state/configuration, React cleanup, tracked GPU
resources, capped device resolution, passive pointer input, no global keyboard
shortcuts or original-site DOM dependencies. Canvas opacity uses the existing
getOpacity callback; hidden/offscreen simulation sleeps. Original black background
uses the site's screen blend mode. The dither texture is bundled locally.

scripts/import-fluid.cjs mechanically adapts a downloaded upstream source file.
The upstream source must be reviewed before rerunning against a newer version.
