import { Link } from 'react-router-dom';

export function NewsCard({ article }) {
    return (
        <li className="news-card">
            <Link to={`/news/${article.slug}`}>
                <div className="news-card-meta">
                    <span className="eyebrow news-card-eyebrow">{article.category}</span>
                    <time dateTime={article.date}>{article.dateLabel}</time>
                </div>
                <div className="news-card-title">{article.title}</div>
                <div className="news-card-summary">{article.summary}</div>
            </Link>
        </li>
    );
}
