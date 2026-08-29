import { useParams } from 'react-router-dom';
import { NewsArticle } from '../components/NewsArticle.jsx';
import { NEWS_ARTICLE_LOOKUP } from '../content/newsData.js';

export function NewsArticlePage() {
    const { slug } = useParams();
    const article = NEWS_ARTICLE_LOOKUP[slug];

    if (!article) {
        return (
            <div className="homePage news-page">
                <div className="content news-article-shell">
                    <div className="section-heading">
                        <div className="title">News article not found</div>
                    </div>
                </div>
            </div>
        );
    }

    return <NewsArticle article={article} />;
}
