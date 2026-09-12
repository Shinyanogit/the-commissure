import { ProcedurePage } from './ProcedurePage.jsx';
import { initPcl_openScene } from '../scenes/pcl_open.js';

export function Pcl_open() {
    return <ProcedurePage page="pcl_open" initScene={initPcl_openScene} />;
}
