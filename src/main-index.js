import { createRoot } from 'react-dom/client';
import React from 'react';
import IndexPage from './pages/IndexPage.jsx';

createRoot(document.getElementById('app')).render(React.createElement(IndexPage));
