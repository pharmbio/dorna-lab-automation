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
      stage: "calibration",  // preflight, calibration, setup, select, move
      selectStage: "source", // source, target
      moveStage: "ready",   // ready, busy
      plates: obj,          // entries can be: empty, full, source, target
      initial: structuredClone(obj), // copy
      statusText: ""
    }
  }

  changeStage(stage) {
    let plates = this.state.plates;
    let initial = this.state.initial;

    if (this.state.stage === "setup") {
      this.setState({initial: plates})
      console.log(this.state.initial)
    }

    switch(stage) {
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
        this.setState({selectStage: "source"})
      case "move":
        this.setState({selectStage: "ready"})
    }
    this.setState({stage: stage})
  }

  changeStatusText(string, delay) {
    setTimeout(() => this.setState({statusText: ""}), delay)
    this.setState({statusText: string})
  }

  handleHeaderClick(stage) {
    this.changeStage(stage)
  }

  handlePrevClick() {
    switch(this.state.stage) {
      case "preflight":
        console.log("Already at first stage"); break;
      case "calibration":
        this.changeStage("preflight"); break;
      case "setup":
        this.changeStage("calibration"); break;
      case "select":
        this.changeStage("setup"); break;
      case "move":
        this.changeStage("select"); break;
    }
  }

  handleNextClick() {
    switch(this.state.stage) {
      case "preflight":
        this.changeStage("calibration"); break;
      case "calibration":
        this.changeStage("setup"); break;
      case "setup":
        this.changeStage("select"); break;
      case "select":
        this.changeStage("move"); break;
      case "move":
        console.log("Already at final stage"); break;
    }
  }

  handlePlateClick(id) {
    const plates = this.state.plates;
    switch(this.state.stage) {
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
          this.setState({stage: "target"});
        }
        break;
      case "target":
        if (plates[id] === "empty") {
          plates[id] = "target";
          this.setState({stage: "ready"});
        }
        break;
      default: break;
    }
    this.setState({plates: plates})
  }

  handleButtonClick(entry) {
    const stage = this.state.stage

    if (entry == "Move") {
      this.changeStatusText("hello", 5000)
    }

    switch(stage) {
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
            stage={this.state.stage}
            onHeaderClick={(stage) => this.handleHeaderClick(stage)}
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
            stage={this.state.stage} 
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
