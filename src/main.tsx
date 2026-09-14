import '@fontsource-variable/inter';
import '@fontsource-variable/source-serif-4';
import '@fontsource-variable/jetbrains-mono';
import './styles/tokens.css';
import './styles/base.css';
import './components/ui/ui.css';
import './components/ui/overlays.css';
import './app/appShell.css';
import './features/editor/editor.css';
import './features/journal/journal.css';
import './features/journal/composer/composer.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter } from 'react-router';
import { App } from './app/App';
import { routes } from './app/router';
import { createBrowserRepositories } from './services/repositories';

function StorageUnavailable() {
  return (
    <main className="journal-message">
      <h1 className="journal-message__title">Study Journal needs browser storage</h1>
      <p>Your notes are saved in this browser. Allow site data (or leave private browsing) and reload.</p>
    </main>
  );
}

const repositories = createBrowserRepositories();
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Missing #root element.');

createRoot(rootElement).render(
  <StrictMode>
    {repositories ? <App repositories={repositories} router={createBrowserRouter(routes)} /> : <StorageUnavailable />}
  </StrictMode>,
);
