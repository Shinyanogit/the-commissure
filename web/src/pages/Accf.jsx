import { ProcedurePage } from './ProcedurePage.jsx';
import { initAccfScene } from '../scenes/accf.js';

export function Accf() {
    return <ProcedurePage page="accf" initScene={initAccfScene} />;
}
