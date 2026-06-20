import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App'; // This will now perfectly map to App.tsx

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Failed to find the root element infrastructure anchor point.");
}

const root = ReactDOM.createRoot(rootElement as HTMLElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);