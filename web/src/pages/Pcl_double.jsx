import { ProcedurePage } from './ProcedurePage.jsx';
import { initPcl_doubleScene } from '../scenes/pcl_double.js';

export function Pcl_double() {
    return <ProcedurePage page="pcl_double" initScene={initPcl_doubleScene} />;
}
