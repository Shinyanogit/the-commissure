import { HomeNav } from './HomeNav.jsx';
import { Footer } from './Footer.jsx';
import { useBodyClass } from './useBodyClass.js';
import { NewsAttachment } from './NewsAttachment.jsx';

export function NewsArticle({ article }) {
    useBodyClass('home-page');

    return (
        <div className="homePage news-page">
            <div className="ambient ambient-one"></div>
            <div className="ambient ambient-two"></div>
            <HomeNav />

            <main className="content news-article-shell" aria-label={article.title}>
                <article>
                    <header className="news-article-header">
                        <div className="eyebrow">{article.category}</div>
                        <h1 className="title">{article.title}</h1>
                        <div className="news-article-meta">
                            <time dateTime={article.date}>{article.dateLabel}</time>
                        </div>
                    </header>

                    <p className="news-summary">{article.summary}</p>

                    <div className="news-article-body">
                        {article.content.map((paragraph) => (
                            <p key={paragraph}>{paragraph}</p>
                        ))}
                    </div>

                    {article.attachments?.length > 0 && (
                        <div className="news-attachments-wrap">
                            {article.attachments.map((attachment) => (
                                <NewsAttachment key={attachment.title} attachment={attachment} />
                            ))}
                        </div>
                    )}
                </article>
            </main>

            <Footer />
        </div>
    );
}
