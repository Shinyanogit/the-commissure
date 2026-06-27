import { useLayoutEffect } from 'react';

export function useBodyClass(className) {
    useLayoutEffect(() => {
        document.body.classList.add(className);
        return () => {
            document.body.classList.remove(className);
        };
    }, [className]);
}
