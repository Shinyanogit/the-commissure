import { useState, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useNavigate } from 'react-router-dom';
import { ProcedureNav } from '../components/ProcedureNav.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import { procedureText } from '../content/procedureText.js';
import '../styles/procedure.css';

export function ProcedurePage({ page, initScene }) {
    const mountRef = useRef(null);
    const rootRef = useRef(null);
    const shellRef = useRef(null);
    const panelMotionRef = useRef(null);
    const explanationContentRef = useRef(null);
    const sceneControllerRef = useRef(null);
    const swipeRef = useRef({ pointerId: null, startX: 0, startY: 0 });
    const panelResizeRef = useRef(null);
    const suppressToggleClickRef = useRef(false);
    const navigationDirectionRef = useRef(0);
    const isPanelTransitioningRef = useRef(false);
    const navigate = useNavigate();

    const data = procedureText[page];
    const [currentScene, setCurrentScene] = useState(0);
    const [isExplanationOpen, setIsExplanationOpen] = useState(true);
    const [panelSize, setPanelSize] = useState({ width: null, height: null });
    const hasSceneNavigation = page === 'pcdf';
    const panelPositionClasses = 'fixed top-20 right-0 bottom-0 left-auto w-[var(--procedure-panel-width)] max-h-none rounded-l-[1.2rem] rounded-r-none portrait:inset-x-0 portrait:top-auto portrait:bottom-0 portrait:h-[var(--procedure-panel-height)] portrait:w-full portrait:max-h-none portrait:rounded-t-[1.2rem] portrait:rounded-b-none';

    useBodyClass('procedure-page');

    useEffect(() => {
        if (!mountRef.current || !rootRef.current) return undefined;
        return initScene(
            mountRef.current,
            rootRef.current,
            data.scenes.length,
            currentScene,
            setCurrentScene,
            sceneControllerRef,
        );
    }, [initScene]);

    useEffect(() => {
        if (!rootRef.current) return undefined;
        const shell = shellRef.current;
        const panelMotion = panelMotionRef.current;
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (shell) {
            tl.fromTo(shell, { opacity: 0 }, { opacity: 1, duration: 0.5 });
        }

        if (panelMotion) {
            tl.fromTo(panelMotion, { opacity: 0 }, { opacity: 1, duration: 0.45 }, '-=0.25');
        }

        return () => tl.kill();
    }, []);

    useEffect(() => {
        const explanationContent = explanationContentRef.current;
        if (!explanationContent) return undefined;

        const direction = navigationDirectionRef.current;
        const startX = direction > 0 ? 32 : direction < 0 ? -32 : 8;

        const tl = gsap.fromTo(
            explanationContent,
            { opacity: 0, x: startX },
            {
                opacity: 1,
                x: 0,
                duration: direction === 0 ? 0.35 : 0.3,
                ease: 'power3.out',
                onComplete: () => {
                    navigationDirectionRef.current = 0;
                    isPanelTransitioningRef.current = false;
                },
            },
        );

        return () => tl.kill();
    }, [currentScene]);

    const handleClick = (event) => {
        const link = event.target.closest('a[href^="/"]');
        if (!link || !rootRef.current?.contains(link)) return;
        event.preventDefault();
        navigate(link.getAttribute('href'));
    };

    const changeScene = (direction) => {
        const controller = sceneControllerRef.current;
        const explanationContent = explanationContentRef.current;
        if (!controller || !explanationContent || isPanelTransitioningRef.current) return;

        isPanelTransitioningRef.current = true;
        navigationDirectionRef.current = direction;
        gsap.to(explanationContent, {
            opacity: 0,
            x: direction > 0 ? -32 : 32,
            duration: 0.22,
            ease: 'power2.in',
            onComplete: () => {
                const accepted = direction > 0 ? controller.next() : controller.previous();
                if (accepted) return;

                navigationDirectionRef.current = 0;
                gsap.to(explanationContent, {
                    opacity: 1,
                    x: 0,
                    duration: 0.2,
                    ease: 'power2.out',
                    onComplete: () => {
                        isPanelTransitioningRef.current = false;
                    },
                });
            },
        });
    };

    const goToPreviousScene = () => changeScene(-1);

    const goToNextScene = () => changeScene(1);

    const handlePanelResizeStart = (event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        const panel = event.currentTarget.closest('.procedure-hero-card');
        if (!panel) return;

        const isPortrait = window.matchMedia('(orientation: portrait)').matches;
        const bounds = panel.getBoundingClientRect();
        panelResizeRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
            startSize: isPortrait ? bounds.height : bounds.width,
            isPortrait,
            dragged: false,
        };
        suppressToggleClickRef.current = false;
        event.stopPropagation();

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Pointer capture is best effort.
        }
    };

    const handlePanelResizeMove = (event) => {
        const resize = panelResizeRef.current;
        if (!resize || resize.pointerId !== event.pointerId) return;

        const delta = resize.isPortrait
            ? event.clientY - resize.startY
            : event.clientX - resize.startX;
        if (!resize.dragged && Math.abs(delta) < 4) return;

        resize.dragged = true;
        const maximum = resize.isPortrait
            ? window.innerHeight * 0.55
            : Math.min(window.innerWidth * 0.55, 640);
        const minimum = Math.min(resize.isPortrait ? 180 : 280, maximum);
        const nextSize = Math.min(Math.max(resize.startSize - delta, minimum), maximum);
        const property = resize.isPortrait ? 'height' : 'width';
        setPanelSize((current) => ({ ...current, [property]: nextSize }));
        event.preventDefault();
        event.stopPropagation();
    };

    const finishPanelResize = (event) => {
        const resize = panelResizeRef.current;
        if (!resize || resize.pointerId !== event.pointerId) return;

        suppressToggleClickRef.current = resize.dragged;
        panelResizeRef.current = null;
        event.stopPropagation();
    };

    const hideExplanation = () => {
        if (suppressToggleClickRef.current) {
            suppressToggleClickRef.current = false;
            return;
        }
        setIsExplanationOpen(false);
    };

    const handlePanelPointerDown = (event) => {
        if (!hasSceneNavigation || event.target.closest('button, a')) return;
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        swipeRef.current = {
            pointerId: event.pointerId,
            startX: event.clientX,
            startY: event.clientY,
        };

        try {
            event.currentTarget.setPointerCapture(event.pointerId);
        } catch {
            // Pointer capture is best effort.
        }
    };

    const finishPanelSwipe = (event) => {
        const swipe = swipeRef.current;
        if (swipe.pointerId !== event.pointerId) return;

        const deltaX = event.clientX - swipe.startX;
        const deltaY = event.clientY - swipe.startY;
        swipeRef.current = { pointerId: null, startX: 0, startY: 0 };

        if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY) * 1.2) return;
        if (deltaX > 0) {
            goToPreviousScene();
        } else {
            goToNextScene();
        }
    };

    return (
        <div className="procedurePage" ref={rootRef} onClick={handleClick}>
            <div ref={mountRef} className="canvas-mount"></div>
            <div className="procedure-atlas-glow glow-one"></div>
            <div className="procedure-atlas-glow glow-two"></div>
            <ProcedureNav />
            <main ref={shellRef} className="procedure-shell">
                <button
                    type="button"
                    className={`procedure-explanation-trigger fixed top-1/2 right-3 z-[36] -translate-y-1/2 portrait:top-auto portrait:right-auto portrait:bottom-3 portrait:left-1/2 portrait:-translate-x-1/2 portrait:translate-y-0 ${isExplanationOpen ? '' : 'visible'}`}
                    onClick={() => setIsExplanationOpen(true)}
                    aria-expanded="false"
                    aria-label="Show explanation"
                    aria-hidden={isExplanationOpen}
                    tabIndex={isExplanationOpen ? -1 : 0}
                >
                    <svg className="portrait:hidden" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m15 18-6-6 6-6" />
                    </svg>
                    <svg className="hidden portrait:block" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m18 15-6-6-6 6" />
                    </svg>
                </button>
                <aside
                    className={`procedure-hero-card ${panelPositionClasses} ${isExplanationOpen ? 'open translate-x-0 portrait:translate-y-0' : 'translate-x-full portrait:translate-x-0 portrait:translate-y-full'}`}
                    style={{
                        '--procedure-panel-width': panelSize.width ? `${panelSize.width}px` : 'clamp(20rem, 30vw, 28rem)',
                        '--procedure-panel-height': panelSize.height ? `${panelSize.height}px` : '32dvh',
                    }}
                    aria-hidden={!isExplanationOpen}
                    onPointerDown={handlePanelPointerDown}
                    onPointerUp={finishPanelSwipe}
                    onPointerCancel={finishPanelSwipe}
                >
                    <button
                        type="button"
                        className="procedure-toggle absolute top-1/2 left-0 z-[2] -translate-x-1/2 -translate-y-1/2 portrait:top-0 portrait:left-1/2 portrait:-translate-x-1/2 portrait:-translate-y-1/2 portrait:rotate-90"
                        onPointerDown={handlePanelResizeStart}
                        onPointerMove={handlePanelResizeMove}
                        onPointerUp={finishPanelResize}
                        onPointerCancel={finishPanelResize}
                        onClick={hideExplanation}
                        aria-expanded="true"
                        aria-label="Hide explanation"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m9 18 6-6-6-6" />
                        </svg>
                    </button>
                    <div ref={panelMotionRef} className="procedure-hero-card-motion">
                        <div className="procedure-explanation-viewport">
                            <div ref={explanationContentRef} className="procedure-explanation-content">
                                <div className="procedure-panel-header">
                                    <span className="procedure-eyebrow inline-flex max-sm:hidden">spine surgical atlas</span>
                                </div>
                                <h1 className="procedure-title">{data.scenes[currentScene].title}</h1>
                                <div
                                    className="procedure-paragraph open"
                                    dangerouslySetInnerHTML={{ __html: data.scenes[currentScene].paragraph }}
                                />
                            </div>
                        </div>
                        {hasSceneNavigation && (
                            <div className="procedure-panel-controls" aria-label="Explanation navigation">
                                <button
                                    type="button"
                                    onClick={goToPreviousScene}
                                    disabled={currentScene === 0}
                                    aria-label="Previous explanation"
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="m15 18-6-6 6-6" />
                                    </svg>
                                </button>
                                <div className="procedure-panel-indicator" aria-label={`Explanation ${currentScene + 1} of ${data.scenes.length}`}>
                                    {data.scenes.map((_, index) => (
                                        <span
                                            key={index}
                                            className={`dot${index === currentScene ? ' active' : ''}`}
                                        />
                                    ))}
                                </div>
                                <button
                                    type="button"
                                    onClick={goToNextScene}
                                    disabled={currentScene === data.scenes.length - 1}
                                    aria-label="Next explanation"
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true">
                                        <path d="m9 18 6-6-6-6" />
                                    </svg>
                                </button>
                            </div>
                        )}
                    </div>
                </aside>
            </main>
        </div>
    );
}
