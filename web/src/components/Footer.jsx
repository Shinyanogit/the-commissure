import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer>
            <Link to="/" className="footer-brand">
                <img src="/icon.png" className="icon" alt="The Commissure icon" />
            </Link>
            <ul className="footer-list">
                <li><Link to="/articles">Articles</Link></li>
                <li><Link to="/#about">About us</Link></li>
                <li><Link to="/#authors">Authors</Link></li>
            </ul>
            <div className="copyright">© 2026 The Commissure</div>
        </footer>
    );
}
