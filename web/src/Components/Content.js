import Preflight from './Components/Preflight'
import Calibration from './Components/Calibration'

function RenderButtons(props) {
  return (
    <ul id="calibrate" className="nav">
      {props.buttons.map( entry => {
        let className="btn btn-secondary"
        return (
          <li key={entry} className="nav-item">
            <button 
              type="button" 
              className={className}
              onClick={() => props.onButtonClick(entry)}
            >
              {entry}
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Controls(props) {
  let buttons = [];
  switch(props.mode) {
    case "calibration":
      buttons = ["Move", "Save"]
      break;
    case "setup":
      buttons = []
      break;
  }
  return <RenderButtons buttons={buttons} onButtonClick={props.onButtonClick}/>
}

function Information(props) {
  switch(props.mode) {
    case "preflight": return <Preflight/>; break;
    default: return <Calibration/>; break;
  }
}

export default function Content(props) {
  return (
    <div className="container bg-light">
      <Controls mode={props.mode} onButtonClick={props.onButtonClick}/>
      <Information mode={props.mode}/>
    </div>
  )
}
