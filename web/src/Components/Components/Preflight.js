export default function Preflight() {
  return (
    <div className="container">
      <div className="bg-light p-4 rounded">
        <h1>Preflight checklist</h1>
        <div className="container">
          <ol>
            <li>Open flowbot door _completely_!</li>
            <li>If off, turn on Dorna control box</li>
            <li>Move microscope to its loading position</li>
            <li>Physically move Dorna into safe position, zeroing all joints</li>
            <li>Mount plexiglass shield around the workbench</li>
            <li>Verify progress with teaching assisstant</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
