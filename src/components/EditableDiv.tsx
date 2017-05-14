import * as React from 'react'
import { Item } from '../interfaces'
import { observer } from 'mobx-react'

@observer
export default class EditableDiv extends React.Component<{text: Item}, {}> {
  render() {
    const text = this.props.text
    function edit () {
      text.editing = true
    }
    function handleKey (e) {
      if (e.key === 'Enter') sendEdit(e)
    }
    function sendEdit (e) {
      text.editing = false
      text.content = e.target.value
    }
    return (
      <div>
        {text.editing
        ? <input type='text' defaultValue={text.content} onKeyUp={event => handleKey(event)} />
        : <div onDoubleClick={edit}>{text.content}</div>}
      </div>
    )
  }
}
