import { useLayoutEffect } from 'react';

export function useBodyClass(className) {
    useLayoutEffect(() => {
        const setViewportHeight = () => {
            const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
            const pageHeight = Math.max(
                viewportHeight,
                document.documentElement.scrollHeight,
                document.body.scrollHeight
            );
            document.documentElement.style.setProperty('--viewport-height', `${viewportHeight}px`);
            document.documentElement.style.setProperty('--page-height', `${pageHeight}px`);
        };

        setViewportHeight();
        window.addEventListener('resize', setViewportHeight);
        window.addEventListener('scroll', setViewportHeight, { passive: true });
        window.visualViewport?.addEventListener('resize', setViewportHeight);

        document.body.classList.add(className);
        return () => {
            window.removeEventListener('resize', setViewportHeight);
            window.removeEventListener('scroll', setViewportHeight);
            window.visualViewport?.removeEventListener('resize', setViewportHeight);
            document.body.classList.remove(className);
        };
    }, [className]);
}
