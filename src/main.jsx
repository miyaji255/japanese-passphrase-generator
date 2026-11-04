import { hydrate, render } from 'solid-js/web';
import App from './App.jsx';
import './style.css';

const mount=import.meta.env.DEV ? render : hydrate;
mount(()=><App/>,document.getElementById('root'));
