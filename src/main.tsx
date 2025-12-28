import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import App from './App.tsx';
import './index.css';
import { initSentry } from './lib/sentry';
import { initAnalytics } from './lib/analytics';
import { initEnvironmentValidation } from './lib/envValidation';

// Validate environment before starting app
initEnvironmentValidation();

// Initialize monitoring and analytics
initSentry();
initAnalytics();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>
);
