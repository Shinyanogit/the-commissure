import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

export function HomeNav() {
    const [open, setOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const tickingRef = useRef(false);

    useEffect(() => {
        const updateScrolled = () => {
            tickingRef.current = false;
            setScrolled((current) => {
                const next = window.scrollY > 24;
                return current === next ? current : next;
            });
        };

        updateScrolled();

        const onScroll = () => {
            if (tickingRef.current) return;
            tickingRef.current = true;
            window.requestAnimationFrame(updateScrolled);
        };

        window.addEventListener('scroll', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            tickingRef.current = false;
        };
    }, []);

    return (
        <nav className={`home-nav${scrolled ? ' scrolled' : ''}`}>
            <Link to="/" className="nav-logo-link">
                <img src="/logo.png" className="logo" alt="The Commissure" />
            </Link>
            <div
                className={`hamburger${open ? ' active' : ''}`}
                onClick={() => setOpen((value) => !value)}
                aria-label="Toggle navigation"
            >
                <span></span>
                <span></span>
                <span></span>
            </div>
            <ul className={`nav-list${open ? ' active' : ''}`}>
                <li><a href="#articles">Articles</a></li>
                <li><a href="#about">About us</a></li>
                <li><a href="#authors">Authors</a></li>
            </ul>
        </nav>
    );
}
