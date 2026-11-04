import { renderToString, generateHydrationScript } from 'solid-js/web';
import App from './App.jsx';

export function renderPage() {
  return {
    page: renderToString(() => <App/>),
    hydrationScript: generateHydrationScript(),
  };
}
