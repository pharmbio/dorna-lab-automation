import React from 'react';

function Position(props) {
  const className = props.id + " position " + props.plate;
  return <button className={className} onClick={props.onClick}>{props.id}</button>
}

export default class Positions extends React.Component {
  render() {
    const plates = this.props.plates
    return (
      <div className="section map">
        {Object.keys(plates).map( id => {
          return <Position
            key={id}
            id={id}
            plate={plates[id]}
            onClick={() => this.props.onPlateClick(id)}
          />
        })}
      </div>
    )
  }
}

