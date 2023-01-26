export default function Information(props) {
  const mode = props.mode

  let setup = (
    <div className="bg-light p-5 rounded">
      <h1>Preflight checklist</h1>
      <p className="lead">
        <ul>
          <li> hello </li>
          <li> hello </li>
          <button type="button" class="btn btn-info">Calibrate</button>
        </ul>
      </p>
    </div>
  )

  switch(props.mode) {
    case "setup":
      return setup
  }
}
