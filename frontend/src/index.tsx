// frontend/src/index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/global.scss';
import './styles/chart-theme.scss';
import App from './App';
import './i18n'; // Initialize i18next
import * as serviceWorkerRegistration from './serviceWorkerRegistration';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.register();