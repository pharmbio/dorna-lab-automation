export default function Mode(props) {
  let change;
  let mode;
  let text;
  let run;

  switch(props.mode) {
    case "preflight":
      change = <button type="button" className="btn change btn-dark" onClick={props.onChangeClick} disabled>Next</button>
      mode = <button type="button" className="btn btn-dark" disabled>Preflight</button>
      text = <span>0. Start and complete checklist.</span>
      run = <button type="button" className="btn run btn-outline-dark" disabled>Run</button>
      break;
    case "setup":
      change = <button type="button" className="btn change btn-primary" onClick={props.onChangeClick}>Next</button>
      mode = <button type="button" className="btn btn-primary" disabled>Setup</button>
      text = <span>1. Select initial plate positions</span>
      run = <button type="button" className="btn run btn-outline-primary" disabled>Run</button>
      break;
    case "source":
      change = <button type="button" className="btn change btn-secondary" onClick={props.onChangeClick}>Change</button>
      mode = <button type="button" className="btn btn-success" disabled>Source</button>
      text = <span>2. Select plate for pick up</span>
      run = <button type="button" className="btn run btn-outline-dark" disabled>Run</button>
      break;
    case "target":
      change = <button type="button" className="btn change btn-secondary" onClick={props.onChangeClick}>Cancel</button>
      mode = <button type="button" className="btn btn-danger" disabled>Target</button>
      text = <span>3. Select target position for plate</span>
      run = <button type="button" className="btn run btn-outline-secondary" disabled>Run</button>
      break;
    case "ready":
      change = <button type="button" className="btn change btn-secondary" onClick={props.onChangeClick}>Cancel</button>
      mode = <button type="button" className="btn btn-warning" disabled>Ready</button>
      text = <span>4. Press run to perform move</span>
      run = <button type="button" className="btn run btn-warning" onClick={props.onRunClick}>Run</button>
      break;
    case "moving":
      change = <button type="button" className="btn change btn-secondary" disabled>Cancel</button>
      mode = <button type="button" className="btn btn-danger" disabled>Moving</button>
      text = <span>5. Press abort to stop move</span>
      run = <button type="button" className="btn run btn-danger"onClick={props.onRunClick}>Abort</button>
      break;
    default: break;
  }

  return (
    <div className="section">
      {mode}
      {text}
      <div className="btn-group right" role="group">
        {change}
        {run}
      </div>
    </div>
  )
}
