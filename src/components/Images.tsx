import * as React from 'react'

export default class Images extends React.Component<{images: string[]}, {}> {
  render() {
    const imageDisplay = this.props.images.map(function (image, index) {
      return <img key={index} src={image} />
    })
    return (
      <div className='Images'>
        <h4>IMAGES</h4>
        {imageDisplay}
      </div>
    )
  }
}
