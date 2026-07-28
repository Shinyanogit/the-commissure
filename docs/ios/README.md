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

No native source belongs in the current root Web directories. Phase 1 creates:

```text
web/       existing React/Vite product
ios/       Xcode project, Swift package, tests, fastlane
content/   validated copy, localization, scene data, catalog source
tooling/   conversion and validation tools
```

The Web move occurs atomically with Vercel preview verification as described in
[`ROADMAP.md`](ROADMAP.md). The Phase 0 documentation commit does not relocate or
modify production Web code.
