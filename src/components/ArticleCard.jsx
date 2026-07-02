import { Link } from 'react-router-dom';
import { useTiltCard } from './useTiltCard.js';

export function ArticleCard({ className, to, image, header, date, children }) {
    const { cardRef, handleMouseMove, handleMouseLeave } = useTiltCard();

    return (
        <li
            className={`article-card ${className}`}
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
        >
            <Link to={to}>
                <div className="image-shell">
                    <img src={image} alt={header} />
                </div>
                <div className="card-copy">
                    <div className="header">{header}</div>
                    <div className="date">{date}</div>
                    <div className="paragraph">{children}</div>
                </div>
            </Link>
        </li>
    );
}
