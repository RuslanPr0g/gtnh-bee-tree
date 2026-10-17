import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { router } from './App';
import { StoreProvider } from './store';
import { iconsReady } from './lib/icons';
import './styles.css';

// bee icons are drawn from textures, so wait for them before the first render
iconsReady.then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </StrictMode>,
  );
});
