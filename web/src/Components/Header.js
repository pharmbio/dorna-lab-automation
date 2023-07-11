import React from 'react';

export default class Header extends React.Component {
  render() {

    // List of stages to expose to user in Header component, order matters
    const headerStages = ["preflight", "calibration", "setup", "select", "move"]

    const text = {
      preflight:    "Go through preflight checklist and make sure each point is understood.",
      calibration:  "Use the Dorna GUI below to calibrate each position.",
      setup:        "Select initial plate position.",
      select:       "Select plate for pick up and target position.",
      move:         "Press run to perform move.",
    };

    let atFirst = this.props.stage === "preflight"
    let atLast = this.props.stage === "move"

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
                {headerStages.map( stage => {
                  let active = stage == this.props.stage
                  let className="nav-link " + (active ? "active" : "")
                  let title = stage.charAt(0).toUpperCase() + stage.slice(1);
                  return (
                    <li key={stage} className="nav-item">
                      <a href="#" className={className} onClick={() => this.props.onHeaderClick(stage)}>
                        {headerStages.indexOf(stage)+1}. {title}
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
          {text[this.props.stage]}
        </div>
      </div>
    )
  }
}
