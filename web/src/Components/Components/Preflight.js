export default function Preflight() {
  return (
    <div className="container">
      <div className="bg-light p-4 rounded">
        <h1>Preflight checklist</h1>
        <div className="container">
          <ol>
            <li>
              These are performed by a TA
              <ol>
                <li>Turn on Dorna control box</li>
                <li>Connect microscope and put it into its loading position</li>
                <li>Physically move Dorna into safe position, then calibrate all joints</li>
              </ol>
            </li>
            <li>Open flowbot door <b>completely!</b></li>
            <li>Put the well plates you will be using later into the flowbot</li>
            <li>Mount plexiglass shield around the workbench</li>
            <li>Do not reach over the plexiglass shield while it is installed</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
