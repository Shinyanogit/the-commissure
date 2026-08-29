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

export const NEWS_ARTICLE_LOOKUP = Object.fromEntries(
    NEWS_ARTICLES.map((article) => [article.slug, article]),
);
