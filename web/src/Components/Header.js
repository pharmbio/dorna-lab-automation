import React from 'react';

// List of stages to expose to user in Header component, order matters
const headerStages = ["preflight", "calibration", "setup", "select", "move"]

const simpleText = {
  preflight:    "Go through preflight checklist and make sure each point is understood.",
  setup:        "Select initial plate position(s).",
};

export default class Header extends React.Component {
  headerInfo(plates) {
    let text = "";
    let targetExists = Object.values(plates).includes("target");
    let sourceExists = Object.values(plates).includes("source");

    switch(this.props.stage) {
      case "preflight":
        return simpleText["preflight"]
      case "calibration":
        text = (
          <span>
            Select a position and <span className="text-primary">Move</span> to it. 
            Make adjustments below and then <span className="text-secondary">Save</span> to calibrate.
            Press <span className="text-danger">Reset</span> remove calibration for selected position.
          </span>
        )
        return text;
      case "setup":
        return simpleText["setup"]
      case "select":
        text = (
          <span>
            { sourceExists && targetExists ? <span>Ready for move!</span> : <span>Select </span> }
            { // Cool ternary to check if source exists
              sourceExists 
              ? <span></span>
              : <span><span className="text-primary"> source</span> plate for pick up </span>
            }
            { sourceExists || targetExists 
              ? <span></span>
              : <span>and </span>
            }
            { // Cool ternary to check if source exists
              targetExists 
              ? <span></span>
              : <span><span className="text-danger"> target</span> position</span>
            }
          </span>
        )
        return text;
      case "move":
        return <span>Press <span className="text-success">Run </span> to perform move.</span>
      default: break;
    }
  }

  render() {
    let atFirst = this.props.stage == "preflight"
    let atLast = this.props.stage == "move"

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
          {this.headerInfo(this.props.plates)}
        </div>
      </div>
    )
  }
}
