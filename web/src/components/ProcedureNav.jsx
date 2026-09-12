import { memo, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function ProcedureNavComponent({ stowed = false }) {
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (stowed) setOpen(false);
    }, [stowed]);

    const closeMenu = () => setOpen(false);

    return (
        <nav className="procedure-nav">
            <Link to="/" className="procedure-logo-link" aria-label="Go to home">
                <img src="/logo.png" className="logo" alt="The Commissure" />
            </Link>
            <button
                type="button"
                className={`hamburger${open ? ' active' : ''}`}
                onClick={() => setOpen((value) => !value)}
                aria-label="Toggle navigation"
                aria-expanded={open}
                aria-controls="procedure-navigation-menu"
            >
                <span></span>
                <span></span>
                <span></span>
            </button>
            <ul id="procedure-navigation-menu" className={`nav-list${open ? ' active' : ''}`}>
                <li className="subtitle">Posterior Surgery</li>
                <li><Link to="/pcdf" onClick={closeMenu}>Posterior Cervical Discectomy and Fusion (PCDF)</Link></li>
                <li><Link to="/pcf" onClick={closeMenu}>Posterior Cervical Foraminotomy (PCF)</Link></li>
                <li><Link to="/pcl_open" onClick={closeMenu}>Open Door Posterior Cervical Laminectomy (Open-door PCL)</Link></li>
                <li className="subtitle">Anterior Surgery</li>
                <li><Link to="/acdf" onClick={closeMenu}>Anterior Cervical Discectomy and Fusion (ACDF)</Link></li>
                <li><Link to="/accf" onClick={closeMenu}>Anterior Cervical Corpectomy and Fusion (ACCF)</Link></li>
            </ul>
        </nav>
    );
}

export const ProcedureNav = memo(ProcedureNavComponent);
