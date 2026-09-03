import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import './index.css';
import App from './App.tsx';
import { applyStoredAppearance } from '@shared/hooks/useAppearance';

// Re-assert the saved accent/base before render. The inline script in
// index.html gets them on screen without a flash; this validates them.
applyStoredAppearance();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
