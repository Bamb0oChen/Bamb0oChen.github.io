import { createRoot } from 'react-dom/client';
import React from 'react';
import RecordsPage from './pages/RecordsPage.jsx';

createRoot(document.getElementById('app')).render(React.createElement(RecordsPage));
