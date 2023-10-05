import Preflight from './Components/Preflight'
import Calibration from './Components/Calibration'

/// stage-specific buttons
export const StageButton={
  Move: "Move",
  Run: "Run",
  Save: "Save",
  Reset: "Reset",
  PickUpPlate: "Pickup Plate",
  PutDownPlate: "Place Plate",
}

// Array.isArray checks that buttons exist before rendering them
function Buttons(props) {
  return (
    Array.isArray(props.buttons) && props.buttons.map( entry => {
      let className = "btn btn-secondary" + (props.moving ? " disabled" : "");
      return (
        <li key={entry} className="nav-item">
          <button
            id={entry}
            type="button"
            className={className}
            onClick={() => props.onButtonClick(entry)}
          >
            {entry}
          </button>
        </li>
      )
    })
  )
}

const stageSpecificButtons = {
  calibration: [
    StageButton.Save, 
    StageButton.Move, 
    StageButton.PickUpPlate,
    StageButton.PutDownPlate,
    StageButton.Reset,
  ],
  setup: [],
  select: [],
  move: [
    StageButton.Run
  ],
}

import { Stage } from '../definitions'

function Information(props) {
  switch(props.stage) {
    case Stage.preflight: return <Preflight/>;
    default: return <Calibration />;
  }
}

export function Content(props) {
  return (
    <div className="container bg-light">
      <nav className="navbar navbar-expand-md" id="Buttons">
        <div className="container-fluid">
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav" id="Controls">
              <Buttons
                moving={props.moving}
                buttons={stageSpecificButtons[props.stage]} 
                onButtonClick={props.onButtonClick} 
              />
            </ul>
            <span className="navbar-text justify-content-center text-center" style={{display: "flex", width:"100%"}}>
              {(props.statusText == "moving") ? <div className="spinner-border text-primary" role="status"></div> :
                (props.statusText == "loading") ? <div className="spinner-border text-secondary" role="status"></div> :
                props.statusText
              }
            </span>
          </div>
        </div>
      </nav>
      <Information stage={props.stage}/>
    </div>
  )
}
