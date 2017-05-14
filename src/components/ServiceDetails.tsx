import * as React from 'react'

import EditableDiv from './EditableDiv'
import Description from './Description'
import ContactInfo from './ContactInfo'
import Images from './Images'

import { Service } from '../interfaces'

export default class ServiceDetails extends React.Component<{service: Service}, {}> {
  render() {
    const service = this.props.service
    return (
      <div className='ServiceDetails'>
        <h5 className='name'>
          <EditableDiv text={service.name} />
        </h5>
        <EditableDiv text={service.text} />
      </div>
    )
  }
}
