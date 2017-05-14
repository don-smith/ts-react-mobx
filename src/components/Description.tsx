import * as React from 'react'
import { Item } from '../interfaces'

import EditableDiv from './EditableDiv'

export default class Description extends React.Component<{text: Item}, {}> {
  render() {
    return (
      <div>
        <h4>DESCRIPTION</h4>
        <EditableDiv text={this.props.text}/>
      </div>
    )
  }
}
