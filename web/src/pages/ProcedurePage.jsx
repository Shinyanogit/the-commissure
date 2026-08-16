import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ProcedureNav } from '../components/ProcedureNav.jsx';
import { ProcedureFooter } from '../components/ProcedureFooter.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import { procedureText } from '../content/procedureText.js';
import '../styles/procedure.css';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const createInitialCardSize = () => {
    if (typeof window === 'undefined') {
        return { width: 780, height: 332 };
    }

    const sideGutter = window.innerWidth <= 640 ? 16 : window.innerWidth <= 900 ? 19 : 40;
    const maxWidth = Math.max(280, window.innerWidth - (sideGutter * 2));
    const maxHeight = Math.max(220, window.innerHeight - 160);

    return {
        width: Math.min(780, maxWidth),
        height: Math.min(332, maxHeight),
    };
};

export function ProcedurePage({ page, initScene }) {
    const mountRef = useRef(null);
    const rootRef = useRef(null);
    const shellRef = useRef(null);
    const cardRef = useRef(null);
    const cardMotionRef = useRef(null);
    const dragStateRef = useRef({
        pointerId: null,
        startX: 0,
        startY: 0,
        startRect: null,
        startPosition: { x: 0, y: 0 },
        hasDragged: false,
    });
    const touchPointsRef = useRef(new Map());
    const pinchStateRef = useRef({
        active: false,
        startDistance: 0,
        startSize: null,
        startPosition: { x: 0, y: 0 },
        startRect: null,
        anchorX: 0.5,
        anchorY: 0.5,
    });
    const suppressClickRef = useRef(false);
    const cardPositionRef = useRef({ x: 0, y: 0 });
    const cardSizeRef = useRef(createInitialCardSize());
    const defaultCardSizeRef = useRef(null);
    const hasUserResizedRef = useRef(false);
    const isPinchingRef = useRef(false);
    const navigate = useNavigate();

    const data = procedureText[page];

    const [currentScene, setCurrentScene] = useState(0);
    const [isExplanationOpen, setIsExplanationOpen] = useState(false);
    const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
    const [cardSize, setCardSize] = useState(() => createInitialCardSize());
    const [isCardSizeLocked, setIsCardSizeLocked] = useState(false);
    const [isDraggingCard, setIsDraggingCard] = useState(false);
    const [isPinchingCard, setIsPinchingCard] = useState(false);

    useBodyClass('procedure-page');

    useEffect(() => {
        cardPositionRef.current = cardPosition;
    }, [cardPosition]);

    useEffect(() => {
        cardSizeRef.current = cardSize;
    }, [cardSize]);

    const getCardSizeBounds = () => {
        if (typeof window === 'undefined') {
            return {
                minWidth: 280,
                maxWidth: 960,
                minHeight: 200,
                maxHeight: 760,
            };
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const sideGutter = viewportWidth <= 640 ? 16 : viewportWidth <= 900 ? 19 : 40;
        const topReserve = viewportWidth <= 900 ? 96 : 110;
        const bottomReserve = viewportWidth <= 640 ? 104 : 120;

        const maxWidth = Math.max(300, Math.min(980, viewportWidth - (sideGutter * 2)));
        const minWidth = Math.min(maxWidth, Math.max(260, Math.min(460, maxWidth * 0.52)));

        const maxHeight = Math.max(220, Math.min(780, viewportHeight - topReserve - bottomReserve));
        const minHeight = Math.min(maxHeight, Math.max(180, Math.min(300, maxHeight * 0.5)));

        return {
            minWidth,
            maxWidth,
            minHeight,
            maxHeight,
        };
    };

    const clampCardSize = (size) => {
        const bounds = getCardSizeBounds();

        return {
            width: clamp(size.width, bounds.minWidth, bounds.maxWidth),
            height: clamp(size.height, bounds.minHeight, bounds.maxHeight),
        };
    };

    const updateCardSize = (nextSizeOrUpdater) => {
        setCardSize((currentSize) => {
            const rawNextSize = typeof nextSizeOrUpdater === 'function'
                ? nextSizeOrUpdater(currentSize)
                : nextSizeOrUpdater;

            const nextSize = clampCardSize(rawNextSize);
            if (nextSize.width === currentSize.width && nextSize.height === currentSize.height) {
                return currentSize;
            }

            return nextSize;
        });
    };

    const clampCardPosition = (nextPosition, rect = cardRef.current?.getBoundingClientRect()) => {
        if (!rect || typeof window === 'undefined') {
            return nextPosition;
        }

        let nextX = nextPosition.x;
        let nextY = nextPosition.y;

        const overflowLeft = rect.left;
        const overflowRight = rect.right - window.innerWidth;
        const overflowTop = rect.top;
        const overflowBottom = rect.bottom - window.innerHeight;

        if (overflowLeft < 0) {
            nextX -= overflowLeft;
        }

        if (overflowRight > 0) {
            nextX -= overflowRight;
        }

        if (overflowTop < 0) {
            nextY -= overflowTop;
        }

        if (overflowBottom > 0) {
            nextY -= overflowBottom;
        }

        return { x: nextX, y: nextY };
    };

    const clampCardPositionToViewport = () => {
        const card = cardRef.current;
        if (!card || typeof window === 'undefined') return;

        setCardPosition((currentPosition) => {
            const nextPosition = clampCardPosition(currentPosition, card.getBoundingClientRect());
            if (nextPosition.x === currentPosition.x && nextPosition.y === currentPosition.y) {
                return currentPosition;
            }

            return nextPosition;
        });
    };

    useEffect(() => {
        if (!mountRef.current || !rootRef.current) return undefined;
        return initScene(mountRef.current, rootRef.current, data.scenes.length, currentScene, setCurrentScene);
    }, [initScene]);

    useEffect(() => {
        if (!rootRef.current) return undefined;
        const shell = shellRef.current;
        const cardMotion = cardMotionRef.current;
        const footer = rootRef.current.querySelector('.procedure-footer');

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (shell) {
            tl.fromTo(shell, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7 });
        }

        if (cardMotion) {
            tl.fromTo(cardMotion, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65 }, shell ? '-=0.4' : undefined);
        }

        if (footer) {
            tl.fromTo(footer, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45 }, cardMotion ? '-=0.3' : undefined);
        }

        return () => tl.kill();
    }, []);

    useEffect(() => {
        if (!rootRef.current) return undefined;
        const cardMotion = cardMotionRef.current;
        if (!cardMotion) return undefined;

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(cardMotion, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45 });

        return () => tl.kill();
    }, [currentScene]);

    useEffect(() => {
        setIsExplanationOpen(false);
    }, [currentScene]);

    useEffect(() => {
        const handleResize = () => {
            const fallbackSize = defaultCardSizeRef.current ?? cardSizeRef.current;

            updateCardSize((currentSize) => {
                const sourceSize = hasUserResizedRef.current ? currentSize : fallbackSize;
                return sourceSize;
            });
            clampCardPositionToViewport();
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        const card = cardRef.current;
        const observer = typeof ResizeObserver === 'undefined' || !card
            ? null
            : new ResizeObserver(() => {
                clampCardPositionToViewport();
            });

        if (observer && card) {
            observer.observe(card);
        }

        if (card) {
            const initialSize = clampCardSize({
                width: card.offsetWidth,
                height: card.offsetHeight,
            });

            if (!defaultCardSizeRef.current) {
                defaultCardSizeRef.current = initialSize;
            }

            updateCardSize(initialSize);
        }

        clampCardPositionToViewport();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);

            if (observer) {
                observer.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        clampCardPositionToViewport();
    }, [cardSize.width, cardSize.height, currentScene, isExplanationOpen]);

    useEffect(() => {
        const card = cardRef.current;
        if (!card) return undefined;

        const preventGestureZoom = (event) => {
            event.preventDefault();
        };

        card.addEventListener('gesturestart', preventGestureZoom);
        card.addEventListener('gesturechange', preventGestureZoom);

        return () => {
            card.removeEventListener('gesturestart', preventGestureZoom);
            card.removeEventListener('gesturechange', preventGestureZoom);
        };
    }, []);

    const handleClick = (event) => {
        const link = event.target.closest('a[href^="/"]');
        if (!link || !rootRef.current?.contains(link)) return;
        event.preventDefault();
        navigate(link.getAttribute('href'));
    };

    const handleCardClickCapture = (event) => {
        if (!suppressClickRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        suppressClickRef.current = false;
    };

    const markSuppressedClick = () => {
        suppressClickRef.current = true;
        window.setTimeout(() => {
            suppressClickRef.current = false;
        }, 0);
    };

    const markCardSizeLocked = () => {
        hasUserResizedRef.current = true;
        setIsCardSizeLocked(true);
    };

    const getPinchDistance = (pointsMap) => {
        const points = Array.from(pointsMap.values());
        if (points.length < 2) return 0;

        const [first, second] = points;
        return Math.hypot(second.x - first.x, second.y - first.y);
    };

    const getPinchMidpoint = (pointsMap) => {
        const points = Array.from(pointsMap.values());
        if (points.length < 2) return null;

        const [first, second] = points;
        return {
            x: (first.x + second.x) / 2,
            y: (first.y + second.y) / 2,
        };
    };

    const beginPinch = () => {
        const card = cardRef.current;
        if (touchPointsRef.current.size < 2 || !card) return;

        const midpoint = getPinchMidpoint(touchPointsRef.current);
        const startRect = card.getBoundingClientRect();
        const safeWidth = Math.max(startRect.width, 1);
        const safeHeight = Math.max(startRect.height, 1);

        const anchorX = midpoint ? clamp((midpoint.x - startRect.left) / safeWidth, 0, 1) : 0.5;
        const anchorY = midpoint ? clamp((midpoint.y - startRect.top) / safeHeight, 0, 1) : 0.5;

        pinchStateRef.current = {
            active: true,
            startDistance: getPinchDistance(touchPointsRef.current),
            startSize: cardSizeRef.current,
            startPosition: cardPositionRef.current,
            startRect,
            anchorX,
            anchorY,
        };
        isPinchingRef.current = true;
        setIsPinchingCard(true);
        setIsDraggingCard(false);
    };

    const finishPinch = () => {
        if (!pinchStateRef.current.active) return;
        pinchStateRef.current = {
            active: false,
            startDistance: 0,
            startSize: null,
            startPosition: cardPositionRef.current,
            startRect: null,
            anchorX: 0.5,
            anchorY: 0.5,
        };
        isPinchingRef.current = false;
        setIsPinchingCard(false);
        markSuppressedClick();
    };

    const resetDragState = () => {
        dragStateRef.current = {
            pointerId: null,
            startX: 0,
            startY: 0,
            startRect: null,
            startPosition: cardPositionRef.current,
            hasDragged: false,
        };
        setIsDraggingCard(false);
    };

    const cancelActiveTouchDrag = () => {
        const dragState = dragStateRef.current;
        if (dragState.pointerId == null) return;

        try {
            if (cardRef.current?.hasPointerCapture(dragState.pointerId)) {
                cardRef.current.releasePointerCapture(dragState.pointerId);
            }
        } catch {
            // Ignore capture release failures.
        }

        resetDragState();
    };

    const canStartDragFromTarget = (target) => !(
        target.closest('button') ||
        target.closest('a') ||
        target.closest('input') ||
        target.closest('textarea') ||
        target.closest('.procedure-paragraph')
    );

    const handleCardPointerDown = (event) => {
        if (event.pointerType === 'touch') {
            touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

            if (
                touchPointsRef.current.size === 1
                && !isPinchingRef.current
                && cardRef.current
                && canStartDragFromTarget(event.target)
            ) {
                dragStateRef.current = {
                    pointerId: event.pointerId,
                    startX: event.clientX,
                    startY: event.clientY,
                    startRect: cardRef.current.getBoundingClientRect(),
                    startPosition: cardPositionRef.current,
                    hasDragged: false,
                };

                try {
                    event.currentTarget.setPointerCapture(event.pointerId);
                } catch {
                    // Pointer capture is best effort.
                }
            }

            if (touchPointsRef.current.size >= 2 && !pinchStateRef.current.active) {
                cancelActiveTouchDrag();
                beginPinch();
                event.preventDefault();
                event.stopPropagation();
            }

            return;
        }

        if (event.pointerType !== 'mouse' && event.pointerType !== 'pen') return;
        if (isPinchingRef.current) return;
        if (!canStartDragFromTarget(event.target)) return;
        if (event.button !== 0 || !cardRef.current) return;

        dragStateRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startRect: cardRef.current.getBoundingClientRect(),
            startPosition: cardPositionRef.current,
            hasDragged: false,
        };

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Pointer capture is best effort.
        }
    };

    const handleCardPointerMove = (event) => {
        if (event.pointerType === 'touch' && touchPointsRef.current.has(event.pointerId)) {
            touchPointsRef.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

            if (touchPointsRef.current.size >= 2 && !pinchStateRef.current.active) {
                cancelActiveTouchDrag();
                beginPinch();
            }

            if (pinchStateRef.current.active && pinchStateRef.current.startSize && pinchStateRef.current.startRect) {
                const nextDistance = getPinchDistance(touchPointsRef.current);
                const midpoint = getPinchMidpoint(touchPointsRef.current);
                const {
                    startDistance,
                    startSize,
                    startPosition,
                    startRect,
                    anchorX,
                    anchorY,
                } = pinchStateRef.current;

                if (startDistance > 0 && nextDistance > 0) {
                    const ratio = clamp(nextDistance / startDistance, 0.55, 1.6);
                    const nextSize = clampCardSize({
                        width: startSize.width * ratio,
                        height: startSize.height * ratio,
                    });

                    if (midpoint) {
                        const nextLeft = midpoint.x - (anchorX * nextSize.width);
                        const nextTop = midpoint.y - (anchorY * nextSize.height);
                        const proposedPosition = {
                            x: startPosition.x + (nextLeft - startRect.left),
                            y: startPosition.y + (nextTop - startRect.top),
                        };
                        const nextRect = {
                            left: nextLeft,
                            right: nextLeft + nextSize.width,
                            top: nextTop,
                            bottom: nextTop + nextSize.height,
                        };
                        setCardPosition(clampCardPosition(proposedPosition, nextRect));
                    }

                    markCardSizeLocked();
                    updateCardSize(nextSize);
                }

                event.preventDefault();
                event.stopPropagation();

                return;
            }

            const dragState = dragStateRef.current;
            if (dragState.pointerId !== event.pointerId || !dragState.startRect) return;

            const deltaX = event.clientX - dragState.startX;
            const deltaY = event.clientY - dragState.startY;
            const distance = Math.hypot(deltaX, deltaY);

            if (!dragState.hasDragged) {
                if (distance < 5) return;
                dragState.hasDragged = true;
                setIsDraggingCard(true);
            }

            event.preventDefault();
            event.stopPropagation();

            const proposedPosition = {
                x: dragState.startPosition.x + deltaX,
                y: dragState.startPosition.y + deltaY,
            };

            const nextRect = {
                left: dragState.startRect.left + deltaX,
                right: dragState.startRect.right + deltaX,
                top: dragState.startRect.top + deltaY,
                bottom: dragState.startRect.bottom + deltaY,
            };

            setCardPosition(clampCardPosition(proposedPosition, nextRect));

            return;
        }

        if (isPinchingRef.current) return;
        const dragState = dragStateRef.current;
        if (dragState.pointerId !== event.pointerId || !dragState.startRect) return;

        const deltaX = event.clientX - dragState.startX;
        const deltaY = event.clientY - dragState.startY;
        const distance = Math.hypot(deltaX, deltaY);

        if (!dragState.hasDragged) {
            if (distance < 5) return;
            dragState.hasDragged = true;
            setIsDraggingCard(true);
        }

        event.preventDefault();
        event.stopPropagation();

        const proposedPosition = {
            x: dragState.startPosition.x + deltaX,
            y: dragState.startPosition.y + deltaY,
        };

        const nextRect = {
            left: dragState.startRect.left + deltaX,
            right: dragState.startRect.right + deltaX,
            top: dragState.startRect.top + deltaY,
            bottom: dragState.startRect.bottom + deltaY,
        };

        setCardPosition(clampCardPosition(proposedPosition, nextRect));
    };

    const finishCardDrag = (event) => {
        const dragState = dragStateRef.current;
        if (dragState.pointerId !== event.pointerId) return;

        try {
            if (cardRef.current?.hasPointerCapture(event.pointerId)) {
                cardRef.current.releasePointerCapture(event.pointerId);
            }
        } catch {
            // Ignore capture release failures.
        }

        if (dragState.hasDragged) {
            event.preventDefault();
            event.stopPropagation();
            markSuppressedClick();
        }

        resetDragState();
    };

    const clearTouchPointer = (event) => {
        if (event.pointerType !== 'touch') return;

        touchPointsRef.current.delete(event.pointerId);
        if (touchPointsRef.current.size < 2) {
            finishPinch();
        }

        if (touchPointsRef.current.size === 1 && !isPinchingRef.current && cardRef.current) {
            const [remainingPointerId, remainingPoint] = Array.from(touchPointsRef.current.entries())[0];
            dragStateRef.current = {
                pointerId: remainingPointerId,
                startX: remainingPoint.x,
                startY: remainingPoint.y,
                startRect: cardRef.current.getBoundingClientRect(),
                startPosition: cardPositionRef.current,
                hasDragged: false,
            };

            try {
                cardRef.current.setPointerCapture(remainingPointerId);
            } catch {
                // Pointer capture is best effort.
            }
        }
    };

    const handleCardPointerUp = (event) => {
        clearTouchPointer(event);
        finishCardDrag(event);
    };

    const handleCardPointerCancel = (event) => {
        clearTouchPointer(event);
        finishCardDrag(event);
    };

    const cardScaleBase = defaultCardSizeRef.current ?? cardSize;
    const rawCardScale = Math.sqrt((cardSize.width * cardSize.height) / (cardScaleBase.width * cardScaleBase.height));
    const cardScale = clamp(Number.isFinite(rawCardScale) ? rawCardScale : 1, 0.78, 1.45);

    return (
        <div className="procedurePage" ref={rootRef} onClick={handleClick}>
            <div ref={mountRef} className="canvas-mount"></div>
            <div className="procedure-atlas-glow glow-one"></div>
            <div className="procedure-atlas-glow glow-two"></div>
            <ProcedureNav />
            <main ref={shellRef} className="procedure-shell">
                <section
                    ref={cardRef}
                    className="procedure-hero-card"
                    onPointerDown={handleCardPointerDown}
                    onPointerMove={handleCardPointerMove}
                    onPointerUp={handleCardPointerUp}
                    onPointerCancel={handleCardPointerCancel}
                    onClickCapture={handleCardClickCapture}
                    style={{
                        transform: `translate3d(${cardPosition.x}px, ${cardPosition.y}px, 0)`,
                        width: `${cardSize.width}px`,
                        height: isCardSizeLocked && isExplanationOpen ? `${cardSize.height}px` : 'auto',
                        '--card-scale': cardScale,
                        '--card-width': `${cardSize.width}px`,
                        '--card-height': `${cardSize.height}px`,
                    }}
                    data-dragging={isDraggingCard ? 'true' : 'false'}
                    data-pinching={isPinchingCard ? 'true' : 'false'}
                    data-can-drag="true"
                >
                    <div ref={cardMotionRef} className="procedure-hero-card-motion">
                        <div className="procedure-hero-copy">
                            <span className="procedure-eyebrow">spine surgical atlas</span>
                            <div className="procedure-title-row">
                                <h1 className="procedure-title">{data.scenes[currentScene].title}</h1>
                                <button
                                    type="button"
                                    className={`procedure-toggle${isExplanationOpen ? ' active' : ''}`}
                                    onClick={() => setIsExplanationOpen((value) => !value)}
                                    aria-expanded={isExplanationOpen}
                                >
                                    {isExplanationOpen ? 'Hide explanation' : 'Show explanation'}
                                </button>
                            </div>
                            <div className={`procedure-paragraph${isExplanationOpen ? ' open' : ''}`} dangerouslySetInnerHTML={{ __html: data.scenes[currentScene].paragraph }} />
                        </div>
                    </div>
                </section>
            </main>
            <ProcedureFooter
                sceneCount={data.scenes.length}
                currentScene={currentScene}
            />
        </div>
    );
}
