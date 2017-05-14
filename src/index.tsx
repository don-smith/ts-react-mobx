import * as React from 'react';
import { render } from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';

import App from './components/App';

import { store } from './createApi'

render((
  <Router>
    <App store={store} />
  </Router>
), document.getElementById('app'));
