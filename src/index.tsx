import * as React from 'react';
import { render } from 'react-dom';
import { HashRouter as Router } from 'react-router-dom';

import { Home } from './components/Home';

render((
  <Router>
    <Home message='Hi there' />
  </Router>
), document.getElementById('app'));
