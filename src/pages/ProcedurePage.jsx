import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcedureNav } from '../components/ProcedureNav.jsx';
import { ProcedureFooter } from '../components/ProcedureFooter.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import { procedureText } from '../content/procedureText.js';
import '../styles/procedure.css';

export function ProcedurePage({ page, initScene }) {
    const mountRef = useRef(null);
    const rootRef = useRef(null);
    const navigate = useNavigate();

    const data = procedureText[page];

    const [currentScene, setCurrentScene] = useState(0);

    useBodyClass('procedure-page');

    useEffect(() => {
        if (!mountRef.current || !rootRef.current) return undefined;
        return initScene(mountRef.current, rootRef.current, data.scenes.length, currentScene, setCurrentScene);
    }, [initScene]);

    const handleClick = (event) => {
        const link = event.target.closest('a[href^="/"]');
        if (!link || !rootRef.current?.contains(link)) return;
        event.preventDefault();
        navigate(link.getAttribute('href'));
    };

    return (
        <div className="procedurePage" ref={rootRef} onClick={handleClick}>
            <div ref={mountRef} className="canvas-mount"></div>
            <ProcedureNav />
            <div className='text'>
                <div className='title'>{data.scenes[currentScene].title}</div>
                <div className='paragraph' dangerouslySetInnerHTML={{ __html: data.scenes[currentScene].paragraph }} />
            </div>
            <ProcedureFooter
                sceneCount={data.scenes.length}
                currentScene={currentScene}
            />
        </div>
    );
}
