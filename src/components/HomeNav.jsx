import { useState } from 'react';
import { Link } from 'react-router-dom';

export function HomeNav() {
    const [open, setOpen] = useState(false);

    return (
        <nav>
            <Link to="/"><img src="" className="logo" /></Link>
            <div
                className={`hamburger${open ? ' active' : ''}`}
                onClick={() => setOpen((value) => !value)}
            >
                <span></span>
                <span></span>
                <span></span>
            </div>
            <ul className={`nav-list${open ? ' active' : ''}`}>
                <li><a href="">Articles</a></li>
                <li><a href="">About us</a></li>
                <li><a href="">Authors</a></li>
            </ul>
        </nav>
    );
}
