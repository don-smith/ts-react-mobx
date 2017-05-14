import * as React from 'react'

import ServiceDetails from './ServiceDetails'

import { Service } from '../interfaces'

export default class ServicesList extends React.Component<{services: Service[]}, {}> {
  render() {
    const services = this.props.services.map(function (service, index) {
      return <ServiceDetails key={index} service={service} />
    })
    return (
      <div className='ServicesList'>
        <h4>SERVICES</h4>
        {services}
      </div>
    )
  }
}
