import Preflight from './Components/Preflight'
import Calibration from './Components/Calibration'
import Setup from './Components/Setup'
import Move from './Components/Move'
import Ready from './Components/Ready'

function Information(props) {
  switch(props.mode) {
    case "preflight": return <Preflight/>; break;
    case "calibration": return <Calibration/>; break;
    case "setup": return <Setup/>; break;
    case "source": return <Move/>; break;
    case "target": return <Move/>; break;
    case "ready": return <Ready/>; break;
    default:
  }
}

export default function Content(props) {
  return (
    <div className="section">
      <Information mode={props.mode}/>
    </div>
  )
}
