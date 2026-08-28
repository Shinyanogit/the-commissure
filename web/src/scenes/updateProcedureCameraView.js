export function updateProcedureCameraView(camera, root) {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panel = root.querySelector('.procedure-hero-card.open');

    camera.aspect = viewportWidth / viewportHeight;

    if (!panel) {
        camera.clearViewOffset();
        camera.updateProjectionMatrix();
        return;
    }

    const panelBounds = panel.getBoundingClientRect();
    const isPortrait = window.matchMedia('(orientation: portrait)').matches;
    const offsetX = isPortrait ? 0 : panelBounds.width / 2;
    const offsetY = isPortrait ? panelBounds.height / 2 : 0;

    camera.setViewOffset(
        viewportWidth,
        viewportHeight,
        offsetX,
        offsetY,
        viewportWidth,
        viewportHeight,
    );
}
