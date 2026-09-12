# Content publication tooling

This directory turns the four reviewed source procedures and generated native
assets into a static GitHub Pages publication. It uses only Node.js built-ins.

Required environment variables:

- `CONTENT_SIGNING_PRIVATE_KEY_BASE64`: base64 PKCS#8 Ed25519 private key
- `CONTENT_SIGNING_PUBLIC_KEY_BASE64`: base64 raw 32-byte Ed25519 public key

`build.mjs` emits `manifest.json`, raw `manifest.sig`, `public-key.raw`, signed
retention files, and immutable procedure directories. It refuses unresolved
medical or rights review, missing native assets, source hash drift, replayed
generation, same-version replacement, unsafe path, and signing-key mismatch.

Use `hydrate-previous.mjs --url <HTTPS base> --output <directory>` before a
later publication. Then give `build.mjs` both `--previous-site <directory>` and
`--previous-manifest <directory>/manifest.json`. `verify.mjs` independently
checks the signature and every current pack byte.
