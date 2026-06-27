import { ProcedurePage } from './ProcedurePage.jsx';
import { initPcdfScene } from '../scenes/pcdf.js';

export function Pcdf() {
    return <ProcedurePage page="pcdf" initScene={initPcdfScene} />;
}
