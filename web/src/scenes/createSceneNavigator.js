export function createSceneNavigator({
    scene,
    camera,
    cameraTarget,
    sceneCount,
    getCurrentScene,
    selectScene,
    getIsAnimating,
    setIsAnimating,
    playForward,
    requestRender,
    orbitControls,
}) {
    const sceneStates = new Map();
    const sceneTimelines = new Map();

    const captureState = () => {
        const objects = [];
        scene.traverse((object) => {
            const materials = Array.isArray(object.material)
                ? object.material
                : object.material ? [object.material] : [];
            objects.push({
                object,
                position: object.position.clone(),
                quaternion: object.quaternion.clone(),
                scale: object.scale.clone(),
                visible: object.visible,
                materials: materials.map((material) => ({
                    material,
                    opacity: material.opacity,
                    transparent: material.transparent,
                })),
            });
        });

        return {
            objects,
            cameraPosition: camera.position.clone(),
            cameraUp: camera.up.clone(),
            cameraTarget: cameraTarget.clone(),
            cameraFov: camera.fov,
        };
    };

    const restoreState = (state) => {
        state.objects.forEach(({ object, position, quaternion, scale, visible, materials }) => {
            object.position.copy(position);
            object.quaternion.copy(quaternion);
            object.scale.copy(scale);
            object.visible = visible;
            materials.forEach(({ material, opacity, transparent }) => {
                material.opacity = opacity;
                material.transparent = transparent;
                material.needsUpdate = true;
            });
        });
        camera.position.copy(state.cameraPosition);
        camera.up.copy(state.cameraUp);
        cameraTarget.copy(state.cameraTarget);
        camera.fov = state.cameraFov;
        camera.updateProjectionMatrix();
        orbitControls?.target.copy(cameraTarget);
        orbitControls?.update();
        scene.updateMatrixWorld(true);
        requestRender();
    };

    const prepareReverse = (currentState, previousState) => {
        const currentMaterials = new Map();
        currentState.objects.forEach(({ materials }) => {
            materials.forEach((materialState) => {
                currentMaterials.set(materialState.material, materialState);
            });
        });

        previousState.objects.forEach(({ object, visible, materials }) => {
            if (visible) object.visible = true;
            materials.forEach(({ material, opacity }) => {
                const currentMaterial = currentMaterials.get(material);
                if (!currentMaterial || Math.abs(currentMaterial.opacity - opacity) < 0.0001) return;
                material.transparent = true;
                material.needsUpdate = true;
            });
        });
    };

    const controller = {
        previous: () => {
            const currentScene = getCurrentScene();
            if (getIsAnimating() || currentScene <= 0) return false;

            const previousScene = currentScene - 1;
            const currentState = sceneStates.get(currentScene);
            const previousState = sceneStates.get(previousScene);
            const timeline = sceneTimelines.get(currentScene);
            if (!currentState || !previousState || !timeline) return false;

            setIsAnimating(true);
            if (orbitControls) orbitControls.enabled = false;
            restoreState(currentState);
            prepareReverse(currentState, previousState);
            selectScene(previousScene);
            timeline.eventCallback('onReverseComplete', () => {
                timeline.eventCallback('onReverseComplete', null);
                restoreState(previousState);
                setIsAnimating(false);
                if (orbitControls) orbitControls.enabled = true;
                requestRender();
            });
            timeline.reverse();
            return true;
        },
        next: () => {
            const currentScene = getCurrentScene();
            if (getIsAnimating() || currentScene >= sceneCount - 1 || !sceneStates.has(currentScene)) {
                return false;
            }

            const nextScene = currentScene + 1;
            setIsAnimating(true);
            if (orbitControls) orbitControls.enabled = false;
            restoreState(sceneStates.get(currentScene));
            selectScene(nextScene);
            playForward(nextScene);
            return true;
        },
    };

    return {
        controller,
        capture(sceneIndex) {
            sceneStates.set(sceneIndex, captureState());
        },
        beginForward(sceneIndex) {
            sceneTimelines.get(sceneIndex)?.kill();
        },
        track(sceneIndex, timeline) {
            sceneTimelines.set(sceneIndex, timeline);
        },
        completeForward(sceneIndex) {
            sceneStates.set(sceneIndex, captureState());
            orbitControls?.target.copy(cameraTarget);
            orbitControls?.update();
            if (orbitControls) orbitControls.enabled = true;
        },
        dispose() {
            sceneTimelines.forEach((timeline) => timeline.kill());
            sceneTimelines.clear();
            sceneStates.clear();
        },
    };
}
