export function NewsAttachment({ attachment }) {
    if (!attachment) return null;

    const isPdf = attachment.type === 'pdf' || attachment.url.toLowerCase().endsWith('.pdf');

    return (
        <section className="news-attachment" aria-labelledby="presentation-slides-title">
            <div className="news-attachment-header">
                <div className="eyebrow">{attachment.title}</div>
            </div>

            {isPdf && (
                <div className="pdf-embed-shell" role="region" aria-label={attachment.title}>
                    <object data={attachment.url} type="application/pdf" aria-label={attachment.title}>
                        <div className="pdf-fallback">
                            <p>Your browser does not support inline PDF viewing.</p>
                            <a href={attachment.url} target="_blank" rel="noreferrer">
                                Open the PDF in a new tab
                            </a>
                        </div>
                    </object>
                </div>
            )}

            <a className="news-attachment-link" href={attachment.url} target="_blank" rel="noreferrer">
                Open {attachment.title} in a new tab
            </a>
        </section>
    );
}
