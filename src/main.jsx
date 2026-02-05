/**
 * Application Entry Point
 * 
 * Mounts the React application to the DOM and sets up providers.
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

// Ensure theme is applied before rendering to avoid flash of light theme
const savedTheme = localStorage.getItem('theme');
if (!savedTheme) {
  localStorage.setItem('theme', 'dark');
  document.documentElement.classList.add('dark');
} else if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

import './index.css';

// Get the root element
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found. Make sure there is a <div id="root"></div> in your HTML.');
}

// Create the root and render the app
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Register Service Worker for offline support and caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .register('/service-worker.js')
    .then((registration) => {
      console.log('Service Worker registered:', registration);
    })
    .catch((error) => {
      console.warn('Service Worker registration failed:', error);
    });
}
