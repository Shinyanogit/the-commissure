import { useLayoutEffect, useRef } from 'react';

export function useBodyClass(className) {
    const viewportHeightRef = useRef(0);
    const resizeFrameRef = useRef(0);

    useLayoutEffect(() => {
        const setViewportHeight = () => {
            resizeFrameRef.current = 0;
            const height = window.visualViewport?.height ?? window.innerHeight;
            if (height === viewportHeightRef.current) return;

            viewportHeightRef.current = height;
            document.documentElement.style.setProperty('--app-height', `${height}px`);
        };

        const scheduleViewportHeight = () => {
            if (resizeFrameRef.current) return;
            resizeFrameRef.current = window.requestAnimationFrame(setViewportHeight);
        };

        setViewportHeight();
        window.addEventListener('resize', scheduleViewportHeight);
        window.visualViewport?.addEventListener('resize', scheduleViewportHeight);

        document.body.classList.add(className);
        return () => {
            if (resizeFrameRef.current) {
                window.cancelAnimationFrame(resizeFrameRef.current);
                resizeFrameRef.current = 0;
            }
            window.removeEventListener('resize', scheduleViewportHeight);
            window.visualViewport?.removeEventListener('resize', scheduleViewportHeight);
            document.body.classList.remove(className);
        };
    }, [className]);
}
