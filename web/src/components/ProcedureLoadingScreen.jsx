export function ProcedureLoadingScreen() {
    return (
        <div
            className="procedure-loading-screen"
            role="status"
            aria-live="polite"
            aria-label="Loading procedure"
        >
            <div className="procedure-loading-mark" aria-hidden="true">
                <img
                    className="procedure-loading-logo procedure-loading-logo-base"
                    src="/logo.png"
                    alt=""
                />
                <img
                    className="procedure-loading-logo procedure-loading-logo-progress"
                    src="/logo.png"
                    alt=""
                />
            </div>
        </div>
    );
}
