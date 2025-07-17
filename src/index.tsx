import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setPersistence, browserLocalPersistence } from 'firebase/auth';
import { auth } from './services/firebase';

setPersistence(auth, browserLocalPersistence)
  .then(() => {
    const container = document.getElementById('root');
    if (container) {
      createRoot(container).render(<App />);
    }
  })
  .catch((error) => {
    console.error('Error setting persistence:', error);
  });
