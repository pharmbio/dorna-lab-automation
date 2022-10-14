import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import graph from './graph.json';

function Mode(props) {
  let change;
  let mode;
  let text;
  let run;

  switch(props.mode) {
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

function Position(props) {
  const className = props.id + " position " + props.plate;
  return <button className={className} onClick={props.onClick}>{props.id}</button>
}

class Positions extends React.Component {
  render() {
    const plates = this.props.plates
    return (
      <div className="section map">
        {Object.keys(plates).map( id => {
          return <Position
            key={id}
            id={id}
            plate={plates[id]}
            onClick={() => this.props.handlePlateClick(id)}
          />
        })}
      </div>
    )
  }
}

// SYSTEM STATE MACHINE:

class System extends React.Component {
  constructor(props) {
    super(props);

    const positions = graph.positions
    const obj = {};

    for (const key of positions) {
      obj[key] = "empty"
    }

    this.state = {
      mode: "setup", // setup, source, target, ready, moving
      plates: obj, // entries can be: empty, full, source, target
      initial: structuredClone(obj) // copy
    }
  }

  ready(source, target) {
    const plates = this.state.plates;
    plates[source] = "empty";
    plates[target] = "full";
    const initial = structuredClone(plates);
    this.setState({
      mode: "source",
      initial: initial,
      plates: plates
    })
  }

  requestMove() {

    const plates = this.state.plates;
    const source = Object.keys(plates).find(key => plates[key] === "source");
    const target = Object.keys(plates).find(key => plates[key] === "target");
    console.log(source + " ==> " + target);

    fetch("http://localhost:5000/move?target="+source)
      .then(res => {
        console.log(res)
        fetch("http://localhost:5000/pickup")
          .then(res => {
            console.log(res)
            fetch("http://localhost:5000/move?source="+source+"&target="+target)
              .then(res => {
                console.log(res)
                  fetch("http://localhost:5000/place")
                    .then(res => {
                      console.log(res)
                      this.ready(source, target)
                    })
              })
          })
      })
  }

  abortMove() {
    fetch("http://localhost:5000/halt")
      .then(response => response.json())
      .then(data => console.log(data))
  }

  resetPlates() {
    const initial = structuredClone(this.state.initial);
    this.setState({plates: initial});
  }

  handleChangeClick() {
    switch(this.state.mode) {
      case "setup":
        const plates = structuredClone(this.state.plates);
        this.setState({initial: plates})
        this.setState({mode: "source"});
        break;
      case "source":
        this.setState({mode: "setup"});
        this.resetPlates();
        break;
      case "target":
        this.setState({mode: "source"});
        this.resetPlates();
        break;
      case "ready":
        this.setState({mode: "source"});
        this.resetPlates();
        break;
      default: break;
    }
  }

  handleRunClick() {
    switch(this.state.mode) {
      case "ready":
        this.setState({mode: "moving"});
        this.requestMove();
        break;
      case "moving":
        this.setState({mode: "ready"});
        this.abortMove();
        break;
      default: break;
    }
  }

  handlePlateClick(id) {
    const plates = this.state.plates;
    switch(this.state.mode) {
      case "setup": plates[id] = plates[id] === "empty" ? "full" : "empty"; break;
      case "source":
        if (plates[id] === "full") {
          plates[id] = "source";
          this.setState({mode: "target"});
        }
        break;
      case "target":
        if (plates[id] === "empty") {
          plates[id] = "target";
          this.setState({mode: "ready"});
        }
        break;
      default: break;
    }
    this.setState({plates: plates})
  }

  render() {
    return (
      <div className="container">
        <Mode
          mode={this.state.mode}
          onChangeClick={() => this.handleChangeClick()}
          onRunClick={() => this.handleRunClick()}
        />
        <Positions
          plates={this.state.plates}
          handlePlateClick={(id) => this.handlePlateClick(id)}
        />
      </div>
    );
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<System />);
