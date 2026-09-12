import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { createStructuredData, getRouteMetadata } from '../seo/routeMetadata.js';

const upsertMeta = (selector, attributes) => {
    let element = document.head.querySelector(selector);
    if (!element) {
        element = document.createElement('meta');
        element.dataset.seoManaged = 'true';
        document.head.append(element);
    }
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
};

const upsertLink = (selector, attributes) => {
    let element = document.head.querySelector(selector);
    if (!element) {
        element = document.createElement('link');
        element.dataset.seoManaged = 'true';
        document.head.append(element);
    }
    Object.entries(attributes).forEach(([name, value]) => element.setAttribute(name, value));
};

export function Seo() {
    const { pathname } = useLocation();

    useEffect(() => {
        const metadata = getRouteMetadata(pathname);
        const robots = metadata.noindex ? 'noindex, nofollow' : 'index, follow';

        document.title = metadata.title;
        upsertMeta('meta[name="description"]', { name: 'description', content: metadata.description });
        upsertMeta('meta[name="robots"]', { name: 'robots', content: robots });
        upsertMeta('meta[property="og:site_name"]', { property: 'og:site_name', content: 'The Commissure' });
        upsertMeta('meta[property="og:type"]', { property: 'og:type', content: metadata.type });
        upsertMeta('meta[property="og:title"]', { property: 'og:title', content: metadata.title });
        upsertMeta('meta[property="og:description"]', { property: 'og:description', content: metadata.description });
        upsertMeta('meta[property="og:url"]', { property: 'og:url', content: metadata.canonical });
        upsertMeta('meta[property="og:image"]', { property: 'og:image', content: metadata.image });
        upsertMeta('meta[property="og:image:alt"]', { property: 'og:image:alt', content: metadata.imageAlt });
        upsertMeta('meta[property="og:image:width"]', { property: 'og:image:width', content: metadata.imageWidth });
        upsertMeta('meta[property="og:image:height"]', { property: 'og:image:height', content: metadata.imageHeight });
        upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
        upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: metadata.title });
        upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: metadata.description });
        upsertMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: metadata.image });
        upsertLink('link[rel="canonical"]', { rel: 'canonical', href: metadata.canonical });

        document.head.querySelectorAll('meta[property^="article:"]').forEach((element) => element.remove());
        if (metadata.datePublished) {
            upsertMeta('meta[property="article:published_time"]', { property: 'article:published_time', content: metadata.datePublished });
            upsertMeta('meta[property="article:modified_time"]', { property: 'article:modified_time', content: metadata.datePublished });
        }

        let structuredData = document.head.querySelector('#route-structured-data');
        const payload = createStructuredData(metadata);
        if (!payload) {
            structuredData?.remove();
            return;
        }
        if (!structuredData) {
            structuredData = document.createElement('script');
            structuredData.id = 'route-structured-data';
            structuredData.type = 'application/ld+json';
            structuredData.dataset.seoManaged = 'true';
            document.head.append(structuredData);
        }
        structuredData.textContent = JSON.stringify(payload).replaceAll('<', '\\u003c');
    }, [pathname]);

    return null;
}
