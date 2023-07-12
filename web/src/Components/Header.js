import React from 'react';

// List of stages to expose to user in Header component, order matters
const headerStages = ["preflight", "calibration", "setup", "select", "move"]

const simpleText = {
  preflight:    "Go through preflight checklist and make sure each point is understood.",
  calibration:  "Select a position, and MOVE to it. Make adjustments with GUI below and then SAVE to calibrate.",
  setup:        "Select initial plate position.",
  select:       "Select plate for pick up and target position.",
  move:         "Press run to perform move.",
};

export default class Header extends React.Component {
  headerInfo() {
    switch(this.props.stage) {
      case "preflight":
        return simpleText["preflight"]
      case "calibration":
        let text = (
          <span>
            Select a position and <span className="text-primary">Move</span> to it. 
            Make adjustments with GUI below and then <span className="text-secondary">Save</span> to calibrate.
            Press <span className="text-danger">Reset</span> to delete calibration file.
          </span>
        )
        return text;
      case "setup":
        return simpleText["setup"]
      case "select":
        return simpleText["select"]
      case "move":
        return simpleText["move"]
      default: break;
    }
  }

  render() {
    let atFirst = this.props.stage == "preflight"
    let atLast = this.props.stage == "move"

    let targetExists = Object.values(this.props.plates).includes("target");
    let sourceExists = Object.values(this.props.plates).includes("source");

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
          {this.headerInfo(targetExists, sourceExists)}
        </div>
      </div>
    )
  }
}
