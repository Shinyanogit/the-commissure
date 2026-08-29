export const SITE_NAME = 'The Commissure';
export const SITE_URL = 'https://the-commissure.vercel.app';

const ORGANIZATION = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: SITE_NAME,
    url: SITE_URL,
};

const PROCEDURES = [
    {
        path: '/pcdf',
        name: 'Posterior Cervical Decompression and Fusion (PCDF)',
        shortName: 'PCDF',
        image: '/pcdfsnap.webp',
        datePublished: '2026-05-17',
        description: 'Explore posterior cervical decompression and fusion (PCDF) through an interactive 3D model and a clear, step-by-step surgical guide.',
    },
    {
        path: '/acdf',
        name: 'Anterior Cervical Discectomy and Fusion (ACDF)',
        shortName: 'ACDF',
        image: '/acdfsnap.webp',
        datePublished: '2026-05-24',
        description: 'Explore anterior cervical discectomy and fusion (ACDF) through an interactive 3D model and a clear, step-by-step surgical guide.',
    },
    {
        path: '/pcf',
        name: 'Posterior Cervical Foraminotomy (PCF)',
        shortName: 'PCF',
        image: '/pcfsnap.webp',
        datePublished: '2026-06-18',
        description: 'Explore posterior cervical foraminotomy (PCF) through an interactive 3D model and a clear, step-by-step surgical guide.',
    },
    {
        path: '/accf',
        name: 'Anterior Cervical Corpectomy and Fusion (ACCF)',
        shortName: 'ACCF',
        image: '/accfsnap.webp',
        datePublished: '2026-06-27',
        description: 'Explore anterior cervical corpectomy and fusion (ACCF) through an interactive 3D model and a clear, step-by-step surgical guide.',
    },
    {
        path: '/pcl_open',
        name: 'Open-door Posterior Cervical Laminoplasty',
        shortName: 'Open-door PCL',
        image: '/openpclsnap.webp',
        datePublished: '2026-08-15',
        description: 'Explore open-door posterior cervical laminoplasty through an interactive 3D model and a clear, step-by-step surgical guide.',
    },
];

const absoluteUrl = (path) => new URL(path, SITE_URL).href;

const procedureMetadata = Object.fromEntries(PROCEDURES.map((procedure) => [
    procedure.path,
    {
        ...procedure,
        title: `${procedure.shortName} Interactive 3D Guide | ${SITE_NAME}`,
        canonical: absoluteUrl(procedure.path),
        image: absoluteUrl(procedure.image),
        imageAlt: `${procedure.name} interactive 3D guide`,
        type: 'article',
    },
]));

export const ROUTE_METADATA = {
    '/': {
        path: '/',
        title: `${SITE_NAME} | Interactive Spine Surgery Education`,
        description: 'Explore cervical spine surgery through interactive 3D models and clear, step-by-step articles created by medical students.',
        canonical: `${SITE_URL}/`,
        image: absoluteUrl('/pcdfsnap.webp'),
        imageAlt: 'Interactive cervical spine surgery model from The Commissure',
        type: 'website',
    },
    '/articles': {
        path: '/articles',
        title: `Cervical Spine Surgery Articles | ${SITE_NAME}`,
        description: 'Browse interactive 3D guides to anterior and posterior cervical spine procedures, including ACDF, ACCF, PCDF, PCF, and laminoplasty.',
        canonical: absoluteUrl('/articles'),
        image: absoluteUrl('/about.webp'),
        imageAlt: 'Cervical spine surgery articles from The Commissure',
        type: 'website',
    },
    ...procedureMetadata,
};

export const INDEXABLE_ROUTES = Object.keys(ROUTE_METADATA);

export function normalizePathname(pathname) {
    if (!pathname || pathname === '/') return '/';
    return pathname.replace(/\/+$/, '') || '/';
}

export function getRouteMetadata(pathname) {
    const normalizedPath = normalizePathname(pathname);
    return ROUTE_METADATA[normalizedPath] ?? {
        path: normalizedPath,
        title: `Page not found | ${SITE_NAME}`,
        description: 'The requested page could not be found.',
        canonical: absoluteUrl(normalizedPath),
        image: absoluteUrl('/pcdfsnap.webp'),
        imageAlt: 'The Commissure',
        type: 'website',
        noindex: true,
    };
}

export function createStructuredData(metadata) {
    if (metadata.noindex) return null;

    const webPage = {
        '@type': metadata.type === 'article' ? 'Article' : 'WebPage',
        '@id': `${metadata.canonical}#webpage`,
        url: metadata.canonical,
        name: metadata.title,
        description: metadata.description,
        inLanguage: 'en',
        isPartOf: { '@id': `${SITE_URL}/#website` },
        primaryImageOfPage: {
            '@type': 'ImageObject',
            url: metadata.image,
        },
    };

    if (metadata.type === 'article') {
        Object.assign(webPage, {
            headline: metadata.name,
            image: [metadata.image],
            datePublished: metadata.datePublished,
            dateModified: metadata.datePublished,
            author: ORGANIZATION,
            publisher: ORGANIZATION,
            mainEntityOfPage: metadata.canonical,
            isAccessibleForFree: true,
            about: {
                '@type': 'MedicalProcedure',
                name: metadata.name,
            },
        });
    }

    const graph = [
        ORGANIZATION,
        {
            '@type': 'WebSite',
            '@id': `${SITE_URL}/#website`,
            url: `${SITE_URL}/`,
            name: SITE_NAME,
            publisher: { '@id': ORGANIZATION['@id'] },
            inLanguage: 'en',
        },
        webPage,
    ];

    if (metadata.path === '/articles') {
        graph.push({
            '@type': 'ItemList',
            '@id': `${metadata.canonical}#procedures`,
            itemListElement: PROCEDURES.map((procedure, index) => ({
                '@type': 'ListItem',
                position: index + 1,
                name: procedure.name,
                url: absoluteUrl(procedure.path),
            })),
        });
    }

    return {
        '@context': 'https://schema.org',
        '@graph': graph,
    };
}
