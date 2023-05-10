import React from 'react';

export default class Header extends React.Component {
  render() {

    // List of modes to expose to user in Header component, order matters
    const headerModes = ["preflight", "calibration", "setup", "move", "ready"]

    // Map all different modes to the modes exposed to the user
    const simplifiedMode = {
      preflight:    "preflight",
      calibration:  "calibration",
      setup:        "setup",
      source:       "move",
      target:       "move",
      ready:        "ready",
      moving:       "ready"
    };

    let text;

    switch(this.props.mode) {
      case "preflight":
        text = <span>0. Start and complete checklist.</span>
        break;
      case "calibration":
        text = <span>1. Perform calibration.</span>
        break;
      case "setup":
        text = <span>1. Perform calibration.</span>
        break;
      case "source":
        text = <span>1. Perform calibration.</span>
        break;
      case "target":
        text = <span>1. Perform calibration.</span>
        break;
      case "ready":
        text = <span>1. Perform calibration.</span>
        break;
      case "moving":
        text = <span>1. Perform calibration.</span>
        break;
      default: break;
    }

    return (
      <div className="section">
        <ul className="nav nav-pills">
          {headerModes.map( mode => {
            let active = mode==simplifiedMode[this.props.mode]
            let className="nav-link " + (active ? "active" : "")
            return (
              <li key={mode} className="nav-item">
                <a href="#" className={className} onClick={() => this.props.onHeaderClick(mode)}>
                  {headerModes.indexOf(mode)}. {mode}  
                </a>
              </li>
            )
          })}
        </ul>
        {text}
      </div>
    )
  }
}
