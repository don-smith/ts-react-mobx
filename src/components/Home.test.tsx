import * as React from 'react';
import { shallow } from 'enzyme';
import { Home } from './Home';

test('Home displays the message', () => {
  const yo = 'yo!';
  const home = shallow(<Home message={yo} />);
  expect(home.text()).toBe(yo);
})
