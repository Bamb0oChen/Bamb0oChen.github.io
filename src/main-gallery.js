import { createRoot } from 'react-dom/client';
import React from 'react';
import GalleryPage from './pages/GalleryPage.jsx';

createRoot(document.getElementById('app')).render(React.createElement(GalleryPage));
