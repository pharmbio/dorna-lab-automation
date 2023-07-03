import Preflight from './Components/Preflight'
import Calibration from './Components/Calibration'

let a = (
  <div className="container bg-light">
    <nav className="navbar navbar-expand-md navbar-light">
      <div className="container-fluid">
        <button className={"btn btn-outline-danger mx-auto " + (true ? 'disabled' : '')} onClick={() => this.props.onPrevClick()}>Previous</button>
        <ul className="navbar-nav mx-auto">
        </ul>
        <button className={"btn btn-outline-primary mx-auto " + (true ? 'disabled' : '')} onClick={() => this.props.onNextClick()}>Next</button>
      </div>
    </nav>
    <div className="span text-center">
      hello
    </div>
  </div>
)

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
          <span className="navbar-text my-auto">Use the Dorna GUI</span>
        </ul>
      </div>
    </nav>
  )
}

function Controls(props) {
  let buttons = [];
  switch(props.mode) {
    case "calibration":
      buttons = ["Move", "Save"]; break;
    case "ready":
      buttons = ["Run"]; break;
  }
  return <RenderButtons buttons={buttons} onButtonClick={props.onButtonClick} statusText={props.statusText}/>
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
      <Controls mode={props.mode} onButtonClick={props.onButtonClick} statusText={props.statusText}/>
      <Information mode={props.mode}/>
    </div>
  )
}

