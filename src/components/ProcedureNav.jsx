import { useState } from 'react';
import { Link } from 'react-router-dom';

export function ProcedureNav() {
    const [open, setOpen] = useState(false);

    return (
        <nav>
            <Link to="/"><img src="/logo.png" className="logo" /></Link>
            <div
                className={`hamburger${open ? ' active' : ''}`}
                onClick={() => setOpen((value) => !value)}
            >
                <span></span>
                <span></span>
                <span></span>
            </div>
            <ul className={`nav-list${open ? ' active' : ''}`}>
                <li className="subtitle">Posterior Surgery</li>
                <li><Link to="/pcdf">Posterior Cervical Discectomy and Fusion (PCDF)</Link></li>
                <li><Link to="/pcf">Posterior Cervical Foraminotomy (PCF)</Link></li>
                <li className="subtitle">Anterior Surgery</li>
                <li><Link to="/acdf">Anterior Cervical Discectomy and Fusion (ACDF)</Link></li>
                <li><Link to="/accf">Anterior Cervical Corpectomy and Fusion (ACCF)</Link></li>
            </ul>
        </nav>
    );
}
