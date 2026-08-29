import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import {
    INDEXABLE_ROUTES,
    createStructuredData,
    getRouteMetadata,
} from '../src/seo/routeMetadata.js';

const DIST_DIRECTORY = 'dist';
const METADATA_BLOCK = /<!-- SEO_ROUTE_METADATA_START -->[\s\S]*?<!-- SEO_ROUTE_METADATA_END -->/;

const escapeAttribute = (value) => String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');

const renderMeta = (attribute, name, content) => (
    `    <meta data-seo-managed="true" ${attribute}="${escapeAttribute(name)}" content="${escapeAttribute(content)}" />`
);

const renderRouteMetadata = (metadata) => {
    const structuredData = JSON.stringify(createStructuredData(metadata)).replaceAll('<', '\\u003c');
    const lines = [
        '<!-- SEO_ROUTE_METADATA_START -->',
        `    <title data-seo-managed="true">${escapeAttribute(metadata.title)}</title>`,
        renderMeta('name', 'description', metadata.description),
        renderMeta('name', 'robots', 'index, follow'),
        renderMeta('property', 'og:site_name', 'The Commissure'),
        renderMeta('property', 'og:locale', 'en_US'),
        renderMeta('property', 'og:type', metadata.type),
        renderMeta('property', 'og:title', metadata.title),
        renderMeta('property', 'og:description', metadata.description),
        renderMeta('property', 'og:url', metadata.canonical),
        renderMeta('property', 'og:image', metadata.image),
        renderMeta('property', 'og:image:alt', metadata.imageAlt),
        renderMeta('property', 'og:image:width', metadata.imageWidth),
        renderMeta('property', 'og:image:height', metadata.imageHeight),
        renderMeta('name', 'twitter:card', 'summary_large_image'),
        renderMeta('name', 'twitter:title', metadata.title),
        renderMeta('name', 'twitter:description', metadata.description),
        renderMeta('name', 'twitter:image', metadata.image),
        `    <link data-seo-managed="true" rel="canonical" href="${escapeAttribute(metadata.canonical)}" />`,
    ];

    if (metadata.datePublished) {
        lines.push(renderMeta('property', 'article:published_time', metadata.datePublished));
        lines.push(renderMeta('property', 'article:modified_time', metadata.datePublished));
    }

    lines.push(`    <script data-seo-managed="true" id="route-structured-data" type="application/ld+json">${structuredData}</script>`);
    lines.push('    <!-- SEO_ROUTE_METADATA_END -->');
    return lines.join('\n');
};

const routeFilename = (route) => route === '/'
    ? 'index.html'
    : `${route.slice(1)}.html`;

const shell = await readFile(join(DIST_DIRECTORY, 'index.html'), 'utf8');
if (!METADATA_BLOCK.test(shell)) {
    throw new Error('SEO metadata markers were not found in dist/index.html');
}

for (const route of INDEXABLE_ROUTES) {
    const metadata = getRouteMetadata(route);
    const html = shell.replace(METADATA_BLOCK, renderRouteMetadata(metadata));
    const filename = routeFilename(route);
    await writeFile(join(DIST_DIRECTORY, filename), html);
    console.log(`Generated ${filename} for ${route}`);
}
