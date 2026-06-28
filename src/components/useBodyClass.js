import { useLayoutEffect } from 'react';

export function useBodyClass(className) {
    useLayoutEffect(() => {
        const setViewportHeight = () => {
            const height = window.visualViewport?.height ?? window.innerHeight;
            document.documentElement.style.setProperty('--app-height', `${height}px`);
        };

        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.visualViewport?.addEventListener('resize', setViewportHeight);

        document.body.classList.add(className);
        return () => {
            window.removeEventListener('resize', setViewportHeight);
            window.visualViewport?.removeEventListener('resize', setViewportHeight);
            document.body.classList.remove(className);
        };
    }, [className]);
}
