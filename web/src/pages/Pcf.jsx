import { ProcedurePage } from './ProcedurePage.jsx';
import { initPcfScene } from '../scenes/pcf.js';

export function Pcf() {
    return <ProcedurePage page="pcf" initScene={initPcfScene} />;
}
