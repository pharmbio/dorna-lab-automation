import React from 'react';

export default class Header extends React.Component {
  render() {

    // List of modes to expose to user in Header component, order matters
    const headerModes = ["preflight", "calibration", "setup", "select", "move"]

    const text = {
      preflight:    "Go through preflight checklist and make sure each point is understood.",
      calibration:  "Use the Dorna GUI below to calibrate each position.",
      setup:        "Select initial plate position.",
      select:       "Select plate for pick up and target position.",
      move:         "Press run to perform move.",
    };

    let atFirst = this.props.mode === "preflight"
    let atLast = this.props.mode === "move"

    return (
      <div className="container bg-light">
        <nav className="navbar navbar-expand-md navbar-light">
          <div className="container-fluid">
            <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
              <span className="navbar-toggler-icon"></span>
            </button>
            <div className="collapse navbar-collapse" id="navbarCollapse">
              <button className={"btn btn-outline-danger mx-auto " + (atFirst ? 'disabled' : '')} onClick={() => this.props.onPrevClick()}>Previous</button>
              <ul className="navbar-nav mx-auto">
                {headerModes.map( mode => {
                  let active = mode == this.props.mode
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
              <button className={"btn btn-outline-primary mx-auto " + (atLast ? 'disabled' : '')} onClick={() => this.props.onNextClick()}>Next</button>
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
