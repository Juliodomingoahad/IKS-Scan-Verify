IKS Scan & Verify V14 — Android / GitHub Pages

Update from V13: fixes dark-panel detection. The earlier detector reused a small-component filter that discarded large black panels, so dot-band isolation could fall back to the whole frame. V14 detects panel bounds using dark-pixel row/column occupancy, then continues dot extraction, grid fitting, and standard DotCode decoding in a Worker.

Upload index.html, worker.js, and manifest.webmanifest to the root of the GitHub Pages repository (replace previous versions).

Important: V14 is an improved prototype, not a guarantee that every reference/custom/proprietary marking can be decoded. Successful reading depends on the actual encoded symbol being compatible with the decoder and on photo quality/perspective. A displayed human-readable payload is not treated as decoded data. Test with a known, authorized standard DotCode payload first.
