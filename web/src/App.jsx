import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Accf } from './pages/Accf.jsx';
import { Acdf } from './pages/Acdf.jsx';
import { Articles } from './pages/Articles.jsx';
import { Home } from './pages/Home.jsx';
import { NewsPage } from './pages/NewsPage.jsx';
import { NewsArticlePage } from './pages/NewsArticlePage.jsx';
import { Pcdf } from './pages/Pcdf.jsx';
import { Pcf } from './pages/Pcf.jsx';
import { Pcl_open } from './pages/Pcl_open.jsx';
import { Seo } from './components/Seo.jsx';

function ScrollToLocation() {
    const { pathname, hash } = useLocation();

    useEffect(() => {
        if (!hash) {
            window.scrollTo(0, 0);
            return undefined;
        }

        const targetId = decodeURIComponent(hash.slice(1));
        const frameId = window.requestAnimationFrame(() => {
            const target = document.getElementById(targetId);
            if (!target) return;

            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            const navigationHeight = document.querySelector('.home-nav')?.getBoundingClientRect().height ?? 0;
            let targetTop = 0;
            let currentElement = target;
            while (currentElement) {
                targetTop += currentElement.offsetTop;
                currentElement = currentElement.offsetParent;
            }

            window.scrollTo({
                top: Math.max(0, targetTop - navigationHeight - 12),
                behavior: reduceMotion ? 'auto' : 'smooth',
            });
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [pathname, hash]);

    return null;
}

export function App() {
    return (
        <>
            <ScrollToLocation />
            <Seo />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/articles" element={<Articles />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/:slug" element={<NewsArticlePage />} />
                <Route path="/acdf" element={<Acdf />} />
                <Route path="/accf" element={<Accf />} />
                <Route path="/pcdf" element={<Pcdf />} />
                <Route path="/pcf" element={<Pcf />} />
                <Route path="/pcl_open" element={<Pcl_open />} />
            </Routes>
        </>
    );
}
