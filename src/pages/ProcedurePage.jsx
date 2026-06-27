import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ProcedureNav } from '../components/ProcedureNav.jsx';
import { useBodyClass } from '../components/useBodyClass.js';
import { procedureText } from '../content/procedureText.js';
import '../styles/procedure.css';

export function ProcedurePage({ page, initScene }) {
    const mountRef = useRef(null);
    const rootRef = useRef(null);
    const navigate = useNavigate();

    useBodyClass('procedure-page');

    useEffect(() => {
        if (!mountRef.current || !rootRef.current) return undefined;
        return initScene(mountRef.current, rootRef.current);
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
            <div dangerouslySetInnerHTML={{ __html: procedureText[page] }} />
        </div>
    );
}
