export default function Preflight(props) {
  return (
    <div className="container">
      <div className="bg-light p-4 rounded">
        <h1>Preflight checklist</h1>
        <div className="container">
          <ol>
            <li>Open flowbot door _completely_!</li>
            <li>If off, turn on Dorna control box</li>
            <li>Mount plexiglass shield around the workbench</li>
            <li>Move microscope to its loading position</li>
            <li>If not in safe position, move dorna to safe using above button</li>
            <li>Open Dorna Lab in other tab. ONLY if in safe position => Turn off motors</li>
            <li>Physically move Dorna into safe position, zeroing all joints</li>
            <li>Click "Set Joint", then "Set All" in Dorna Lab</li>
            <li>Turn on motors again</li>
            <li>Verify progress with TA...</li>
          </ol>
          <ul>
            <li>Move to a plate position using the selector above and Move button below</li>
            <li>Change to Dorna Lab, make sure Discrete Jog Mode is turned on and in the 1-5mm range</li>
            <li>Make adjustments to the position</li>
            <li>Test calibration with Test</li>
            <li>Pick up plate with Pickup</li>
            <li>Place plate with Place</li>
            <li>When happy with a position, click Save and move to the next</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
