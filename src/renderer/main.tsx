import { createRoot } from 'react-dom/client';
import { App } from './App';
import './design/tokens.css';
import './design/layout.css';
import './design/components.css';
createRoot(document.getElementById('root')!).render(<App />);
