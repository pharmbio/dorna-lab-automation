import Preflight from './Components/Preflight'
import Calibration from './Components/Calibration'

function RenderButtons(props) {
  return (
    <nav id="Controls" className="navbar">
      <div className='container-fluid'>
      <ul id="calibrate" className="nav">
        {props.buttons.map( entry => {
          let className="btn btn-secondary" 
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
      </ul>
      <span className="navbar-text">
        Navbar text with an inline element
      </span>
      </div>
    </nav>
  )
}

function Controls(props) {
  let buttons = [];
  switch(props.mode) {
    case "calibration":
      buttons = ["Move", "Save"]
      break;
    case "ready":
      buttons = ["Run"]
      break;
  }
  return <RenderButtons buttons={buttons} onButtonClick={props.onButtonClick}/>
}

function Information(props) {
  switch(props.mode) {
    case "preflight": return <Preflight/>;
    default: return <Calibration />;
  }
}

export default function Content(props) {
  return (
    <div className="container bg-light">
      <Controls mode={props.mode} onButtonClick={props.onButtonClick} status={props.status}/>
      <Information mode={props.mode}/>
    </div>
  )
}
