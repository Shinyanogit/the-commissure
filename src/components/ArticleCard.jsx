import { Link } from 'react-router-dom';

export function ArticleCard({ className, to, image, header, date, children }) {
    return (
        <li className={`article-card ${className}`}>
            <Link to={to}>
                <img src={image} />
                <div className="header">{header}</div>
                <div className="date">{date}</div>
                <div className="paragraph">{children}</div>
            </Link>
        </li>
    );
}
