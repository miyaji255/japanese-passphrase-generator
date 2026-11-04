import { hydrate, render } from 'solid-js/web';
import App from './App.tsx';
import './style.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing app root');
const mount = import.meta.env.DEV ? render : hydrate;
mount(() => <App />, root);
