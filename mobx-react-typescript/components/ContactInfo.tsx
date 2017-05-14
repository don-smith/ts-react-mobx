import * as React from 'react'

import EditableDiv from './EditableDiv'

import { Supplier } from '../interfaces'

export default class ContactInfo extends React.Component<{supplier: Supplier}, {}> {
  render() {
    const supplier = this.props.supplier
    return (
      <ul className='ContactInfo'>
        { (supplier.address.content !== undefined) ? <li className='address'><EditableDiv text={supplier.address} /></li> : null }
        { (supplier.phone.content !== undefined) ? <li className='phone'><EditableDiv text={supplier.phone} /></li> : null }
        { (supplier.email.content !== undefined) ? <li className='email'><EditableDiv text={supplier.email} /></li> : null }
        { (supplier.website.content !== undefined) ? <li className='website'><EditableDiv text={supplier.website} /></li> : null }
      </ul>
    )
  }
}
