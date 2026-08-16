import { HomeNav } from '../components/HomeNav.jsx';
import { ArticleCard } from '../components/ArticleCard.jsx';
import { Footer } from '../components/Footer.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import '../styles/home.css';

const articleGroups = [
    {
        title: 'Posterior surgery',
        articles: [
            {
                className: 'article1',
                to: '/pcdf',
                image: '/pcdfsnap.webp',
                header: 'Posterior Cervical Decompression and Fusion (PCDF)',
                date: 'May 17, 2026',
                description:
                    'PCDF is a spinal procedure performed to relieve compression of the spinal cord and nerves through a posterior approach. It consists of two major components: posterior cervical laminectomy and posterior cervical fixation. Owing to its ability to decompress the spinal cord and provide stabilization, PCDF is a powerful surgical technique…',
            },
            {
                className: 'article3',
                to: '/pcf',
                image: '/pcfsnap.webp',
                header: 'Posterior Cervical Foraminotomy (PCF)',
                date: 'Jun 18, 2026',
                description:
                    'Posterior cervical foraminotomy (PCF) is a surgical procedure that relieves pressure on spine cord and nerves by widening the neural foramen posteriorly. A major advantage of PCF is that it allows patients to preserve range of motion after the surgery. During the procedure, surgeons may additionally perform discectomy or osteophytectomy to…',
            },
            {
                className: 'article5',
                to: '/pcl_open',
                image: '/background.webp',
                header: 'Open-door Posterior Cervical Laminoplasty (Open-door PCL)',
                date: 'Aug 15, 2026',
                description:
                    'Posterior cervical laminoplasty (PCL) is a surgical procedure that relieves pressure on the spinal cord by expanding the spinal canal. There are numerous types of PCL, and this article focuses on one of the most common techniques: Open-door PCL. Open-door PCL consists of four major steps: creation of the hinge…',
            },
        ],
    },
    {
        title: 'Anterior surgery',
        articles: [
            {
                className: 'article2',
                to: '/acdf',
                image: '/acdfsnap.webp',
                header: 'Anterior Cervical Discectomy and Fusion (ACDF)',
                date: 'May 24, 2026',
                description:
                    'Anterior cervical discectomy and fusion (ACDF) is a surgical procedure that aims to relieve compression on the spinal cord and stabilize the cervical spine. ACDF consists of three main procedures: anterior cervical discectomy, interbody cage implantation, and anterior cervical fixation. Compared with posterior cervical decompression and fusion (PCDF), ACDF is…',
            },
            {
                className: 'article4',
                to: '/accf',
                image: '/about.webp',
                header: 'Anterior Cervical Corpectomy and Fusion (ACCF)',
                date: 'Jun 27, 2026',
                description:
                    'Anterior cervical corpectomy and fusion (ACCF) is a surgical procedure that relieves compression on the spinal cord by removing one or more levels of intervertebral discs and the vertebral bodies. The procedure consists of three major steps: anterior cervical discectomy and corpectomy, vertebral body reconstruction, and anterior cervical fixation. By…',
            },
        ],
    },
];

export function Articles() {
    useBodyClass('home-page');

    return (
        <div className="homePage articles-page" id="articles">
            <div className="ambient ambient-one"></div>
            <div className="ambient ambient-two"></div>
            <HomeNav />

            <div className="content article articles-shell">
                <div className="section-heading">
                    <div className="title">A modern atlas of cervical surgery</div>
                </div>

                {articleGroups.map(({ title, articles }) => (
                    <section key={title} className="articles-group">
                        <div className="articles-group-header">
                            <div className="eyebrow">{title}</div>
                        </div>
                        <ul className="article-list articles-list">
                            {articles.map((article) => (
                                <ArticleCard
                                    key={article.to}
                                    className={article.className}
                                    to={article.to}
                                    image={article.image}
                                    header={article.header}
                                    date={article.date}
                                >
                                    {article.description}
                                </ArticleCard>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>

            <Footer />
        </div>
    );
}
