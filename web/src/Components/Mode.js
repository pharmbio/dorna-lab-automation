export default function Mode(props) {
    
  let headerModes = ["preflight", "calibration", "setup", "move", "ready"]
  
  // preflight, calibration, setup, source, target, ready, moving
  const simplifiedMode = {
    preflight:    "preflight",
    calibration:  "calibration",
    setup:        "setup",
    source:       "move",
    target:       "move",
    ready:        "ready",
    moving:       "ready"
  };
  
  let currentMode = props.mode

  let Header = ({modes})  => (
    <ul className="nav nav-pills">
      {modes.map(mode => (
        <li key={mode} className="nav-item">
          <a 
            href="#" 
            className={"nav-link " + (simplifiedMode[mode] == currentMode ? "active" : "")} 
            onClick={() => props.onHeaderClick(calibration)}
          >
            {modes.indexOf(mode)}. {mode}
          </a>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="section">
      <Header modes={headerModes}/>
    </div>
  )
}
