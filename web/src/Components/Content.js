import Preflight from './Components/Preflight'
import Calibration from './Components/Calibration'

// Array.isArray checks that buttons exist before rendering them
function Controls(props) {
  return (
    <nav id="Controls" className="navbar">
      <div className='container-fluid'>
        <ul id="calibrate" className="nav">
          {Array.isArray(props.buttons) && props.buttons.map( entry => {
            let className="btn btn-secondary" 
            if (props.moving) {
              className += " disabled"
            }
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
          })}
          <span className="navbar-text my-auto">{props.statusText}</span>
        </ul>
      </div>
    </nav>
  )
}

const stageSpecificButtons = {
  calibration: ["Move", "Save", "Reset"],
  setup: [],
  select: [],
  move: [],
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
      <Controls 
        moving={props.moving}
        buttons={stageSpecificButtons[props.stage]} 
        onButtonClick={props.onButtonClick} 
        statusText={props.statusText}
      />
      <Information stage={props.stage}/>
    </div>
  )
}

