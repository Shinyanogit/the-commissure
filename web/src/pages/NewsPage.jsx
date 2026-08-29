import { HomeNav } from '../components/HomeNav.jsx';
import { Footer } from '../components/Footer.jsx';
import { NewsCard } from '../components/NewsCard.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import { NEWS_ARTICLES } from '../content/newsData.js';

export function NewsPage() {
    useBodyClass('home-page');

    const articles = [...NEWS_ARTICLES].sort((a, b) => new Date(b.date) - new Date(a.date));

    return (
        <div className="homePage news-page">
            <div className="ambient ambient-one"></div>
            <div className="ambient ambient-two"></div>
            <HomeNav />

            <main className="content news-page-shell">
                <div className="section-heading">
                    <div className="eyebrow">Latest news</div>
                    <div className="title">Announcements from The Commissure</div>
                </div>

                <ul className="news-card-list">
                    {articles.map((article) => (
                        <NewsCard key={article.slug} article={article} />
                    ))}
                </ul>
            </main>

            <Footer />
        </div>
    );
}
