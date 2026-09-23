# Local environment map

`empty_warehouse_01_1k.hdr` is the same warehouse HDR previously loaded by Drei's
`warehouse` preset. It is now served by this website, not a runtime third-party CDN.

- Asset: https://polyhaven.com/a/empty_warehouse_01
- Artist: Sergej Majboroda
- License: CC0 — https://polyhaven.com/license
- Vendored from: https://raw.githubusercontent.com/pmndrs/drei-assets/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/empty_warehouse_01_1k.hdr

The environment has its own error and loading boundaries. If it fails, the model
continues with ambient/directional lighting. Model-asset failure uses a procedural
gramophone; viewer/chunk/rendering failure is isolated from the rest of the page.
