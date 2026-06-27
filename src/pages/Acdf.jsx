import { ProcedurePage } from './ProcedurePage.jsx';
import { initAcdfScene } from '../scenes/acdf.js';

export function Acdf() {
    return <ProcedurePage page="acdf" initScene={initAcdfScene} />;
}
