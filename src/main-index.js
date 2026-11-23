import { createRoot } from 'react-dom/client';
import React from 'react';
import IndexPage from './pages/IndexPage.jsx';

const url = new URL(window.location.href);
if (url.searchParams.get('intro') === 'handwriting') {
    url.searchParams.delete('intro');
    window.history.replaceState(window.history.state, '', url);
}

createRoot(document.getElementById('app')).render(React.createElement(IndexPage));
