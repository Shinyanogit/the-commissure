import { useCallback, useRef } from 'react';

export function useTiltCard() {
    const cardRef = useRef(null);
    const rectRef = useRef(null);

    const cacheRect = useCallback(() => {
        const card = cardRef.current;
        if (!card) return null;

        const rect = card.getBoundingClientRect();
        rectRef.current = rect;
        return rect;
    }, []);

    const handleMouseEnter = useCallback(() => {
        cacheRect();
    }, [cacheRect]);

    const handleMouseMove = useCallback((event) => {
        const card = cardRef.current;
        if (!card) return;

        const rect = rectRef.current ?? cacheRect();
        if (!rect) return;

        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * 8;
        const rotateX = ((0.5 - (y / rect.height))) * 8;

        card.style.setProperty('--tilt-x', `${rotateX.toFixed(2)}deg`);
        card.style.setProperty('--tilt-y', `${rotateY.toFixed(2)}deg`);
        card.style.transform = `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-8px) scale(1.01)`;
    }, []);

    const handleMouseLeave = useCallback(() => {
        const card = cardRef.current;
        if (!card) return;

        card.style.transform = '';
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
        rectRef.current = null;
    }, []);

    return { cardRef, handleMouseEnter, handleMouseMove, handleMouseLeave };
}
