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
      mode: "calibration",  // preflight, calibration, setup, select, move
      selectMode: "source", // source, target
      moveStage: "ready",   // ready, busy
      plates: obj,          // entries can be: empty, full, source, target
      initial: structuredClone(obj), // copy
      statusText: ""
    }
  }

  changeMode(mode) {
    let plates = this.state.plates;
    let initial = this.state.initial;

    if (this.state.mode === "setup") {
      this.setState({initial: plates})
      console.log(this.state.initial)
    }

    switch(mode) {
      case "preflight":
        Object.keys(plates).forEach((item) => {
	  plates[item] = "empty"
	})
        break;
      case "calibration":
        Object.keys(plates).forEach((item) => {
	  plates[item] = "empty"
	})
        break;
      case "setup":
        this.setState({plates: initial})
        break;
      case "select":
        this.setState({selectMode: "source"})
      case "move":
        this.setState({selectMode: "ready"})
    }
    this.setState({mode: mode})
  }

  changeStatusText(string, delay) {
    setTimeout(() => this.setState({statusText: ""}), delay)
    this.setState({statusText: string})
  }

  handleHeaderClick(mode) {
    this.changeMode(mode)
  }

  handlePrevClick() {
    switch(this.state.mode) {
      case "preflight":
        console.log("Already at first mode"); break;
      case "calibration":
        this.changeMode("preflight"); break;
      case "setup":
        this.changeMode("calibration"); break;
      case "select":
        this.changeMode("setup"); break;
      case "move":
        this.changeMode("select"); break;
    }
  }

  handleNextClick() {
    switch(this.state.mode) {
      case "preflight":
        this.changeMode("calibration"); break;
      case "calibration":
        this.changeMode("setup"); break;
      case "setup":
        this.changeMode("select"); break;
      case "select":
        this.changeMode("move"); break;
      case "move":
        console.log("Already at final mode"); break;
    }
  }

  handlePlateClick(id) {
    const plates = this.state.plates;
    switch(this.state.mode) {
      case "calibration": 
        Object.keys(plates).forEach((item) => {
	  plates[item] = "empty"
	})
        plates[id] = "full"
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

  handleButtonClick(entry) {
    const mode = this.state.mode

    if (entry == "Move") {
      this.changeStatusText("hello", 5000)
    }

    switch(mode) {
      case "calibration":
        const plates = this.state.plates
        const target = Object.keys(plates).find(key => plates[key] === "full");
        switch(entry) {
          case "Move":
            console.log("Moving to " + target);
            fetch("/move?target="+target)
              .then(res => {
                console.log(res)
              })
          case "Save":
            console.log("Updated " + target + " with new coordinates. Written to calibration.json")
            fetch("/save?node="+target)
              .then(res => {
                console.log(res)
              })
            break;
          default: break;
        }
    
    }
  }

  render() {
    return (
      <div>
        <div className="section">
          <Header
            mode={this.state.mode}
            onHeaderClick={(mode) => this.handleHeaderClick(mode)}
            onPrevClick={() => this.handlePrevClick()}
            onNextClick={() => this.handleNextClick()}
          />
        </div>

        <div className="section">
          <Positions
            plates={this.state.plates}
            onPlateClick={(id) => this.handlePlateClick(id)}
          />
        </div>

        <div className="section">
          <Content 
            mode={this.state.mode} 
            onButtonClick={(id) => this.handleButtonClick(id)}
            statusText={this.state.statusText}
          />
        </div>
      </div>
    );
  }
}

// ========================================

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<System />);
