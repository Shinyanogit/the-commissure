# Native iOS Documentation Map

These documents are intentionally separated by ownership so one requirement has
one source of truth:

| Document | Owns | Does not own |
|---|---|---|
| [`../DESIGN_CONCEPT.md`](../DESIGN_CONCEPT.md) | Visual/interaction philosophy, 7:2:1, icon-first and MECE rules | Domain or release mechanics |
| [`PRODUCT_SPEC.md`](PRODUCT_SPEC.md) | User-visible 1.0 behavior and scope | Swift implementation details |
| [`ARCHITECTURE.md`](ARCHITECTURE.md) | Modules, state, interaction, concurrency, code rules | Hosting/provider choice |
| [`ASSET_DELIVERY.md`](ASSET_DELIVERY.md) | Bundle/download/cache/update, pack security, hosting/cost | Screen layout |
| [`ROADMAP.md`](ROADMAP.md) | Execution order, ownership, entry/exit gates | Repeating detailed requirements |
| [`RELEASE_SPEC.md`](RELEASE_SPEC.md) | QA, App Review, metadata, fastlane, definition of done | Product ideation |
| `CONSULTATION_SYNTHESIS.md` | Fable/GPT Pro/Apple/audit evidence and resolved decisions | New requirements |

When two files appear to conflict, the specialist document in the table owns
its listed concern. Record a changed decision in the consultation log and update
every downstream contract in the same commit.

## Implementation boundary

Phase 1 established the current repository roots:

```text
web/       existing React/Vite product
ios/       Xcode project, Swift package, tests, fastlane
content/   validated copy, localization, scene data, catalog source
tooling/   conversion and validation tools
```

The Web move preserved source blobs with `git mv`, and Vercel now builds from
`web/`. Native source belongs only in `ios/`; shared validated content belongs in
`content/`; conversion and validation code belongs in `tooling/`. See the Phase 1
evidence and next gate in [`ROADMAP.md`](ROADMAP.md).

Phase 5A adds the native presentation shell under the same boundary. Its views
consume Codex-owned `ViewState` projections and do not perform content, file,
network, or RealityKit lookup. The shell is a machine-gated implementation
checkpoint, not final visual, medical-copy, or App Store acceptance. The owner
has rejected the shell's visual composition as a release baseline, so Phase 5R
restarts composition in Claude Design/Figma before Opus 5 writes replacement
SwiftUI. A human-selected static direction and disposable interaction prototype
are required before production visual implementation. The existing native
contracts and Web/content boundary remain intact.
