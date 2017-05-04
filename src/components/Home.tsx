import * as React from 'react'

export interface HomeProps { message: string }

export class Home extends React.Component<HomeProps, undefined> {
  render () {
    return <h1>{this.props.message}</h1>
  }
}
