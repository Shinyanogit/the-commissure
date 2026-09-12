export const NEWS_ARTICLES = [
    {
        slug: 'jsmvr',
        title: 'The Commissure Presented at the 25th Annual Meeting of the Japanese Society for Medical VR',
        date: '2026-08-29',
        dateLabel: 'Aug 29, 2026',
        category: 'Conference',
        summary: 'The Commissure was presented at the 25th Annual Meeting of the Japanese Society for Medical VR as both a Podium Oral Presentation and a Student Ideathon Presentation, introducing the project to researchers, clinicians, and students interested in medical VR and medical education.',
        content: [
            'The Commissure is a web-based 3D spine surgery education platform that was established and was developed by a group of medical students. Our project was presented at the 25th Annual Meeting of the Japanese Society for Medical VR (JSMVR) as both the Podium Oral Presentation and the Student Ideathon Presentation. Throughout the conference, we have introduced our motivation, development process and the current status of The Commissure to the researchers, clinicians, and students in the field of medical VR and medical education.',
            'By interacting with the beautiful minds of the participants, we have received valuable feedback and suggestions for the future development of The Commissure. Namely, we have received feedback on the impact of shaping our project as VR-based, the potential of expanding our project to other surgical procedures, and the importance of providing a more comprehensive educational experience for learners. We are grateful for the opportunity to present our project at JSMVR and we look forward to continuing to improve The Commissure based on the feedback we have received.'
        ],
        attachments: [
            {
                type: 'pdf',
                title: 'JSMVR Presentation Slides',
                url: '/JSMVR%20Presentation.pdf',
            },
        ],
    },
];

export const NEWS_UPDATES = [
    {
        label: 'The Commissure Presented at the 25th Annual Meeting of the Japanese Society for Medical VR',
        date: '2026-08-29',
        dateLabel: 'Aug 29, 2026',
        to: '/news/jsmvr',
    },
    {
        label: 'Search metadata and a sitemap were added for all published procedure guides',
        date: '2026-08-29',
        dateLabel: 'Aug 29, 2026',
        to: '/articles',
    },
    {
        label: "Shinya Yamaguchi's author profile now links to his portfolio",
        date: '2026-08-29',
        dateLabel: 'Aug 29, 2026',
        href: 'https://shinyanogit.github.io/',
        external: true,
    },
    {
        label: 'Procedure pages now show a branded transition while each 3D scene prepares',
        date: '2026-08-29',
        dateLabel: 'Aug 29, 2026',
        to: '/acdf',
    },
    {
        label: 'Procedure navigation and explanation controls were redesigned for desktop and mobile',
        date: '2026-08-29',
        dateLabel: 'Aug 29, 2026',
        to: '/pcdf',
    },
    {
        label: 'Procedure models now support orbit, zoom, pan, and synchronized reversible step transitions',
        date: '2026-08-29',
        dateLabel: 'Aug 29, 2026',
        to: '/pcdf',
    },
    {
        label: 'Article on Open Door Posterior Cervical Laminoplasty (Open-door PCL) is now available',
        date: '2026-08-15',
        dateLabel: 'Aug 15, 2026',
        to: '/pcl_open',
    },
    {
        label: 'Koki Tokida joined the editorial board',
        date: '2026-06-27',
        dateLabel: 'Jun 27, 2026',
        href: '',
    },
    {
        label: 'Article on Anterior Cervical Corpectomy and Fusion (ACCF) is now available',
        date: '2026-06-27',
        dateLabel: 'Jun 27, 2026',
        to: '/accf',
    },
    {
        label: 'Shinya Yamaguchi joined the editorial board',
        date: '2026-06-26',
        dateLabel: 'Jun 26, 2026',
        href: '',
    },
    {
        label: 'Article on Posterior Cervical Foraminotomy (PCF) is now available',
        date: '2026-06-18',
        dateLabel: 'Jun 18, 2026',
        to: '/pcf',
    },
    {
        label: 'Article on Anterior Cervical Discectomy and Fusion (ACDF) is now available',
        date: '2026-05-24',
        dateLabel: 'May 24, 2026',
        to: '/acdf',
    },
];

export const NEWS_ARTICLE_LOOKUP = Object.fromEntries(
    NEWS_ARTICLES.map((article) => [article.slug, article]),
);
