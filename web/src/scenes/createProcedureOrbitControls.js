import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export function createProcedureOrbitControls({ camera, domElement, cameraTarget, requestRender }) {
    camera.lookAt(cameraTarget);

    const controls = new OrbitControls(camera, domElement);
    controls.target.copy(cameraTarget);
    controls.enablePan = true;
    controls.screenSpacePanning = true;
    controls.touches.ONE = THREE.TOUCH.ROTATE;
    controls.touches.TWO = THREE.TOUCH.DOLLY_PAN;

    const handleChange = () => {
        cameraTarget.copy(controls.target);
        requestRender();
    };

    controls.addEventListener('change', handleChange);
    controls.update();

    return {
        controls,
        syncTarget() {
            controls.target.copy(cameraTarget);
            controls.update();
        },
        dispose() {
            controls.removeEventListener('change', handleChange);
            controls.dispose();
        },
    };
}
