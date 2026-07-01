export function ProcedureFooter({ sceneCount, currentScene }) {
    return (
        <footer>
            <div className='indicator'>
                {Array.from({ length: sceneCount }).map((_, i) => (
                    <span
                        key={i}
                        className={`dot ${i === currentScene ? 'active' : ''}`}
                    />
                ))}
            </div>
            <div className="copyright">© 2026 The Commissure</div>
        </footer>
    );
}
