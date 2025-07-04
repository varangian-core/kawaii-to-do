import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// import TestApp from './TestApp';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('Root element not found!');
} else {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}