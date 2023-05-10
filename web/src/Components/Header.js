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

    const text = {
      preflight:    "Go through preflight checklist and make sure each point is understood.",
      calibration:  "Use the Dorna GUI below to calibrate each position.",
      setup:        "Select initial plate position.",
      source:       "Select plate for pick up.",
      target:       "Select target position for plate.",
      ready:        "Press run to perform move.",
      moving:       "Press abort to stop move."
    };

    return (
      <div className="container bg-light">
        <nav className="navbar navbar-expand-md navbar-light">
          <div className="container-fluid">
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarCollapse">
              <button className="btn btn-outline-danger me-auto" onClick={() => this.props.onPrevClick()}>Previous</button>
              <ul className="navbar-nav me-auto">
                {headerModes.map( mode => {
                  let active = mode==simplifiedMode[this.props.mode]
                  let className="nav-link " + (active ? "active" : "")
                  let title = mode.charAt(0).toUpperCase() + mode.slice(1);
                  return (
                    <li key={mode} className="nav-item">
                      <a href="#" className={className} onClick={() => this.props.onHeaderClick(mode)}>
                        {headerModes.indexOf(mode)+1}. {title}
                      </a>
                    </li>
                  )
                })}
              </ul>
              <button className="btn btn-outline-primary" onClick={() => this.props.onNextClick()}>Next</button>
            </div>
          </div>
        </nav>
        <div className="span text-center">
          {text[this.props.mode]}
        </div>
      </div>
    )
  }
}
