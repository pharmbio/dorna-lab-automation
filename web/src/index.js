import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';

import Header from './Components/Header'
import Positions from './Components/Positions'
import Content from './Components/Content'

import graph from './graph.json';

// SYSTEM STATE MACHINE:
class System extends React.Component {
  constructor(props) {
    super(props);

    // Collected from graph.json
    const positions = graph.positions
    const obj = {};

    for (const key of positions) {
      obj[key] = "empty"
    }

    this.state = {
      mode: "preflight", // preflight, calibration, setup, source, target, ready, moving
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

  simpleMove() {
    const plates = this.state.plates;
    const target = Object.keys(plates).find(key => plates[key] === "full");
    console.log("Moving to " + target);
		
    fetch("http://localhost:5000/move?target="+target)
      .then(res => {
        console.log(res)
      })
  }

  savePosition() {
    const plates = this.state.plates;
    const target = Object.keys(plates).find(key => plates[key] === "full");
    console.log("Updated " + target + " with new coordinates. Written to calibration.json")
    fetch("http://localhost:5000/save?node="+target)
      .then(res => {
        console.log(res)
      })
    fetch("http://localhost:5000/calibrate")
      .then(res => {
        console.log(res)
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

  calibrate() {
    fetch("http://localhost:5000/calibrate")
      .then(response => response.json())
      .then(data => console.log(data))
  }

  resetPlates() {
    const initial = structuredClone(this.state.initial);
    this.setState({plates: initial});
  }

  handleHeaderClick(mode) {
    const defaultMode = {
      preflight:    "preflight",
      calibration:  "calibration",
      setup:        "setup",
      move:         "source",
      ready:        "ready",
    };
    console.log(this.state.mode + " ==> " + mode)
    this.setState({mode: defaultMode[mode]})
  }

  handleChangeClick() {
    switch(this.state.mode) {
      case "preflight":
	this.setState({mode: "setup"})
	this.calibrate()
	break;
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
      case "preflight": 
        Object.keys(plates).forEach((item) => {
	  plates[item] = "empty"
	  plates[id] = "full"
	})
	break;
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

  // const className = props.id + " position " + props.plate;
  // return <button className={className} onClick={props.onClick}>{props.id}</button>
  // frame: "control", // control, dorna, flowbot
  // this.setState({mode: "target"});

  render() {
    return (
      <div>
        <div className="container">
          <Header
            mode={this.state.mode}
            onHeaderClick={(mode) => this.handleHeaderClick(mode)}
            onNextClick={() => this.handleChangeClick()}
          />
        </div>

        <div className="container-fluid">
          <Positions
            plates={this.state.plates}
            onPlateClick={(id) => this.handlePlateClick(id)}
          />
        </div>

        <div className="container-fluid">
          <Content mode={this.state.mode}/>
        </div>
      </div>
    );
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<System />);
