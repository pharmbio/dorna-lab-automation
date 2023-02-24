export default function Information(props) {
  const mode = props.mode

  let preflight = (
    <div className="bg-light p-5 rounded">
      <h1>Preflight checklist</h1>
      <div className="container">
        <ol>
          <li>Open flowbot door _completely_!</li>
          <li>Move microscope to its loading position.</li>
          <li>Place a test plate in microscope.</li>
          <li>Turn on Dorna control box.</li>
          <li>Mount plexiglass shield around the workbench.</li>
          <li>Verify progress with TA.</li>
        </ol>
        <ul>
	  <li>Move to a plate position using the selector above and Move button below.</li>
          <li>Change to Dorna Lab, and make adjustments to the position.</li>
          <li>Test calibration with Test</li>
          <li>Pick up plate with Pickup</li>
          <li>Place plate with Place</li>
          <li>When happy with a position, click Save and move to the next.</li>
        </ul>
	<div className="row">
          <button type="button" className="btn btn-primary"   onClick={props.handleMoveClick}>Move</button>
          <button type="button" className="btn btn-secondary" onClick={() => window.fetch("http://localhost:5000/testcalibration").then(res => console.log(res))}>Test</button>
          <button type="button" className="btn btn-secondary" onClick={() => window.fetch("http://localhost:5000/pickup").then(res => console.log(res))}>Pickup</button>
          <button type="button" className="btn btn-secondary" onClick={() => window.fetch("http://localhost:5000/place").then(res => console.log(res))}>Place</button>
          <button type="button" className="btn btn-success" onClick={props.handleSaveClick}>Save</button>
	</div>
      </div>
    </div>
  )

  switch(props.mode) {
    case "preflight":
      return preflight
  }
}
