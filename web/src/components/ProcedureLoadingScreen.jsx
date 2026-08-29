export function ProcedureLoadingScreen() {
    return (
        <div
            className="procedure-loading-screen"
            role="status"
            aria-live="polite"
            aria-label="Loading procedure"
        >
            <div className="loader" aria-hidden="true"></div>
        </div>
    );
}
