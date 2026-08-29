# Web Search Discovery

This document is the source of truth for the public Web site's search metadata,
crawl entry points, and post-deployment checks.

## Canonical site and indexed routes

The canonical production origin is `https://the-commissure.vercel.app`.

| Route | Search role |
| --- | --- |
| `/` | Site and mission landing page |
| `/articles` | Collection of all procedure guides |
| `/pcdf` | PCDF interactive guide |
| `/acdf` | ACDF interactive guide |
| `/pcf` | PCF interactive guide |
| `/accf` | ACCF interactive guide |
| `/pcl_open` | Open-door PCL interactive guide |

Each route owns one title, description, canonical URL, Open Graph/Twitter
preview, and Schema.org graph. Procedure routes use `Article` with
`MedicalProcedure` as the subject. Unknown client-side routes receive
`noindex, nofollow` metadata.

## Rendering contract

- `src/seo/routeMetadata.js` is the single metadata registry.
- `scripts/generate-seo-pages.mjs` turns the Vite shell into one crawlable HTML
  entry document per indexed route during every production build.
- `vercel.json` serves the matching entry document on a direct route request,
  then retains the generic SPA fallback for unknown extensionless paths.
- `src/components/Seo.jsx` keeps the same metadata synchronized after
  client-side navigation.
- `public/robots.txt` allows crawling and declares the sitemap.
- `public/sitemap.xml` lists canonical absolute URLs only.

The Google site-verification tag remains in `index.html`. Search metadata makes
the site understandable and discoverable to crawlers, but does not guarantee
indexing, ranking, or a rich result; Google makes those decisions after crawl
and quality evaluation.

## Verification

Run from `web/`:

```bash
npm run build
npm test
```

The smoke test verifies all seven static entry documents, unique titles and
canonicals, parseable JSON-LD, route rewrites, the complete sitemap, and the
robots declaration. Browser review must also confirm that metadata changes
when navigating between the home, article index, and procedure routes.

## Post-deployment checklist

1. Confirm `/robots.txt` and `/sitemap.xml` return HTTP 200 on production.
2. Confirm the raw response for each indexed route contains its own title,
   canonical, description, and JSON-LD before JavaScript runs.
3. Submit `https://the-commissure.vercel.app/sitemap.xml` in Google Search
   Console.
4. Use URL Inspection for `/`, `/articles`, and each procedure route; request
   indexing after the production deployment is stable.
5. Recheck coverage and enhancements after Google has recrawled the site.

When adding a public route, update the metadata registry, sitemap, Vercel route
rewrite, and smoke-test expectation in the same pull request.

## References

- [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Build and submit a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Canonical URL guidance](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Structured data introduction](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data)
- [Article structured data](https://developers.google.com/search/docs/appearance/structured-data/article)

## Change record

- 2026-08-29: Added route-level metadata, static route documents, canonical
  URLs, structured data, crawler entry points, automated checks, and the
  Search Console handoff.
