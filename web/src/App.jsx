import { Route, Routes, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Accf } from './pages/Accf.jsx';
import { Acdf } from './pages/Acdf.jsx';
import { Home } from './pages/Home.jsx';
import { Pcdf } from './pages/Pcdf.jsx';
import { Pcf } from './pages/Pcf.jsx';

function ScrollToTop() {
    const { pathname } = useLocation();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return null;
}

export function App() {
    return (
        <>
            <ScrollToTop />
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/acdf" element={<Acdf />} />
                <Route path="/accf" element={<Accf />} />
                <Route path="/pcdf" element={<Pcdf />} />
                <Route path="/pcf" element={<Pcf />} />
            </Routes>
        </>
    );
}
