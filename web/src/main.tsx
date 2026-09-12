import { render } from 'preact';

import { App } from './application/App.tsx';
import './styles/app.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('The Web Port application root is missing.');
}

render(<App />, root);
