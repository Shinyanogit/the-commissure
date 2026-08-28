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
    const sceneControllerRef = useRef(null);
    const swipeRef = useRef({ pointerId: null, startX: 0, startY: 0 });
    const navigate = useNavigate();

    const data = procedureText[page];
    const [currentScene, setCurrentScene] = useState(0);
    const [isExplanationOpen, setIsExplanationOpen] = useState(true);
    const hasSceneNavigation = page === 'pcdf';
    const panelPositionClasses = 'fixed top-20 right-0 bottom-0 left-auto w-[clamp(20rem,30vw,28rem)] max-h-none rounded-l-[1.2rem] rounded-r-none portrait:inset-x-0 portrait:top-auto portrait:bottom-0 portrait:h-[32dvh] portrait:w-full portrait:max-h-none portrait:rounded-t-[1.2rem] portrait:rounded-b-none';

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
        const panelMotion = panelMotionRef.current;
        if (!panelMotion) return undefined;

        const tl = gsap.fromTo(
            panelMotion,
            { opacity: 0.35, x: 8 },
            { opacity: 1, x: 0, duration: 0.35, ease: 'power3.out' },
        );

        return () => tl.kill();
    }, [currentScene]);

    const handleClick = (event) => {
        const link = event.target.closest('a[href^="/"]');
        if (!link || !rootRef.current?.contains(link)) return;
        event.preventDefault();
        navigate(link.getAttribute('href'));
    };

    const goToPreviousScene = () => {
        sceneControllerRef.current?.previous();
    };

    const goToNextScene = () => {
        sceneControllerRef.current?.next();
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
                {!isExplanationOpen && (
                    <button
                        type="button"
                        className="procedure-explanation-trigger fixed top-24 right-4 z-[36] portrait:top-auto portrait:right-3 portrait:bottom-3"
                        onClick={() => setIsExplanationOpen(true)}
                        aria-expanded="false"
                        aria-label="Show explanation"
                    >
                        <svg className="portrait:rotate-90" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="m15 18-6-6 6-6" />
                        </svg>
                    </button>
                )}
                <aside
                    className={`procedure-hero-card ${panelPositionClasses} ${isExplanationOpen ? 'open translate-x-0 portrait:translate-y-0' : 'translate-x-full portrait:translate-x-0 portrait:translate-y-full'}`}
                    aria-hidden={!isExplanationOpen}
                    onPointerDown={handlePanelPointerDown}
                    onPointerUp={finishPanelSwipe}
                    onPointerCancel={finishPanelSwipe}
                >
                    <div ref={panelMotionRef} className="procedure-hero-card-motion">
                        <div className="procedure-panel-header max-sm:absolute max-sm:top-4 max-sm:right-4 max-sm:z-[1]">
                            <span className="procedure-eyebrow inline-flex max-sm:hidden">spine surgical atlas</span>
                            <button
                                type="button"
                                className="procedure-toggle portrait:rotate-90"
                                onClick={() => setIsExplanationOpen(false)}
                                aria-expanded="true"
                                aria-label="Hide explanation"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true">
                                    <path d="m9 18 6-6-6-6" />
                                </svg>
                            </button>
                        </div>
                        <h1 className="procedure-title">{data.scenes[currentScene].title}</h1>
                        <div
                            className="procedure-paragraph open"
                            dangerouslySetInnerHTML={{ __html: data.scenes[currentScene].paragraph }}
                        />
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
