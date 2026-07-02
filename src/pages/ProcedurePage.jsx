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
    const navigate = useNavigate();

    const data = procedureText[page];

    const [currentScene, setCurrentScene] = useState(0);
    const [isExplanationOpen, setIsExplanationOpen] = useState(false);

    useBodyClass('procedure-page');

    useEffect(() => {
        if (!mountRef.current || !rootRef.current) return undefined;
        return initScene(mountRef.current, rootRef.current, data.scenes.length, currentScene, setCurrentScene);
    }, [initScene]);

    useEffect(() => {
        if (!rootRef.current) return undefined;
        const shell = shellRef.current;
        const card = cardRef.current;
        const footer = rootRef.current.querySelector('.procedure-footer');

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

        if (shell) {
            tl.fromTo(shell, { opacity: 0, y: 26 }, { opacity: 1, y: 0, duration: 0.7 });
        }

        if (card) {
            tl.fromTo(card, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.65 }, shell ? '-=0.4' : undefined);
        }

        if (footer) {
            tl.fromTo(footer, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.45 }, card ? '-=0.3' : undefined);
        }

        return () => tl.kill();
    }, []);

    useEffect(() => {
        if (!rootRef.current) return undefined;
        const card = cardRef.current;
        if (!card) return undefined;

        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo(card, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.45 });

        return () => tl.kill();
    }, [currentScene]);

    useEffect(() => {
        setIsExplanationOpen(false);
    }, [currentScene]);

    const handleClick = (event) => {
        const link = event.target.closest('a[href^="/"]');
        if (!link || !rootRef.current?.contains(link)) return;
        event.preventDefault();
        navigate(link.getAttribute('href'));
    };

    return (
        <div className="procedurePage" ref={rootRef} onClick={handleClick}>
            <div ref={mountRef} className="canvas-mount"></div>
            <div className="procedure-atlas-glow glow-one"></div>
            <div className="procedure-atlas-glow glow-two"></div>
            <ProcedureNav />
            <main ref={shellRef} className="procedure-shell">
                <section ref={cardRef} className="procedure-hero-card">
                    <div className="procedure-hero-copy">
                        <span className="procedure-eyebrow">Interactive surgical atlas</span>
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
                </section>
            </main>
            <ProcedureFooter
                sceneCount={data.scenes.length}
                currentScene={currentScene}
            />
        </div>
    );
}
