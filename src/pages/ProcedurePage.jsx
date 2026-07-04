import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ProcedureNav } from '../components/ProcedureNav.jsx';
import { ProcedureFooter } from '../components/ProcedureFooter.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import { procedureText } from '../content/procedureText.js';
import '../styles/procedure.css';

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
    const suppressClickRef = useRef(false);
    const cardPositionRef = useRef({ x: 0, y: 0 });
    const navigate = useNavigate();

    const data = procedureText[page];

    const [currentScene, setCurrentScene] = useState(0);
    const [isExplanationOpen, setIsExplanationOpen] = useState(false);
    const [cardPosition, setCardPosition] = useState({ x: 0, y: 0 });
    const [isDraggingCard, setIsDraggingCard] = useState(false);

    useBodyClass('procedure-page');

    useEffect(() => {
        cardPositionRef.current = cardPosition;
    }, [cardPosition]);

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

        clampCardPositionToViewport();

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('orientationchange', handleResize);

            if (observer) {
                observer.disconnect();
            }
        };
    }, [currentScene, isExplanationOpen]);

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

    const handleCardPointerDown = (event) => {
        if (
            event.target.closest('button') ||
            event.target.closest('a') ||
            event.target.closest('input') ||
            event.target.closest('textarea') ||
            event.target.closest('.procedure-paragraph')
        ) { return; }
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
            suppressClickRef.current = true;
            window.setTimeout(() => {
                suppressClickRef.current = false;
            }, 0);
        }

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
                    onPointerUp={finishCardDrag}
                    onPointerCancel={finishCardDrag}
                    onClickCapture={handleCardClickCapture}
                    style={{
                        transform: `translate3d(${cardPosition.x}px, ${cardPosition.y}px, 0)`,
                    }}
                    data-dragging={isDraggingCard ? 'true' : 'false'}
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
