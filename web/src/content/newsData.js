export const NEWS_ARTICLES = [
    {
        slug: 'jsmvr',
        title: 'The Commissure Presented at the 25th Annual Meeting of the Japanese Society for Medical VR',
        date: '2026-08-29',
        dateLabel: 'Aug 29, 2026',
        category: 'Conference',
        summary: 'The Commissure was presented at the 25th Annual Meeting of the Japanese Society for Medical VR as both a Podium Oral Presentation and a Student Ideathon presentation, introducing the project to researchers, clinicians, and students interested in medical VR and medical education.',
        content: [
            'The Commissure was presented at the 25th Annual Meeting of the Japanese Society for Medical VR (JSMVR).',
            'The project was presented as a Podium Oral Presentation and was also presented in the Student Ideathon.',
            'These presentations introduced the background and motivation behind the development of The Commissure, the development process, and the features and product of the completed web-based 3D educational platform.',
            'This opportunity allowed the team to share the project with researchers, clinicians, and students interested in medical VR and medical education, while also discussing future directions and potential collaborations.',
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

export const NEWS_ARTICLE_LOOKUP = Object.fromEntries(
    NEWS_ARTICLES.map((article) => [article.slug, article]),
);
