import Preflight from './Components/Preflight'
import Calibration from './Components/Calibration'

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
  calibration: ["Move", "Save", "Reset"],
  setup: [],
  select: [],
  move: ["Run"],
}

function Information(props) {
  switch(props.stage) {
    case "preflight": return <Preflight/>;
    default: return <Calibration />;
  }
}

export default function Content(props) {
  return (
    <div className="container bg-light">
      <nav className="navbar navbar-expand-md" id="Buttons">
        <div className="container-fluid">
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse" >
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav col-4" id="Controls">
              <Buttons
                moving={props.moving}
                buttons={stageSpecificButtons[props.stage]} 
                onButtonClick={props.onButtonClick} 
              />
            </ul>
            <span className="navbar-text col-4 justify-content-center text-center">
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
