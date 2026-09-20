import { createRoot } from 'react-dom/client'
import AppIpad from './AppIpad'
import AppPanorama from './AppPanorama'
import './index.css'

const app = window.location.pathname === '/ipad' ? <AppIpad /> : <AppPanorama />

createRoot(document.getElementById('root')!).render(app)
