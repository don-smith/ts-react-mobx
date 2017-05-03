import * as React from 'react'
import { render } from 'react-dom'
import { HashRouter as Router } from 'react-router-dom'

render((
  <Router>
    <h1>Hello</h1>
  </Router>
), document.getElementById('app'))
