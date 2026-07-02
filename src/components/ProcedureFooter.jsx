export function ProcedureFooter({ sceneCount, currentScene }) {
    return (
        <footer className="procedure-footer">
            <div className="indicator">
                {Array.from({ length: sceneCount }).map((_, i) => (
                    <span
                        key={i}
                        className={`dot ${i === currentScene ? 'active' : ''}`}
                    />
                ))}
            </div>
            <div className="footer-meta">
                <span className="footer-label">Atlas progression</span>
                <span className="copyright">© 2026 The Commissure</span>
            </div>
        </footer>
    );
}
