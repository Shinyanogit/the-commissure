# Shared Content

This directory will contain renderer-neutral procedure metadata, stable IDs,
English/Japanese prose, provenance, catalogs, and versioned JSON schemas.

Until the Phase 3 migration is validated, the current website prose remains in
`web/src/content/procedureText.js`. Web GSAP timelines and native RealityKit
scene states are renderer-specific and must not be combined into a shared
animation language.
