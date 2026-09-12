import { HomeNav } from '../components/HomeNav.jsx';
import { Footer } from '../components/Footer.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import { NEWS_UPDATES } from '../content/newsData.js';

export function NewsPage() {
    useBodyClass('home-page');

    const articles = [...NEWS_UPDATES].sort((a, b) => new Date(b.date) - new Date(a.date));

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

                <ul className="news-list" id="news-page-list">
                    {articles.map((update) => (
                        <li key={`${update.label}-${update.date}`}>
                            <span className="header">
                                {update.to ? (
                                    <a href={update.to}>{update.label}</a>
                                ) : (
                                    <a
                                        href={update.href}
                                        target={update.external ? '_blank' : undefined}
                                        rel={update.external ? 'noreferrer' : undefined}
                                    >
                                        {update.label}
                                    </a>
                                )}
                            </span>
                            <span className="date">{update.dateLabel}</span>
                        </li>
                    ))}
                </ul>
            </main>

            <Footer />
        </div>
    );
}
