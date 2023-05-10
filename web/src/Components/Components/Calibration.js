export default function Calibration(props) {
  return (
    <div className="container">
      <div className="bg-light">
        <nav className="navbar navbar-expand-md navbar-light  bg-light border-bottom ">
          <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarCollapse" aria-controls="navbarCollapse" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarCollapse">
            <ul className="navbar-nav mr-md-auto">
              <li className="nav-item">
                <input type="button" className="btn btn-danger halt_b" value="Halt" data-cmd="halt"/>
              </li>
              <li className="nav-item">
                <input type="button" className="btn btn-link connect_s_b ws_stat_v" data-toggle="modal" data-target="#connection_modal" value="Disconnected"/>
              </li>
              <li className="nav-item alarm_li">
                <input type="button" className="btn btn-link alarm_b text-danger" value="Disable alarm" data-cmd="alarm"/>
              </li>
            </ul>
            <ul className="nav navbar-nav ml-auto" id="pills-tab" role="tablist">
              <li className="nav-item">
                <a className="nav-link active" id="pills-main-tab" data-toggle="pill" href="#pills-main" role="tab" aria-controls="pills-main" aria-selected="true"><span>Main</span></a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="pills-io-tab" data-toggle="pill" href="#pills-io" role="tab" aria-controls="pills-io" aria-selected="false">I/O</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" id="pills-setting-tab" data-toggle="pill" href="#pills-setting" role="tab" aria-controls="pills-setting" aria-selected="false">Setting</a>
              </li>
            </ul>
          </div>
        </nav>

        <iframe src="http://lab.dorna.ai"></iframe>
      </div>
    </div>
  )
}
