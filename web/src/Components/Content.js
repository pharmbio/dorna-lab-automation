import Preflight from './Components/Preflight'
import Calibration from './Components/Calibration'
import Setup from './Components/Setup'
import Move from './Components/Move'
import Ready from './Components/Ready'

function Controls(props) {
  switch(props.mode) {
    case "preflight": 
      return (
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
          <ul class="navbar-nav">
          </ul>
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <button type="button" className="btn btn-dark" onClick={props.handleNextClick}>Next</button>
            </li>
          </ul>
        </nav>
      )
      break;
    case "calibration":
      return (
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
          <ul class="navbar-nav">
            <li class="nav-item" id="calibrate">
              <button type="button" className="btn btn-secondary" onClick={props.handleMoveClick}>Move</button>
            </li>
            <li class="nav-item">
              <button type="button" className="btn btn-primary" onClick={props.handleNextClick}>Save</button>
            </li>
          </ul>
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <button type="button" className="btn btn-dark" onClick={props.handleNextClick}>Next</button>
            </li>
          </ul>
        </nav>
      )
      break;
    case "ready":
      return (
        <ul id="calibrate" className="nav">
          <li className="nav-item">
            <button type="button" className="btn btn-secondary" onClick={props.handleMoveClick}>Move</button>
          </li>
          <li className="nav-item">
            <button type="button" className="btn btn-success" onClick={props.handleSaveClick}>Save</button>
          </li>
        </ul>
      )
      break;
    case "moving":
      return (
        <nav class="navbar navbar-expand-lg navbar-light bg-light">
          <ul class="navbar-nav">
          </ul>
          <ul class="navbar-nav ms-auto">
            <li class="nav-item">
              <button type="button" className="btn btn-dark" onClick={props.handleNextClick}>Next</button>
            </li>
          </ul>
        </nav>
      )
      break;
  }
}

function Information(props) {
  switch(props.mode) {
    case "preflight": return <Preflight/>; break;
    case "calibration": return <Calibration/>; break;
    default: break;
  }
}

export default function Content(props) {
  return (
    <div className="container bg-light">
      <Controls mode={props.mode}/>
      <Information mode={props.mode}/>
    </div>
  )
}
